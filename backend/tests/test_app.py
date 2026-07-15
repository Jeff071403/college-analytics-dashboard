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
                    nirf_rank INTEGER,
                    university_category VARCHAR(255) NOT NULL,
                    hostel_facility VARCHAR(100) NOT NULL,
                    nirf_rank_raw VARCHAR(100) NOT NULL
                )
            """))
            conn.execute(text("""
                CREATE TABLE courses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    course_id INTEGER NOT NULL,
                    college_id INTEGER NOT NULL,
                    course_name VARCHAR(255) NOT NULL,
                    course_level VARCHAR(50) NOT NULL,
                    course_category VARCHAR(100) NOT NULL,
                    duration INTEGER NOT NULL
                )
            """))
            conn.execute(text("""
                INSERT INTO colleges (
                    college_id, college_name, college_category, location_raw,
                    location_normalized, website, email, phone, naac_grade,
                    principal_name, autonomous, nirf_rank, university_category,
                    hostel_facility, nirf_rank_raw
                ) VALUES (
                    :college_id, :college_name, :college_category, :location_raw,
                    :location_normalized, :website, :email, :phone, :naac_grade,
                    :principal_name, :autonomous, :nirf_rank, :university_category,
                    :hostel_facility, :nirf_rank_raw
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
                "university_category": "State University",
                "hostel_facility": "Boys Only",
                "nirf_rank_raw": "10"
            })
            conn.execute(text("""
                INSERT INTO courses (
                    course_id, college_id, course_name, course_level, course_category, duration
                ) VALUES (
                    101, 1, 'B.Sc Computer Science', 'UG', 'Computer Applications / IT', 3
                )
            """))
            conn.execute(text("""
                INSERT INTO courses (
                    course_id, college_id, course_name, course_level, course_category, duration
                ) VALUES (
                    102, 1, 'M.Sc Computer Science', 'PG', 'Computer Applications / IT', 2
                )
            """))

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

    def test_get_courses(self):
        response = self.client.get("/api/courses")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["status"], "success")
        self.assertIn("B.Sc Computer Science", payload["data"])
        self.assertIn("M.Sc Computer Science", payload["data"])

    def test_get_college_courses(self):
        response = self.client.get("/api/colleges/1/courses")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["status"], "success")
        self.assertEqual(len(payload["data"]), 2)
        
        # Test alias route /college/<id>/courses
        response_alias = self.client.get("/college/1/courses")
        self.assertEqual(response_alias.status_code, 200)
        self.assertEqual(response_alias.get_json()["status"], "success")

    def test_get_colleges_with_course_stats(self):
        response = self.client.get("/api/colleges")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["status"], "success")
        self.assertEqual(len(payload["data"]), 1)
        self.assertEqual(payload["data"][0]["course_count"], 2)
        
        # Verify stats block
        stats = payload.get("stats")
        self.assertIsNotNone(stats)
        self.assertEqual(stats["total_courses"], 2)
        self.assertEqual(stats["avg_courses"], 2.0)
        self.assertEqual(stats["course_distribution"]["UG"], 1)
        self.assertEqual(stats["course_distribution"]["PG"], 1)

    def test_get_colleges_filtering(self):
        # Filtering by level UG
        response_ug = self.client.get("/api/colleges?course_level=UG")
        self.assertEqual(len(response_ug.get_json()["data"]), 1)
        
        # Filtering by level PhD (should return 0 colleges in mock DB)
        response_phd = self.client.get("/api/colleges?course_level=PhD")
        self.assertEqual(len(response_phd.get_json()["data"]), 0)


if __name__ == "__main__":
    unittest.main()
