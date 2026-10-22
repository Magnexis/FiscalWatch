import sys
from pathlib import Path
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from refresh_data import amount, ct_row, collect

class RefreshTests(unittest.TestCase):
    def test_money_validation(self):
        self.assertEqual(amount('-0.01'),'-0.01')
        for value in ['NaN','Infinity','0.001']:
            with self.assertRaises(ValueError): amount(value)
    def test_distribution_identity(self):
        r=dict(fiscal_year='2026',payment_id='p',invoice_id='i',invoice_line_number='1',invoice_line_distribution_number='1',payment_date='2026-01-01',amount='12.00')
        self.assertNotEqual(ct_row(r)['id'],ct_row({**r,'invoice_line_distribution_number':'2'})['id'])
    def test_invalid_query_rejected_before_network(self):
        with self.assertRaises(ValueError): collect('ct',year=1)
        with self.assertRaises(ValueError): collect('ct',limit=999999)

if __name__=='__main__': unittest.main()
