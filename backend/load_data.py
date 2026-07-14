import os
import re
import pandas as pd
from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData
from db import get_engine

def parse_nirf_rank_int(val):
    if pd.isna(val):
        return None
    val_str = str(val).strip()
    if val_str.lower() in ["", "nan", "not ranked"]:
        return None
    # Extract first sequence of digits
    match = re.search(r'\d+', val_str)
    if match:
        return int(match.group())
    return None

def clean_data():
    # Find files path
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    excel_path = os.path.join(root_dir, "colleges1.xlsx")
    old_excel_path = os.path.join(root_dir, "colleges.xlsx")
    
    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"Excel file not found at: {excel_path}")
        
    print(f"Reading data from: {excel_path}")
    df = pd.read_excel(excel_path, sheet_name="colleges")
    
    # Merge autonomous status from the old colleges.xlsx if available
    if os.path.exists(old_excel_path):
        print(f"Merging autonomous column from old file: {old_excel_path}")
        old_df = pd.read_excel(old_excel_path, sheet_name="colleges")
        if 'autonomous' in old_df.columns:
            df = pd.merge(df, old_df[['college_id', 'autonomous']], on='college_id', how='left')
        else:
            df['autonomous'] = 'Unknown'
    else:
        df['autonomous'] = 'Unknown'
    
    # 1. NAAC Grade Cleaning: blank -> "Not Listed"
    df['naac_grade'] = df['naac_grade'].apply(
        lambda x: "Not Listed" if pd.isna(x) or str(x).strip() in ["", "nan", "NaN"] else str(x).strip()
    )
    
    # 2. Location Normalization:
    def normalize_location(loc):
        if pd.isna(loc):
            return "Unknown"
        loc_str = str(loc).strip()
        loc_lower = loc_str.lower()
        
        # Chengalpattu / Chengalpet / etc
        if any(k in loc_lower for k in ["chengalpattu", "chengalpet", "chengelpet"]):
            return "Chengalpattu"
        # Thiruvallur / Tiruvallur
        if any(k in loc_lower for k in ["thiruvallur", "tiruvallur"]):
            return "Thiruvallur"
        # Chennai
        if loc_lower == "chennai":
            return "Chennai"
            
        # Capitalize if lowercase
        if loc_str.islower():
            return loc_str.title()
        return loc_str

    df['location_raw'] = df['location'].apply(lambda x: str(x).strip() if pd.notna(x) else "Unknown")
    df['location_normalized'] = df['location'].apply(normalize_location)
    
    # 3. Autonomous status: "Yes" / "No" / occasionally blank ("Unknown")
    df['autonomous'] = df['autonomous'].apply(
        lambda x: "Yes" if str(x).strip().lower() == "yes" else 
                  ("No" if str(x).strip().lower() == "no" else "Unknown")
    )
    
    # Clean phone / email / website / principal_name / college_category / college_name
    df['college_name'] = df['college_name'].fillna("Unnamed College").apply(lambda x: str(x).strip())
    df['college_category'] = df['college_category'].fillna("Other").apply(lambda x: str(x).strip())
    df['website'] = df['website'].fillna("").apply(lambda x: str(x).strip())
    df['email'] = df['email'].fillna("").apply(lambda x: str(x).strip())
    df['phone'] = df['phone'].fillna("").apply(lambda x: str(x).strip())
    df['principal_name'] = df['principal_name'].fillna("Unknown").apply(lambda x: str(x).strip())
    
    # Parse NIRF Rank: raw label and parsed integer rank
    df['nirf_rank_raw'] = df['nirf_rank'].apply(
        lambda x: str(x).strip() if pd.notna(x) and str(x).strip() != "" else "Not Ranked"
    )
    df['nirf_rank'] = df['nirf_rank'].apply(parse_nirf_rank_int)
    
    # Parse new columns: University Category and Hostel Facility
    df['university_category'] = df['University Category'].fillna("Unknown").apply(lambda x: str(x).strip())
    df['hostel_facility'] = df['Hostel Facility'].fillna("No Hostel Found").apply(lambda x: str(x).strip())
    
    # Select columns we need for the dashboard
    cleaned_df = df[[
        'college_id', 'college_name', 'college_category', 'location_raw', 
        'location_normalized', 'website', 'email', 'phone', 'naac_grade', 
        'principal_name', 'autonomous', 'nirf_rank', 'university_category',
        'hostel_facility', 'nirf_rank_raw'
    ]].copy()
    
    return cleaned_df

def load_to_db():
    try:
        cleaned_df = clean_data()
        print(f"Cleaned {len(cleaned_df)} rows of data.")
        
        # Get DB engine
        engine, db_type = get_engine()
        metadata = MetaData()
        
        # Define table
        colleges_table = Table(
            'colleges', metadata,
            Column('college_id', Integer, primary_key=True),
            Column('college_name', String(255), nullable=False),
            Column('college_category', String(100), nullable=False),
            Column('location_raw', String(100), nullable=False),
            Column('location_normalized', String(100), nullable=False),
            Column('website', String(255)),
            Column('email', String(255)),
            Column('phone', String(100)),
            Column('naac_grade', String(50), nullable=False),
            Column('principal_name', String(255)),
            Column('autonomous', String(50), nullable=False),
            Column('nirf_rank', Integer, nullable=True),
            Column('university_category', String(255), nullable=False),
            Column('hostel_facility', String(100), nullable=False),
            Column('nirf_rank_raw', String(100), nullable=False)
        )
        
        # Recreate table
        metadata.drop_all(engine)
        metadata.create_all(engine)
        
        # Insert records
        records = cleaned_df.to_dict(orient='records')
        with engine.begin() as conn:
            conn.execute(colleges_table.insert(), records)
            
        print(f"Successfully loaded data into {db_type} database.")
        
        # Quick validation
        with engine.connect() as conn:
            from sqlalchemy import text
            count = conn.execute(text("SELECT count(*) FROM colleges")).scalar()
            print(f"Verified DB record count: {count}")
            
    except Exception as e:
        print(f"Failed to load data to DB: {e}")
        raise e

if __name__ == "__main__":
    load_to_db()
