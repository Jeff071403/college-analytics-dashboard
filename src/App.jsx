import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RotateCcw, 
  Building2, 
  MapPin, 
  User, 
  Globe, 
  Mail, 
  Phone, 
  X, 
  ExternalLink, 
  FileCheck2, 
  GraduationCap, 
  Award, 
  CheckCircle,
  HelpCircle,
  Trophy,
  Database,
  Edit3,
  Save,
  Check,
  Loader2,
  AlertTriangle,
  Home,
  Sun,
  Moon,
  Trash2,
  Plus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

export default function App() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dark / Light theme
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('theme', darkMode ? 'dark' : 'light'); } catch {}
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.background = '#0A0A1A';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.background = '#F3F4F6';
    }
  }, [darkMode]);
  
  // Navigation / View state
  const [currentView, setCurrentView] = useState('explorer');
  
  // Filter States
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedNaac, setSelectedNaac] = useState('');
  const [selectedAutonomous, setSelectedAutonomous] = useState('');
  const [selectedNirf, setSelectedNirf] = useState('');
  const [selectedUnivCategory, setSelectedUnivCategory] = useState('');
  const [selectedHostel, setSelectedHostel] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('All');
  
  // Course Filter States
  const [selectedCourseLevel, setSelectedCourseLevel] = useState('');
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [uniqueCourseNames, setUniqueCourseNames] = useState([]);
  
  // Dashboard stats from backend
  const [courseStats, setCourseStats] = useState({
    total_courses: 0,
    avg_courses: 0,
    highest_course_college: null,
    course_distribution: { UG: 0, PG: 0, Diploma: 0, PhD: 0 }
  });
  
  // Detail Modal State
  const [selectedCollege, setSelectedCollege] = useState(null);
  
  // Modal tab and courses
  const [modalTab, setModalTab] = useState('overview');
  const [selectedCollegeCourses, setSelectedCollegeCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Admin View States
  const [adminSearchText, setAdminSearchText] = useState('');
  const [selectedAdminCollege, setSelectedAdminCollege] = useState(null);
  
  // Admin course management states
  const [adminTab, setAdminTab] = useState('details'); // 'details' | 'courses'
  const [adminCourses, setAdminCourses] = useState([]);
  const [loadingAdminCourses, setLoadingAdminCourses] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({
    course_name: '',
    course_level: 'UG',
    course_category: 'Commerce',
    duration: 3
  });
  const [courseSaveStatus, setCourseSaveStatus] = useState(null);
  const [courseSaveMessage, setCourseSaveMessage] = useState('');

  const [formState, setFormState] = useState({
    college_name: '',
    college_category: '',
    location_raw: '',
    location_normalized: '',
    website: '',
    email: '',
    phone: '',
    naac_grade: 'Not Listed',
    principal_name: '',
    autonomous: 'Unknown',
    nirf_rank: '',
    university_category: 'Unknown',
    hostel_facility: 'No Hostel Found',
    nirf_rank_raw: 'Not Ranked'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  const fetchAdminCourses = (collegeId) => {
    if (!collegeId) return;
    setLoadingAdminCourses(true);
    fetch(`/api/colleges/${collegeId}/courses`)
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          setAdminCourses(res.data);
        } else {
          setAdminCourses([]);
        }
        setLoadingAdminCourses(false);
      })
      .catch(err => {
        console.error('Error fetching admin courses:', err);
        setAdminCourses([]);
        setLoadingAdminCourses(false);
      });
  };

  const handleSelectAdminCollege = (college) => {
    setSelectedAdminCollege(college);
    setFormState({
      college_name: college.college_name || '',
      college_category: college.college_category || '',
      location_raw: college.location_raw || '',
      location_normalized: college.location_normalized || '',
      website: college.website || '',
      email: college.email || '',
      phone: college.phone || '',
      naac_grade: college.naac_grade || 'Not Listed',
      principal_name: college.principal_name || '',
      autonomous: college.autonomous || 'Unknown',
      nirf_rank: college.nirf_rank !== null ? String(college.nirf_rank) : '',
      university_category: college.university_category || 'Unknown',
      hostel_facility: college.hostel_facility || 'No Hostel Found',
      nirf_rank_raw: college.nirf_rank_raw || 'Not Ranked'
    });
    setSaveStatus(null);
    setSaveMessage('');
    setAdminTab('details');
    setEditingCourse(null);
    setIsAddingCourse(false);
    setCourseSaveStatus(null);
    setCourseSaveMessage('');
    fetchAdminCourses(college.college_id);
  };

  const handleAddCourseClick = () => {
    setIsAddingCourse(true);
    setEditingCourse(null);
    setCourseForm({
      course_name: '',
      course_level: 'UG',
      course_category: 'Commerce',
      duration: 3
    });
    setCourseSaveStatus(null);
    setCourseSaveMessage('');
  };

  const handleEditCourseClick = (course) => {
    setEditingCourse(course);
    setIsAddingCourse(false);
    setCourseForm({
      course_name: course.course_name,
      course_level: course.course_level,
      course_category: course.course_category,
      duration: course.duration
    });
    setCourseSaveStatus(null);
    setCourseSaveMessage('');
  };

  const handleCourseSave = (e) => {
    e.preventDefault();
    if (!selectedAdminCollege) return;
    setCourseSaveStatus(null);
    setCourseSaveMessage('');

    const url = isAddingCourse 
      ? `/api/colleges/${selectedAdminCollege.college_id}/courses`
      : `/api/courses/${editingCourse.id}`;
    const method = isAddingCourse ? 'POST' : 'PUT';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseForm)
    })
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          setCourseSaveStatus('success');
          setCourseSaveMessage(isAddingCourse ? 'Course added successfully!' : 'Course updated successfully!');
          
          fetchAdminCourses(selectedAdminCollege.college_id);
          setEditingCourse(null);
          setIsAddingCourse(false);

          // Update local colleges list course count
          const updatedCourseCountDiff = isAddingCourse ? 1 : 0;
          if (updatedCourseCountDiff !== 0) {
            setColleges(prev => prev.map(c => 
              c.college_id === selectedAdminCollege.college_id 
                ? { ...c, course_count: c.course_count + updatedCourseCountDiff } 
                : c
            ));
          }

          if (courseForm.course_name && !uniqueCourseNames.includes(courseForm.course_name)) {
            setUniqueCourseNames(prev => [...prev, courseForm.course_name].sort());
          }
        } else {
          setCourseSaveStatus('error');
          setCourseSaveMessage(res.message || 'Failed to save course');
        }
      })
      .catch(err => {
        setCourseSaveStatus('error');
        setCourseSaveMessage(err.message || 'Network error occurred while saving.');
      });
  };

  const handleCourseDelete = (course) => {
    if (!window.confirm(`Are you sure you want to delete the course "${course.course_name}"?`)) return;

    fetch(`/api/courses/${course.id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          fetchAdminCourses(selectedAdminCollege.college_id);
          setColleges(prev => prev.map(c => 
            c.college_id === selectedAdminCollege.college_id 
              ? { ...c, course_count: Math.max(0, c.course_count - 1) } 
              : c
          ));
        } else {
          alert(res.message || 'Failed to delete course');
        }
      })
      .catch(err => {
        alert(err.message || 'Network error occurred while deleting.');
      });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedAdminCollege) return;
    setIsSaving(true);
    setSaveStatus(null);
    setSaveMessage('');
    const payload = { ...formState };
    fetch(`/api/colleges/${selectedAdminCollege.college_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {
        setIsSaving(false);
        if (res.status === 'success') {
          setSaveStatus('success');
          setSaveMessage('College record updated successfully in database!');
          setColleges(prevColleges =>
            prevColleges.map(c =>
              c.college_id === selectedAdminCollege.college_id ? { ...c, ...res.data } : c
            )
          );
          setSelectedAdminCollege(res.data);
        } else {
          setSaveStatus('error');
          setSaveMessage(res.message || 'Failed to save college details');
        }
      })
      .catch(err => {
        setIsSaving(false);
        setSaveStatus('error');
        setSaveMessage(err.message || 'Network error occurred while saving.');
      });
  };

  // Debounce search text
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearchText(searchText); }, 300);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Fetch unique course names on mount
  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(res => { if (res.status === 'success') setUniqueCourseNames(res.data); })
      .catch(err => console.error('Error fetching course list:', err));
  }, []);

  // Fetch colleges list
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearchText.trim()) params.append('search', debouncedSearchText);
    if (selectedCourseLevel) params.append('course_level', selectedCourseLevel);
    if (selectedCourseName) params.append('course_name', selectedCourseName);
    fetch(`/api/colleges?${params.toString()}`)
      .then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); })
      .then(res => {
        if (res.status === 'success') {
          setColleges(res.data);
          if (res.stats) setCourseStats(res.stats);
        } else {
          throw new Error(res.message || 'Failed to load colleges');
        }
        setLoading(false);
      })
      .catch(err => { console.error('Error fetching colleges data:', err); setError(err.message); setLoading(false); });
  }, [debouncedSearchText, selectedCourseLevel, selectedCourseName]);

  // Fetch courses when modal opens
  useEffect(() => {
    if (selectedCollege) {
      setModalTab('overview');
      setLoadingCourses(true);
      fetch(`/api/colleges/${selectedCollege.college_id}/courses`)
        .then(res => res.json())
        .then(res => {
          setSelectedCollegeCourses(res.status === 'success' ? res.data : []);
          setLoadingCourses(false);
        })
        .catch(() => { setSelectedCollegeCourses([]); setLoadingCourses(false); });
    } else {
      setSelectedCollegeCourses([]);
      setModalTab('overview');
    }
  }, [selectedCollege]);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') setSelectedCollege(null); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter options
  const categories = [...new Set(colleges.map(c => c.college_category))].sort();
  const locations = [...new Set(colleges.map(c => c.location_normalized))].sort();
  const naacGrades = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'D', 'Not Accredited', 'Not Listed'];
  const autonomousStatuses = ['Yes', 'No', 'Unknown'];
  const universityCategories = [...new Set(colleges.map(c => c.university_category).filter(Boolean))].sort();
  const hostelFacilities = ['Boys & Girls', 'Girls Only', 'Boys Only', 'No Hostel Found'];

  const handleClearFilters = () => {
    setSearchText('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedNaac('');
    setSelectedAutonomous('');
    setSelectedNirf('');
    setSelectedUnivCategory('');
    setSelectedHostel('');
    setSelectedCourseLevel('');
    setSelectedCourseName('');
    setActiveCategoryTab('All');
  };

  // Sync category pill + dropdown together
  const handleCategorySelect = (catName) => {
    setActiveCategoryTab(catName);
    setSelectedCategory(catName === 'All' ? '' : catName);
  };

  // Scroll helpers
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const activeFilterCount = [
    searchText.trim() !== '', selectedCategory !== '', selectedLocation !== '',
    selectedNaac !== '', selectedAutonomous !== '', selectedNirf !== '',
    selectedUnivCategory !== '', selectedHostel !== '',
    selectedCourseLevel !== '', selectedCourseName !== ''
  ].filter(Boolean).length;

  // Filter logic
  const filteredColleges = colleges.filter(college => {
    if (activeCategoryTab !== 'All' && college.college_category !== activeCategoryTab) return false;
    if (selectedCategory && college.college_category !== selectedCategory) return false;
    if (selectedLocation && college.location_normalized !== selectedLocation) return false;
    if (selectedNaac && college.naac_grade !== selectedNaac) return false;
    if (selectedAutonomous && college.autonomous !== selectedAutonomous) return false;
    if (selectedNirf === 'ranked' && !college.nirf_rank) return false;
    if (selectedNirf === 'unranked' && college.nirf_rank) return false;
    if (selectedUnivCategory && college.university_category !== selectedUnivCategory) return false;
    if (selectedHostel && college.hostel_facility !== selectedHostel) return false;
    return true;
  });

  const totalFiltered = filteredColleges.length;
  const accreditedCount = filteredColleges.filter(c => c.naac_grade !== 'Not Accredited' && c.naac_grade !== 'Not Listed').length;
  const pctAccredited = totalFiltered > 0 ? Math.round((accreditedCount / totalFiltered) * 100) : 0;
  const autonomousCount = filteredColleges.filter(c => c.autonomous === 'Yes').length;
  const pctAutonomous = totalFiltered > 0 ? Math.round((autonomousCount / totalFiltered) * 100) : 0;
  const hostelCount = filteredColleges.filter(c => c.hostel_facility && c.hostel_facility !== 'No Hostel Found').length;
  const pctHostel = totalFiltered > 0 ? Math.round((hostelCount / totalFiltered) * 100) : 0;
  const univCountsForPill = filteredColleges.reduce((acc, c) => { acc[c.university_category] = (acc[c.university_category] || 0) + 1; return acc; }, {});
  const topUnivCategory = Object.entries(univCountsForPill).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
  const totalCollegesCount = colleges.length;
  const totalUnaccreditedCount = colleges.filter(c => c.naac_grade === 'Not Accredited' || c.naac_grade === 'Not Listed').length;
  const totalUnaccreditedPct = totalCollegesCount > 0 ? Math.round((totalUnaccreditedCount / totalCollegesCount) * 100) : 0;
  const rankedCountTotal = colleges.filter(c => c.nirf_rank).length;
  const thesisStatement = `${totalCollegesCount} institutions · ${rankedCountTotal} NIRF ranked · ~${totalUnaccreditedPct}% unaccredited`;

  const categoryCounts = filteredColleges.reduce((acc, c) => { acc[c.college_category] = (acc[c.college_category] || 0) + 1; return acc; }, {});
  const categoryChartData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const regionCounts = filteredColleges.reduce((acc, c) => { acc[c.location_normalized] = (acc[c.location_normalized] || 0) + 1; return acc; }, {});
  const regionChartData = Object.entries(regionCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const naacCounts = filteredColleges.reduce((acc, c) => { acc[c.naac_grade] = (acc[c.naac_grade] || 0) + 1; return acc; }, {});
  const naacChartData = naacGrades.map(grade => ({ name: grade, value: naacCounts[grade] || 0 })).filter(item => item.value > 0);
  const hostelCounts = filteredColleges.reduce((acc, c) => { acc[c.hostel_facility] = (acc[c.hostel_facility] || 0) + 1; return acc; }, {});
  const hostelChartData = Object.entries(hostelCounts).map(([name, value]) => ({ name, value }));
  const HOSTEL_COLORS = { 'Boys & Girls': '#8B5CF6', 'Girls Only': '#EC4899', 'Boys Only': '#3B82F6', 'No Hostel Found': '#64748B' };
  const univCounts = filteredColleges.reduce((acc, c) => { acc[c.university_category] = (acc[c.university_category] || 0) + 1; return acc; }, {});
  const univChartData = Object.entries(univCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  const getNaacColor = (grade) => {
    if (['A++', 'A+', 'A'].includes(grade)) return '#10b981';
    if (['B++', 'B+', 'B'].includes(grade)) return '#d97706';
    return '#64748b';
  };

  const getNaacBadgeClass = (grade) => {
    if (['A++', 'A+', 'A'].includes(grade)) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (['B++', 'B+', 'B'].includes(grade)) return 'bg-accent-50 text-accent-800 border-accent-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const ugCount = selectedCollegeCourses.filter(c => c.course_level === 'UG').length;
  const pgCount = selectedCollegeCourses.filter(c => c.course_level === 'PG').length;
  const diplomaCount = selectedCollegeCourses.filter(c => c.course_level === 'Diploma').length;
  const phdCount = selectedCollegeCourses.filter(c => c.course_level === 'PhD').length;

  const getCategoryEmoji = (catName = '') => {
    if (catName.includes('Arts')) return '🎨';
    if (catName.includes('Engineering')) return '⚙️';
    if (catName.includes('Medical') || catName.includes('Physio')) return '🏥';
    if (catName.includes('Pharmacy')) return '💊';
    if (catName.includes('Dental')) return '🦷';
    if (catName.includes('ITI')) return '🔧';
    return '🏛️';
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div id="app-root" className={darkMode ? 'dark' : ''} style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--page-bg)' }}>

      {/* ══════ SIDEBAR ══════ */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🏛️</div>
          <h2>College<br/>Analytics</h2>
          <p>Accreditation Registry</p>
        </div>

        <span className="sidebar-section-label">Main Menu</span>
        <button onClick={() => setCurrentView('explorer')} className={`sidebar-nav-item${currentView === 'explorer' ? ' active' : ''}`}>
          <Building2 className="nav-icon" /><span>Explorer</span>
        </button>
        <button onClick={() => { setCurrentView('explorer'); setTimeout(() => scrollToSection('filter-bar-section'), 100); }} className="sidebar-nav-item">
          <GraduationCap className="nav-icon" /><span>Courses</span>
        </button>
        <button onClick={() => setCurrentView('admin')} className={`sidebar-nav-item${currentView === 'admin' ? ' active' : ''}`}>
          <Database className="nav-icon" /><span>Registry Editor</span>
        </button>

        <span className="sidebar-section-label" style={{ marginTop: '0.5rem' }}>Analytics</span>
        <button onClick={() => { setCurrentView('explorer'); handleClearFilters(); setTimeout(() => scrollToSection('category-bar'), 100); }} className="sidebar-nav-item">
          <Award className="nav-icon" /><span>NAAC Reports</span>
        </button>
        <button onClick={() => { setCurrentView('explorer'); setSelectedNirf('ranked'); setTimeout(() => scrollToSection('college-grid-section'), 100); }} className="sidebar-nav-item">
          <Trophy className="nav-icon" /><span>NIRF Rankings</span>
        </button>
        <button onClick={() => { setCurrentView('explorer'); setTimeout(() => scrollToSection('category-bar'), 100); }} className="sidebar-nav-item">
          <MapPin className="nav-icon" /><span>By Region</span>
        </button>

        <span className="sidebar-section-label" style={{ marginTop: '0.5rem' }}>Info</span>
        <button onClick={() => { setCurrentView('explorer'); handleClearFilters(); }} className="sidebar-nav-item">
          <Globe className="nav-icon" /><span>About</span>
        </button>
        <button onClick={() => { setCurrentView('explorer'); setSelectedCollege(colleges.find(c => c.email || c.phone || c.website) || null); }} className="sidebar-nav-item">
          <Phone className="nav-icon" /><span>Contact</span>
        </button>

        <div style={{ marginTop: 'auto', padding: '1rem 1.25rem 0' }}>
          <div style={{ fontSize: '0.62rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <MapPin style={{ width: 12, height: 12 }} /><span>Tamil Nadu, India</span>
          </div>
        </div>
      </aside>

      {/* ══════ MAIN COLUMN ══════ */}
      <div className="main-col">

        {/* ─── TOPBAR ─── */}
        <div className="topbar">
          <div className="topbar-search">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search colleges, courses..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>
          <div className="topbar-spacer" />
          <span className="topbar-stat">{loading ? 'Loading...' : thesisStatement}</span>
          <button onClick={() => setDarkMode(d => !d)} className="theme-btn">
            {darkMode
              ? <><Sun style={{ width: 13, height: 13, color: '#FCD34D' }} /><span>Light</span></>
              : <><Moon style={{ width: 13, height: 13 }} /><span>Dark</span></>}
          </button>
        </div>

        {/* ─── PAGE CONTENT ─── */}
        <div className="page-content">

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #7C3AED', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Loading institutional data...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '1.5rem', textAlign: 'center', maxWidth: 480, margin: '3rem auto' }}>
              <AlertTriangle style={{ width: 32, height: 32, color: '#EF4444', margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#B91C1C' }}>Failed to load college data</p>
              <p style={{ fontSize: '0.7rem', color: '#EF4444', marginTop: 4 }}>{error}</p>
              <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.4rem 1rem', border: '1px solid #FECACA', background: '#fff', color: '#B91C1C', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                Retry
              </button>
            </div>
          )}

          {/* ══════ EXPLORER VIEW ══════ */}
          {!loading && !error && currentView === 'explorer' && (
            <div className="page-grid">

              {/* ── Left/Main Column ── */}
              <div>

                {/* HERO BANNER */}
                <div className="hero-banner">
                  <div className="hero-text" style={{ position: 'relative', zIndex: 1 }}>
                    <h2>Explore Top Colleges in <span>Tamil Nadu</span></h2>
                    <p>Discover {totalCollegesCount}+ colleges, {courseStats.total_courses}+ courses and accreditation data to shape informed decisions.</p>
                    <div className="hero-btns">
                      <button className="hero-btn-primary" onClick={() => scrollToSection('college-grid-section')}>🏛️ Explore Colleges</button>
                      <button className="hero-btn-secondary" onClick={() => scrollToSection('filter-bar-section')}>📚 Explore Courses</button>
                    </div>
                  </div>
                  <div className="hero-stats">
                    <div className="hero-stat-card">
                      <div className="stat-num">{totalCollegesCount}+</div>
                      <div className="stat-label">Colleges</div>
                    </div>
                    <div className="hero-stat-card">
                      <div className="stat-num">{courseStats.total_courses}+</div>
                      <div className="stat-label">Courses</div>
                    </div>
                    <div className="hero-stat-card">
                      <div className="stat-num">{rankedCountTotal}</div>
                      <div className="stat-label">NIRF Ranked</div>
                    </div>
                  </div>
                </div>

                {/* CATEGORY PILLS */}
                <div className="category-bar" id="category-bar">
                  <button onClick={() => handleCategorySelect('All')} className={`cat-pill${activeCategoryTab === 'All' ? ' active' : ''}`}>
                    🏛️ All Colleges <span className="pill-count">{colleges.length}</span>
                  </button>
                  {Object.entries(
                    colleges.reduce((acc, c) => { acc[c.college_category] = (acc[c.college_category] || 0) + 1; return acc; }, {})
                  ).sort((a, b) => b[1] - a[1]).map(([catName, count]) => (
                    <button
                      key={catName}
                      onClick={() => handleCategorySelect(catName)}
                      className={`cat-pill${activeCategoryTab === catName ? ' active' : ''}`}
                    >
                      {getCategoryEmoji(catName)} {catName} <span className="pill-count">{count}</span>
                    </button>
                  ))}
                </div>

                {/* FILTER BAR */}
                <div className="filter-bar" id="filter-bar-section">
                  <div className="filter-bar-header">
                    <span className="filter-bar-title">🔍 Filters</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      {activeFilterCount > 0 && (
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#7C3AED', background: 'var(--accent-light)', padding: '2px 10px', borderRadius: 999 }}>
                          {activeFilterCount} active
                        </span>
                      )}
                      <button
                        onClick={handleClearFilters}
                        title="Clear all filters"
                        style={{ fontSize: '0.68rem', color: activeFilterCount > 0 ? '#7C3AED' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid var(--card-border)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', transition: 'all 0.15s' }}
                      >
                        <RotateCcw style={{ width: 11, height: 11 }} /> Reset
                      </button>
                    </div>
                  </div>
                  <div className="filter-grid">
                    {/* Category — synced with pill bar */}
                    <div>
                      <select
                        value={selectedCategory}
                        onChange={e => {
                          const val = e.target.value;
                          setSelectedCategory(val);
                          setActiveCategoryTab(val || 'All');
                        }}
                        className="filter-select"
                      >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} className="filter-select"><option value="">All Regions</option>{locations.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                    <div><select value={selectedNaac} onChange={e => setSelectedNaac(e.target.value)} className="filter-select"><option value="">All NAAC Grades</option>{naacGrades.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                    <div><select value={selectedAutonomous} onChange={e => setSelectedAutonomous(e.target.value)} className="filter-select"><option value="">All Autonomy</option>{autonomousStatuses.map(s => <option key={s} value={s}>Autonomous: {s}</option>)}</select></div>
                    <div><select value={selectedNirf} onChange={e => setSelectedNirf(e.target.value)} className="filter-select"><option value="">All NIRF Status</option><option value="ranked">NIRF Ranked</option><option value="unranked">Unranked</option></select></div>
                    <div><select value={selectedUnivCategory} onChange={e => setSelectedUnivCategory(e.target.value)} className="filter-select"><option value="">All Affiliations</option>{universityCategories.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                    <div><select value={selectedHostel} onChange={e => setSelectedHostel(e.target.value)} className="filter-select"><option value="">All Hostels</option>{hostelFacilities.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                    {/* Course Level — purple accent, normal option color */}
                    <div>
                      <select value={selectedCourseLevel} onChange={e => setSelectedCourseLevel(e.target.value)} className="filter-select" style={{ color: selectedCourseLevel ? '#7C3AED' : 'var(--text-primary)', fontWeight: selectedCourseLevel ? 600 : 400 }}>
                        <option value="" style={{ color: 'var(--text-primary)', fontWeight: 400 }}>All Course Levels</option>
                        <option value="UG" style={{ color: '#1D4ED8', fontWeight: 600 }}>📘 UG — Undergraduate</option>
                        <option value="PG" style={{ color: '#6D28D9', fontWeight: 600 }}>📗 PG — Postgraduate</option>
                        <option value="Diploma" style={{ color: '#BE185D', fontWeight: 600 }}>📙 Diploma / Certificate</option>
                        <option value="PhD" style={{ color: '#92400E', fontWeight: 600 }}>🎓 PhD — Research</option>
                      </select>
                    </div>
                    {/* Course Name */}
                    <div>
                      <select value={selectedCourseName} onChange={e => setSelectedCourseName(e.target.value)} className="filter-select" style={{ color: selectedCourseName ? '#7C3AED' : 'var(--text-primary)', fontWeight: selectedCourseName ? 600 : 400 }}>
                        <option value="" style={{ color: 'var(--text-primary)', fontWeight: 400 }}>All Courses ({uniqueCourseNames.length})</option>
                        {uniqueCourseNames.map(n => <option key={n} value={n} style={{ color: 'var(--text-primary)', fontWeight: 400 }}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* LIVE METRICS — 6-up */}
                <div className="metrics-row cols-6" style={{ marginBottom: '1rem' }}>
                  {[
                    { label: 'Colleges Shown', value: totalFiltered, sub: `/ ${totalCollegesCount}`, grad: 'linear-gradient(135deg,#F97316,#EC4899)', icon: Building2 },
                    { label: 'NAAC Accredited', value: `${pctAccredited}%`, sub: `(${accreditedCount})`, grad: 'linear-gradient(135deg,#0EA5E9,#2563EB)', icon: Award },
                    { label: 'Autonomous', value: `${pctAutonomous}%`, sub: `(${autonomousCount})`, grad: 'linear-gradient(135deg,#10B981,#0D9488)', icon: CheckCircle },
                    { label: 'NIRF Ranked', value: filteredColleges.filter(c => c.nirf_rank).length, sub: 'colleges', grad: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', icon: Trophy },
                    { label: 'Hostel Facility', value: `${pctHostel}%`, sub: `(${hostelCount})`, grad: 'linear-gradient(135deg,#EC4899,#DB2777)', icon: Home },
                    { label: 'Top Affiliation', value: topUnivCategory.length > 10 ? topUnivCategory.split(' ')[0] : topUnivCategory, sub: '', grad: 'linear-gradient(135deg,#F59E0B,#D97706)', icon: GraduationCap }
                  ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <div key={i} className="metric-card" style={{ background: card.grad }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <span className="metric-card-label">{card.label}</span>
                          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon style={{ width: 13, height: 13 }} />
                          </div>
                        </div>
                        <div className="metric-card-value">{card.value}</div>
                        {card.sub && <div className="metric-card-sub">{card.sub}</div>}
                      </div>
                    );
                  })}
                </div>

                {/* COURSE METRICS — 3-up */}
                <div className="metrics-row cols-3" style={{ marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Total Courses Offered', value: courseStats.total_courses, sub: 'Across selected colleges', grad: 'linear-gradient(135deg,#4F46E5,#7C3AED)', icon: GraduationCap },
                    { label: 'Avg Courses / College', value: courseStats.avg_courses, sub: 'Mean course count', grad: 'linear-gradient(135deg,#0D9488,#0891B2)', icon: Award },
                    { label: 'Highest Course Offering', value: courseStats.highest_course_college ? `${courseStats.highest_course_college.course_count} Courses` : 'N/A', sub: courseStats.highest_course_college?.college_name || '—', grad: 'linear-gradient(135deg,#BE185D,#9333EA)', icon: Trophy }
                  ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <div key={i} className="metric-card" style={{ background: card.grad }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <span className="metric-card-label">{card.label}</span>
                          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon style={{ width: 13, height: 13 }} />
                          </div>
                        </div>
                        <div className="metric-card-value">{card.value}</div>
                        <div className="metric-card-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.sub}</div>
                      </div>
                    );
                  })}
                </div>

                {/* CHARTS GRID */}
                {totalFiltered > 0 && (
                  <div className="charts-grid">
                    {/* Chart 1 */}
                    <div className="chart-card">
                      <div className="chart-card-header">
                        <div>
                          <h3 className="chart-card-title">{activeCategoryTab === 'All' ? 'Colleges by Category' : `By Region (${activeCategoryTab})`}</h3>
                          <p className="chart-card-sub">{activeCategoryTab === 'All' ? 'Distribution across disciplines' : 'Geographic distribution'}</p>
                        </div>
                        <span className="chart-pill">Live</span>
                      </div>
                      <div style={{ height: 210 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={activeCategoryTab === 'All' ? categoryChartData : regionChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--card-border)" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tickFormatter={t => t.length > 17 ? t.slice(0,14)+'…' : t} tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} />
                            <Tooltip cursor={{ fill: 'var(--accent-light)' }} contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, fontSize: 12 }} />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={13}>
                              {(activeCategoryTab === 'All' ? categoryChartData : regionChartData).map((_, i) => (
                                <Cell key={i} fill={['#7C3AED','#4F46E5','#0EA5E9','#10B981','#F59E0B','#EC4899','#EF4444','#8B5CF6'][i % 8]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 2 */}
                    <div className="chart-card">
                      <div className="chart-card-header">
                        <div><h3 className="chart-card-title">NAAC Grade Distribution</h3><p className="chart-card-sub">Accreditation grades spread</p></div>
                        <span className="chart-pill">Grades</span>
                      </div>
                      <div style={{ height: 210 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={naacChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} />
                            <YAxis hide />
                            <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, fontSize: 12 }} />
                            <Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={22}>
                              {naacChartData.map((entry, i) => <Cell key={i} fill={getNaacColor(entry.name)} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 3 */}
                    <div className="chart-card">
                      <div className="chart-card-header">
                        <div><h3 className="chart-card-title">Hostel Facility</h3><p className="chart-card-sub">Residential options breakdown</p></div>
                        <span className="chart-pill">Residential</span>
                      </div>
                      <div style={{ height: 210, display: 'flex', alignItems: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={hostelChartData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value">
                              {hostelChartData.map((entry, i) => <Cell key={i} fill={HOSTEL_COLORS[entry.name] || '#A78BFA'} />)}
                            </Pie>
                            <Tooltip formatter={v => [`${v} colleges`, 'Count']} contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, fontSize: 12 }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, color: 'var(--text-secondary)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 4 */}
                    <div className="chart-card">
                      <div className="chart-card-header">
                        <div><h3 className="chart-card-title">Top University Affiliations</h3><p className="chart-card-sub">Governing universities distribution</p></div>
                        <span className="chart-pill">Affiliations</span>
                      </div>
                      <div style={{ height: 210 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={univChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--card-border)" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={130} axisLine={false} tickLine={false} tickFormatter={t => t.length > 20 ? t.slice(0,17)+'…' : t} tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} />
                            <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, fontSize: 12 }} />
                            <Bar dataKey="value" fill="#4F46E5" radius={[0, 6, 6, 0]} barSize={13} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 5 — Course Level */}
                    <div className="chart-card">
                      <div className="chart-card-header">
                        <div><h3 className="chart-card-title">Course Level Distribution</h3><p className="chart-card-sub">UG · PG · Diploma · PhD</p></div>
                        <span className="chart-pill">Courses</span>
                      </div>
                      <div style={{ height: 210, display: 'flex', alignItems: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={Object.entries(courseStats.course_distribution || {}).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value">
                              {['#3B82F6','#8B5CF6','#EC4899','#F59E0B'].map((color, i) => <Cell key={i} fill={color} />)}
                            </Pie>
                            <Tooltip formatter={v => [`${v} courses`, 'Count']} contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, fontSize: 12 }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, color: 'var(--text-secondary)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* NIRF LEADERS */}
                {filteredColleges.some(c => c.nirf_rank) && (
                  <div className="nirf-leaders">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trophy style={{ width: 14, height: 14, color: '#D97706' }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>NIRF Ranked Leaders</h3>
                        <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', margin: 0 }}>Top performing institutions in current view</p>
                      </div>
                    </div>
                    <div className="nirf-leaders-grid">
                      {filteredColleges.filter(c => c.nirf_rank).sort((a, b) => a.nirf_rank - b.nirf_rank).map(college => (
                        <div key={college.college_id} onClick={() => setSelectedCollege(college)} className="nirf-leader-item">
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h4 style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{college.college_name}</h4>
                            <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{college.college_category} · {college.course_count} Courses</span>
                          </div>
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 999, padding: '1px 7px', flexShrink: 0 }}>{college.nirf_rank_raw}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* COLLEGE GRID */}
                <div id="college-grid-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Registry Entries</h3>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Showing {totalFiltered} of {totalCollegesCount}</span>
                  </div>

                  {totalFiltered > 0 ? (
                    <div className="college-grid">
                      {filteredColleges.map(college => (
                        <div key={college.college_id} onClick={() => setSelectedCollege(college)} className="college-card">
                          <div className="college-card-header">
                            <div className="college-card-icon">{getCategoryEmoji(college.college_category)}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 className="college-card-title">{college.college_name}</h4>
                              <div className="college-card-meta">
                                <MapPin style={{ width: 11, height: 11 }} />{college.location_normalized}
                              </div>
                            </div>
                            <span className={`naac-badge ${getNaacBadgeClass(college.naac_grade)}`} style={{ border: '1px solid', borderRadius: 999, padding: '1px 7px', fontSize: '0.63rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {college.naac_grade}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>{college.university_category}</p>
                          <div className="college-card-tags">
                            {college.autonomous === 'Yes' && <span className="tag" style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderColor: '#DDD6FE' }}>Autonomous</span>}
                            {college.hostel_facility && college.hostel_facility !== 'No Hostel Found' && (
                              <span className="tag" style={{ background: '#FDF2F8', color: '#9D174D', borderColor: '#FBCFE8', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Home style={{ width: 9, height: 9 }} />{college.hostel_facility}
                              </span>
                            )}
                            {college.nirf_rank_raw && college.nirf_rank_raw !== 'Not Ranked' && (
                              <span className="tag" style={{ background: '#FFFBEB', color: '#92400E', borderColor: '#FDE68A', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Trophy style={{ width: 9, height: 9 }} />{college.nirf_rank_raw}
                              </span>
                            )}
                            <span className="tag" style={{ background: '#EEF2FF', color: '#3730A3', borderColor: '#C7D2FE' }}>📚 {college.course_count} Courses</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.875rem' }}>
                        <HelpCircle style={{ width: 24, height: 24, color: 'var(--accent)' }} />
                      </div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.375rem' }}>No institutions match</h4>
                      <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>Try adjusting or clearing your filters.</p>
                      <button onClick={handleClearFilters} className="btn-ghost">Clear all filters</button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT PANEL ── */}
              <div className="right-panel">
                <div className="panel-card">
                  <h3 className="panel-card-title">⚡ Quick Actions</h3>
                  {[
                    { icon: '🏛️', label: 'Find Colleges', sub: 'Search & Explore', color: '#EDE9FE', action: () => scrollToSection('college-grid-section') },
                    { icon: '📚', label: 'Find Courses', sub: 'Browse All Courses', color: '#E0F2FE', action: () => scrollToSection('filter-bar-section') },
                    { icon: '⚖️', label: 'Compare Colleges', sub: 'Compare & Decide', color: '#FEF3C7', action: () => setCurrentView('admin') },
                    { icon: '❤️', label: 'My Shortlist', sub: 'Your Saved Colleges', color: '#FCE7F3', action: () => { setSelectedNaac('A++'); scrollToSection('college-grid-section'); } }
                  ].map((item, i) => (
                    <div key={i} className="quick-action-item" onClick={item.action} style={{ cursor: 'pointer' }}>
                      <div className="qa-icon" style={{ background: item.color }}>{item.icon}</div>
                      <div className="qa-text">
                        <strong>{item.label}</strong>
                        <span>{item.sub}</span>
                      </div>
                      <ExternalLink style={{ width: 12, height: 12, color: 'var(--text-muted)', flexShrink: 0 }} />
                    </div>
                  ))}
                </div>

                <div className="panel-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.625rem', alignItems: 'center' }}>
                    <h3 className="panel-card-title" style={{ margin: 0 }}>🏆 Top Colleges</h3>
                    <button className="view-all-btn" onClick={() => { setSelectedNaac('A'); scrollToSection('college-grid-section'); }}>View All</button>
                  </div>
                  {filteredColleges.filter(c => ['A++','A+','A'].includes(c.naac_grade)).slice(0, 8).map(college => (
                    <div key={college.college_id} className="top-college-item" onClick={() => setSelectedCollege(college)}>
                      <div className="top-college-avatar">{college.naac_grade}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="top-college-name">{college.college_name}</div>
                        <span className="top-college-loc">{college.location_normalized}</span>
                      </div>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, borderRadius: 999, padding: '1px 6px', border: '1px solid', flexShrink: 0 }} className={getNaacBadgeClass(college.naac_grade)}>{college.naac_grade}</span>
                    </div>
                  ))}
                  {filteredColleges.filter(c => ['A++','A+','A'].includes(c.naac_grade)).length === 0 && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No A-grade colleges in current filter</p>
                  )}
                </div>

                <div className="panel-card">
                  <h3 className="panel-card-title">📊 Dataset Stats</h3>
                  {[
                    { label: 'Total Institutions', value: totalCollegesCount, color: '#7C3AED' },
                    { label: 'NIRF Ranked', value: rankedCountTotal, color: '#F59E0B' },
                    { label: 'Unique Courses', value: uniqueCourseNames.length, color: '#0EA5E9' },
                    { label: 'Regions Covered', value: locations.length, color: '#10B981' }
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: i < 3 ? '1px solid var(--card-border)' : 'none' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════ ADMIN VIEW ══════ */}
          {!loading && !error && currentView === 'admin' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>Registry Editor</h2>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0 }}>Select a college to edit its NAAC, NIRF, contact and affiliation data.</p>
              </div>
              <div className="admin-panel">
                {/* College List */}
                <div className="panel-card" style={{ maxHeight: 700, display: 'flex', flexDirection: 'column', padding: 0 }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: '0 0 0.625rem' }}>Select College to Edit</p>
                    <div className="filter-search-wrap">
                      <Search className="filter-search-icon" />
                      <input type="text" placeholder="Search by name..." value={adminSearchText} onChange={e => setAdminSearchText(e.target.value)} className="filter-input" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {colleges.filter(c => c.college_name.toLowerCase().includes(adminSearchText.toLowerCase())).map(college => {
                      const isSel = selectedAdminCollege?.college_id === college.college_id;
                      return (
                        <button key={college.college_id} type="button" onClick={() => handleSelectAdminCollege(college)} style={{ width: '100%', textAlign: 'left', padding: '0.625rem 1rem', background: isSel ? 'var(--accent-light)' : 'transparent', borderLeft: isSel ? '3px solid #7C3AED' : '3px solid transparent', border: 'none', borderBottom: '1px solid var(--card-border)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ minWidth: 0 }}>
                            <h4 style={{ fontSize: '0.72rem', fontWeight: 600, color: isSel ? '#7C3AED' : 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{college.college_name}</h4>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>ID: {college.college_id} · {college.college_category}</span>
                          </div>
                          <span className={`naac-badge ${getNaacBadgeClass(college.naac_grade)}`} style={{ border: '1px solid', borderRadius: 999, padding: '1px 6px', fontSize: '0.6rem', fontWeight: 700, flexShrink: 0 }}>{college.naac_grade}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Edit Form */}
                <div className="panel-card" style={{ padding: 0 }}>
                  {!selectedAdminCollege ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
                      <Database style={{ width: 40, height: 40, color: 'var(--text-muted)', marginBottom: '0.875rem' }} />
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 0.375rem' }}>No College Selected</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Select a college from the list to edit its details.</p>
                    </div>
                  ) : (
                    <div>
                      {/* Tabs Header */}
                      <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', background: 'var(--page-bg)', padding: '0 1rem', borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
                        <button 
                          onClick={() => setAdminTab('details')}
                          className={`modal-tab-btn${adminTab === 'details' ? ' active' : ''}`}
                          style={{ borderBottom: adminTab === 'details' ? '2px solid #7C3AED' : '2px solid transparent', borderRadius: 0, padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: adminTab === 'details' ? '#7C3AED' : 'var(--text-secondary)' }}
                          type="button"
                        >
                          <Building2 style={{ width: 13, height: 13, marginRight: 6 }} />College Details
                        </button>
                        <button 
                          onClick={() => setAdminTab('courses')}
                          className={`modal-tab-btn${adminTab === 'courses' ? ' active' : ''}`}
                          style={{ borderBottom: adminTab === 'courses' ? '2px solid #7C3AED' : '2px solid transparent', borderRadius: 0, padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: adminTab === 'courses' ? '#7C3AED' : 'var(--text-secondary)' }}
                          type="button"
                        >
                          <GraduationCap style={{ width: 13, height: 13, marginRight: 6 }} />Manage Courses ({adminCourses.length})
                        </button>
                      </div>

                      {/* Tab content: College Details */}
                      {adminTab === 'details' && (
                        <form onSubmit={handleSave}>
                          <div style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <p style={{ fontSize: '0.65rem', color: '#7C3AED', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Editing: #{selectedAdminCollege.college_id}</p>
                              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{selectedAdminCollege.college_name}</h3>
                            </div>
                            {saveStatus === 'success' && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Check style={{ width: 12, height: 12 }} /> Saved
                              </span>
                            )}
                            {saveStatus === 'error' && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <AlertTriangle style={{ width: 12, height: 12 }} /> {saveMessage}
                              </span>
                            )}
                          </div>
                          <div style={{ padding: '1rem', overflowY: 'auto', maxHeight: 580 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                              {[
                                { label: 'College Name', key: 'college_name', type: 'text', full: true },
                                { label: 'College Category', key: 'college_category', type: 'text' },
                                { label: 'Location (Raw)', key: 'location_raw', type: 'text' },
                                { label: 'Location (Normalized)', key: 'location_normalized', type: 'text' },
                                { label: 'Principal Name', key: 'principal_name', type: 'text' },
                                { label: 'Website', key: 'website', type: 'text' },
                                { label: 'Email', key: 'email', type: 'email' },
                                { label: 'Phone', key: 'phone', type: 'text' }
                              ].map(field => (
                                <div key={field.key} style={field.full ? { gridColumn: '1 / -1' } : {}}>
                                  <label className="form-label">{field.label}</label>
                                  <input type={field.type} value={formState[field.key]} onChange={e => setFormState({ ...formState, [field.key]: e.target.value })} className="form-input" />
                                </div>
                              ))}
                              <div>
                                <label className="form-label">NAAC Grade</label>
                                <select value={formState.naac_grade} onChange={e => setFormState({ ...formState, naac_grade: e.target.value })} className="form-input">
                                  {naacGrades.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="form-label">Autonomous Status</label>
                                <select value={formState.autonomous} onChange={e => setFormState({ ...formState, autonomous: e.target.value })} className="form-input">
                                  {['Yes', 'No', 'Unknown'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="form-label">NIRF Rank (numeric)</label>
                                <input type="number" value={formState.nirf_rank} onChange={e => setFormState({ ...formState, nirf_rank: e.target.value })} className="form-input" placeholder="e.g. 45" />
                              </div>
                              <div>
                                <label className="form-label">NIRF Rank (raw text)</label>
                                <input type="text" value={formState.nirf_rank_raw} onChange={e => setFormState({ ...formState, nirf_rank_raw: e.target.value })} className="form-input" placeholder="e.g. #45" />
                              </div>
                              <div>
                                <label className="form-label">University Category</label>
                                <input type="text" value={formState.university_category} onChange={e => setFormState({ ...formState, university_category: e.target.value })} className="form-input" />
                              </div>
                              <div>
                                <label className="form-label">Hostel Facility</label>
                                <select value={formState.hostel_facility} onChange={e => setFormState({ ...formState, hostel_facility: e.target.value })} className="form-input">
                                  {hostelFacilities.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>
                          <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid var(--card-border)', background: 'var(--page-bg)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
                            <button type="button" onClick={() => handleSelectAdminCollege(selectedAdminCollege)} disabled={isSaving} className="btn-ghost">Discard Edits</button>
                            <button type="submit" disabled={isSaving} className="btn-primary">
                              {isSaving ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> Saving…</> : <><Save style={{ width: 13, height: 13 }} /> Save Changes</>}
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Tab content: Manage Courses */}
                      {adminTab === 'courses' && (
                        <div style={{ padding: '1rem' }}>
                          {(isAddingCourse || editingCourse) ? (
                            <form onSubmit={handleCourseSave}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                  {isAddingCourse ? 'Add New Course' : `Edit Course: ${editingCourse.course_name}`}
                                </h4>
                                {courseSaveStatus === 'success' && (
                                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '3px 10px' }}>
                                    {courseSaveMessage}
                                  </span>
                                )}
                                {courseSaveStatus === 'error' && (
                                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '3px 10px' }}>
                                    {courseSaveMessage}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.875rem', maxHeight: 450, overflowY: 'auto', paddingRight: '4px' }}>
                                <div>
                                  <label className="form-label">Course Name</label>
                                  <input 
                                    type="text" 
                                    list="admin-course-names"
                                    value={courseForm.course_name}
                                    onChange={e => setCourseForm({ ...courseForm, course_name: e.target.value })}
                                    className="form-input" 
                                    placeholder="e.g. B.Sc Computer Science"
                                    required 
                                  />
                                  <datalist id="admin-course-names">
                                    {uniqueCourseNames.map(name => <option key={name} value={name} />)}
                                  </datalist>
                                </div>
                                <div>
                                  <label className="form-label">Course Level</label>
                                  <select 
                                    value={courseForm.course_level} 
                                    onChange={e => setCourseForm({ ...courseForm, course_level: e.target.value })} 
                                    className="form-input"
                                  >
                                    <option value="UG">UG — Undergraduate</option>
                                    <option value="PG">PG — Postgraduate</option>
                                    <option value="Diploma">Diploma / Certificate</option>
                                    <option value="PhD">PhD — Research</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="form-label">Course Category</label>
                                  <select 
                                    value={courseForm.course_category} 
                                    onChange={e => setCourseForm({ ...courseForm, course_category: e.target.value })} 
                                    className="form-input"
                                  >
                                    {['Commerce', 'Engineering', 'Science', 'Management', 'Computer Applications / IT', 'Arts / Humanities', 'Medical & Allied Sciences', 'Design & Media', 'Education', 'Law', 'Hospitality & Tourism', 'Other'].map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="form-label">Duration (Years)</label>
                                  <input 
                                    type="number" 
                                    min="1" 
                                    max="10"
                                    value={courseForm.duration}
                                    onChange={e => setCourseForm({ ...courseForm, duration: e.target.value })}
                                    className="form-input" 
                                    required 
                                  />
                                </div>
                              </div>
                              <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--card-border)', paddingTop: '0.875rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button type="button" onClick={() => { setIsAddingCourse(false); setEditingCourse(null); }} className="btn-ghost">Cancel</button>
                                <button type="submit" className="btn-primary">
                                  <Save style={{ width: 13, height: 13, marginRight: 4 }} /> Save Course
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                  {adminCourses.length} Courses Offered
                                </span>
                                <button 
                                  type="button" 
                                  onClick={handleAddCourseClick} 
                                  className="btn-primary" 
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Plus style={{ width: 12, height: 12 }} /> Add Course
                                </button>
                              </div>

                              {loadingAdminCourses ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '0.5rem' }}>
                                  <Loader2 style={{ width: 24, height: 24, color: '#7C3AED' }} className="animate-spin" />
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Loading courses...</span>
                                </div>
                              ) : adminCourses.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed var(--card-border)', borderRadius: 10 }}>
                                  <GraduationCap style={{ width: 32, height: 32, color: 'var(--text-muted)', margin: '0 auto 0.5rem' }} />
                                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>No courses listed for this college.</p>
                                  <button type="button" onClick={handleAddCourseClick} className="btn-ghost" style={{ fontSize: '0.68rem' }}>Add the first course</button>
                                </div>
                              ) : (
                                <div style={{ overflowY: 'auto', maxHeight: 520, display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '4px' }}>
                                  {adminCourses.map(course => {
                                    const lvlColors = { UG: '#1D4ED8', PG: '#6D28D9', Diploma: '#BE185D', PhD: '#92400E' };
                                    return (
                                      <div 
                                        key={course.id} 
                                        style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'space-between', 
                                          padding: '0.625rem 0.875rem', 
                                          border: '1px solid var(--card-border)', 
                                          borderRadius: 10,
                                          background: 'var(--card-bg)'
                                        }}
                                      >
                                        <div style={{ minWidth: 0, flex: 1, marginRight: '1rem' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                            <span 
                                              style={{ 
                                                fontSize: '0.55rem', 
                                                fontWeight: 800, 
                                                background: `${lvlColors[course.course_level]}15`, 
                                                color: lvlColors[course.course_level], 
                                                padding: '1px 5px', 
                                                borderRadius: 4,
                                                border: `1px solid ${lvlColors[course.course_level]}30`
                                              }}
                                            >
                                              {course.course_level}
                                            </span>
                                            <h5 style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                              {course.course_name}
                                            </h5>
                                          </div>
                                          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                            {course.course_category} · {course.duration} {course.duration > 1 ? 'years' : 'year'}
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                          <button 
                                            type="button" 
                                            onClick={() => handleEditCourseClick(course)}
                                            style={{ border: '1px solid var(--card-border)', background: 'var(--page-bg)', padding: '4px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Edit Course"
                                          >
                                            <Edit3 style={{ width: 12, height: 12, color: 'var(--text-secondary)' }} />
                                          </button>
                                          <button 
                                            type="button" 
                                            onClick={() => handleCourseDelete(course)}
                                            style={{ border: '1px solid var(--card-border)', background: 'var(--page-bg)', padding: '4px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Delete Course"
                                          >
                                            <Trash2 style={{ width: 12, height: 12, color: '#EF4444' }} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>{/* end page-content */}
      </div>{/* end main-col */}

      {/* ══════ DETAIL MODAL ══════ */}
      {selectedCollege && (
        <div className="modal-overlay">
          <div style={{ position: 'absolute', inset: 0 }} onClick={() => setSelectedCollege(null)} />
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-category">{selectedCollege.college_category}</div>
              <h3>{selectedCollege.college_name}</h3>
              <button onClick={() => setSelectedCollege(null)} className="modal-close-btn" aria-label="Close">
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <div className="modal-tabs">
              {[
                { id: 'overview', label: 'Overview', icon: Building2 },
                { id: 'courses', label: 'Courses', icon: GraduationCap },
                { id: 'contact', label: 'Contact', icon: Phone },
                { id: 'analytics', label: 'Analytics', icon: Award, disabled: true }
              ].map(tab => {
                const TabIcon = tab.icon;
                return (
                  <button key={tab.id} disabled={tab.disabled} onClick={() => setModalTab(tab.id)} className={`modal-tab-btn${modalTab === tab.id ? ' active' : ''}`}>
                    <TabIcon style={{ width: 12, height: 12 }} />{tab.label}
                  </button>
                );
              })}
            </div>

            <div className="modal-body">
              {/* Overview */}
              {modalTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--card-border)' }}>
                    <div>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>NAAC Grade</span>
                      <span className={`naac-badge ${getNaacBadgeClass(selectedCollege.naac_grade)}`} style={{ border: '1px solid', borderRadius: 999, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700 }}>{selectedCollege.naac_grade}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Autonomous</span>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, background: selectedCollege.autonomous === 'Yes' ? 'var(--accent-light)' : 'var(--page-bg)', color: selectedCollege.autonomous === 'Yes' ? 'var(--accent)' : 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>{selectedCollege.autonomous}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>NIRF Rank</span>
                      {selectedCollege.nirf_rank_raw && selectedCollege.nirf_rank_raw !== 'Not Ranked' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 999, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700 }}>
                          <Trophy style={{ width: 9, height: 9, color: '#D97706' }} />{selectedCollege.nirf_rank_raw}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Unranked</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--card-border)' }}>
                    <div>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>University Category</span>
                      <span style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedCollege.university_category || 'Unknown'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Hostel Facility</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: selectedCollege.hostel_facility === 'No Hostel Found' ? 'var(--page-bg)' : '#FDF2F8', color: selectedCollege.hostel_facility === 'No Hostel Found' ? 'var(--text-muted)' : '#9D174D', border: `1px solid ${selectedCollege.hostel_facility === 'No Hostel Found' ? 'var(--card-border)' : '#FBCFE8'}`, borderRadius: 999, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 600 }}>
                        <Home style={{ width: 9, height: 9 }} />{selectedCollege.hostel_facility || 'No Hostel Found'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', paddingBottom: '1rem', borderBottom: '1px solid var(--card-border)' }}>
                    <MapPin style={{ width: 14, height: 14, color: 'var(--text-muted)', marginTop: 2 }} />
                    <div>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Location</span>
                      <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                        {selectedCollege.location_raw}
                        {selectedCollege.location_raw !== selectedCollege.location_normalized && (
                          <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)', display: 'block', fontWeight: 400 }}>(Region: {selectedCollege.location_normalized})</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', border: '1px solid #C7D2FE', borderRadius: 12, padding: '0.875rem' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3730A3', display: 'block', marginBottom: '0.625rem' }}>Courses Summary</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.375rem', textAlign: 'center' }}>
                      {[{ label: 'Total', value: selectedCollege.course_count, color: '#3730A3' }, { label: 'UG', value: ugCount, color: '#1D4ED8' }, { label: 'PG', value: pgCount, color: '#6D28D9' }, { label: 'Dipl.', value: diplomaCount, color: '#BE185D' }, { label: 'PhD', value: phdCount, color: '#92400E' }].map((s, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '0.375rem 0.25rem', border: '1px solid #DDD6FE' }}>
                          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>{s.label}</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Courses Tab */}
              {modalTab === 'courses' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent-light)', borderRadius: 10, padding: '0.625rem 0.875rem', border: '1px solid #DDD6FE' }}>
                    <span style={{ fontSize: '0.73rem', fontWeight: 600, color: '#3730A3' }}>Total Offered Courses</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#7C3AED', color: '#fff', padding: '2px 10px', borderRadius: 999 }}>{selectedCollege.course_count}</span>
                  </div>
                  {loadingCourses ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 0', gap: '0.5rem' }}>
                      <Loader2 style={{ width: 24, height: 24, color: '#7C3AED' }} className="animate-spin" />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Loading courses...</span>
                    </div>
                  ) : selectedCollegeCourses.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.73rem', fontStyle: 'italic' }}>No courses found.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {['UG','PG','Diploma','PhD'].map(lvl => {
                        const lvlCourses = selectedCollegeCourses.filter(c => c.course_level === lvl);
                        if (!lvlCourses.length) return null;
                        const lvlColors = { UG: '#1D4ED8', PG: '#6D28D9', Diploma: '#BE185D', PhD: '#92400E' };
                        return (
                          <div key={lvl} style={{ border: '1px solid var(--card-border)', borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{ background: 'var(--page-bg)', padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: lvlColors[lvl] }}>
                                {lvl === 'UG' ? 'Undergraduate' : lvl === 'PG' ? 'Postgraduate' : lvl === 'PhD' ? 'Doctoral (PhD)' : 'Diploma / Certificate'}
                              </span>
                              <span style={{ fontSize: '0.6rem', fontWeight: 700, background: lvlColors[lvl], color: '#fff', padding: '1px 7px', borderRadius: 999 }}>{lvlCourses.length}</span>
                            </div>
                            <ul style={{ listStyle: 'none', margin: 0, padding: '0.375rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              {lvlCourses.map(course => (
                                <li key={course.course_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', borderBottom: '1px solid var(--card-border)' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-primary)' }}>{course.course_name}</span>
                                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginLeft: '0.5rem', flexShrink: 0 }}>{course.duration}yr</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Contact Tab */}
              {modalTab === 'contact' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: 'var(--page-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '0.75rem' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User style={{ width: 15, height: 15, color: '#7C3AED' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Principal</span>
                      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{selectedCollege.principal_name || 'Not Listed'}</p>
                    </div>
                  </div>
                  {[
                    { Icon: Globe, label: 'Website', value: selectedCollege.website, href: selectedCollege.website, external: true },
                    { Icon: Mail, label: 'Email', value: selectedCollege.email, href: `mailto:${selectedCollege.email}` },
                    { Icon: Phone, label: 'Phone', value: selectedCollege.phone, href: `tel:${selectedCollege.phone}` }
                  ].map(({ Icon, label, value, href, external }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0', borderBottom: '1px solid var(--card-border)' }}>
                      <Icon style={{ width: 14, height: 14, color: 'var(--text-muted)', flexShrink: 0 }} />
                      {value ? (
                        <a href={href} target={external ? '_blank' : undefined} rel="noopener noreferrer" style={{ fontSize: '0.73rem', color: '#7C3AED', textDecoration: 'none', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {value}{external && <ExternalLink style={{ width: 10, height: 10, flexShrink: 0 }} />}
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{label} not available</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedCollege(null)} className="btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
