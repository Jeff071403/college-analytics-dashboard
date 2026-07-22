import re
import urllib.parse
import urllib.request
import json
import os
import random
from sqlalchemy import func, text
from sqlalchemy.orm import joinedload
from models import College, Course, User
from db import db_session

# ==========================================
# Data Validation (Requirement 12)
# ==========================================

def validate_email(email):
    if not email:
        return True
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(pattern, email.strip()))

def validate_website(website):
    if not website:
        return True
    # A safe, standard URL pattern that prevents catastrophic backtracking
    pattern = r'^(https?:\/\/)?([a-zA-Z0-9\.\-\_]+)\.([a-zA-Z]{2,10})(\/[^\s]*)?$'
    return bool(re.match(pattern, website.strip()))

def validate_phone(phone):
    if not phone:
        return True
    cleaned = re.sub(r'[\s\-\(\)\+]', '', phone.strip())
    return cleaned.isdigit() and len(cleaned) >= 7

def validate_coords(lat, lon):
    if lat is None or lon is None:
        return True
    try:
        lat_val = float(lat)
        lon_val = float(lon)
        return -90.0 <= lat_val <= 90.0 and -180.0 <= lon_val <= 180.0
    except (ValueError, TypeError):
        return False


# ==========================================
# College Service
# ==========================================

def get_colleges_list(search_query=None, course_level=None, course_name=None):
    """
    Fetches all colleges matching search and filter parameters from database (Requirement 4 & 5).
    Uses SQLAlchemy ORM and aggregates course count.
    """
    db = db_session()
    
    # Subquery to calculate course counts per college
    course_counts = db.query(
        Course.college_id,
        func.count(Course.id).label('total_course_count')
    ).group_by(Course.college_id).subquery()
    
    query = db.query(
        College,
        func.coalesce(course_counts.c.total_course_count, 0).label('course_count')
    ).outerjoin(
        course_counts, College.college_id == course_counts.c.college_id
    )
    
    # Filter by college name, principal name, or course name matching the search query
    if search_query:
        search_pattern = f"%{search_query}%"
        # Check if college_id matches search inside courses
        matching_course_college_ids = db.query(Course.college_id).filter(
            Course.course_name.ilike(search_pattern)
        ).subquery()
        
        query = query.filter(
            (College.college_name.ilike(search_pattern)) |
            (College.principal_name.ilike(search_pattern)) |
            (College.college_id.in_(matching_course_college_ids))
        )
        
    # Filter by course level
    if course_level:
        matching_level_college_ids = db.query(Course.college_id).filter(
            Course.course_level == course_level
        ).subquery()
        query = query.filter(College.college_id.in_(matching_level_college_ids))
        
    # Filter by specific course name
    if course_name:
        matching_name_college_ids = db.query(Course.college_id).filter(
            Course.course_name == course_name
        ).subquery()
        query = query.filter(College.college_id.in_(matching_name_college_ids))
        
    query = query.order_by(College.college_id)
    
    results = query.all()
    
    colleges_data = []
    matching_ids = []
    
    for college, course_cnt in results:
        colleges_data.append({
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
            'nirf_rank': college.nirf_rank,
            'university_category': college.university_category,
            'hostel_facility': college.hostel_facility,
            'nirf_rank_raw': college.nirf_rank_raw,
            'ownership': college.ownership,
            'google_rating': college.google_rating,
            'latitude': college.latitude,
            'longitude': college.longitude,
            'bus_facility': college.bus_facility,
            'placement_score': college.placement_score,
            'co_ed': college.co_ed,
            'ugc_recognized': college.ugc_recognized,
            'course_count': course_cnt
        })
        matching_ids.append(college.college_id)
        
    # Calculate statistics using SQLAlchemy aggregations (Requirement 7)
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
        total_courses = sum(c['course_count'] for c in colleges_data)
        avg_courses = round(total_courses / len(colleges_data), 2) if colleges_data else 0.0
        
        highest_college = max(colleges_data, key=lambda x: x['course_count']) if colleges_data else None
        highest_course_college = {
            'college_name': highest_college['college_name'],
            'course_count': highest_college['course_count']
        } if highest_college and highest_college['course_count'] > 0 else None
        
        # Course levels aggregation query
        level_counts = db.query(
            Course.course_level,
            func.count(Course.id)
        ).filter(
            Course.college_id.in_(matching_ids)
        ).group_by(Course.course_level).all()
        
        course_distribution = {
            'UG': 0,
            'PG': 0,
            'Diploma': 0,
            'PhD': 0
        }
        for lvl, cnt in level_counts:
            if lvl in course_distribution:
                course_distribution[lvl] = cnt
                
        stats = {
            'total_courses': total_courses,
            'avg_courses': avg_courses,
            'highest_course_college': highest_course_college,
            'course_distribution': course_distribution
        }
        
    return colleges_data, stats


