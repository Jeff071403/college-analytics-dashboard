import os
import threading
import time
import urllib.parse
import urllib.request
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from db import db_session, engine
from models import College
from services import (
    get_colleges_list,
    get_college_by_id,
    create_college_record,
    update_college_record,
    delete_college_record,
    get_distinct_course_names,
    get_courses_by_college,
    add_course_to_college,
    update_course_record,
    delete_course_record
)

app = Flask(__name__)
CORS(app)

# Remove scoped sessions on request teardown to avoid connection leaks
@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

# ==========================================
# Background Geocoding Task (Requirement 6)
# ==========================================

def start_background_geocoding():
    def loop():
        print("[Background Geocoder] Thread started.")
        while True:
            db = db_session()
            try:
                # Query colleges that lack coordinates
                colleges_to_geocode = db.query(College).filter(
                    (College.latitude == None) | (College.longitude == None)
                ).all()
                
                if colleges_to_geocode:
                    print(f"[Background Geocoder] Found {len(colleges_to_geocode)} colleges needing geocoding.")
                    api_key = os.getenv('VITE_GOOGLE_MAPS_API_KEY') or os.getenv('GOOGLE_MAPS_API_KEY')
                    
                    import re
                    for college in colleges_to_geocode:
                        time.sleep(1.5) # Sleep to avoid rate limiting
                        
                        name = college.college_name
                        area_raw = college.location_raw or ''
                        area_norm = college.location_normalized or ''
                        
                        # Clean parentheses content (like "(Autonomous)", "(Men)")
                        clean_name = re.sub(r'\(.*?\)', '', name).strip()
                        clean_name = " ".join(clean_name.split())
                        
                        # Build query variations in order of specificity
                        queries = []
                        
                        # Query 1: Clean Name, Area Raw, Area Norm, Chennai, Tamil Nadu, India
                        parts1 = [clean_name]
                        if area_raw and area_raw.lower() not in clean_name.lower():
                            parts1.append(area_raw)
                        if area_norm and area_norm.lower() not in (clean_name + ' ' + area_raw).lower():
                            parts1.append(area_norm)
                        if 'chennai' not in clean_name.lower() and 'chennai' not in area_raw.lower() and 'chennai' not in area_norm.lower():
                            parts1.append('Chennai')
                        parts1.append('Tamil Nadu')
                        parts1.append('India')
                        queries.append(", ".join(parts1))
                        
                        # Query 2: Clean Name, Chennai, Tamil Nadu, India
                        if 'chennai' not in clean_name.lower():
                            queries.append(f"{clean_name}, Chennai, Tamil Nadu, India")
                        else:
                            queries.append(f"{clean_name}, Tamil Nadu, India")
                            
                        # Query 3: Area/City Fallback
                        if area_raw and area_raw.lower() != 'chennai':
                            queries.append(f"{area_raw}, Chennai, Tamil Nadu, India")
                        elif area_norm and area_norm.lower() != 'chennai':
                            queries.append(f"{area_norm}, Chennai, Tamil Nadu, India")
                        
                        # Query 4: City Center absolute fallback
                        queries.append("Chennai, Tamil Nadu, India")
                        
                        lat, lon = None, None
                        
                        # Try to resolve coordinates using query candidates
                        for query in queries:
                            # 1. Google Geocoding
                            if api_key:
                                try:
                                    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={urllib.parse.quote(query)}&key={api_key}"
                                    req = urllib.request.Request(url, headers={'User-Agent': 'CollegeAnalyticsPortal/2.0'})
                                    with urllib.request.urlopen(req, timeout=10) as response:
                                        res_data = json.loads(response.read().decode())
                                        if res_data and res_data.get('status') == 'OK' and res_data.get('results'):
                                            loc = res_data['results'][0]['geometry']['location']
                                            lat, lon = float(loc['lat']), float(loc['lng'])
                                            print(f"[Background Geocoder] Google Geocoded via '{query}'")
                                            break
                                except Exception as ge_err:
                                    print(f"[Background Geocoder] Google Geocoding failed for '{query}': {ge_err}")
                                    
                            # 2. OSM Nominatim (if Google failed or no key)
                            try:
                                url = "https://nominatim.openstreetmap.org/search?q=" + urllib.parse.quote(query) + "&format=json&limit=1"
                                req = urllib.request.Request(url, headers={'User-Agent': 'CollegeAnalyticsPortal/2.0 (jeffe@gmail.com)'})
                                with urllib.request.urlopen(req, timeout=10) as response:
                                    res_data = json.loads(response.read().decode())
                                    if res_data:
                                        lat, lon = float(res_data[0]['lat']), float(res_data[0]['lon'])
                                        print(f"[Background Geocoder] OS Nominatim Geocoded via '{query}'")
                                        break
                            except Exception as os_err:
                                print(f"[Background Geocoder] OS Nominatim failed for '{query}': {os_err}")
                                if hasattr(os_err, 'code') and os_err.code == 429:
                                    print("[Background Geocoder] OSM Nominatim returned 429. Aborting query search loop.")
                                    time.sleep(2)
                                    break
                                    
                        # Save resolved coordinates
                        if lat is not None and lon is not None:
                            college.latitude = lat
                            college.longitude = lon
                            db.commit()
                            print(f"[Background Geocoder] Saved '{name}' -> ({lat}, {lon})")
                            continue
            except Exception as loop_err:
                print(f"[Background Geocoder] Task loop error: {loop_err}")
            finally:
                db_session.remove()
                
            time.sleep(30)
            
    threading.Thread(target=loop, daemon=True).start()

