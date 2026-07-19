import React from 'react';
import { Award, Info, ShieldCheck, Mail, MapPin, BookOpen, Layers, Cpu } from 'lucide-react';

export default function AboutView() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">About the Portal</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Institutional analytics registry information and developer profiles</p>
      </div>

      {/* About Section */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Info className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">College Analytics Portal</h3>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          The College Analytics Portal is a comprehensive data analytics platform developed to help students, parents, researchers, and educational institutions analyze and compare colleges.
        </p>

        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          The portal provides college information, rankings, analytics, comparison tools, interactive maps, and other useful insights to support informed decision-making. By consolidating NAAC accreditations, NIRF rankings, and course databases, it offers an administrative registry alongside rich visualizations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] text-gray-500">Verified NAAC Tiers</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] text-gray-500">NIRF National Standings</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-rose-500" />
            <span className="text-[11px] text-gray-500">Academic Decision Support</span>
          </div>
        </div>
      </div>

      {/* Developed By Section */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-purple-600 dark:text-purple-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Developed By</h3>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">MCC-MRF Innovation Park</h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            MCC-MRF Innovation Park is a collaborative innovation and research center established to promote technology-driven solutions, research, product development, and industry-academia collaboration. The center encourages students and developers to build innovative software solutions that solve real-world problems using modern technologies.
          </p>
        </div>
      </div>

      {/* Developers Card Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Project Development Team</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  DP
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Developer</h4>
                  <span className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider block">Full Stack Developer</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Organization:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">MCC-MRF Innovation Park</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Role:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Full Stack Developer</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-slate-800 pt-3 mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" /> Technologies Used
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Python', 'Flask/Django (existing framework)', 'SQL', 'Bootstrap', 'JavaScript', 
                  'Chart.js', 'Leaflet', 'HTML', 'CSS'
                ].map(tech => (
                  <span key={tech} className="px-2 py-0.5 bg-gray-50 border border-gray-150 dark:bg-slate-800 dark:border-slate-700 rounded-full text-[9px] font-mono font-medium text-gray-600 dark:text-gray-300">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Support footer */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-xl p-6 space-y-4">
        <h3 className="text-xs font-bold tracking-wide uppercase opacity-90 flex items-center gap-1.5">
          <Mail className="w-4 h-4" /> Support & Contact Info
        </h3>
        
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-indigo-300" />
            <span>MCC-MRF Innovation Park, Chennai, Tamil Nadu, India</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-indigo-300" />
            <a href="mailto:support@mccinnovationpark.org" className="hover:underline">support@mccinnovationpark.org</a>
          </div>
        </div>
      </div>
    </div>
  );
}
