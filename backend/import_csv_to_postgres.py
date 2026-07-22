import os
import re
import pandas as pd
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

from models import Base, College, Course
from db import get_db, engine, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME
from services import validate_email, validate_website, validate_phone

def parse_nirf_rank_int(val):
    if pd.isna(val):
        return None
    val_str = str(val).strip()
    if val_str.lower() in ["", "nan", "not ranked"]:
        return None
    match = re.search(r'\d+', val_str)
    if match:
        return int(match.group())
    return None

def normalize_location(loc):
    if pd.isna(loc):
        return "Unknown"
    loc_str = str(loc).strip()
    loc_lower = loc_str.lower()
    
    if any(k in loc_lower for k in ["chengalpattu", "chengalpet", "chengelpet"]):
        return "Chengalpattu"
    if any(k in loc_lower for k in ["thiruvallur", "tiruvallur"]):
        return "Thiruvallur"
    if loc_lower == "chennai":
        return "Chennai"
        
    if loc_str.islower():
        return loc_str.title()
    return loc_str

def parse_course_details(course_name):
    name = course_name.strip()
    n = name.lower()
    
    if n.startswith('phd') or n.startswith('ph.d') or 'doctor of' in n:
        level = 'PhD'
    elif 'diploma' in n or 'certificate' in n:
        level = 'Diploma'
    elif any(n.startswith(p) for p in ['m.', 'ma ', 'msc ', 'mcom ', 'mba', 'mca', 'med', 'mpharm', 'mphil', 'mtech', 'mfa', 'mot', 'mpt', 'msw', 'llm']):
        level = 'PG'
    else:
        level = 'UG'
        
    category = 'Other'
    if any(k in n for k in ['computer science', 'computer application', 'data science', 'information technology', 'machine learning', 'web development', 'bca', 'mca', 'pgdca', 'artificial intelligence', 'cyber security', 'digital marketing']):
        category = 'Computer Applications / IT'
    elif any(k in n for k in ['engineering', 'b.tech', 'm.tech', 'b.e', 'structural engineering']):
        category = 'Engineering'
    elif any(k in n for k in ['management', 'business administration', 'mba', 'bba', 'logistics', 'aviation', 'hospital management']):
        category = 'Management'
    elif any(k in n for k in ['commerce', 'b.com', 'm.com', 'accounting', 'finance', 'taxation', 'banking']):
        category = 'Commerce'
    elif any(k in n for k in ['science', 'biochemistry', 'microbiology', 'biotechnology', 'botany', 'chemistry', 'physics', 'mathematics', 'statistics', 'zoology', 'geology', 'environmental science', 'forensic science', 'nutrition', 'plant biology', 'electronics', 'psychology']):
        category = 'Science'
    elif any(k in n for k in ['english', 'tamil', 'french', 'hindi', 'literature', 'history', 'economics', 'sociology', 'philosophy', 'political science', 'public administration', 'criminology', 'defence studies', 'tourism', 'social work', 'journalism', 'communication', 'b.a', 'm.a', 'bsw', 'msw', 'content writing']):
        category = 'Arts / Humanities'
    elif any(k in n for k in ['nursing', 'medical', 'pharmacy', 'b.pharm', 'm.pharm', 'mbbs', 'bams', 'bhms', 'bums', 'bpt', 'mpt', 'mot', 'operation theatre', 'laboratory technology', 'sports']):
        category = 'Medical & Allied Sciences'
    elif any(k in n for k in ['design', 'fashion', 'interior', 'visual communication', 'animation', 'b.des', 'm.des', 'bfa', 'mfa']):
        category = 'Design & Media'
    elif any(k in n for k in ['education', 'teacher training', 'b.ed', 'm.ed', 'montessori']):
        category = 'Education'
    elif any(k in n for k in ['law', 'llb', 'llm']):
        category = 'Law'
    elif any(k in n for k in ['hotel', 'catering', 'restaurant', 'hospitality', 'bhm', 'bhmct', 'bttm', 'food processing', 'bakery']):
        category = 'Hospitality & Tourism'
        
    if level == 'PhD':
        duration = 3
    elif level == 'Diploma':
        duration = 1
    elif level == 'PG':
        duration = 2
    else: # UG
        if 'b.arch' in n or 'mbbs' in n or 'llb' in n:
            duration = 5
        elif 'b.tech' in n or 'b.e' in n or 'b.pharm' in n:
            duration = 4
        else:
            duration = 3
            
    return level, category, duration

