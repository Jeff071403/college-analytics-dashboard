import threading
from sqlalchemy import text, inspect
import urllib.request
import urllib.parse
import json
import time
import random
import os

def run_migrations(engine):
    print("Running database migrations...")
    try:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('colleges')]
        
        # 1. Add missing columns
        with engine.begin() as conn:
            if 'ownership' not in columns:
                print("Adding 'ownership' column...")
                conn.execute(text("ALTER TABLE colleges ADD COLUMN ownership VARCHAR(100) DEFAULT 'Private'"))
            if 'google_rating' not in columns:
                print("Adding 'google_rating' column...")
                conn.execute(text("ALTER TABLE colleges ADD COLUMN google_rating FLOAT DEFAULT 4.2"))
            if 'latitude' not in columns:
                print("Adding 'latitude' column...")
                conn.execute(text("ALTER TABLE colleges ADD COLUMN latitude FLOAT"))
            if 'longitude' not in columns:
                print("Adding 'longitude' column...")
                conn.execute(text("ALTER TABLE colleges ADD COLUMN longitude FLOAT"))
            if 'bus_facility' not in columns:
                print("Adding 'bus_facility' column...")
                conn.execute(text("ALTER TABLE colleges ADD COLUMN bus_facility VARCHAR(50) DEFAULT 'No'"))
            if 'placement_score' not in columns:
                print("Adding 'placement_score' column...")
                conn.execute(text("ALTER TABLE colleges ADD COLUMN placement_score FLOAT DEFAULT 0.0"))
            if 'co_ed' not in columns:
                print("Adding 'co_ed' column...")
                conn.execute(text("ALTER TABLE colleges ADD COLUMN co_ed VARCHAR(50) DEFAULT 'Co-ed'"))
            if 'ugc_recognized' not in columns:
                print("Adding 'ugc_recognized' column...")
                conn.execute(text("ALTER TABLE colleges ADD COLUMN ugc_recognized VARCHAR(50) DEFAULT 'No'"))
            if 'created_at' not in columns:
                print("Adding 'created_at' column...")
                conn.execute(text("ALTER TABLE colleges ADD COLUMN created_at DATETIME"))
            if 'updated_at' not in columns:
                print("Adding 'updated_at' column...")
                conn.execute(text("ALTER TABLE colleges ADD COLUMN updated_at DATETIME"))
                
        # 2. Backfill ownership and ratings if null or defaults
        with engine.begin() as conn:
            # Set default values for created_at/updated_at
            conn.execute(text("UPDATE colleges SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))
            conn.execute(text("UPDATE colleges SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL"))
            # Backfill ownership based on name keywords
            conn.execute(text("""
                UPDATE colleges 
                SET ownership = 'Government' 
                WHERE (ownership IS NULL OR ownership = 'Private') 
                  AND (
                    LOWER(college_name) LIKE '%government%' 
                    OR LOWER(college_name) LIKE '%govt%'
                    OR LOWER(college_name) LIKE '%presidency%'
                    OR LOWER(college_name) LIKE '%kilpauk%'
                    OR LOWER(college_name) LIKE '%stanley%'
                    OR LOWER(college_name) LIKE '%constituent%'
                  )
            """))
            
            # Set default values for any rows where ownership is still null
            conn.execute(text("UPDATE colleges SET ownership = 'Private' WHERE ownership IS NULL"))
            
            # Seed google ratings realistically if they are still the migration default (4.2)
            conn.execute(text("UPDATE colleges SET google_rating = 4.7 WHERE google_rating = 4.2 AND naac_grade = 'A++'"))
            conn.execute(text("UPDATE colleges SET google_rating = 4.5 WHERE google_rating = 4.2 AND naac_grade = 'A+'"))
            conn.execute(text("UPDATE colleges SET google_rating = 4.3 WHERE google_rating = 4.2 AND naac_grade = 'A'"))
            conn.execute(text("UPDATE colleges SET google_rating = 4.1 WHERE google_rating = 4.2 AND naac_grade = 'B++'"))
            conn.execute(text("UPDATE colleges SET google_rating = 3.9 WHERE google_rating = 4.2 AND naac_grade = 'B+'"))
            conn.execute(text("UPDATE colleges SET google_rating = 3.7 WHERE google_rating = 4.2 AND naac_grade IN ('B', 'C', 'D', 'Not Accredited', 'Not Listed')"))
            
        print("Schema migrations and data seeding completed successfully.")
        
        # 3. Start background geocoding thread
        threading.Thread(target=background_geocode, args=(engine,), daemon=True).start()
    except Exception as e:
        print(f"Migration error: {e}")

def background_geocode(engine):
    print("Starting background geocoding loop...")
    while True:
        try:
            # Fetch colleges that need geocoding
            with engine.connect() as conn:
                result = conn.execute(text("SELECT college_id, college_name, location_normalized FROM colleges WHERE latitude IS NULL OR longitude IS NULL"))
                colleges_to_geocode = [(row[0], row[1], row[2]) for row in result]
                
            if colleges_to_geocode:
                print(f"Found {len(colleges_to_geocode)} colleges that need geocoding.")
                for college_id, name, location in colleges_to_geocode:
                    # Respect OSM Nominatim rate limits (max 1 query/sec)
                    time.sleep(1.2)
                    
                    # Build search query accurately using normalized location
                    query_parts = [name]
                    if location:
                        query_parts.append(location)
                    if 'tamil nadu' not in (name + ' ' + (location or '')).lower():
                        query_parts.append('Tamil Nadu')
                    query_parts.append('India')
                    query = ", ".join(query_parts)
                    coords = geocode_query(query)
                    
                    if not coords:
                        # Fallback 1: Name, Location, Tamil Nadu, India
                        query_fb1 = f"{name}, {location}, Tamil Nadu, India"
                        coords = geocode_query(query_fb1)
                        
                    if not coords:
                        # Fallback 2: Name, Tamil Nadu, India
                        query_fb2 = f"{name}, Tamil Nadu, India"
                        coords = geocode_query(query_fb2)
                        
                    if not coords:
                        # Final fallback: just location normalized
                        query_last = f"{location}, Tamil Nadu, India"
                        coords = geocode_query(query_last)
                        
                    if coords:
                        lat, lon = coords
                        
                        with engine.begin() as conn:
                            conn.execute(text("""
                                UPDATE colleges 
                                SET latitude = :lat, longitude = :lon 
                                WHERE college_id = :id
                            """), {'lat': lat, 'lon': lon, 'id': college_id})
                        print(f"Geocoded college {college_id}: '{name}' -> ({lat}, {lon})")
                    else:
                        print(f"Could not geocode college {college_id}: '{name}'")
            
        except Exception as e:
            print(f"Geocoding task loop encountered an error: {e}")
        
        # Sleep for 30 seconds before checking again
        time.sleep(30)

def geocode_query(query):
    # Try to load API key from environment or .env file manually
    api_key = os.environ.get('VITE_GOOGLE_MAPS_API_KEY') or os.environ.get('GOOGLE_MAPS_API_KEY')
    if not api_key:
        try:
            if os.path.exists('.env'):
                with open('.env', 'r') as f:
                    for line in f:
                        if line.strip().startswith('VITE_GOOGLE_MAPS_API_KEY='):
                            api_key = line.split('=', 1)[1].strip()
                            # Strip quotes if present
                            if (api_key.startswith('"') and api_key.endswith('"')) or (api_key.startswith("'") and api_key.endswith("'")):
                                api_key = api_key[1:-1]
                            break
        except Exception:
            pass

    if api_key:
        try:
            url = f"https://maps.googleapis.com/maps/api/geocode/json?address={urllib.parse.quote(query)}&key={api_key}"
            req = urllib.request.Request(url, headers={'User-Agent': 'CollegeAnalyticsPortal/2.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                if data and data.get('status') == 'OK' and data.get('results'):
                    loc = data['results'][0]['geometry']['location']
                    return float(loc['lat']), float(loc['lng'])
        except Exception:
            pass
            
    # Fallback to OpenStreetMap Nominatim
    try:
        url = "https://nominatim.openstreetmap.org/search?q=" + urllib.parse.quote(query) + "&format=json&limit=1"
        req = urllib.request.Request(url, headers={'User-Agent': 'CollegeAnalyticsPortal/2.0 (jeffe@gmail.com)'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception:
        pass
    return None
