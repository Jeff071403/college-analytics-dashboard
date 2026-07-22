from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Index, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class College(Base):
    __tablename__ = 'colleges'

    college_id = Column(Integer, primary_key=True)
    college_name = Column(String(255), nullable=False)
    college_category = Column(String(100), nullable=False)
    location_raw = Column(String(255), nullable=False)
    location_normalized = Column(String(100), nullable=False)
    website = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(100), nullable=True)
    naac_grade = Column(String(50), nullable=False, default='Not Listed')
    principal_name = Column(String(255), nullable=True)
    autonomous = Column(String(50), nullable=False, default='No')
    nirf_rank = Column(Integer, nullable=True)
    university_category = Column(String(255), nullable=False, default='Unknown')
    hostel_facility = Column(String(100), nullable=False, default='No Hostel Found')
    nirf_rank_raw = Column(String(100), nullable=False, default='Not Ranked')
    google_rating = Column(Float, nullable=True, default=4.0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    bus_facility = Column(String(50), nullable=False, default='No')
    placement_score = Column(Float, nullable=True, default=0.0)
    co_ed = Column(String(50), nullable=False, default='Co-ed')
    ugc_recognized = Column(String(50), nullable=False, default='No')
    ownership = Column(String(100), nullable=True, default='Private')
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Establish relationship to courses
    courses = relationship("Course", back_populates="college", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('college_name', 'location_normalized', name='uq_college_name_location'),
        Index('idx_college_name', 'college_name'),
        Index('idx_location_normalized', 'location_normalized'),
        Index('idx_naac_grade', 'naac_grade'),
        Index('idx_nirf_rank', 'nirf_rank'),
        Index('idx_location_raw', 'location_raw'),
        Index('idx_website', 'website'),
    )

class Course(Base):
    __tablename__ = 'courses'

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, nullable=False)
    college_id = Column(Integer, ForeignKey('colleges.college_id', ondelete='CASCADE'), nullable=False)
    course_name = Column(String(255), nullable=False)
    course_level = Column(String(50), nullable=False)
    course_category = Column(String(100), nullable=False)
    duration = Column(Integer, nullable=False)

    college = relationship("College", back_populates="courses")

    __table_args__ = (
        UniqueConstraint('college_id', 'course_name', name='uq_courses_college_course'),
    )

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default='user')
