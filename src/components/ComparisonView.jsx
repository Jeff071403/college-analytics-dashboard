import React, { useState } from 'react';
import { Award, ArrowLeftRight, Check, X, Info, Download } from 'lucide-react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { downloadChartAsPng } from '../utils/chartExport';

export default function ComparisonView({ colleges }) {
  const [col1Id, setCol1Id] = useState('');
  const [col2Id, setCol2Id] = useState('');
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [showList1, setShowList1] = useState(false);
  const [showList2, setShowList2] = useState(false);

  const college1 = colleges.find(c => String(c.college_id) === String(col1Id));
  const college2 = colleges.find(c => String(c.college_id) === String(col2Id));

  // Dropdown filtering
  const filteredColleges1 = colleges.filter(c => 
    c.college_name.toLowerCase().includes(search1.toLowerCase())
  ).slice(0, 8);

  const filteredColleges2 = colleges.filter(c => 
    c.college_name.toLowerCase().includes(search2.toLowerCase())
  ).slice(0, 8);

  // NAAC Scoring
  const getNaacScore = (grade) => {
    const scores = { 'A++': 9, 'A+': 8, 'A': 7, 'B++': 6, 'B+': 5, 'B': 4, 'C': 3, 'D': 2 };
    return scores[grade] || 0;
  };

  // NIRF Score (Higher is better score)
  const getNirfScore = (rank) => {
    if (!rank) return 0;
    return Math.max(0, 201 - rank); // Assuming max rank is 200
  };

  // Highlight color helper
  const getHighlightClass = (val1, val2, isBetter, isRank = false) => {
    if (!val1 && !val2) return 'bg-red-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200';
    if (!val1) return 'bg-red-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200';
    if (!val2) return 'bg-red-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200';
    
    if (val1 === val2) return 'bg-yellow-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200';
    
    if (isBetter) {
      return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200';
    }
    return '';
  };

  // Build chart datasets
  let radarChartData = [];
  let barChartData = [];
  if (college1 && college2) {
    radarChartData = [
      {
        subject: 'NAAC Accreditation',
        A: getNaacScore(college1.naac_grade) * 11, // Scale to 0-100
        B: getNaacScore(college2.naac_grade) * 11,
        fullMark: 100
      },
      {
        subject: 'NIRF Rank Score',
        A: getNirfScore(college1.nirf_rank) ? Math.round((getNirfScore(college1.nirf_rank) / 200) * 100) : 0,
        B: getNirfScore(college2.nirf_rank) ? Math.round((getNirfScore(college2.nirf_rank) / 200) * 100) : 0,
        fullMark: 100
      },
      {
        subject: 'Google Rating',
        A: (college1.google_rating || 0) * 20, // Scale to 0-100
        B: (college2.google_rating || 0) * 20,
        fullMark: 100
      },
      {
        subject: 'Placement Rating',
        A: (parseFloat(college1.placement_score) || 0) * 10, // Scale 0-10 to 100
        B: (parseFloat(college2.placement_score) || 0) * 10,
        fullMark: 100
      },
      {
        subject: 'Hostel Facility',
        A: college1.hostel_facility && college1.hostel_facility !== 'No Hostel Found' ? 100 : 0,
        B: college2.hostel_facility && college2.hostel_facility !== 'No Hostel Found' ? 100 : 0,
        fullMark: 100
      },
      {
        subject: 'Course Count',
        A: Math.min(100, (college1.course_count || 0) * 2), // Cap at 50 courses for score
        B: Math.min(100, (college2.course_count || 0) * 2),
        fullMark: 100
      }
    ];

    barChartData = [
      {
        name: 'Google Rating',
        [college1.college_name]: college1.google_rating || 0,
        [college2.college_name]: college2.google_rating || 0
      },
      {
        name: 'Placement Score',
        [college1.college_name]: parseFloat(college1.placement_score) || 0,
        [college2.college_name]: parseFloat(college2.placement_score) || 0
      },
      {
        name: 'NAAC Tier (1-10)',
        [college1.college_name]: getNaacScore(college1.naac_grade),
        [college2.college_name]: getNaacScore(college2.naac_grade)
      }
    ];
  }

  // Automatic Insight Generator
  const generateInsights = () => {
    if (!college1 || !college2) return [];
    const insights = [];

    // NAAC comparison
    const score1 = getNaacScore(college1.naac_grade);
    const score2 = getNaacScore(college2.naac_grade);
    if (score1 > score2) {
      insights.push(`<strong>${college1.college_name}</strong> has a higher NAAC accreditation grade (${college1.naac_grade}) compared to <strong>${college2.college_name}</strong> (${college2.naac_grade}).`);
    } else if (score2 > score1) {
      insights.push(`<strong>${college2.college_name}</strong> has a higher NAAC accreditation grade (${college2.naac_grade}) compared to <strong>${college1.college_name}</strong> (${college1.naac_grade}).`);
    } else {
      insights.push(`Both colleges have the same NAAC accreditation grade (${college1.naac_grade}).`);
    }

    // NIRF comparison
    if (college1.nirf_rank && college2.nirf_rank) {
      if (college1.nirf_rank < college2.nirf_rank) {
        insights.push(`<strong>${college1.college_name}</strong> holds a better NIRF rank (${college1.nirf_rank_raw}) compared to <strong>${college2.college_name}</strong> (${college2.nirf_rank_raw}).`);
      } else if (college2.nirf_rank < college1.nirf_rank) {
        insights.push(`<strong>${college2.college_name}</strong> holds a better NIRF rank (${college2.nirf_rank_raw}) compared to <strong>${college1.college_name}</strong> (${college1.nirf_rank_raw}).`);
      } else {
        insights.push(`Both colleges share the same NIRF ranking.`);
      }
    } else if (college1.nirf_rank) {
      insights.push(`Only <strong>${college1.college_name}</strong> is NIRF ranked (${college1.nirf_rank_raw}).`);
    } else if (college2.nirf_rank) {
      insights.push(`Only <strong>${college2.college_name}</strong> is NIRF ranked (${college2.nirf_rank_raw}).`);
    } else {
      insights.push(`Neither college is currently ranked in the NIRF database.`);
    }

    // University comparison
    const u1 = (college1.university_category || '').split('(')[0].trim();
    const u2 = (college2.university_category || '').split('(')[0].trim();
    if (u1 === u2) {
      insights.push(`Both colleges are affiliated with the same university: <strong>${u1}</strong>.`);
    } else {
      insights.push(`They belong to different affiliations: <strong>${college1.college_name}</strong> is under ${u1}, while <strong>${college2.college_name}</strong> is under ${u2}.`);
    }

    // Google rating
    const r1 = college1.google_rating || 0;
    const r2 = college2.google_rating || 0;
    if (r1 > r2) {
      insights.push(`<strong>${college1.college_name}</strong> has a higher student/visitor Google rating (${r1}★) than <strong>${college2.college_name}</strong> (${r2}★).`);
    } else if (r2 > r1) {
      insights.push(`<strong>${college2.college_name}</strong> has a higher student/visitor Google rating (${r2}★) than <strong>${college1.college_name}</strong> (${r1}★).`);
    }

    // Placement score comparison
    const p1 = parseFloat(college1.placement_score) || 0;
    const p2 = parseFloat(college2.placement_score) || 0;
    if (p1 > p2) {
      insights.push(`<strong>${college1.college_name}</strong> has a higher Estimated Placement Score (${p1}/10) compared to <strong>${college2.college_name}</strong> (${p2}/10).`);
    } else if (p2 > p1) {
      insights.push(`<strong>${college2.college_name}</strong> has a higher Estimated Placement Score (${p2}/10) compared to <strong>${college1.college_name}</strong> (${p1}/10).`);
    } else if (p1 > 0) {
      insights.push(`Both colleges have the same Estimated Placement Score (${p1}/10).`);
    }

    // Co-Ed comparison
    const g1 = college1.co_ed || 'Co-ed';
    const g2 = college2.co_ed || 'Co-ed';
    if (g1 === g2) {
      insights.push(`Both are <strong>${g1}</strong> institutions.`);
    } else {
      insights.push(`<strong>${college1.college_name}</strong> is a <strong>${g1}</strong> institution, whereas <strong>${college2.college_name}</strong> is <strong>${g2}</strong>.`);
    }

    // Bus facility comparison
    const b1 = college1.bus_facility || 'No';
    const b2 = college2.bus_facility || 'No';
    if (b1 === 'Yes' && b2 === 'Yes') {
      insights.push(`Both institutions offer transit bus facilities.`);
    } else if (b1 === 'Yes') {
      insights.push(`Only <strong>${college1.college_name}</strong> lists transit bus facilities.`);
    } else if (b2 === 'Yes') {
      insights.push(`Only <strong>${college2.college_name}</strong> lists transit bus facilities.`);
    }

    // Website availability
    const w1 = college1.website && college1.website.trim() !== '';
    const w2 = college2.website && college2.website.trim() !== '';
    if (w1 && !w2) {
      insights.push(`Only <strong>${college1.college_name}</strong> has an official website portal listed.`);
    } else if (w2 && !w1) {
      insights.push(`Only <strong>${college2.college_name}</strong> has an official website portal listed.`);
    }

    // Ownership status
    if (college1.ownership !== college2.ownership) {
      insights.push(`<strong>${college1.college_name}</strong> is a ${college1.ownership} institution, whereas <strong>${college2.college_name}</strong> is ${college2.ownership}.`);
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">College Comparison</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Select any two colleges to run side-by-side rankings, ratings, and course offering audits</p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        {/* Dropdown 1 */}
        <div className="relative">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">Select College A</label>
          <input
            type="text"
            placeholder="Search and select college..."
            value={college1 ? college1.college_name : search1}
            onChange={(e) => {
              setSearch1(e.target.value);
              if (college1) {
                setCol1Id('');
              }
              setShowList1(true);
            }}
            onFocus={() => setShowList1(true)}
            className="form-input text-xs dark:bg-slate-800 dark:border-slate-700"
          />
          {college1 && (
            <button 
              onClick={() => { setCol1Id(''); setSearch1(''); }}
              className="absolute right-2 top-6 text-gray-400 hover:text-rose-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {showList1 && !college1 && (
            <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto">
              {filteredColleges1.map(c => (
                <button
                  key={c.college_id}
                  onClick={() => {
                    setCol1Id(c.college_id);
                    setShowList1(false);
                  }}
                  className="w-100 text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border-b border-gray-100 dark:border-slate-800 last:border-b-0 text-gray-800 dark:text-gray-200 block"
                >
                  {c.college_name}
                </button>
              ))}
              {filteredColleges1.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-400 italic">No colleges found</div>
              )}
            </div>
          )}
        </div>

        {/* Dropdown 2 */}
        <div className="relative">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">Select College B</label>
          <input
            type="text"
            placeholder="Search and select college..."
            value={college2 ? college2.college_name : search2}
            onChange={(e) => {
              setSearch2(e.target.value);
              if (college2) {
                setCol2Id('');
              }
              setShowList2(true);
            }}
            onFocus={() => setShowList2(true)}
            className="form-input text-xs dark:bg-slate-800 dark:border-slate-700"
          />
          {college2 && (
            <button 
              onClick={() => { setCol2Id(''); setSearch2(''); }}
              className="absolute right-2 top-6 text-gray-400 hover:text-rose-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {showList2 && !college2 && (
            <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto">
              {filteredColleges2.map(c => (
                <button
                  key={c.college_id}
                  onClick={() => {
                    setCol2Id(c.college_id);
                    setShowList2(false);
                  }}
                  className="w-100 text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border-b border-gray-100 dark:border-slate-800 last:border-b-0 text-gray-800 dark:text-gray-200 block"
                >
                  {c.college_name}
                </button>
              ))}
              {filteredColleges2.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-400 italic">No colleges found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {college1 && college2 ? (
        <div className="space-y-6">
          {/* Side by Side Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border-l-4 border-l-indigo-500 border border-gray-100 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">College A</span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{college1.college_name}</h3>
              <p className="text-xs text-gray-500">{college1.university_category} · {college1.location_normalized}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border-l-4 border-l-sky-500 border border-gray-100 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">College B</span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{college2.college_name}</h3>
              <p className="text-xs text-gray-500">{college2.university_category} · {college2.location_normalized}</p>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Metric Breakdown Table</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-100 border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 font-semibold border-b border-gray-100 dark:border-slate-800 text-left">
                    <th className="p-3">Attribute</th>
                    <th className="p-3">{college1.college_name}</th>
                    <th className="p-3">{college2.college_name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-600 dark:text-gray-300">
                  {/* Category */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">Category</td>
                    <td className={`p-3 ${getHighlightClass(college1.college_category, college2.college_category, true)}`}>{college1.college_category}</td>
                    <td className={`p-3 ${getHighlightClass(college2.college_category, college1.college_category, true)}`}>{college2.college_category}</td>
                  </tr>
                  {/* Ownership */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">Ownership</td>
                    <td className="p-3">{college1.ownership}</td>
                    <td className="p-3">{college2.ownership}</td>
                  </tr>
                  {/* University Category */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">University Affiliation</td>
                    <td className={`p-3 ${getHighlightClass(college1.university_category, college2.university_category, true)}`}>{college1.university_category}</td>
                    <td className={`p-3 ${getHighlightClass(college2.university_category, college1.university_category, true)}`}>{college2.university_category}</td>
                  </tr>
                  {/* NAAC Grade */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">NAAC Grade</td>
                    <td className={`p-3 font-bold ${getHighlightClass(getNaacScore(college1.naac_grade), getNaacScore(college2.naac_grade), getNaacScore(college1.naac_grade) > getNaacScore(college2.naac_grade))}`}>
                      {college1.naac_grade}
                    </td>
                    <td className={`p-3 font-bold ${getHighlightClass(getNaacScore(college2.naac_grade), getNaacScore(college1.naac_grade), getNaacScore(college2.naac_grade) > getNaacScore(college1.naac_grade))}`}>
                      {college2.naac_grade}
                    </td>
                  </tr>
                  {/* NIRF Rank */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">NIRF Rank</td>
                    <td className={`p-3 font-bold ${getHighlightClass(getNirfScore(college1.nirf_rank), getNirfScore(college2.nirf_rank), getNirfScore(college1.nirf_rank) > getNirfScore(college2.nirf_rank))}`}>
                      {college1.nirf_rank_raw}
                    </td>
                    <td className={`p-3 font-bold ${getHighlightClass(getNirfScore(college2.nirf_rank), getNirfScore(college1.nirf_rank), getNirfScore(college2.nirf_rank) > getNirfScore(college1.nirf_rank))}`}>
                      {college2.nirf_rank_raw}
                    </td>
                  </tr>
                  {/* Google Rating */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">Google Rating</td>
                    <td className={`p-3 font-bold ${getHighlightClass(college1.google_rating, college2.google_rating, (college1.google_rating || 0) > (college2.google_rating || 0))}`}>
                      {college1.google_rating ? `${college1.google_rating} ★` : 'Not Rated'}
                    </td>
                    <td className={`p-3 font-bold ${getHighlightClass(college2.google_rating, college1.google_rating, (college2.google_rating || 0) > (college1.google_rating || 0))}`}>
                      {college2.google_rating ? `${college2.google_rating} ★` : 'Not Rated'}
                    </td>
                  </tr>
                  {/* Website */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">Website</td>
                    <td className={`p-3 ${getHighlightClass(college1.website, college2.website, !!college1.website)}`}>
                      {college1.website ? (
                        <a href={college1.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{college1.website}</a>
                      ) : (
                        'Website Not Available'
                      )}
                    </td>
                    <td className={`p-3 ${getHighlightClass(college2.website, college1.website, !!college2.website)}`}>
                      {college2.website ? (
                        <a href={college2.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{college2.website}</a>
                      ) : (
                        'Website Not Available'
                      )}
                    </td>
                  </tr>
                  {/* Contact Info */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">Contact Info</td>
                    <td className="p-3">
                      Email: {college1.email || 'Not Available'}<br/>
                      Phone: {college1.phone || 'Not Available'}
                    </td>
                    <td className="p-3">
                      Email: {college2.email || 'Not Available'}<br/>
                      Phone: {college2.phone || 'Not Available'}
                    </td>
                  </tr>
                   {/* Hostel */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">Hostel Facility</td>
                    <td className="p-3">{college1.hostel_facility}</td>
                    <td className="p-3">{college2.hostel_facility}</td>
                  </tr>
                  {/* Co-Ed Status */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">Gender Policy</td>
                    <td className="p-3">{college1.co_ed || 'Co-ed'}</td>
                    <td className="p-3">{college2.co_ed || 'Co-ed'}</td>
                  </tr>
                  {/* Bus Facility */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">Bus Facility</td>
                    <td className={`p-3 ${getHighlightClass(college1.bus_facility, college2.bus_facility, college1.bus_facility === 'Yes')}`}>{college1.bus_facility || 'No'}</td>
                    <td className={`p-3 ${getHighlightClass(college2.bus_facility, college1.bus_facility, college2.bus_facility === 'Yes')}`}>{college2.bus_facility || 'No'}</td>
                  </tr>
                  {/* UGC Recognized */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">UGC Recognized</td>
                    <td className={`p-3 ${getHighlightClass(college1.ugc_recognized, college2.ugc_recognized, college1.ugc_recognized === 'Yes')}`}>{college1.ugc_recognized || 'No'}</td>
                    <td className={`p-3 ${getHighlightClass(college2.ugc_recognized, college1.ugc_recognized, college2.ugc_recognized === 'Yes')}`}>{college2.ugc_recognized || 'No'}</td>
                  </tr>
                  {/* Placement Score */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">Estimated Placement Score</td>
                    <td className={`p-3 font-bold ${getHighlightClass(parseFloat(college1.placement_score) || 0, parseFloat(college2.placement_score) || 0, (parseFloat(college1.placement_score) || 0) > (parseFloat(college2.placement_score) || 0))}`}>
                      {college1.placement_score !== undefined ? `${college1.placement_score} / 10` : '0.0 / 10'}
                    </td>
                    <td className={`p-3 font-bold ${getHighlightClass(parseFloat(college2.placement_score) || 0, parseFloat(college1.placement_score) || 0, (parseFloat(college2.placement_score) || 0) > (parseFloat(college1.placement_score) || 0))}`}>
                      {college2.placement_score !== undefined ? `${college2.placement_score} / 10` : '0.0 / 10'}
                    </td>
                  </tr>
                  {/* Courses Count */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">Courses Offered</td>
                    <td className={`p-3 ${getHighlightClass(college1.course_count, college2.course_count, (college1.course_count || 0) > (college2.course_count || 0))}`}>{college1.course_count} Courses</td>
                    <td className={`p-3 ${getHighlightClass(college2.course_count, college1.course_count, (college2.course_count || 0) > (college1.course_count || 0))}`}>{college2.course_count} Courses</td>
                  </tr>
                  {/* Region */}
                  <tr>
                    <td className="p-3 font-semibold bg-gray-50/30 dark:bg-slate-800/10">Region Location</td>
                    <td className="p-3">{college1.location_normalized}</td>
                    <td className="p-3">{college2.location_normalized}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights Summary */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <Info className="w-4 h-4" /> Automated Insight Summary
            </h4>
            <ul className="list-disc list-inside space-y-2 text-xs text-gray-600 dark:text-gray-300">
              {insights.map((insight, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: insight }} />
              ))}
            </ul>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4" id="comp-radar">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Metric Comparison Radar</h4>
                <button 
                  onClick={() => downloadChartAsPng('comp-radar', 'comparison_radar.png')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                    <PolarGrid stroke="var(--card-border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                    <Radar name={college1.college_name} dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.4} />
                    <Radar name={college2.college_name} dataKey="B" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.4} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4" id="comp-bar">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Ratings & Accreditation Score Comparison</h4>
                <button 
                  onClick={() => downloadChartAsPng('comp-bar', 'comparison_bar.png')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, bottom: 5, right: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                    <Bar dataKey={college1.college_name} fill="#6366F1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={college2.college_name} fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-8 text-center text-gray-400 text-xs italic">
          Please select both colleges from the dropdown menus to generate side-by-side analytical comparisons, charts, and insights.
        </div>
      )}
    </div>
  );
}
