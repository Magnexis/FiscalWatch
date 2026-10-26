"""Offline validation for the dated official GAO CSV snapshot utility."""
import io
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from scripts.gao_snapshot import SOURCE, parse_csv, download, is_official_https


class MockResponse(io.BytesIO):
    def __init__(self, body, final_url=SOURCE):
        super().__init__(body)
        self.final_url = final_url

    def geturl(self):
        return self.final_url


class GaoSnapshotTests(unittest.TestCase):
    def test_csv_and_provenance(self):
        sample = b"\xef\xbb\xbfReport,Status,Recommendation\nGAO-16-189,Open,One\n"
        with TemporaryDirectory() as tmp:
            dest = Path(tmp) / "sample.csv"
            meta = download(dest, opener=lambda request, timeout: MockResponse(sample))
            self.assertEqual(meta["dataRows"], 1)
            self.assertEqual(meta["statusAsOf"], "2026-03")
            self.assertEqual(meta["independentlyVerifiedAnnualSavingsUSD"], 0)
            self.assertEqual(dest.read_bytes(), sample)
            self.assertTrue(dest.with_suffix(".csv.metadata.json").exists())

    def test_bad_redirect_rejected_before_write(self):
        with TemporaryDirectory() as tmp:
            dest = Path(tmp) / "test.csv"
            with self.assertRaisesRegex(ValueError, "Untrusted redirect"):
                download(dest, opener=lambda request, timeout: MockResponse(b"a,b,c\n1,2,3\n", "https://example.com/file.csv"))
            self.assertFalse(dest.exists())

    def test_bad_csv_rejected(self):
        for sample in (b"", b"<html>Access denied</html>", b"a,b,c\n", b"a,b,c\n1,2\n", b"a,b,c\x00\n1,2,3\n"):
            with self.assertRaises(ValueError):
                parse_csv(sample)

    def test_origin_not_substring(self):
        self.assertTrue(is_official_https(SOURCE))
        self.assertFalse(is_official_https("https://gao.gov.evil.test/file"))
        self.assertFalse(is_official_https("http://www.gao.gov/file"))


if __name__ == "__main__":
    unittest.main()
