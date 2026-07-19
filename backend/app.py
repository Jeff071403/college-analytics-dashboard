import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import text
from db import get_engine
from migrations import run_migrations

app = Flask(__name__)
CORS(app)

# Retrieve the DB engine
engine, db_type = get_engine()

_migrated_engines = set()

@app.before_request
def ensure_migrations():
    if engine not in _migrated_engines:
        run_migrations(engine)
        _migrated_engines.add(engine)


@app.route('/api/colleges', methods=['GET'])
def get_colleges():
    try:
        search = request.args.get('search', '').strip()
        course_level = request.args.get('course_level', '').strip()
        course_name = request.args.get('course_name', '').strip()
        
        # Determine case-insensitivity operator based on database type
        like_op = "ILIKE" if db_type == "postgresql" else "LIKE"
        
        # Base query to fetch colleges along with total course count via SQL COUNT aggregation
        query = f"""
            SELECT 
                c.college_id, 
                c.college_name, 
                c.college_category, 
                c.location_raw, 
                c.location_normalized, 
                c.website, 
                c.email, 
                c.phone, 
                c.naac_grade, 
                c.principal_name, 
                c.autonomous,
                c.nirf_rank,
                c.university_category,
                c.hostel_facility,
                c.nirf_rank_raw,
                c.ownership,
                c.latitude,
                c.longitude,
                c.google_rating,
                COALESCE(course_counts.total_course_count, 0) AS course_count
            FROM colleges c
            LEFT JOIN (
                SELECT college_id, COUNT(*) AS total_course_count
                FROM courses
                GROUP BY college_id
            ) course_counts ON c.college_id = course_counts.college_id
            WHERE 1=1
        """
        params = {}
        
        # Add search filter matching college name, principal name, or course name
        if search:
            query += f""" AND (
                c.college_name {like_op} :search
                OR c.principal_name {like_op} :search
                OR c.college_id IN (
                    SELECT college_id FROM courses WHERE course_name {like_op} :search
                )
            )"""
            params['search'] = f"%{search}%"
            
        # Add course level filter
        if course_level:
            query += """ AND c.college_id IN (
                SELECT college_id FROM courses WHERE course_level = :course_level
            )"""
            params['course_level'] = course_level
            
        # Add course name filter
        if course_name:
            query += """ AND c.college_id IN (
                SELECT college_id FROM courses WHERE course_name = :course_name
            )"""
            params['course_name'] = course_name
            
        query += " ORDER BY c.college_id"
        
        with engine.connect() as conn:
            result = conn.execute(text(query), params)
            colleges = []
            matching_ids = []
            
            for row in result:
                colleges.append({
                    'college_id': row[0],
                    'college_name': row[1],
                    'college_category': row[2],
                    'location_raw': row[3],
                    'location_normalized': row[4],
                    'website': row[5],
                    'email': row[6],
                    'phone': row[7],
                    'naac_grade': row[8],
                    'principal_name': row[9],
                    'autonomous': row[10],
                    'nirf_rank': row[11],
                    'university_category': row[12],
                    'hostel_facility': row[13],
                    'nirf_rank_raw': row[14],
                    'ownership': row[15],
                    'latitude': row[16],
                    'longitude': row[17],
                    'google_rating': row[18],
                    'course_count': row[19]
                })
                matching_ids.append(row[0])
                
            # Calculate dynamic metrics for course data matching current query
            stats = {
                'total_courses': 0,
                'avg_courses': 0.0,
                'highest_course_college': None,
                'course_distribution': {
                    'UG': 0,
                    'PG': 0,
                    'Diploma': 0,
                    'PhD': 0
                }
            }
            
            if matching_ids:
                total_courses = sum(c['course_count'] for c in colleges)
                avg_courses = round(total_courses / len(colleges), 2) if colleges else 0.0
                
                # College with the highest course count
                highest_college = max(colleges, key=lambda x: x['course_count']) if colleges else None
                highest_course_college = {
                    'college_name': highest_college['college_name'],
                    'course_count': highest_college['course_count']
                } if highest_college and highest_college['course_count'] > 0 else None
                
                # Fetch course level distribution for matched colleges
                ids_str = ','.join(map(str, matching_ids))
                dist_query = text(f"""
                    SELECT course_level, COUNT(*) 
                    FROM courses 
                    WHERE college_id IN ({ids_str})
                    GROUP BY course_level
                """)
                dist_result = conn.execute(dist_query)
                course_distribution = {
                    'UG': 0,
                    'PG': 0,
                    'Diploma': 0,
                    'PhD': 0
                }
                for drow in dist_result:
                    lvl = drow[0]
                    cnt = drow[1]
                    if lvl in course_distribution:
                        course_distribution[lvl] = cnt
                        
                stats = {
                    'total_courses': total_courses,
                    'avg_courses': avg_courses,
                    'highest_course_college': highest_course_college,
                    'course_distribution': course_distribution
                }
                
            return jsonify({
                'status': 'success',
                'count': len(colleges),
                'db_type': db_type,
                'data': colleges,
                'stats': stats
            })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/colleges/<int:college_id>', methods=['PUT'])
