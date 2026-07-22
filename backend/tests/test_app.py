import sys
import tempfile
import unittest
from pathlib import Path

from sqlalchemy import create_engine, text

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import app as backend_app


from models import Base
class UpdateCollegeRouteTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test_colleges.db"
        self.engine = create_engine(f"sqlite:///{self.db_path}")

        # Create all tables using metadata to ensure all columns (including new ones) exist in the tests
        Base.metadata.create_all(self.engine)

        with self.engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO colleges (
                    college_id, college_name, college_category, location_raw,
                    location_normalized, website, email, phone, naac_grade,
                    principal_name, autonomous, nirf_rank, university_category,
                    hostel_facility, nirf_rank_raw,
                    bus_facility, placement_score, co_ed, ugc_recognized,
                    google_rating, latitude, longitude, ownership
                ) VALUES (
                    :college_id, :college_name, :college_category, :location_raw,
                    :location_normalized, :website, :email, :phone, :naac_grade,
                    :principal_name, :autonomous, :nirf_rank, :university_category,
                    :hostel_facility, :nirf_rank_raw,
                    :bus_facility, :placement_score, :co_ed, :ugc_recognized,
                    :google_rating, :latitude, :longitude, :ownership
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
                "nirf_rank_raw": "10",
                "bus_facility": "No",
                "placement_score": 0.0,
                "co_ed": "Co-ed",
                "ugc_recognized": "No",
                "google_rating": 4.0,
                "latitude": None,
                "longitude": None,
                "ownership": "Private"
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

        from db import db_session
        db_session.configure(bind=self.engine)
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

    def test_add_college_course(self):
        # Successful addition
        response = self.client.post(
            "/api/colleges/1/courses",
            json={
                "course_name": "Ph.D Computer Science",
                "course_level": "PhD",
                "course_category": "Computer Applications / IT",
                "duration": 3
            }
        )
        self.assertEqual(response.status_code, 201)
        payload = response.get_json()
        self.assertEqual(payload["status"], "success")
        self.assertEqual(payload["data"]["course_name"], "Ph.D Computer Science")
        self.assertEqual(payload["data"]["course_level"], "PhD")

        # Duplicate check (the mock setup already has 'B.Sc Computer Science' for college 1, let's try to add it again)
        response_dup = self.client.post(
            "/api/colleges/1/courses",
            json={
                "course_name": "B.Sc Computer Science",
                "course_level": "UG",
                "course_category": "Computer Applications / IT",
                "duration": 3
            }
        )
        self.assertEqual(response_dup.status_code, 400)
        self.assertEqual(response_dup.get_json()["status"], "error")

    def test_update_course(self):
        # Update course with primary key 1 (mock setup: we inserted 2 courses, their row ids will be 1 and 2 in sqlite)
        response = self.client.put(
            "/api/courses/1",
            json={
                "course_name": "B.Sc Computer Science and Data Analytics",
                "course_level": "UG",
                "course_category": "Computer Applications / IT",
                "duration": 3
            }
        )
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["status"], "success")
        self.assertEqual(payload["data"]["course_name"], "B.Sc Computer Science and Data Analytics")

        # Update course that doesn't exist
        response_not_found = self.client.put(
            "/api/courses/999",
            json={
                "course_name": "B.Sc Physics",
                "course_level": "UG",
                "course_category": "Science",
                "duration": 3
            }
        )
        self.assertEqual(response_not_found.status_code, 404)

    def test_delete_course(self):
        # Delete course with ID 1
        response = self.client.delete("/api/courses/1")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["status"], "success")
        self.assertEqual(payload["message"], "Course deleted successfully")

        # Delete course that doesn't exist
        response_not_found = self.client.delete("/api/courses/999")
        self.assertEqual(response_not_found.status_code, 404)


if __name__ == "__main__":
    unittest.main()
