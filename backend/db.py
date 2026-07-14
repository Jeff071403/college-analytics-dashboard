import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env variables from root directory first, then current backend directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "colleges_db")

def get_engine():
    # Attempt to connect to PostgreSQL
    try:
        # Step 1: Connect to default postgres DB first to check/create the target database
        temp_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/postgres"
        temp_engine = create_engine(temp_url, isolation_level="AUTOCOMMIT")
        
        with temp_engine.connect() as conn:
            # Check if DB exists
            result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{DB_NAME}'"))
            exists = result.scalar()
            if not exists:
                print(f"PostgreSQL database '{DB_NAME}' not found. Creating database...")
                conn.execute(text(f"CREATE DATABASE {DB_NAME}"))
                print(f"PostgreSQL database '{DB_NAME}' created successfully.")
            else:
                print(f"PostgreSQL database '{DB_NAME}' exists.")
        
        # Step 2: Connect to the actual target DB
        pg_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        engine = create_engine(pg_url)
        # Test the connection to ensure credentials are correct
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Successfully connected to PostgreSQL DB.")
        return engine, "postgresql"

    except Exception as e:
        print(f"PostgreSQL connection/creation failed: {e}")
        print("Falling back to local SQLite database (colleges.db)...")
        # SQLite db path in root of the project
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sqlite_path = os.path.join(root_dir, "colleges.db")
        sqlite_url = f"sqlite:///{sqlite_path}"
        engine = create_engine(sqlite_url)
        return engine, "sqlite"
