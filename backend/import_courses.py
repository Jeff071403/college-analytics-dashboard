import os
import sys
import pandas as pd
from sqlalchemy import Table, Column, Integer, String, ForeignKey, MetaData, UniqueConstraint, text
from db import get_engine

# Infer level, category, and duration from the course name
def parse_course_details(course_name):
    name = course_name.strip()
    n = name.lower()
    
    # 1. Level Classification
    if n.startswith('phd') or n.startswith('ph.d') or 'doctor of' in n:
        level = 'PhD'
    elif 'diploma' in n or 'certificate' in n:
        level = 'Diploma'
    elif any(n.startswith(p) for p in ['m.', 'ma ', 'msc ', 'mcom ', 'mba', 'mca', 'med', 'mpharm', 'mphil', 'mtech', 'mfa', 'mot', 'mpt', 'msw', 'llm']):
        level = 'PG'
    else:
        level = 'UG'
        
    # 2. Category Classification
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
        
    # 3. Duration Estimation (in years)
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

def import_courses(file_path=None):
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(backend_dir)
    
    # Auto-detect file if not specified
    if not file_path:
        possible_csv = os.path.join(root_dir, "courses.csv")
        possible_xlsx = os.path.join(root_dir, "courses.xlsx")
        if os.path.exists(possible_csv):
            file_path = possible_csv
        elif os.path.exists(possible_xlsx):
            file_path = possible_xlsx
        else:
            raise FileNotFoundError("Could not find courses.csv or courses.xlsx in the root directory.")
            
    print(f"Reading courses data from: {file_path}")
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.csv':
        df = pd.read_csv(file_path)
    elif ext in ['.xlsx', '.xls']:
        df = pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported file format. Must be CSV or Excel.")
        
    print(f"Loaded {len(df)} rows from file.")
    
    # Validate required columns
    required_cols = {'course_id', 'college_id', 'course_name'}
    if not required_cols.issubset(df.columns):
        raise ValueError(f"File is missing required columns: {required_cols - set(df.columns)}")
        
    # Get DB engine
    engine, db_type = get_engine()
    metadata = MetaData()
    
    # Define colleges table in metadata to resolve ForeignKey reference
    colleges_table = Table(
        'colleges', metadata,
        Column('college_id', Integer, primary_key=True)
    )
    
    # Define table structure
    courses_table = Table(
        'courses', metadata,
        Column('id', Integer, primary_key=True, autoincrement=True),
        Column('course_id', Integer, nullable=False),
        Column('college_id', Integer, ForeignKey('colleges.college_id', ondelete='CASCADE'), nullable=False, index=True),
        Column('course_name', String(255), nullable=False),
        Column('course_level', String(50), nullable=False),
        Column('course_category', String(100), nullable=False),
        Column('duration', Integer, nullable=False),
        UniqueConstraint('college_id', 'course_name', name='uq_courses_college_course')
    )
    
    # Check if table exists, create it if not
    metadata.create_all(engine)
    print("Ensured 'courses' table exists in the database.")
    
    # Validate college IDs
    with engine.connect() as conn:
        colleges_result = conn.execute(text("SELECT college_id FROM colleges"))
        valid_college_ids = {row[0] for row in colleges_result}
        
    print(f"Found {len(valid_college_ids)} valid colleges in database.")
    
    # Process rows
    valid_records = []
    missing_college_rows = 0
    duplicate_rows_in_file = set()
    
    # Keep track of college_id + course_name in this import to prevent internal duplicates
    seen_in_import = set()
    
    # Load existing courses from database to prevent importing duplicates
    existing_courses = set()
    try:
        with engine.connect() as conn:
            existing_result = conn.execute(text("SELECT college_id, course_name FROM courses"))
            for row in existing_result:
                existing_courses.add((row[0], row[1].strip()))
    except Exception as e:
        print(f"Could not check existing courses: {e}. Proceeding assuming empty table.")

    for index, row in df.iterrows():
        college_id = int(row['college_id'])
        course_name = str(row['course_name']).strip()
        course_id = int(row['course_id'])
        
        # 1. Validate missing college ID
        if college_id not in valid_college_ids:
            missing_college_rows += 1
            continue
            
        # 2. Prevent duplicates (both file duplicates and database duplicates)
        key = (college_id, course_name)
        if key in seen_in_import:
            duplicate_rows_in_file.add(key)
            continue
        if key in existing_courses:
            continue
            
        seen_in_import.add(key)
        
        # Infer level, category, duration
        level, category, duration = parse_course_details(course_name)
        
        valid_records.append({
            'course_id': course_id,
            'college_id': college_id,
            'course_name': course_name,
            'course_level': level,
            'course_category': category,
            'duration': duration
        })
        
    if missing_college_rows > 0:
        print(f"WARNING: Skipped {missing_college_rows} rows due to missing college_id in colleges table.")
    if duplicate_rows_in_file:
        print(f"NOTE: Skipped {len(duplicate_rows_in_file)} rows that were duplicate definitions inside the source file.")
        
    if not valid_records:
        print("No new course records to insert.")
        return
        
    # Insert records
    print(f"Inserting {len(valid_records)} new course records into '{db_type}' database...")
    with engine.begin() as conn:
        conn.execute(courses_table.insert(), valid_records)
        
    print("Course import completed successfully!")
    
    # Verification count
    with engine.connect() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM courses")).scalar()
        print(f"Total courses currently in database: {count}")

if __name__ == "__main__":
    file_arg = sys.argv[1] if len(sys.argv) > 1 else None
    import_courses(file_arg)
