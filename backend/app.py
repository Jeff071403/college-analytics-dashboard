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
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    college_id, 
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
                ORDER BY college_id
            """))
            
            colleges = []
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
                    'nirf_rank_raw': row[14]
                })
                
            return jsonify({
                'status': 'success',
                'count': len(colleges),
                'db_type': db_type,
                'data': colleges
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

if __name__ == '__main__':
    # Run on port 5000, disabling the auto-reloader to prevent Windows crashes
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