def get_college_by_id(college_id):
    db = db_session()
    return db.query(College).filter(College.college_id == college_id).first()


def check_college_exists(name, location_norm):
    db = db_session()
    return db.query(College).filter(
        func.lower(College.college_name) == name.strip().lower(),
        func.lower(College.location_normalized) == location_norm.strip().lower()
    ).first()


def create_college_record(data):
    """Creates college record in PostgreSQL after validation (Requirement 12)"""
    db = db_session()
    
    email = data.get('email', '').strip()
    website = data.get('website', '').strip()
    phone = data.get('phone', '').strip()
    lat = data.get('latitude')
    lon = data.get('longitude')
    
    if not validate_email(email):
        raise ValueError("Invalid email format.")
    if not validate_website(website):
        raise ValueError("Invalid website URL.")
    if not validate_phone(phone):
        raise ValueError("Invalid phone number.")
    if not validate_coords(lat, lon):
        raise ValueError("Coordinates must be valid decimals (-90 to 90 lat, -180 to 180 lon).")
        
    # Check duplicate
    name = data.get('college_name', '').strip()
    loc_norm = data.get('location_normalized', '').strip()
    if check_college_exists(name, loc_norm):
        raise ValueError(f"College '{name}' in '{loc_norm}' already exists.")
        
    max_id = db.query(func.max(College.college_id)).scalar()
    new_id = (max_id + 1) if max_id is not None else 1
    
    # Parse NIRF rank
    import re
    def parse_nirf(val_str):
        if not val_str or val_str.strip().lower() in ["not ranked", "nan"]:
            return None
        m = re.search(r'\d+', val_str)
        return int(m.group()) if m else None

    nirf_rank_raw = data.get('nirf_rank_raw', 'Not Ranked').strip()
    nirf_rank = parse_nirf(nirf_rank_raw)

    college = College(
        college_id=new_id,
        college_name=name,
        college_category=data.get('college_category', 'Arts & Science').strip(),
        location_raw=data.get('location_raw', 'Unknown').strip(),
        location_normalized=loc_norm,
        website=website,
        email=email,
        phone=phone,
        naac_grade=data.get('naac_grade', 'Not Listed').strip(),
        principal_name=data.get('principal_name', 'Unknown').strip(),
        autonomous=data.get('autonomous', 'No').strip(),
        university_category=data.get('university_category', 'Unknown').strip(),
        hostel_facility=data.get('hostel_facility', 'No Hostel Found').strip(),
        nirf_rank_raw=nirf_rank_raw,
        nirf_rank=nirf_rank,
        ownership=data.get('ownership', 'Private').strip(),
        google_rating=float(data.get('google_rating', 4.0)) if data.get('google_rating') is not None else 4.0,
        latitude=float(lat) if lat is not None and lat != '' else None,
        longitude=float(lon) if lon is not None and lon != '' else None,
        bus_facility=data.get('bus_facility', 'No').strip(),
        placement_score=float(data['placement_score']) if data.get('placement_score') is not None and data.get('placement_score') != '' else 0.0,
        co_ed=data.get('co_ed', 'Co-ed').strip(),
        ugc_recognized=data.get('ugc_recognized', 'No').strip()
    )
    
    db.add(college)
    db.commit()
    return college


