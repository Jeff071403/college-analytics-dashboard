import React, { useState, useEffect } from 'react';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import { 
  Building2, 
  MapPin, 
  User, 
  Globe, 
  Mail, 
  Phone, 
  X, 
  ExternalLink, 
  GraduationCap, 
  Award, 
  Trophy, 
  Home, 
  Star,
  Loader2
} from 'lucide-react';

export default function CollegeDetailView({ college, onClose, onSelectRelated, allColleges, darkMode }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Filter Related Colleges: same category or same university, excluding this college itself
  const relatedColleges = allColleges
    .filter(c => c.college_id !== college.college_id && (
      c.college_category === college.college_category || 
      (c.university_category && college.university_category && 
       c.university_category.split('(')[0] === college.university_category.split('(')[0])
    ))
    .slice(0, 5);

  // Fetch courses on mount / college change
  useEffect(() => {
    if (!college) return;
    setLoadingCourses(true);
    fetch(`/api/colleges/${college.college_id}/courses`)
      .then(res => res.json())
      .then(res => {
        setCourses(res.status === 'success' ? res.data : []);
        setLoadingCourses(false);
      })
      .catch(() => {
        setCourses([]);
        setLoadingCourses(false);
      });
  }, [college]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    id: 'google-map-script'
  });

  // local coordinates cache state
  const [geocodedCoords] = useState(() => {
    try {
      const cached = localStorage.getItem('geocoded_coords_cache');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const getCollegeCoords = (college) => {
    const cached = geocodedCoords[college.college_id];
    if (cached && cached !== 'FAILED') {
      return cached;
    }
    if (college.latitude && college.longitude) {
      const lat = parseFloat(college.latitude);
      const lng = parseFloat(college.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  };

  const coords = getCollegeCoords(college);

  const ugCount = courses.filter(c => c.course_level === 'UG').length;
  const pgCount = courses.filter(c => c.course_level === 'PG').length;
  const diplomaCount = courses.filter(c => c.course_level === 'Diploma').length;
  const phdCount = courses.filter(c => c.course_level === 'PhD').length;

  return (
    <div className="modal-overlay">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" onClick={onClose} />
      <div className="modal-box max-w-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-5 text-white relative">
          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
            {college.college_category} · {college.ownership}
          </span>
          <h3 className="text-sm font-bold leading-tight pr-8">{college.college_name}</h3>
          
          <button onClick={onClose} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Items */}
        <div className="flex bg-gray-50 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800 px-4">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'courses', label: 'Courses Offered', icon: GraduationCap },
            { id: 'related', label: 'Related Colleges', icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 py-3 px-3 text-[11px] font-bold border-b-2 transition ${
                  activeTab === tab.id 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[380px] overflow-y-auto space-y-4">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              
              {/* Accreditations summary cards */}
              <div className="grid grid-cols-3 gap-3 pb-3 border-b border-gray-100 dark:border-slate-800/80">
                <div className="bg-gray-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800/60">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1">NAAC Grade</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full font-bold text-[10px]">
                    {college.naac_grade && college.naac_grade.trim() !== '' ? college.naac_grade : 'Not Accredited'}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800/60">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1">NIRF Rank</span>
                  {college.nirf_rank ? (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 rounded-full font-bold text-[10px]">
                      {college.nirf_rank_raw}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 italic font-semibold">Not Ranked</span>
                  )}
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800/60">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Rating</span>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 rounded-full font-bold text-[10px] flex items-center w-fit gap-1">
                    <Star className="w-3 h-3 fill-purple-600 text-purple-600 dark:fill-purple-400" /> {college.google_rating || '4.0'}
                  </span>
                </div>
              </div>

              {/* Affiliation & Autonomy & Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-3 border-b border-gray-100 dark:border-slate-800/80">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1">University Affiliation</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{college.university_category || 'Data Not Available'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Hostel Facility</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{college.hostel_facility || 'Data Not Available'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Bus Facility</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{college.bus_facility || 'No'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Gender Policy</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{college.co_ed || 'Co-ed'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1">UGC Recognized</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{college.ugc_recognized || 'No'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Placement Score</span>
                  <span className="text-xs font-semibold text-gray-850 dark:text-gray-200 font-bold">{college.placement_score !== undefined ? `${college.placement_score} / 10` : '0.0 / 10'}</span>
                </div>
              </div>

              {/* Contact and address */}
              <div className="space-y-2 pb-3 border-b border-gray-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-xs">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">Principal:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{college.principal_name || 'Data Not Available'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">Email:</span>
                  {college.email ? (
                    <a href={`mailto:${college.email}`} className="text-indigo-600 hover:underline">{college.email}</a>
                  ) : (
                    <span className="text-gray-400 italic">Data Not Available</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">Phone:</span>
                  {college.phone ? (
                    <a href={`tel:${college.phone}`} className="text-indigo-600 hover:underline">{college.phone}</a>
                  ) : (
                    <span className="text-gray-400 italic">Data Not Available</span>
                  )}
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-gray-500">Address:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 ml-1">{college.location_raw}</span>
                  </div>
                </div>
              </div>

              {/* Website */}
              <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800/60 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Official Website</span>
                </div>
                {college.website ? (
                  <a href={college.website} target="_blank" rel="noreferrer" className="btn-primary text-[10px] font-semibold py-1 px-3 flex items-center gap-1">
                    Open Website <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 italic font-semibold">Website Not Available</span>
                )}
              </div>

              {/* Google Map Preview */}
              {coords && isLoaded && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">Map Preview</span>
                  <div className="w-100 h-32 rounded-lg border border-gray-150 dark:border-slate-800 overflow-hidden relative">
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={coords}
                      zoom={14}
                      options={{
                        zoomControl: false,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        styles: darkMode ? [
                          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                          { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
                        ] : []
                      }}
                    >
                      <Marker
                        position={coords}
                        title={college.college_name}
                      />
                    </GoogleMap>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COURSES TAB */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              
              {/* Course distribution statistics block */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-800/50 dark:to-slate-800/80 border border-indigo-150 dark:border-slate-700/50 rounded-xl p-3.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 block mb-2">Offerings Summary</span>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { label: 'Total', value: courses.length, color: 'text-indigo-900 dark:text-white' },
                    { label: 'UG', value: ugCount, color: 'text-blue-600 dark:text-blue-400' },
                    { label: 'PG', value: pgCount, color: 'text-purple-600 dark:text-purple-400' },
                    { label: 'Diploma', value: diplomaCount, color: 'text-rose-600 dark:text-rose-400' },
                    { label: 'PhD', value: phdCount, color: 'text-amber-600 dark:text-amber-400' }
                  ].map((s, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-indigo-50 dark:border-slate-800">
                      <span className="text-[9px] text-gray-400 uppercase font-semibold block">{s.label}</span>
                      <span className={`text-base font-bold leading-none mt-1 block ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {loadingCourses ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-xs text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span>Loading courses database...</span>
                </div>
              ) : courses.length === 0 ? (
                <p className="text-center py-6 text-xs text-gray-400 italic">No registered courses listed for this college.</p>
              ) : (
                <div className="space-y-3">
                  {['UG', 'PG', 'Diploma', 'PhD'].map(lvl => {
                    const lvlCourses = courses.filter(c => c.course_level === lvl);
                    if (lvlCourses.length === 0) return null;
                    const lvlColor = { UG: 'text-blue-600 border-b-blue-500', PG: 'text-purple-600 border-b-purple-500', Diploma: 'text-rose-600 border-b-rose-500', PhD: 'text-amber-600 border-b-amber-500' }[lvl];
                    return (
                      <div key={lvl} className="border border-gray-100 dark:border-slate-800 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 dark:bg-slate-800/40 px-3 py-1.5 flex justify-between items-center border-b border-gray-100 dark:border-slate-800">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${lvlColor}`}>
                            {lvl === 'UG' ? 'Undergraduate' : lvl === 'PG' ? 'Postgraduate' : lvl === 'PhD' ? 'Doctoral (PhD)' : 'Diploma / Certificate'}
                          </span>
                          <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 text-[9px] font-bold rounded-full">{lvlCourses.length}</span>
                        </div>
                        <ul className="divide-y divide-gray-50 dark:divide-slate-800 px-3 py-1 text-xs">
                          {lvlCourses.map(course => (
                            <li key={course.id} className="py-2 flex justify-between items-center text-gray-700 dark:text-gray-300">
                              <span>{course.course_name}</span>
                              <span className="text-[10px] font-mono text-gray-400">{course.duration} yr</span>
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

          {/* RELATED COLLEGES TAB */}
          {activeTab === 'related' && (
            <div className="space-y-3">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Recommended Institutions</span>
              <div className="space-y-2">
                {relatedColleges.map(c => (
                  <div 
                    key={c.college_id} 
                    onClick={() => {
                      onSelectRelated(c);
                      setActiveTab('overview');
                    }}
                    className="p-3 bg-gray-50 hover:bg-indigo-50/40 dark:bg-slate-800/30 dark:hover:bg-indigo-950/10 border border-gray-100 dark:border-slate-800 rounded-xl cursor-pointer flex justify-between items-center transition"
                  >
                    <div className="min-w-0 pr-4">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{c.college_name}</h4>
                      <span className="text-[10px] text-gray-400">{c.college_category} · {c.location_normalized}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/10 dark:text-emerald-400 rounded-full font-bold text-[9px]">
                      {c.naac_grade}
                    </span>
                  </div>
                ))}
                {relatedColleges.length === 0 && (
                  <p className="text-center py-6 text-xs text-gray-400 italic">No similar related colleges found.</p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-end">
          <button onClick={onClose} className="btn-ghost text-xs font-semibold py-1.5 px-4">
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
}