# Start background thread
start_background_geocoding()


# ==========================================
# API Routes
# ==========================================

@app.route('/api/colleges', methods=['GET'])
def get_colleges():
    try:
        search = request.args.get('search', '').strip()
        course_level = request.args.get('course_level', '').strip()
        course_name = request.args.get('course_name', '').strip()
        
        colleges, stats = get_colleges_list(
            search_query=search,
            course_level=course_level,
            course_name=course_name
        )
        
        return jsonify({
            'status': 'success',
            'count': len(colleges),
            'db_type': 'postgresql',
            'data': colleges,
            'stats': stats
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
        if not data.get('college_name', '').strip():
            return jsonify({'status': 'error', 'message': 'College Name is required'}), 400
            
        college = create_college_record(data)
        
        # Build return values matching expected format
        return_dict = {
            'college_id': college.college_id,
            'college_name': college.college_name,
            'college_category': college.college_category,
            'location_raw': college.location_raw,
            'location_normalized': college.location_normalized,
            'website': college.website,
            'email': college.email,
            'phone': college.phone,
            'naac_grade': college.naac_grade,
            'principal_name': college.principal_name,
            'autonomous': college.autonomous,
            'university_category': college.university_category,
            'hostel_facility': college.hostel_facility,
            'nirf_rank_raw': college.nirf_rank_raw,
            'nirf_rank': college.nirf_rank,
            'ownership': college.ownership,
            'google_rating': college.google_rating,
            'latitude': college.latitude,
            'longitude': college.longitude,
            'bus_facility': college.bus_facility,
            'placement_score': college.placement_score,
            'co_ed': college.co_ed,
            'ugc_recognized': college.ugc_recognized,
            'course_count': 0
        }
        
        return jsonify({
            'status': 'success',
            'message': 'College added successfully',
            'data': return_dict
        }), 201
    except ValueError as val_err:
        return jsonify({'status': 'error', 'message': str(val_err)}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/colleges/<int:college_id>', methods=['PUT'])
def update_college(college_id):
    try:
        data = request.get_json(silent=True) or {}
        college = update_college_record(college_id, data)
        if not college:
            return jsonify({'status': 'error', 'message': 'College not found'}), 404
            
        return_dict = {
            'college_id': college.college_id,
            'college_name': college.college_name,
            'college_category': college.college_category,
            'location_raw': college.location_raw,
            'location_normalized': college.location_normalized,
            'website': college.website,
            'email': college.email,
            'phone': college.phone,
            'naac_grade': college.naac_grade,
            'principal_name': college.principal_name,
            'autonomous': college.autonomous,
            'university_category': college.university_category,
            'hostel_facility': college.hostel_facility,
            'nirf_rank_raw': college.nirf_rank_raw,
            'nirf_rank': college.nirf_rank,
            'ownership': college.ownership,
            'google_rating': college.google_rating,
            'latitude': college.latitude,
            'longitude': college.longitude,
            'bus_facility': college.bus_facility,
            'placement_score': college.placement_score,
            'co_ed': college.co_ed,
            'ugc_recognized': college.ugc_recognized
        }
        
        return jsonify({
            'status': 'success',
            'message': 'College updated successfully',
            'data': return_dict
        })
    except ValueError as val_err:
        return jsonify({'status': 'error', 'message': str(val_err)}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/colleges/<int:college_id>', methods=['DELETE'])
def delete_college(college_id):
    try:
        success = delete_college_record(college_id)
        if not success:
            return jsonify({'status': 'error', 'message': 'College not found'}), 404
            
        return jsonify({
            'status': 'success',
            'message': 'College deleted successfully',
            'data': {'college_id': college_id}
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/courses', methods=['GET'])
def get_courses():
    try:
        courses = get_distinct_course_names()
        return jsonify({
            'status': 'success',
            'data': courses
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/colleges/<int:college_id>/courses', methods=['GET'])
@app.route('/college/<int:college_id>/courses', methods=['GET'])
def get_college_courses(college_id):
    try:
        college = get_college_by_id(college_id)
        if not college:
            return jsonify({'status': 'error', 'message': 'College not found'}), 404
            
        courses = get_courses_by_college(college_id)
        courses_data = []
        for c in courses:
            courses_data.append({
                'id': c.id,
                'course_id': c.course_id,
                'course_name': c.course_name,
                'course_level': c.course_level,
                'course_category': c.course_category,
                'duration': c.duration
            })
            
        return jsonify({
            'status': 'success',
            'count': len(courses_data),
            'data': courses_data
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/colleges/<int:college_id>/courses', methods=['POST'])
def add_college_course(college_id):
    try:
        data = request.get_json(silent=True) or {}
        if not data.get('course_name', '').strip() or not data.get('course_level', '').strip() or data.get('duration') is None:
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
            
        course = add_course_to_college(college_id, data)
        
        return jsonify({
            'status': 'success',
            'message': 'Course added successfully',
            'data': {
                'id': course.id,
                'course_id': course.course_id,
                'college_id': course.college_id,
                'course_name': course.course_name,
                'course_level': course.course_level,
                'course_category': course.course_category,
                'duration': course.duration
            }
        }), 201
    except ValueError as val_err:
        return jsonify({'status': 'error', 'message': str(val_err)}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/courses/<int:id>', methods=['PUT'])
def update_course(id):
    try:
        data = request.get_json(silent=True) or {}
        if not data.get('course_name', '').strip() or not data.get('course_level', '').strip() or data.get('duration') is None:
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
            
        course = update_course_record(id, data)
        if not course:
            return jsonify({'status': 'error', 'message': 'Course not found'}), 404
            
        return jsonify({
            'status': 'success',
            'message': 'Course updated successfully',
            'data': {
                'id': course.id,
                'course_id': course.course_id,
                'college_id': course.college_id,
                'course_name': course.course_name,
                'course_level': course.course_level,
                'course_category': course.course_category,
                'duration': course.duration
            }
        })
    except ValueError as val_err:
        return jsonify({'status': 'error', 'message': str(val_err)}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/courses/<int:id>', methods=['DELETE'])
def delete_course(id):
    try:
        res = delete_course_record(id)
        if not res:
            return jsonify({'status': 'error', 'message': 'Course not found'}), 404
            
        return jsonify({
            'status': 'success',
            'message': 'Course deleted successfully',
            'data': {
                'id': id,
                'college_id': res['college_id'],
                'course_name': res['course_name']
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
