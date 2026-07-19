import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Maximize, ZoomIn } from 'lucide-react';

export default function CollegeMapView({ colleges, darkMode, onSelectCollege }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerClusterGroupRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwnership, setSelectedOwnership] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isWomens, setIsWomens] = useState(false);
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [isUnivDept, setIsUnivDept] = useState(false);
  const [selectedNaac, setSelectedNaac] = useState('');
  const [isNirf, setIsNirf] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter colleges with valid coordinates
  const collegesWithCoords = colleges.filter(c => c.latitude && c.longitude);

  const filteredColleges = collegesWithCoords.filter(c => {
    // Ownership
    if (selectedOwnership && c.ownership !== selectedOwnership) return false;
    
    // Category (Engineering, Arts)
    if (selectedCategory && c.college_category !== selectedCategory) return false;
    
    // Women's College (heuristic: name contains 'women' or 'girls')
    if (isWomens) {
      const name = c.college_name.toLowerCase();
      if (!name.includes('women') && !name.includes('girls') && !name.includes('arts for women')) {
        return false;
      }
    }
    
    // Autonomous
    if (isAutonomous && c.autonomous !== 'Yes') return false;
    
    // University Department
    if (isWomens || isUnivDept) {
      if (isUnivDept) {
        const uc = (c.university_category || '').toLowerCase();
        const isDept = uc.includes('university') && !uc.includes('affiliated') && !uc.includes('deemed');
        if (!isDept) return false;
      }
    }
    
    // NAAC Grade
    if (selectedNaac && c.naac_grade !== selectedNaac) return false;
    
    // NIRF Ranking
    if (isNirf && !c.nirf_rank) return false;
    
    return true;
  });

  // Autocomplete search suggestions
  const suggestions = searchQuery.trim() !== '' 
    ? filteredColleges.filter(c => c.college_name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  // Map tile styling based on Dark Mode
  const tileUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  // Initialize and update Map
  useEffect(() => {
    if (!window.L || !mapRef.current) return;

    // Create map instance if it does not exist
    if (!mapInstanceRef.current) {
      const map = window.L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([13.0827, 80.2707], 11); // Center on Chennai
      
      mapInstanceRef.current = map;
      
      // Add custom attribution
      window.L.control.attribution({ prefix: false }).addAttribution('© OpenStreetMap, CartoDB').addTo(map);
    }

    const map = mapInstanceRef.current;

    // Remove existing tile layer and add new one based on theme
    if (map._tileLayer) {
      map.removeLayer(map._tileLayer);
    }
    const tiles = window.L.tileLayer(tileUrl, { maxZoom: 19 });
    tiles.addTo(map);
    map._tileLayer = tiles;

    // Clear and create marker cluster group
    if (markerClusterGroupRef.current) {
      map.removeLayer(markerClusterGroupRef.current);
    }

    const markerClusterGroup = window.L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 40
    });
    markerClusterGroupRef.current = markerClusterGroup;

    // Draw markers
    filteredColleges.forEach(college => {
      const lat = parseFloat(college.latitude);
      const lon = parseFloat(college.longitude);

      const naacText = (college.naac_grade && college.naac_grade.trim() !== '') ? college.naac_grade : 'Not Accredited';
      const nirfText = (college.nirf_rank_raw && college.nirf_rank_raw.trim() !== '') ? college.nirf_rank_raw : 'Not Ranked';

      const customPopup = window.L.popup({
        maxWidth: 260,
        className: 'custom-map-popup'
      }).setContent(`
        <div style="font-family: 'Inter', sans-serif; font-size: 11px; color: #1e1b4b; padding: 4px;">
          <h4 style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #4338ca; line-height: 1.3;">
            ${college.college_name}
          </h4>
          <p style="margin: 0 0 6px; color: #6b7280; font-size: 10px;">
            ${college.college_category} · ${college.location_normalized}
          </p>
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
            <span style="font-size: 9px; font-weight: 700; background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 999px;">
              NAAC: ${naacText}
            </span>
            <span style="font-size: 9px; font-weight: 700; background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 999px;">
              NIRF: ${nirfText}
            </span>
          </div>
          <div style="display: flex; gap: 4px; border-top: 1px solid #f3f4f6; padding-top: 6px;">
            ${college.website ? `
              <a href="${college.website}" target="_blank" style="flex: 1; text-align: center; background: #6366f1; color: white; border-radius: 4px; padding: 3px 0; font-weight: 600; text-decoration: none; font-size: 9px;">
                Website
              </a>
            ` : `
              <span style="flex: 1; text-align: center; color: #9ca3af; background: #f3f4f6; border-radius: 4px; padding: 3px 0; font-size: 9px; font-style: italic;">
                Website Not Available
              </span>
            `}
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(college.college_name + ', ' + college.location_normalized + ', Tamil Nadu')}" 
               target="_blank" 
               style="flex: 1; text-align: center; border: 1px solid #ddd; border-radius: 4px; padding: 3px 0; color: #4b5563; text-decoration: none; font-weight: 600; font-size: 9px;"
            >
              Open in Google Maps
            </a>
          </div>
        </div>
      `);

      const marker = window.L.marker([lat, lon]).bindPopup(customPopup);
      markerClusterGroup.addLayer(marker);
    });

    map.addLayer(markerClusterGroup);

    // Zoom map view to fit bounds of filtered markers
    if (filteredColleges.length > 0) {
      const bounds = markerClusterGroup.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    }

  }, [filteredColleges.length, tileUrl]);

  // Cleanup Map on Unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleZoomToCollege = (college) => {
    if (!mapInstanceRef.current || !college.latitude || !college.longitude) return;
    const map = mapInstanceRef.current;
    
    // Zoom in on coordinates
    map.setView([parseFloat(college.latitude), parseFloat(college.longitude)], 15);
    
    // Find the marker cluster layer to open the popup automatically
    if (markerClusterGroupRef.current) {
      const group = markerClusterGroupRef.current;
      group.eachLayer(layer => {
        if (Math.abs(layer.getLatLng().lat - parseFloat(college.latitude)) < 0.0001 && 
            Math.abs(layer.getLatLng().lng - parseFloat(college.longitude)) < 0.0001) {
          group.zoomToShowLayer(layer, () => {
            layer.openPopup();
          });
        }
      });
    }

    setSearchQuery(college.college_name);
    setShowDropdown(false);
  };

  const handleResetFilters = () => {
    setSelectedOwnership('');
    setSelectedCategory('');
    setIsWomens(false);
    setIsAutonomous(false);
    setIsUnivDept(false);
    setSelectedNaac('');
    setIsNirf(false);
    setSearchQuery('');
  };

  const toggleFullScreen = () => {
    const el = document.getElementById('map-wrapper');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">College Map</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Interactive OpenStreetMap geolocation for accredited colleges</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Control Panel */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Map Controls</h3>
            <button 
              onClick={handleResetFilters} 
              className="text-[10px] text-indigo-500 hover:underline"
            >
              Reset Filters
            </button>
          </div>

          {/* Autocomplete Search input */}
          <div className="relative">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">Search College</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="form-input pl-8 text-xs dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {suggestions.map(c => (
                  <button
                    key={c.college_id}
                    onClick={() => handleZoomToCollege(c)}
                    className="w-100 text-left px-3 py-2 text-[11px] hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-slate-800 last:border-b-0 block"
                  >
                    {c.college_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ownership Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">Ownership</label>
            <select
              value={selectedOwnership}
              onChange={e => setSelectedOwnership(e.target.value)}
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700"
            >
              <option value="">All Ownerships</option>
              <option value="Government">Government</option>
              <option value="Private">Private</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">College Category</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700"
            >
              <option value="">All Categories</option>
              <option value="Arts & Science">Arts & Science</option>
              <option value="Engineering">Engineering</option>
            </select>
          </div>

          {/* NAAC Grade Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">NAAC Grade</label>
            <select
              value={selectedNaac}
              onChange={e => setSelectedNaac(e.target.value)}
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700"
            >
              <option value="">All NAAC Grades</option>
              {['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'D'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Toggle Checklist */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            {/* Autonomous */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-300">
              <input 
                type="checkbox" 
                checked={isAutonomous} 
                onChange={e => setIsAutonomous(e.target.checked)} 
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Autonomous Institute</span>
            </label>
            
            {/* University Dept */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-300">
              <input 
                type="checkbox" 
                checked={isUnivDept} 
                onChange={e => setIsUnivDept(e.target.checked)} 
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>University Department</span>
            </label>

            {/* Women's College */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-300">
              <input 
                type="checkbox" 
                checked={isWomens} 
                onChange={e => setIsWomens(e.target.checked)} 
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Women's College</span>
            </label>

            {/* NIRF Ranked */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-300">
              <input 
                type="checkbox" 
                checked={isNirf} 
                onChange={e => setIsNirf(e.target.checked)} 
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>NIRF Ranked Only</span>
            </label>
          </div>

          <div className="pt-2 text-[10px] text-gray-400 font-semibold italic border-t border-gray-100 dark:border-slate-800">
            Showing {filteredColleges.length} of {collegesWithCoords.length} mapped colleges.
          </div>
        </div>

        {/* Map Canvas Wrapper */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm relative" id="map-wrapper">
          <div className="absolute right-4 top-4 z-[999] flex gap-2">
            <button 
              onClick={toggleFullScreen} 
              className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 p-2 rounded-lg border border-gray-200 dark:border-slate-700 shadow-lg flex items-center justify-center" 
              title="Full Screen Map"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
          <div 
            id="map-container" 
            ref={mapRef} 
            className="w-100 h-[500px] z-10"
            style={{ outline: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