def run_import():
    print("Step 1: Connecting to PostgreSQL database...")
    print(f"Database settings: DB_NAME='{DB_NAME}', DB_HOST='{DB_HOST}', DB_USER='{DB_USER}'")
    
    # Create tables
    print("Step 2: Checking/creating database schema (create_all)...")
    Base.metadata.create_all(bind=engine)
    print("Schema checked and verified successfully.")
    
    Session = sessionmaker(bind=engine)
    db = Session()
    
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    excel_path = os.path.join(root_dir, "colleges1.xlsx")
    old_excel_path = os.path.join(root_dir, "colleges.xlsx")
    courses_path = os.path.join(root_dir, "courses.csv")
    
    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"Colleges Excel file not found at: {excel_path}")
    if not os.path.exists(courses_path):
        raise FileNotFoundError(f"Courses CSV file not found at: {courses_path}")
        
    # 2. Clean and load Colleges
    print("Step 3: Reading and cleaning colleges data from Excel...")
    df = pd.read_excel(excel_path, sheet_name="colleges")
    
    if os.path.exists(old_excel_path):
        old_df = pd.read_excel(old_excel_path, sheet_name="colleges")
        if 'autonomous' in old_df.columns:
            df = pd.merge(df, old_df[['college_id', 'autonomous']], on='college_id', how='left')
        else:
            df['autonomous'] = 'No'
    else:
        df['autonomous'] = 'No'
        
    df['naac_grade'] = df['naac_grade'].apply(lambda x: "Not Listed" if pd.isna(x) or str(x).strip() in ["", "nan", "NaN"] else str(x).strip())
    df['location_raw'] = df['location'].apply(lambda x: str(x).strip() if pd.notna(x) else "Unknown")
    df['location_normalized'] = df['location'].apply(normalize_location)
    df['autonomous'] = df['autonomous'].apply(lambda x: "Yes" if str(x).strip().lower() == "yes" else ("No" if str(x).strip().lower() == "no" else "No"))
    df['college_name'] = df['college_name'].fillna("Unnamed College").apply(lambda x: str(x).strip())
    df['college_category'] = df['college_category'].fillna("Other").apply(lambda x: str(x).strip())
    df['website'] = df['website'].fillna("").apply(lambda x: str(x).strip())
    df['email'] = df['email'].fillna("").apply(lambda x: str(x).strip())
    df['phone'] = df['phone'].fillna("").apply(lambda x: str(x).strip())
    df['principal_name'] = df['principal_name'].fillna("Unknown").apply(lambda x: str(x).strip())
    df['nirf_rank_raw'] = df['nirf_rank'].apply(lambda x: str(x).strip() if pd.notna(x) and str(x).strip() != "" else "Not Ranked")
    df['nirf_rank'] = df['nirf_rank'].apply(parse_nirf_rank_int)
    df['university_category'] = df['University Category'].fillna("Unknown").apply(lambda x: str(x).strip())
    df['hostel_facility'] = df['Hostel Facility'].fillna("No Hostel Found").apply(lambda x: str(x).strip())
    df['bus_facility'] = df['Bus Facility'].fillna("No").apply(lambda x: "Yes" if str(x).strip().lower() == "yes" else "No")
    df['placement_score'] = pd.to_numeric(df['Estimated Placement Score'], errors='coerce').fillna(0.0)
    df['co_ed'] = df['Co_Ed'].fillna("Co-ed").apply(lambda x: str(x).strip())
    df['ugc_recognized'] = df['UGC_Recognized'].fillna("No").apply(lambda x: "Yes" if str(x).strip().lower() == "yes" else "No")
    df['ownership'] = df['college_name'].apply(lambda name: 'Government' if any(k in name.lower() for k in ["government", "govt", "presidency", "kilpauk", "stanley", "constituent"]) else 'Private')

    colleges_imported = 0
    colleges_skipped_duplicates = 0
    colleges_invalid_skipped = 0
    
    # Pre-load existing colleges to avoid querying inside the loop (Requirement 11 - performance)
    print("Step 4: Pre-fetching existing colleges from PostgreSQL...")
    existing_college_ids = {c.college_id for c in db.query(College.college_id).all()}
    existing_college_names_locations = {
        (c.college_name.lower().strip(), c.location_normalized.lower().strip())
        for c in db.query(College.college_name, College.location_normalized).all()
    }
    
    print("Importing colleges into PostgreSQL...")
    for _, row in df.iterrows():
        row_dict = row.to_dict()
        for k, v in row_dict.items():
            if pd.isna(v):
                row_dict[k] = None

        college_id = int(row_dict['college_id'])
        college_name = str(row_dict['college_name']).strip()
        location_normalized = str(row_dict['location_normalized']).strip()
        email = str(row_dict['email']).strip() if row_dict['email'] else None
        website = str(row_dict['website']).strip() if row_dict['website'] else None
        phone = str(row_dict['phone']).strip() if row_dict['phone'] else None
        
        # 1. Validation Checks (Requirement 12)
        if email and not validate_email(email):
            colleges_invalid_skipped += 1
            continue
        if website and not validate_website(website):
            colleges_invalid_skipped += 1
            continue
        if phone and not validate_phone(phone):
            colleges_invalid_skipped += 1
            continue
            
        # 2. Skip duplicates in database
        key = (college_name.lower().strip(), location_normalized.lower().strip())
        if college_id in existing_college_ids or key in existing_college_names_locations:
            colleges_skipped_duplicates += 1
            continue
            
        # Add College
        college = College(
            college_id=college_id,
            college_name=college_name,
            college_category=str(row_dict['college_category']),
            location_raw=str(row_dict['location_raw']),
            location_normalized=location_normalized,
            website=website,
            email=email,
            phone=phone,
            naac_grade=str(row_dict['naac_grade']),
            principal_name=str(row_dict['principal_name']),
            autonomous=str(row_dict['autonomous']),
            nirf_rank=row_dict['nirf_rank'] if row_dict['nirf_rank'] is not None else None,
            university_category=str(row_dict['university_category']),
            hostel_facility=str(row_dict['hostel_facility']),
            nirf_rank_raw=str(row_dict['nirf_rank_raw']),
            bus_facility=str(row_dict['bus_facility']),
            placement_score=float(row_dict['placement_score']) if row_dict['placement_score'] is not None else 0.0,
            co_ed=str(row_dict['co_ed']),
            ugc_recognized=str(row_dict['ugc_recognized']),
            ownership=str(row_dict['ownership'])
        )
        db.add(college)
        existing_college_ids.add(college_id)
        existing_college_names_locations.add(key)
        colleges_imported += 1
        
    db.commit()
    print("Colleges import completed.")

    # 3. Clean and load Courses
    print("Reading and cleaning courses data...")
    courses_df = pd.read_csv(courses_path)
    
    courses_imported = 0
    courses_skipped_duplicates = 0
    courses_skipped_invalid_college = 0
    
    # Pre-load existing courses (Requirement 11 - performance)
    print("Pre-fetching existing courses...")
    existing_courses = {
        (c.college_id, c.course_name.lower().strip())
        for c in db.query(Course.college_id, Course.course_name).all()
    }
    seen_courses_in_import = set()
    
    # Get current valid college IDs from DB
    valid_college_ids = {c.college_id for c in db.query(College.college_id).all()}
    
    print("Importing courses into PostgreSQL...")
    for _, row in courses_df.iterrows():
        row_dict = row.to_dict()
        for k, v in row_dict.items():
            if pd.isna(v):
                row_dict[k] = None

        college_id = int(row_dict['college_id'])
        course_name = str(row_dict['course_name']).strip()
        course_id = int(row_dict['course_id'])
        
        # Validation: does college exist?
        if college_id not in valid_college_ids:
            courses_skipped_invalid_college += 1
            continue
            
        # Check duplicate course for same college
        key = (college_id, course_name.lower().strip())
        if key in seen_courses_in_import or key in existing_courses:
            courses_skipped_duplicates += 1
            continue
            
        seen_courses_in_import.add(key)
        
        # Parse course properties
        level, category, duration = parse_course_details(course_name)
        
        course = Course(
            course_id=course_id,
            college_id=college_id,
            course_name=course_name,
            course_level=level,
            course_category=category,
            duration=duration
        )
        db.add(course)
        courses_imported += 1
        
    db.commit()
    db.close()
    
    print("Courses import completed.")
    print("\n" + "="*40)
    print("Migration Summary:")
    print(f"Imported {colleges_imported} colleges")
    print(f"Imported {courses_imported} courses")
    print(f"Skipped {colleges_skipped_duplicates + courses_skipped_duplicates} duplicates")
    if colleges_invalid_skipped > 0:
        print(f"Skipped {colleges_invalid_skipped} invalid college records")
    if courses_skipped_invalid_college > 0:
        print(f"Skipped {courses_skipped_invalid_college} courses with missing colleges")
    print("="*40 + "\n")

if __name__ == '__main__':
    load_dotenv()
    run_import()
