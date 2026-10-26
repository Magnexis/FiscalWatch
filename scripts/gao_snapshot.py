"""Download an official dated GAO recommendations CSV with provenance metadata.

This utility does not update recommendation status, claim savings, or contact GAO.
"""
import argparse
import csv
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

SOURCE = "https://www.gao.gov/assets/2026-05/2026%20Duplication%20and%20Cost%20Savings%20-%20Downloadable%20Spreadsheet.csv"
MAX_BYTES = 25 * 1024 * 1024
ALLOWED_HOSTS = {"gao.gov", "www.gao.gov", "files.gao.gov"}


def is_official_https(url):
    parts = urlsplit(url)
    return parts.scheme == "https" and parts.hostname in ALLOWED_HOSTS and parts.username is None and parts.password is None


def parse_csv(raw):
    if not raw or b"\x00" in raw:
        raise ValueError("Empty or binary CSV response")
    try:
        payload = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError("Expected UTF-8 CSV") from exc
    if payload.lstrip().lower().startswith(("<html", "<!doctype", "<?xml", "{")):
        raise ValueError("HTML or error document returned instead of CSV")
    try:
        reader = csv.reader(io.StringIO(payload, newline=""))
        columns = next(reader)
        if len(columns) < 3 or any(not x.strip() for x in columns):
            raise ValueError("Missing or malformed CSV headings")
        count = 0
        for row in reader:
            if not row or not any(x.strip() for x in row):
                continue
            if len(row) != len(columns):
                raise ValueError("Inconsistent CSV column count")
            count += 1
    except (StopIteration, csv.Error) as exc:
        raise ValueError("Malformed CSV response") from exc
    if count == 0:
        raise ValueError("CSV contains no data rows")
    return columns, count


def download(out, *, opener=urlopen):
    if not is_official_https(SOURCE):
        raise ValueError("Untrusted source URL")
    req = Request(SOURCE, headers={"User-Agent": "Magnexis-FiscalWatch/1.3 research"})
    with opener(req, timeout=30) as response:
        final = response.geturl()
        if not is_official_https(final):
            raise ValueError("Untrusted redirect host")
        raw = response.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("Download exceeds size limit")
    columns, count = parse_csv(raw)
    metadata = {
        "sourceUrl": SOURCE, "finalUrl": final,
        "retrievedAt": datetime.now(timezone.utc).isoformat(),
        "statusAsOf": "2026-03",
        "statusWarning": "Historical GAO March 2026 statuses. Check individual report pages for current status.",
        "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest(),
        "columns": columns, "dataRows": count,
        "independentlyVerifiedAnnualSavingsUSD": 0,
        "disclaimer": "No government endorsement, policy adoption, independent verification or estimated savings from download."
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(raw)
    out.with_suffix(out.suffix + ".metadata.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=Path(".local-data/gao-2026-recommendations.csv"))
    result = download(parser.parse_args().out)
    print(f"Downloaded {result['dataRows']} dated GAO CSV records; SHA-256 {result['sha256']}")
    print("No live status refresh or verified savings inferred.")
