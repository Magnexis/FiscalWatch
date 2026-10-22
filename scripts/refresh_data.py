"""Download bounded, reproducible public extracts. No credentials; no allegations."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import urllib.parse
import urllib.request
from decimal import Decimal, InvalidOperation

ROOT = Path(__file__).resolve().parents[1]
CT = 'https://data.ct.gov/resource/ajdm-rvz7.json'
USA = 'https://api.usaspending.gov/api/v2/search/spending_by_award/'


def request_json(url, payload=None):
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={
        'User-Agent': 'Magnexis-FiscalWatch/0.1 (public fiscal research)',
        'Content-Type': 'application/json', 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as response:
        raw = response.read(20_000_001)
    if len(raw) > 20_000_000:
        raise ValueError('Response exceeds 20 MB; use a narrower query')
    return json.loads(raw, parse_float=Decimal), hashlib.sha256(raw).hexdigest()


def amount(value):
    try:
        number = Decimal(str(value))
    except InvalidOperation as exc:
        raise ValueError('Invalid source monetary amount') from exc
    if not number.is_finite() or number != number.quantize(Decimal('.01')):
        raise ValueError('Amount must be finite and have cent precision')
    return format(number, '.2f')


def ct_row(r):
    key = [r.get(k, '') for k in ['fiscal_year', 'payment_id', 'invoice_id',
           'invoice_line_number', 'invoice_line_distribution_number', 'account', 'fund_code']]
    return dict(id='ct:' + hashlib.sha256(json.dumps(key).encode()).hexdigest(),
                vendor=r.get('vendor', ''), vendorId=r.get('vendor_id', ''),
                agency=r.get('department', ''), date=r['payment_date'][:10],
                amount=amount(r['amount']), category=r.get('expense_category', ''),
                invoice=r.get('invoice_id', ''), kind='payment', metric='payment',
                contract=r.get('contract_number', ''), source=CT)


def usa_row(r, kind):
    return dict(id='usa:' + r['generated_internal_id'], vendor=r.get('Recipient Name') or '',
                vendorId=r.get('Recipient UEI') or '', agency=r.get('Awarding Agency') or '',
                date=(r.get('Base Obligation Date') or r.get('Start Date') or '')[:10],
                amount=amount(r['Award Amount']), category=r.get('Description') or '',
                invoice='', kind=kind, metric='award-obligation', contract=r.get('Award ID') or '',
                source='https://www.usaspending.gov/award/' + urllib.parse.quote(r['generated_internal_id'], safe=''))


def collect(source, year=2026, limit=1000, kind='contract'):
    if not 2020 <= year <= 2100 or not 1 <= limit <= 10000:
        raise ValueError('Year must be 2020–2100 and limit 1–10000')
    if source == 'ct':
        query = {'$where': f"fiscal_year={year}", '$limit': limit,
                 '$order': 'payment_date DESC,payment_id,invoice_id,invoice_line_number,invoice_line_distribution_number,account,fund_code'}
        url = CT + '?' + urllib.parse.urlencode(query)
        raw, digest = request_json(url)
        rows = [ct_row(row) for row in raw]
        coverage = f'CT FY{year}: up to {limit} latest payment-distribution rows; not a random sample or statewide total.'
        warnings = ['CT fiscal year ends June 30. Distribution lines are not unique invoices.',
                    'Equal amounts and repeated payment IDs can be legitimate split distributions.',
                    'Redactions are preserved. Agency labels are shown as supplied, without reinterpretation.']
        recorded_query = url
    elif source == 'usaspending':
        codes = ['A', 'B', 'C', 'D'] if kind == 'contract' else ['02', '03', '04', '05']
        payload = {'filters': {'award_type_codes': codes, 'time_period': [
            {'start_date': f'{year-1}-10-01', 'end_date': f'{year}-09-30'}],
            'place_of_performance_locations': [{'country': 'USA', 'state': 'CT'}]},
            'fields': ['Award ID', 'Recipient Name', 'Recipient UEI', 'Award Amount', 'Awarding Agency',
                       'Base Obligation Date', 'Start Date', 'Description', 'generated_internal_id'],
            'limit': min(limit, 100), 'page': 1, 'sort': 'Award Amount', 'order': 'desc'}
        raw, digest = request_json(USA, payload)
        if not isinstance(raw.get('results'), list):
            raise ValueError('USAspending results missing')
        rows = [usa_row(row, kind) for row in raw['results']]
        coverage = f'Federal FY{year}: top {len(rows)} CT place-of-performance {kind} awards in the date filter; not all federal spending.'
        warnings = ['Award amounts are award-level obligations, not invoice payments or necessarily obligations incurred within the filter dates.',
                    'Contract and grant extracts are separate; do not add federal awards to CT payments.',
                    'Award search is capped at 100 records per extract; pagination beyond this pilot is not implemented.']
        recorded_query = json.dumps({'url': USA, 'payload': payload}, sort_keys=True)
    else:
        raise ValueError('Unknown source')
    return dict(schemaVersion=1, source=source,dataset='ct' if source=='ct' else f'usaspending-{kind}',
                retrievedAt=dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00', 'Z'),
                query=recorded_query, coverage=coverage, complete=False, rows=rows,
                warnings=warnings, rawSha256=digest, hashBasis='raw-response')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', choices=['ct', 'usaspending'])
    parser.add_argument('--year', type=int, default=2026)
    parser.add_argument('--limit', type=int, default=1000)
    parser.add_argument('--kind', choices=['contract', 'grant'], default='contract')
    args = parser.parse_args()
    snapshot = collect(args.source, args.year, args.limit, args.kind)
    dest = ROOT / 'public' / 'data'
    dest.mkdir(parents=True, exist_ok=True)
    filename = args.source if args.source == 'ct' else f'usaspending-{args.kind}'
    path = dest / f'{filename}.json'
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(snapshot, indent=2), encoding='utf-8')
    temporary.replace(path)
    print(json.dumps({'file': str(path), 'rows': len(snapshot['rows']), 'coverage': snapshot['coverage'], 'sha256': snapshot['rawSha256']}))


if __name__ == '__main__':
    main()
