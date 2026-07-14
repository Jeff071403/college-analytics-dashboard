import sys
import tempfile
import unittest
from pathlib import Path

from sqlalchemy import create_engine, text

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import app as backend_app


class UpdateCollegeRouteTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test_colleges.db"
        self.engine = create_engine(f"sqlite:///{self.db_path}")

        with self.engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE colleges (
                    college_id INTEGER PRIMARY KEY,
                    college_name VARCHAR(255) NOT NULL,
                    college_category VARCHAR(100) NOT NULL,
                    location_raw VARCHAR(100) NOT NULL,
                    location_normalized VARCHAR(100) NOT NULL,
                    website VARCHAR(255),
                    email VARCHAR(255),
                    phone VARCHAR(100),
                    naac_grade VARCHAR(50) NOT NULL,
                    principal_name VARCHAR(255),
                    autonomous VARCHAR(50) NOT NULL,
                    nirf_rank INTEGER
                )
            """))
            conn.execute(text("""
                INSERT INTO colleges (
                    college_id, college_name, college_category, location_raw,
                    location_normalized, website, email, phone, naac_grade,
                    principal_name, autonomous, nirf_rank
                ) VALUES (
                    :college_id, :college_name, :college_category, :location_raw,
                    :location_normalized, :website, :email, :phone, :naac_grade,
                    :principal_name, :autonomous, :nirf_rank
                )
            """), {
                "college_id": 1,
                "college_name": "Old Name",
                "college_category": "Engineering",
                "location_raw": "Chennai",
                "location_normalized": "Chennai",
                "website": "",
                "email": "",
                "phone": "",
                "naac_grade": "A",
                "principal_name": "Old Principal",
                "autonomous": "Yes",
                "nirf_rank": 10,
            })

        backend_app.engine = self.engine
        backend_app.db_type = "sqlite"
        self.client = backend_app.app.test_client()

    def tearDown(self):
        if hasattr(self, 'engine'):
            self.engine.dispose()
        self.temp_dir.cleanup()

    def test_update_college_record(self):
        response = self.client.put(
            "/api/colleges/1",
            json={
                "college_name": "Updated College",
                "college_category": "Engineering",
                "location_raw": "Chennai",
                "location_normalized": "Chennai",
                "website": "https://example.com",
                "email": "info@example.com",
                "phone": "9876543210",
                "naac_grade": "A+",
                "principal_name": "New Principal",
                "autonomous": "Yes",
                "nirf_rank": 25,
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["status"], "success")
        self.assertEqual(payload["data"]["college_name"], "Updated College")
        self.assertEqual(payload["data"]["nirf_rank"], 25)

    def test_delete_college_record(self):
        response = self.client.delete("/api/colleges/1")

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["status"], "success")
        self.assertEqual(payload["message"], "College deleted successfully")


if __name__ == "__main__":
    unittest.main()
