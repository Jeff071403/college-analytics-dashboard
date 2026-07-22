import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapPin, Search, Maximize, X } from 'lucide-react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

const defaultCenter = { lat: 13.0827, lng: 80.2707 };
const defaultZoom = 10; // Zoom level 10 for Chennai overview

// Helper to extract a potential address keyword/location from the website URL or string
const extractAddressFromWebsite = (website) => {
  if (!website) return null;
  const trimmed = website.trim();
  
  // Case A: If it's not a URL but looks like an address containing zip/Chennai/Tamil Nadu
  const isUrl = /^(https?:\/\/|www\.)/i.test(trimmed) || trimmed.includes('.com') || trimmed.includes('.edu') || trimmed.includes('.org') || trimmed.includes('.in');
  if (!isUrl && (trimmed.toLowerCase().includes('chennai') || trimmed.toLowerCase().includes('tamil nadu') || /\d{6}/.test(trimmed))) {
    return trimmed;
  }
  
  // Case B: If it is a URL, parse path segments
  try {
    let urlString = trimmed;
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = 'http://' + urlString;
    }
    const parsed = new URL(urlString);
    const path = parsed.pathname;
    
    if (path && path !== '/') {
      const segments = decodeURIComponent(path).split('/').filter(s => s.trim() !== '');
      for (const segment of segments) {
        const lower = segment.toLowerCase();
        if (
          lower.length > 3 && 
          !['index', 'home', 'contact', 'about', 'contactus', 'html', 'php', 'aspx'].includes(lower) &&
          !/\.(html|php|aspx|jsp)$/.test(lower)
        ) {
          return segment.replace(/[-_]+/g, ' ');
        }
      }
    }
  } catch (e) {
    // Ignore URL parsing errors
  }
  
  return null;
};

// Helper to extract keywords from website hostname for search accuracy scoring
const getDomainKeywords = (url) => {
  if (!url) return [];
  try {
    let urlString = url.trim();
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = 'http://' + urlString;
    }
    const hostname = new URL(urlString).hostname;
    const parts = hostname.split('.');
    return parts.filter(p => !['www', 'com', 'org', 'net', 'edu', 'in', 'ac', 'co'].includes(p.toLowerCase()));
  } catch (e) {
    return [];
  }
};

// Helper to build search query: College Name, Area/Location, Chennai, Tamil Nadu, India
const getGeocodingQuery = (college) => {
  const name = college.college_name;
  const area = college.location_raw || college.location_normalized || '';
  
  const queryParts = [name];
  if (area) {
    queryParts.push(area);
  }
  
  const hasChennai = (name + ' ' + area).toLowerCase().includes('chennai');
  if (!hasChennai) {
    queryParts.push('Chennai');
  }
  
  const hasTN = (name + ' ' + area).toLowerCase().includes('tamil nadu');
  if (!hasTN) {
    queryParts.push('Tamil Nadu');
  }
  
  const hasIndia = (name + ' ' + area).toLowerCase().includes('india');
  if (!hasIndia) {
    queryParts.push('India');
  }
  
  return queryParts.join(', ');
};

// Scoring function to rank candidates returned by Geocoder
const scoreResult = (result, college) => {
  let score = 0;
  const address = (result.formatted_address || '').toLowerCase();
  
  // 1. Match college name words
  const nameWords = college.college_name.toLowerCase().split(/[\s,.-]+/);
  nameWords.forEach(word => {
    if (word.length > 2 && address.includes(word)) {
      score += 5;
    }
  });

  // 2. Match area/location
  const area = (college.location_raw || college.location_normalized || '').toLowerCase();
  if (area) {
    const areaWords = area.split(/[\s,.-]+/);
    areaWords.forEach(word => {
      if (word.length > 2 && address.includes(word)) {
        score += 10;
      }
    });
  }

  // 3. Match website domain keywords
  const websiteKeywords = getDomainKeywords(college.website);
  websiteKeywords.forEach(kw => {
    if (kw.length > 2 && address.includes(kw.toLowerCase())) {
      score += 5;
    }
  });

  // 4. Match City/District
  if (address.includes('chennai')) {
    score += 5;
  }
  if (address.includes('tamil nadu')) {
    score += 5;
  }
  const district = (college.location_normalized || '').toLowerCase();
  if (district && address.includes(district)) {
    score += 5;
  }

  return score;
};