def update_college(college_id):
    try:
        data = request.get_json(silent=True) or {}
        if not data:
            return jsonify({'status': 'error', 'message': 'No data provided'}), 400

        with engine.begin() as conn:
            existing = conn.execute(text("""
                SELECT
                    college_name,
                    college_category,
                    location_raw,
                    location_normalized,
                    website,
                    email,
                    phone,
                    naac_grade,
                    principal_name,
                    autonomous,
                    nirf_rank,
                    university_category,
                    hostel_facility,
                    nirf_rank_raw,
                    ownership,
                    google_rating,
                    latitude,
                    longitude
                FROM colleges
                WHERE college_id = :college_id
            """), {'college_id': college_id}).mappings().first()

            if existing is None:
                return jsonify({'status': 'error', 'message': 'College not found'}), 404

            location_changed = False
            if 'location_normalized' in data and data['location_normalized'] != existing['location_normalized']:
                location_changed = True
            elif 'college_name' in data and data['college_name'] != existing['college_name']:
                location_changed = True

            lat_val = data.get('latitude')
            lon_val = data.get('longitude')
            
            lat_resolved = None
            lon_resolved = None
            if lat_val is not None and lat_val != '':
                lat_resolved = float(lat_val)
            elif not location_changed:
                lat_resolved = existing['latitude']
                
            if lon_val is not None and lon_val != '':
                lon_resolved = float(lon_val)
            elif not location_changed:
                lon_resolved = existing['longitude']

            update_values = {
                'college_name': data.get('college_name', existing['college_name']),
                'college_category': data.get('college_category', existing['college_category']),
                'location_raw': data.get('location_raw', existing['location_raw']),
                'location_normalized': data.get('location_normalized', existing['location_normalized']),
                'website': data.get('website', existing['website'] or ''),
                'email': data.get('email', existing['email'] or ''),
                'phone': data.get('phone', existing['phone'] or ''),
                'naac_grade': data.get('naac_grade', existing['naac_grade']),
                'principal_name': data.get('principal_name', existing['principal_name'] or ''),
                'autonomous': data.get('autonomous', existing['autonomous']),
                'university_category': data.get('university_category', existing['university_category']),
                'hostel_facility': data.get('hostel_facility', existing['hostel_facility']),
                'ownership': data.get('ownership', existing['ownership'] or 'Private'),
                'google_rating': float(data.get('google_rating', existing['google_rating'] if existing['google_rating'] is not None else 4.0)),
                'latitude': lat_resolved,
                'longitude': lon_resolved
            }

            if 'nirf_rank_raw' in data:
                raw_val = data.get('nirf_rank_raw')
                update_values['nirf_rank_raw'] = str(raw_val).strip() if raw_val is not None else 'Not Ranked'
                import re
                def parse_nirf(val_str):
                    if not val_str or val_str.strip().lower() in ["not ranked", "nan"]:
                        return None
                    m = re.search(r'\d+', val_str)
                    return int(m.group()) if m else None
                update_values['nirf_rank'] = parse_nirf(update_values['nirf_rank_raw'])
            elif 'nirf_rank' in data:
                nirf_rank = data.get('nirf_rank')
                if nirf_rank == '' or nirf_rank is None:
                    update_values['nirf_rank'] = None
                    update_values['nirf_rank_raw'] = 'Not Ranked'
                else:
                    try:
                        update_values['nirf_rank'] = int(nirf_rank)
                        update_values['nirf_rank_raw'] = str(nirf_rank)
                    except ValueError:
                        return jsonify({'status': 'error', 'message': 'NIRF Rank must be an integer'}), 400
            else:
                update_values['nirf_rank'] = existing['nirf_rank']
                update_values['nirf_rank_raw'] = existing['nirf_rank_raw']

            conn.execute(text("""
                UPDATE colleges
                SET
                    college_name = :college_name,
                    college_category = :college_category,
                    location_raw = :location_raw,
                    location_normalized = :location_normalized,
                    website = :website,
                    email = :email,
                    phone = :phone,
                    naac_grade = :naac_grade,
                    principal_name = :principal_name,
                    autonomous = :autonomous,
                    nirf_rank = :nirf_rank,
                    university_category = :university_category,
                    hostel_facility = :hostel_facility,
                    nirf_rank_raw = :nirf_rank_raw,
                    ownership = :ownership,
                    google_rating = :google_rating,
                    latitude = :latitude,
                    longitude = :longitude
                WHERE college_id = :college_id
            """), {
                **update_values,
                'college_id': college_id
            })

            response_data = {
                'college_id': college_id,
                **update_values
            }

        return jsonify({
            'status': 'success',
            'message': 'College updated successfully',
            'data': response_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/colleges', methods=['POST'])
def add_college():
    try:
        data = request.get_json(silent=True) or {}
        college_name = data.get('college_name', '').strip()
        if not college_name:
            return jsonify({'status': 'error', 'message': 'College Name is required'}), 400

        with engine.begin() as conn:
            max_id = conn.execute(text("SELECT MAX(college_id) FROM colleges")).scalar()
            new_id = (max_id + 1) if max_id is not None else 1

            import re
            def parse_nirf(val_str):
                if not val_str or val_str.strip().lower() in ["not ranked", "nan"]:
                    return None
                m = re.search(r'\d+', val_str)
                return int(m.group()) if m else None

            nirf_rank_raw = data.get('nirf_rank_raw', 'Not Ranked').strip()
            nirf_rank = parse_nirf(nirf_rank_raw)

            lat_val = data.get('latitude')
            lon_val = data.get('longitude')
            lat = float(lat_val) if lat_val is not None and lat_val != '' else None
            lon = float(lon_val) if lon_val is not None and lon_val != '' else None

            values = {
                'college_id': new_id,
                'college_name': college_name,
                'college_category': data.get('college_category', 'Arts & Science').strip(),
                'location_raw': data.get('location_raw', 'Unknown').strip(),
                'location_normalized': data.get('location_normalized', 'Unknown').strip(),
                'website': data.get('website', '').strip(),
                'email': data.get('email', '').strip(),
                'phone': data.get('phone', '').strip(),
                'naac_grade': data.get('naac_grade', 'Not Listed').strip(),
                'principal_name': data.get('principal_name', 'Unknown').strip(),
                'autonomous': data.get('autonomous', 'No').strip(),
                'university_category': data.get('university_category', 'Unknown').strip(),
                'hostel_facility': data.get('hostel_facility', 'No Hostel Found').strip(),
                'nirf_rank_raw': nirf_rank_raw,
                'nirf_rank': nirf_rank,
                'ownership': data.get('ownership', 'Private').strip(),
                'google_rating': float(data.get('google_rating', 4.0)),
                'latitude': lat,
                'longitude': lon
            }

            conn.execute(text("""
                INSERT INTO colleges (
                    college_id, college_name, college_category, location_raw, location_normalized,
                    website, email, phone, naac_grade, principal_name, autonomous, nirf_rank,
                    university_category, hostel_facility, nirf_rank_raw, ownership, google_rating,
                    latitude, longitude
                ) VALUES (
                    :college_id, :college_name, :college_category, :location_raw, :location_normalized,
                    :website, :email, :phone, :naac_grade, :principal_name, :autonomous, :nirf_rank,
                    :university_category, :hostel_facility, :nirf_rank_raw, :ownership, :google_rating,
                    :latitude, :longitude
                )
            """), values)

        # Include course_count = 0 in returning data for immediate frontend rendering
        values['course_count'] = 0
        return jsonify({
            'status': 'success',
            'message': 'College added successfully',
            'data': values
        }), 201
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/colleges/<int:college_id>', methods=['DELETE'])
def delete_college(college_id):
    try:
        with engine.begin() as conn:
            result = conn.execute(text("""
                DELETE FROM colleges
                WHERE college_id = :college_id
            """), {'college_id': college_id})

            if result.rowcount == 0:
                return jsonify({'status': 'error', 'message': 'College not found'}), 404

        return jsonify({
            'status': 'success',
            'message': 'College deleted successfully',
            'data': {'college_id': college_id}
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/courses', methods=['GET'])
def get_courses():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT DISTINCT course_name FROM courses ORDER BY course_name"))
            courses = [row[0] for row in result]
            return jsonify({
                'status': 'success',
                'data': courses
            })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/colleges/<int:college_id>/courses', methods=['GET'])
@app.route('/college/<int:college_id>/courses', methods=['GET'])
def get_college_courses(college_id):
    try:
        with engine.connect() as conn:
            # Check if college exists
            check_college = conn.execute(text("SELECT 1 FROM colleges WHERE college_id = :college_id"), {'college_id': college_id}).scalar()
            if not check_college:
                return jsonify({
                    'status': 'error',
                    'message': 'College not found'
                }), 404
                
            result = conn.execute(text("""
                SELECT id, course_id, course_name, course_level, course_category, duration 
                FROM courses 
                WHERE college_id = :college_id
                ORDER BY course_level, course_name
            """), {'college_id': college_id})
            
            courses = []
            for row in result:
                courses.append({
                    'id': row[0],
                    'course_id': row[1],
                    'course_name': row[2],
                    'course_level': row[3],
                    'course_category': row[4],
                    'duration': row[5]
                })
                
            return jsonify({
                'status': 'success',
                'count': len(courses),
                'data': courses
            })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/colleges/<int:college_id>/courses', methods=['POST'])
def add_college_course(college_id):
    try:
        data = request.get_json(silent=True) or {}
        course_name = data.get('course_name', '').strip()
        course_level = data.get('course_level', '').strip()
        course_category = data.get('course_category', '').strip()
        duration = data.get('duration')

        if not course_name or not course_level or not course_category or duration is None:
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400

        try:
            duration = int(duration)
        except ValueError:
            return jsonify({'status': 'error', 'message': 'Duration must be an integer'}), 400

        with engine.begin() as conn:
            # Check if college exists
            check_college = conn.execute(text("SELECT 1 FROM colleges WHERE college_id = :college_id"), {'college_id': college_id}).scalar()
            if not check_college:
                return jsonify({'status': 'error', 'message': 'College not found'}), 404

            # Check if college already offers this course name (prevent duplicates)
            dup_check = conn.execute(text("""
                SELECT 1 FROM courses 
                WHERE college_id = :college_id AND LOWER(course_name) = LOWER(:course_name)
            """), {'college_id': college_id, 'course_name': course_name}).scalar()
            if dup_check:
                return jsonify({'status': 'error', 'message': 'This college already offers this course'}), 400

            # Determine course_id
            existing_course_id = conn.execute(text("""
                SELECT course_id FROM courses 
                WHERE LOWER(course_name) = LOWER(:course_name) 
                LIMIT 1
            """), {'course_name': course_name}).scalar()

            if existing_course_id:
                course_id = existing_course_id
            else:
                max_id = conn.execute(text("SELECT MAX(course_id) FROM courses")).scalar()
                course_id = (max_id + 1) if max_id is not None else 1

            # Insert course
            if db_type == "postgresql":
                result = conn.execute(text("""
                    INSERT INTO courses (course_id, college_id, course_name, course_level, course_category, duration)
                    VALUES (:course_id, :college_id, :course_name, :course_level, :course_category, :duration)
                    RETURNING id
                """), {
                    'course_id': course_id, 'college_id': college_id, 'course_name': course_name,
                    'course_level': course_level, 'course_category': course_category, 'duration': duration
                })
                inserted_id = result.scalar()
            else:
                conn.execute(text("""
                    INSERT INTO courses (course_id, college_id, course_name, course_level, course_category, duration)
                    VALUES (:course_id, :college_id, :course_name, :course_level, :course_category, :duration)
                """), {
                    'course_id': course_id, 'college_id': college_id, 'course_name': course_name,
                    'course_level': course_level, 'course_category': course_category, 'duration': duration
                })
                inserted_id = conn.execute(text("SELECT last_insert_rowid()")).scalar()

        return jsonify({
            'status': 'success',
            'message': 'Course added successfully',
            'data': {
                'id': inserted_id,
                'course_id': course_id,
                'college_id': college_id,
                'course_name': course_name,
                'course_level': course_level,
                'course_category': course_category,
                'duration': duration
            }
        }), 201
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/courses/<int:id>', methods=['PUT'])
def update_course(id):
    try:
        data = request.get_json(silent=True) or {}
        course_name = data.get('course_name', '').strip()
        course_level = data.get('course_level', '').strip()
        course_category = data.get('course_category', '').strip()
        duration = data.get('duration')

        if not course_name or not course_level or not course_category or duration is None:
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400

        try:
            duration = int(duration)
        except ValueError:
            return jsonify({'status': 'error', 'message': 'Duration must be an integer'}), 400

        with engine.begin() as conn:
            # Check if course exists
            course = conn.execute(text("SELECT college_id FROM courses WHERE id = :id"), {'id': id}).mappings().first()
            if not course:
                return jsonify({'status': 'error', 'message': 'Course not found'}), 404
            
            college_id = course['college_id']

            # Check if updating to a duplicate course name under the same college
            dup_check = conn.execute(text("""
                SELECT 1 FROM courses 
                WHERE college_id = :college_id AND LOWER(course_name) = LOWER(:course_name) AND id != :id
            """), {'college_id': college_id, 'course_name': course_name, 'id': id}).scalar()
            if dup_check:
                return jsonify({'status': 'error', 'message': 'This college already offers a course with this name'}), 400

            # Determine course_id for the updated name
            existing_course_id = conn.execute(text("""
                SELECT course_id FROM courses 
                WHERE LOWER(course_name) = LOWER(:course_name) AND id != :id
                LIMIT 1
            """), {'course_name': course_name, 'id': id}).scalar()

            if existing_course_id:
                course_id = existing_course_id
            else:
                max_id = conn.execute(text("SELECT MAX(course_id) FROM courses")).scalar()
                course_id = (max_id + 1) if max_id is not None else 1

            # Update database
            conn.execute(text("""
                UPDATE courses
                SET course_id = :course_id,
                    course_name = :course_name,
                    course_level = :course_level,
                    course_category = :course_category,
                    duration = :duration
                WHERE id = :id
            """), {
                'course_id': course_id,
                'course_name': course_name,
                'course_level': course_level,
                'course_category': course_category,
                'duration': duration,
                'id': id
            })

        return jsonify({
            'status': 'success',
            'message': 'Course updated successfully',
            'data': {
                'id': id,
                'course_id': course_id,
                'college_id': college_id,
                'course_name': course_name,
                'course_level': course_level,
                'course_category': course_category,
                'duration': duration
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/courses/<int:id>', methods=['DELETE'])
def delete_course(id):
    try:
        with engine.begin() as conn:
            # Check if course exists
            course = conn.execute(text("SELECT college_id, course_name FROM courses WHERE id = :id"), {'id': id}).mappings().first()
            if not course:
                return jsonify({'status': 'error', 'message': 'Course not found'}), 404

            conn.execute(text("DELETE FROM courses WHERE id = :id"), {'id': id})

        return jsonify({
            'status': 'success',
            'message': 'Course deleted successfully',
            'data': {
                'id': id,
                'college_id': course['college_id'],
                'course_name': course['course_name']
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


if __name__ == '__main__':
    # Run on port 5000, disabling the auto-reloader to prevent Windows crashes
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
