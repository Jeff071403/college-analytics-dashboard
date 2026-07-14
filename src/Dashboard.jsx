import React from 'react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome to your analytics dashboard</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: 'Weekly Sales', value: '$15,0000', change: '+60%', color: 'from-orange-400 to-red-400' },
            { title: 'Weekly Orders', value: '45,6334', change: '-10%', color: 'from-blue-400 to-blue-600' },
            { title: 'Visitors Online', value: '95,5741', change: '+5%', color: 'from-teal-400 to-teal-600' }
          ].map((stat, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 text-white shadow-lg`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg">{stat.title}</h3>
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-3xl font-bold mb-2">{stat.value}</div>
              <div className="text-sm opacity-90">{stat.change === '-10%' ? 'Decreased' : 'Increased'} by {Math.abs(parseInt(stat.change))}%</div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Visit and Sales Statistics</h2>
            <div className="flex items-end justify-around h-64 border-b-2 border-gray-200 pb-4">
              {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG'].map((month, idx) => {
                const height = [40, 70, 60, 55, 50, 75, 45, 65][idx];
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="w-12 bg-purple-500 rounded-t" style={{ height: `${height * 2}px` }}></div>
                    <span className="text-xs text-gray-600 mt-2">{month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h2>
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#06B6D4" strokeWidth="12" strokeDasharray="75 100" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#0D9488" strokeWidth="12" strokeDasharray="75 100" strokeDashoffset="-75" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#EC4899" strokeWidth="12" strokeDasharray="50 100" strokeDashoffset="-150" />
                  <circle cx="50" cy="50" r="25" fill="white" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Search Engines', pct: '30%', color: 'bg-cyan-400' },
                { label: 'Direct Click', pct: '30%', color: 'bg-teal-600' },
                { label: 'Bookmarks', pct: '40%', color: 'bg-pink-400' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