// Select the best result from candidates after validation check (Requirement 4 & 7)
const getBestGeocodingResult = (results, college) => {
  const district = (college.location_normalized || college.location_raw || '').toLowerCase().trim();
  
  const passingCandidates = results.filter(result => {
    const formattedAddress = (result.formatted_address || '').toLowerCase();
    const containsChennai = formattedAddress.includes('chennai');
    const containsTN = formattedAddress.includes('tamil nadu') || formattedAddress.includes('tn ');
    const matchesDistrict = district && (formattedAddress.includes(district) || district.includes(formattedAddress));
    return containsChennai || containsTN || matchesDistrict;
  });

  if (passingCandidates.length === 0) {
    return null;
  }

  // Sort by score descending
  passingCandidates.sort((a, b) => scoreResult(b, college) - scoreResult(a, college));
  return passingCandidates[0];
};

// Error handling helper
const handleGeocodeError = (status, college) => {
  let errorMsg = "";
  if (status === 'ZERO_RESULTS') {
    errorMsg = `No location found for "${college.college_name}".`;
  } else if (status === 'OVER_QUERY_LIMIT') {
    errorMsg = "Google Maps API query quota exceeded. Please try again later.";
  } else if (status === 'REQUEST_DENIED') {
    errorMsg = "Google Maps API request was denied. Please verify your API key.";
  } else if (status === 'INVALID_REQUEST') {
    errorMsg = "Invalid search request.";
  } else {
    errorMsg = `Google Maps Geocoding failed: ${status}`;
  }
  console.error(`[Geocoding Error] ${errorMsg}`);
  alert(errorMsg);
};

const GOOGLE_MAPS_LIBRARIES = ['marker'];

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b9" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3930" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

