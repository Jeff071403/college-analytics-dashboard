import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import text
from db import get_engine

app = Flask(__name__)
CORS(app)

# Retrieve the DB engine
engine, db_type = get_engine()

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
                    'course_count': row[15]
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
                    nirf_rank_raw
                FROM colleges
                WHERE college_id = :college_id
            """), {'college_id': college_id}).mappings().first()

            if existing is None:
                return jsonify({'status': 'error', 'message': 'College not found'}), 404

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
                    nirf_rank_raw = :nirf_rank_raw
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
                SELECT course_id, course_name, course_level, course_category, duration 
                FROM courses 
                WHERE college_id = :college_id
                ORDER BY course_level, course_name
            """), {'college_id': college_id})
            
            courses = []
            for row in result:
                courses.append({
                    'course_id': row[0],
                    'course_name': row[1],
                    'course_level': row[2],
                    'course_category': row[3],
                    'duration': row[4]
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

if __name__ == '__main__':
    # Run on port 5000, disabling the auto-reloader to prevent Windows crashes
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