def update_college_record(college_id, data):
    """Updates college record in PostgreSQL (Requirement 4)"""
    db = db_session()
    college = db.query(College).filter(College.college_id == college_id).first()
    if not college:
        return None
        
    email = data.get('email', college.email)
    website = data.get('website', college.website)
    phone = data.get('phone', college.phone)
    lat = data.get('latitude')
    lon = data.get('longitude')
    
    if email is not None and not validate_email(email):
        raise ValueError("Invalid email format.")
    if website is not None and not validate_website(website):
        raise ValueError("Invalid website URL.")
    if phone is not None and not validate_phone(phone):
        raise ValueError("Invalid phone number.")
    if not validate_coords(lat, lon):
        raise ValueError("Coordinates must be valid decimals (-90 to 90 lat, -180 to 180 lon).")

    # Update simple properties if in data
    college.college_name = data.get('college_name', college.college_name)
    college.college_category = data.get('college_category', college.college_category)
    college.location_raw = data.get('location_raw', college.location_raw)
    college.location_normalized = data.get('location_normalized', college.location_normalized)
    college.website = website
    college.email = email
    college.phone = phone
    college.naac_grade = data.get('naac_grade', college.naac_grade)
    college.principal_name = data.get('principal_name', college.principal_name)
    college.autonomous = data.get('autonomous', college.autonomous)
    college.university_category = data.get('university_category', college.university_category)
    college.hostel_facility = data.get('hostel_facility', college.hostel_facility)
    college.ownership = data.get('ownership', college.ownership)
    
    if 'google_rating' in data and data['google_rating'] is not None:
        college.google_rating = float(data['google_rating'])
        
    if lat is not None and lat != '':
        college.latitude = float(lat)
    if lon is not None and lon != '':
        college.longitude = float(lon)
        
    college.bus_facility = data.get('bus_facility', college.bus_facility)
    
    if 'placement_score' in data and data['placement_score'] is not None and data['placement_score'] != '':
        college.placement_score = float(data['placement_score'])
        
    college.co_ed = data.get('co_ed', college.co_ed)
    college.ugc_recognized = data.get('ugc_recognized', college.ugc_recognized)

    # Parse NIRF
    if 'nirf_rank_raw' in data:
        raw_val = data.get('nirf_rank_raw')
        college.nirf_rank_raw = str(raw_val).strip() if raw_val is not None else 'Not Ranked'
        import re
        def parse_nirf(val_str):
            if not val_str or val_str.strip().lower() in ["not ranked", "nan"]:
                return None
            m = re.search(r'\d+', val_str)
            return int(m.group()) if m else None
        college.nirf_rank = parse_nirf(college.nirf_rank_raw)
    elif 'nirf_rank' in data:
        nirf = data.get('nirf_rank')
        if nirf == '' or nirf is None:
            college.nirf_rank = None
            college.nirf_rank_raw = 'Not Ranked'
        else:
            college.nirf_rank = int(nirf)
            college.nirf_rank_raw = str(nirf)

    db.commit()
    return college


def delete_college_record(college_id):
    db = db_session()
    college = db.query(College).filter(College.college_id == college_id).first()
    if not college:
        return False
    db.delete(college)
    db.commit()
    return True


# ==========================================
# Course Service
# ==========================================

def get_distinct_course_names():
    db = db_session()
    results = db.query(Course.course_name).distinct().order_by(Course.course_name).all()
    return [r[0] for r in results]


def get_courses_by_college(college_id):
    db = db_session()
    return db.query(Course).filter(Course.college_id == college_id).order_by(Course.course_level, Course.course_name).all()


def check_course_exists(college_id, course_name):
    db = db_session()
    return db.query(Course).filter(
        Course.college_id == college_id,
        func.lower(Course.course_name) == course_name.strip().lower()
    ).first()


def add_course_to_college(college_id, data):
    db = db_session()
    college_exists = db.query(College).filter(College.college_id == college_id).first()
    if not college_exists:
        raise ValueError("College not found.")
        
    course_name = data.get('course_name', '').strip()
    if check_course_exists(college_id, course_name):
        raise ValueError("This college already offers this course.")
        
    # Check if a course_id for this name already exists in database
    existing_course_id = db.query(Course.course_id).filter(
        func.lower(Course.course_name) == course_name.lower()
    ).first()
    
    if existing_course_id:
        course_id = existing_course_id[0]
    else:
        max_id = db.query(func.max(Course.course_id)).scalar()
        course_id = (max_id + 1) if max_id is not None else 1
        
    course = Course(
        course_id=course_id,
        college_id=college_id,
        course_name=course_name,
        course_level=data.get('course_level', '').strip(),
        course_category=data.get('course_category', '').strip(),
        duration=int(data.get('duration', 3))
    )
    
    db.add(course)
    db.commit()
    return course


def update_course_record(course_record_id, data):
    db = db_session()
    course = db.query(Course).filter(Course.id == course_record_id).first()
    if not course:
        return None
        
    course_name = data.get('course_name', '').strip()
    # Check duplicates
    dup_check = db.query(Course).filter(
        Course.college_id == course.college_id,
        func.lower(Course.course_name) == course_name.lower(),
        Course.id != course_record_id
    ).first()
    if dup_check:
        raise ValueError("This college already offers a course with this name.")
        
    # Determine course_id
    existing_course_id = db.query(Course.course_id).filter(
        func.lower(Course.course_name) == course_name.lower(),
        Course.id != course_record_id
    ).first()
    
    if existing_course_id:
        course_id = existing_course_id[0]
    else:
        max_id = db.query(func.max(Course.course_id)).scalar()
        course_id = (max_id + 1) if max_id is not None else 1
        
    course.course_id = course_id
    course.course_name = course_name
    course.course_level = data.get('course_level', course.course_level)
    course.course_category = data.get('course_category', course.course_category)
    course.duration = int(data.get('duration', course.duration))
    
    db.commit()
    return course


def delete_course_record(course_record_id):
    db = db_session()
    course = db.query(Course).filter(Course.id == course_record_id).first()
    if not course:
        return None
    college_id = course.college_id
    course_name = course.course_name
    db.delete(course)
    db.commit()
    return {'college_id': college_id, 'course_name': course_name}
