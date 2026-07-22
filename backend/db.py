import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from dotenv import load_dotenv

# Load env variables from root directory first, then current backend directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "colleges_db")

# Automatically check and create database in PostgreSQL if it doesn't exist
try:
    from sqlalchemy import text
    temp_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/postgres"
    temp_engine = create_engine(temp_url, isolation_level="AUTOCOMMIT")
    with temp_engine.connect() as conn:
        result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{DB_NAME}'"))
        exists = result.scalar()
        if not exists:
            print(f"PostgreSQL database '{DB_NAME}' not found. Creating database...")
            conn.execute(text(f"CREATE DATABASE {DB_NAME}"))
            print(f"PostgreSQL database '{DB_NAME}' created successfully.")
except Exception as e:
    print(f"Warning: Could not check/create PostgreSQL database '{DB_NAME}': {e}")

# Connection engine
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db_session = scoped_session(SessionLocal)

def get_db():
    """Context-safe session generator or accessor"""
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()