export default function CollegeMapView({ colleges, darkMode, onSelectCollege }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    id: 'google-map-script',
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const [map, setMap] = useState(null);
  const [selectedCollegeMarker, setSelectedCollegeMarker] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwnership, setSelectedOwnership] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isWomens, setIsWomens] = useState(false);
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [isUnivDept, setIsUnivDept] = useState(false);
  const [selectedNaac, setSelectedNaac] = useState('');
  const [isNirf, setIsNirf] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // local coordinates cache state
  const [geocodedCoords, setGeocodedCoords] = useState(() => {
    try {
      const cached = localStorage.getItem('geocoded_coords_cache');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  // Prioritize DB coordinates, fall back to cache
  const getCollegeCoords = useCallback((college) => {
    if (college && college.latitude && college.longitude) {
      const lat = parseFloat(college.latitude);
      const lng = parseFloat(college.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    if (college && geocodedCoords[college.college_id] && geocodedCoords[college.college_id] !== 'FAILED') {
      return geocodedCoords[college.college_id];
    }
    return null;
  }, [geocodedCoords]);

  // Helper to save coordinates to cache & DB
  const saveCollegeCoords = async (collegeId, coords) => {
    // 1. Update React state & local storage cache immediately
    setGeocodedCoords(prev => {
      const updated = { ...prev, [collegeId]: coords };
      localStorage.setItem('geocoded_coords_cache', JSON.stringify(updated));
      return updated;
    });

    // 2. Persist to database via PUT API
    try {
      const response = await fetch(`/api/colleges/${collegeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to update college in database: status ${response.status}`);
      }
      console.log(`[Database Update] Successfully saved coordinates for college ${collegeId} to database.`);
    } catch (err) {
      console.warn(`[Database Update] Failed to update database for college ${collegeId}. Falling back to localStorage cache.`, err);
    }
  };

  // Apply dashboard filters on the colleges list
  const filteredColleges = useMemo(() => {
    return colleges.filter(c => {
      // Ownership
      if (selectedOwnership && c.ownership !== selectedOwnership) return false;
      
      // Category
      if (selectedCategory && c.college_category !== selectedCategory) return false;
      
      // Women's College
      if (isWomens) {
        const name = c.college_name.toLowerCase();
        if (!name.includes('women') && !name.includes('girls') && !name.includes('arts for women')) {
          return false;
        }
      }
      
      // Autonomous
      if (isAutonomous && c.autonomous !== 'Yes') return false;
      
      // University Department
      if (isUnivDept) {
        const uc = (c.university_category || '').toLowerCase();
        const isDept = uc.includes('university') && !uc.includes('affiliated') && !uc.includes('deemed');
        if (!isDept) return false;
      }
      
      // NAAC Grade
      if (selectedNaac && c.naac_grade !== selectedNaac) return false;
      
      // NIRF Ranking
      if (isNirf && !c.nirf_rank) return false;
      
      return true;
    });
  }, [colleges, selectedOwnership, selectedCategory, isWomens, isAutonomous, isUnivDept, selectedNaac, isNirf]);

  // Get colleges that have valid coordinates (or are already geocoded successfully)
  const mappedColleges = useMemo(() => {
    return filteredColleges.filter(c => getCollegeCoords(c) !== null);
  }, [filteredColleges, getCollegeCoords]);

  // Autocomplete search suggestions
  const suggestions = useMemo(() => {
    return searchQuery.trim() !== '' 
      ? filteredColleges.filter(c => c.college_name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
      : [];
  }, [searchQuery, filteredColleges]);

  // Sequential client-side geocoding loop for colleges lacking coordinates
  useEffect(() => {
    if (!isLoaded || !window.google || !apiKey) return;

    // Identify colleges lacking database coordinates AND lacking cached coordinates
    const toGeocode = filteredColleges.filter(c => {
      const hasDBCoords = c.latitude && c.longitude && !isNaN(parseFloat(c.latitude)) && !isNaN(parseFloat(c.longitude));
      const hasCachedCoords = geocodedCoords[c.college_id] && geocodedCoords[c.college_id] !== 'FAILED';
      return !hasDBCoords && !hasCachedCoords;
    });

    if (toGeocode.length === 0) return;

    let active = true;
    const geocoder = new window.google.maps.Geocoder();

    const processQueue = async () => {
      for (const college of toGeocode) {
        if (!active) break;

        const hasCached = geocodedCoords[college.college_id] && geocodedCoords[college.college_id] !== 'FAILED';
        if (hasCached) continue;

        try {
          const geocodingQuery = getGeocodingQuery(college);
          
          const coords = await new Promise((resolve, reject) => {
            geocoder.geocode({ address: geocodingQuery }, (results, status) => {
              if (status === 'OK' && results && results.length > 0) {
                const bestResult = getBestGeocodingResult(results, college);
                if (bestResult) {
                  const loc = bestResult.geometry.location;
                  const lat = loc.lat();
                  const lng = loc.lng();
                  const formattedAddress = bestResult.formatted_address;
                  
                  // Requirement 8 Console Log
                  console.log(
                    `Searching:\n` +
                    `College: ${college.college_name}\n` +
                    `Location: ${college.location_raw || college.location_normalized}\n` +
                    `Geocoding Query: ${geocodingQuery}\n` +
                    `Latitude: ${lat}\n` +
                    `Longitude: ${lng}\n` +
                    `Formatted Address: ${formattedAddress}`
                  );
                  
                  resolve({ lat, lng });
                } else {
                  // Fallback 12: Website address extraction
                  const websiteAddress = extractAddressFromWebsite(college.website);
                  if (websiteAddress) {
                    const fallbackQuery = `${college.college_name}, ${websiteAddress}, Chennai, Tamil Nadu, India`;
                    geocoder.geocode({ address: fallbackQuery }, (fbResults, fbStatus) => {
                      if (fbStatus === 'OK' && fbResults && fbResults.length > 0) {
                        const fbBestResult = getBestGeocodingResult(fbResults, college);
                        if (fbBestResult) {
                          const fbLoc = fbBestResult.geometry.location;
                          const fbLat = fbLoc.lat();
                          const fbLng = fbLoc.lng();
                          const fbAddr = fbBestResult.formatted_address;
                          
                          console.log(
                            `Searching (Fallback):\n` +
                            `College: ${college.college_name}\n` +
                            `Location: ${college.location_raw || college.location_normalized}\n` +
                            `Geocoding Query: ${fallbackQuery}\n` +
                            `Latitude: ${fbLat}\n` +
                            `Longitude: ${fbLng}\n` +
                            `Formatted Address: ${fbAddr}`
                          );
                          
                          resolve({ lat: fbLat, lng: fbLng });
                          return;
                        }
                      }
                      reject('ZERO_RESULTS');
                    });
                  } else {
                    reject('ZERO_RESULTS');
                  }
                }
              } else {
                reject(status);
              }
            });
          });

          if (active) {
            await saveCollegeCoords(college.college_id, coords);
          }

          // Respect Google Geocoding rate limits
          await new Promise(resolve => setTimeout(resolve, 600));

        } catch (err) {
          console.warn(`[Geocoding Loop] Failed for '${college.college_name}':`, err);
          
          setGeocodedCoords(prev => {
            const updated = { ...prev, [college.college_id]: 'FAILED' };
            localStorage.setItem('geocoded_coords_cache', JSON.stringify(updated));
            return updated;
          });
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    };

    processQueue();

    return () => {
      active = false;
    };
  }, [filteredColleges, isLoaded, apiKey, geocodedCoords]);

  // Adjust map boundaries dynamically when mappedColleges changes
  useEffect(() => {
    if (!map || mappedColleges.length === 0 || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;

    mappedColleges.forEach(college => {
      const coords = getCollegeCoords(college);
      if (coords) {
        bounds.extend(coords);
        hasCoords = true;
      }
    });

    if (hasCoords) {
      map.fitBounds(bounds);
      
      // Limit zoom depth when centering a single marker
      if (mappedColleges.length === 1) {
        const listener = window.google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom() > 16) {
            map.setZoom(16);
          }
          window.google.maps.event.removeListener(listener);
        });
      }
    }
  }, [map, mappedColleges, getCollegeCoords]);

  // Map callbacks
  const onLoad = useCallback(mapInstance => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const clustererRef = useRef(null);
  const markersRef = useRef({});

  // Synchronize AdvancedMarkerElements with map and clustering
  useEffect(() => {
    if (!map || !window.google || !window.google.maps.marker) return;

    // Clear existing markers from map
    Object.values(markersRef.current).forEach(marker => {
      marker.map = null;
    });
    markersRef.current = {};

    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    const newMarkers = [];
    mappedColleges.forEach(college => {
      const coords = getCollegeCoords(college);
      if (!coords) return;

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: coords,
        title: college.college_name,
      });

      marker.addListener('click', () => {
        handleMarkerClick(college);
      });

      markersRef.current[college.college_id] = marker;
      newMarkers.push(marker);
    });

    if (newMarkers.length > 0) {
      if (!clustererRef.current) {
        clustererRef.current = new MarkerClusterer({
          map,
          markers: newMarkers
        });
      } else {
        clustererRef.current.addMarkers(newMarkers);
      }
    }

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      Object.values(markersRef.current).forEach(marker => {
        marker.map = null;
      });
      markersRef.current = {};
    };
  }, [map, mappedColleges, getCollegeCoords]);

  const handleZoomToCollege = async (college) => {
    // 1. If coordinates exist in DB or cache, use directly (Requirement 2)
    let coords = getCollegeCoords(college);
    
    if (!coords) {
      if (!isLoaded || !window.google || !window.google.maps) {
        alert("Google Maps API is not loaded yet.");
        return;
      }

      try {
        const geocoder = new window.google.maps.Geocoder();
        const geocodingQuery = getGeocodingQuery(college);

        const resultCoords = await new Promise((resolve, reject) => {
          geocoder.geocode({ address: geocodingQuery }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              const bestResult = getBestGeocodingResult(results, college);
              if (bestResult) {
                const loc = bestResult.geometry.location;
                const lat = loc.lat();
                const lng = loc.lng();
                const formattedAddress = bestResult.formatted_address;

                console.log(
                  `Searching:\n` +
                  `College: ${college.college_name}\n` +
                  `Location: ${college.location_raw || college.location_normalized}\n` +
                  `Geocoding Query: ${geocodingQuery}\n` +
                  `Latitude: ${lat}\n` +
                  `Longitude: ${lng}\n` +
                  `Formatted Address: ${formattedAddress}`
                );

                resolve({ lat, lng });
              } else {
                // Fallback 12: website address extraction
                const websiteAddress = extractAddressFromWebsite(college.website);
                if (websiteAddress) {
                  const fallbackQuery = `${college.college_name}, ${websiteAddress}, Chennai, Tamil Nadu, India`;
                  geocoder.geocode({ address: fallbackQuery }, (fbResults, fbStatus) => {
                    if (fbStatus === 'OK' && fbResults && fbResults.length > 0) {
                      const fbBestResult = getBestGeocodingResult(fbResults, college);
                      if (fbBestResult) {
                        const fbLoc = fbBestResult.geometry.location;
                        const fbLat = fbLoc.lat();
                        const fbLng = fbLoc.lng();
                        const fbAddr = fbBestResult.formatted_address;

                        console.log(
                          `Searching (Fallback):\n` +
                          `College: ${college.college_name}\n` +
                          `Location: ${college.location_raw || college.location_normalized}\n` +
                          `Geocoding Query: ${fallbackQuery}\n` +
                          `Latitude: ${fbLat}\n` +
                          `Longitude: ${fbLng}\n` +
                          `Formatted Address: ${fbAddr}`
                        );

                        resolve({ lat: fbLat, lng: fbLng });
                        return;
                      }
                    }
                    reject('ZERO_RESULTS');
                  });
                } else {
                  reject('ZERO_RESULTS');
                }
              }
            } else {
              reject(status);
            }
          });
        });

        coords = resultCoords;
        await saveCollegeCoords(college.college_id, coords);

      } catch (err) {
        handleGeocodeError(err, college);
        return;
      }
    }

    if (coords && map) {
      map.panTo(coords);
      map.setZoom(16); // Set zoom level to 16 when college is found

      setSelectedCollegeMarker(college);
      setSearchQuery(college.college_name);
      setShowDropdown(false);
    } else {
      alert(`Could not find coordinates for "${college.college_name}".`);
    }
  };

  const handleMarkerClick = (college) => {
    setSelectedCollegeMarker(college);
    if (map) {
      const coords = getCollegeCoords(college);
      if (coords) {
        map.panTo(coords);
      }
    }
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
    setSelectedCollegeMarker(null);
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

  const mapOptions = useMemo(() => {
    return {
      styles: darkMode ? darkMapStyle : [],
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      mapId: 'DEMO_MAP_ID'
    };
  }, [darkMode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">College Map</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Interactive Google Maps geolocation for accredited colleges</p>
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
          <div className="relative" ref={searchRef}>
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
                className="form-input pl-8 pr-8 text-xs dark:bg-slate-800 dark:border-slate-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCollegeMarker(null);
                  }}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {suggestions.map(c => (
                  <button
                    key={c.college_id}
                    type="button"
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
            Showing {mappedColleges.length} of {filteredColleges.length} filtered colleges ({colleges.length} total).
          </div>
        </div>

        {/* Map Canvas Wrapper */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm relative h-[500px]" id="map-wrapper">
          <div className="absolute right-4 top-4 z-50 flex gap-2">
            <button 
              onClick={toggleFullScreen} 
              className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 p-2 rounded-lg border border-gray-200 dark:border-slate-700 shadow-lg flex items-center justify-center" 
              title="Full Screen Map"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>

          {/* Loader or Map Display */}
          {!apiKey ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400">
              <h3 className="font-bold text-sm mb-1">Google Maps API Key Missing</h3>
              <p className="text-xs max-w-sm">Please set the <code>VITE_GOOGLE_MAPS_API_KEY</code> environment variable to view the interactive map.</p>
            </div>
          ) : loadError ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400">
              <h3 className="font-bold text-sm mb-1">Google Maps Load Failure</h3>
              <p className="text-xs max-w-sm">The Google Maps JavaScript API could not be loaded. Please check your network connection and API credentials.</p>
            </div>
          ) : !isLoaded ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-slate-900/50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={defaultCenter}
              zoom={defaultZoom}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={mapOptions}
            >
              {selectedCollegeMarker && getCollegeCoords(selectedCollegeMarker) && (
                <InfoWindow
                  position={getCollegeCoords(selectedCollegeMarker)}
                  onCloseClick={() => setSelectedCollegeMarker(null)}
                >
                  <div style={{ fontFamily: "System-UI, -apple-system, sans-serif", fontSize: '11px', color: '#1e1b4b', padding: '4px', maxWidth: '280px', minWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#4338ca', lineHeight: 1.3 }}>
                      {selectedCollegeMarker.college_name}
                    </h4>
                    <p style={{ margin: '0 0 6px', color: '#6b7280', fontSize: '10px' }}>
                      {selectedCollegeMarker.college_category} · {selectedCollegeMarker.location_normalized}
                    </p>

                    <div style={{ margin: '0 0 8px', color: '#4b5563', fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '3px', borderTop: '1px solid #f3f4f6', paddingTop: '6px' }}>
                      {selectedCollegeMarker.location_raw && (
                        <div><strong>Address:</strong> {selectedCollegeMarker.location_raw}</div>
                      )}
                      {selectedCollegeMarker.university_category && (
                        <div><strong>Affiliation:</strong> {selectedCollegeMarker.university_category}</div>
                      )}
                      {selectedCollegeMarker.phone && (
                        <div><strong>Phone:</strong> {selectedCollegeMarker.phone}</div>
                      )}
                      {selectedCollegeMarker.email && (
                        <div><strong>Email:</strong> {selectedCollegeMarker.email}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '999px' }}>
                        NAAC: {selectedCollegeMarker.naac_grade || 'Not Accredited'}
                      </span>
                      <span style={{ fontSize: '9px', fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '999px' }}>
                        NIRF: {selectedCollegeMarker.nirf_rank_raw || 'Not Ranked'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #f3f4f6', paddingTop: '8px', marginTop: '4px' }}>
                      {selectedCollegeMarker.website ? (
                        <a 
                          href={selectedCollegeMarker.website} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ flex: 1, textAlign: 'center', background: '#6366f1', color: 'white', borderRadius: '4px', padding: '4px 0', fontWeight: 600, textDecoration: 'none', fontSize: '9px' }}
                        >
                          Website
                        </a>
                      ) : (
                        <span style={{ flex: 1, textAlign: 'center', color: '#9ca3af', background: '#f3f4f6', borderRadius: '4px', padding: '4px 0', fontSize: '9px', fontStyle: 'italic' }}>
                          No Website
                        </span>
                      )}
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${getCollegeCoords(selectedCollegeMarker).lat},${getCollegeCoords(selectedCollegeMarker).lng}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ flex: 1, textAlign: 'center', border: '1px solid #ddd', borderRadius: '4px', padding: '4px 0', color: '#4b5563', textDecoration: 'none', fontWeight: 600, fontSize: '9px' }}
                      >
                        Open Maps
                      </a>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>
      </div>
    </div>
  );
}
