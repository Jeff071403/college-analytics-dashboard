import React, { useState } from 'react';
import { Plus, Save, Loader2, Check, AlertTriangle } from 'lucide-react';

export default function AddCollegeView({ onCollegeAdded, categories, locations, naacGrades, universityCategories, hostelFacilities }) {
  const defaultForm = {
    college_name: '',
    college_category: 'Arts & Science',
    location_raw: '',
    location_normalized: 'Chennai',
    website: '',
    email: '',
    phone: '',
    naac_grade: 'Not Listed',
    principal_name: '',
    autonomous: 'No',
    university_category: 'Unknown',
    hostel_facility: 'No Hostel Found',
    nirf_rank_raw: 'Not Ranked',
    ownership: 'Private',
    google_rating: '4.0',
    latitude: '',
    longitude: ''
  };

  const [formState, setFormState] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    setSaveMessage('');

    fetch('/api/colleges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formState)
    })
      .then(res => res.json())
      .then(res => {
        setIsSaving(false);
        if (res.status === 'success') {
          setSaveStatus('success');
          setSaveMessage('New college record added successfully!');
          setFormState(defaultForm); // Reset form
          if (onCollegeAdded) {
            onCollegeAdded(res.data);
          }
        } else {
          setSaveStatus('error');
          setSaveMessage(res.message || 'Failed to add college details');
        }
      })
      .catch(err => {
        setIsSaving(false);
        setSaveStatus('error');
        setSaveMessage(err.message || 'Network error occurred while saving.');
      });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add College</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Add a new college record into the central registry database</p>
        </div>
        {saveStatus === 'success' && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> {saveMessage}
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {saveMessage}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">College Name *</label>
            <input 
              type="text" 
              required 
              value={formState.college_name} 
              onChange={e => setFormState({ ...formState, college_name: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700" 
              placeholder="e.g. Presidency College"
            />
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">College Category</label>
            <select 
              value={formState.college_category} 
              onChange={e => setFormState({ ...formState, college_category: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Ownership</label>
            <select 
              value={formState.ownership} 
              onChange={e => setFormState({ ...formState, ownership: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700"
            >
              <option value="Private">Private (Self-financing / Aided)</option>
              <option value="Government">Government (State / Central)</option>
            </select>
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Location (Raw)</label>
            <input 
              type="text" 
              value={formState.location_raw} 
              onChange={e => setFormState({ ...formState, location_raw: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700" 
              placeholder="e.g. Kamarajar Salai, Triplicane, Chennai"
            />
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Location (Normalized Region)</label>
            <select 
              value={formState.location_normalized} 
              onChange={e => setFormState({ ...formState, location_normalized: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700"
            >
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Official Website</label>
            <input 
              type="url" 
              value={formState.website} 
              onChange={e => setFormState({ ...formState, website: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700" 
              placeholder="e.g. https://www.presidency.edu.in"
            />
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Principal Name</label>
            <input 
              type="text" 
              value={formState.principal_name} 
              onChange={e => setFormState({ ...formState, principal_name: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700" 
              placeholder="e.g. Dr. R. Raman"
            />
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Email</label>
            <input 
              type="email" 
              value={formState.email} 
              onChange={e => setFormState({ ...formState, email: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700" 
              placeholder="e.g. contact@presidency.edu.in"
            />
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Phone</label>
            <input 
              type="text" 
              value={formState.phone} 
              onChange={e => setFormState({ ...formState, phone: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700" 
              placeholder="e.g. 044-28440699"
            />
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">NAAC Grade</label>
            <select 
              value={formState.naac_grade} 
              onChange={e => setFormState({ ...formState, naac_grade: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700"
            >
              {naacGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Autonomous status</label>
            <select 
              value={formState.autonomous} 
              onChange={e => setFormState({ ...formState, autonomous: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">NIRF Ranking (e.g. "Not Ranked" or "#45")</label>
            <input 
              type="text" 
              value={formState.nirf_rank_raw} 
              onChange={e => setFormState({ ...formState, nirf_rank_raw: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700" 
              placeholder="e.g. #45 or Not Ranked"
            />
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Google Maps Rating (1.0 to 5.0)</label>
            <input 
              type="number" 
              step="0.1" 
              min="1" 
              max="5"
              value={formState.google_rating} 
              onChange={e => setFormState({ ...formState, google_rating: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700" 
              placeholder="e.g. 4.3"
            />
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Hostel Facility</label>
            <select 
              value={formState.hostel_facility} 
              onChange={e => setFormState({ ...formState, hostel_facility: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700"
            >
              {hostelFacilities.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Affiliating University Category</label>
            <input 
              type="text" 
              list="add-univ-cats"
              value={formState.university_category} 
              onChange={e => setFormState({ ...formState, university_category: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700" 
              placeholder="e.g. University of Madras (Affiliated)"
            />
            <datalist id="add-univ-cats">
              {universityCategories.map(u => <option key={u} value={u} />)}
            </datalist>
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Latitude (optional - left blank for geocoder)</label>
            <input 
              type="number" 
              step="0.000001" 
              value={formState.latitude} 
              onChange={e => setFormState({ ...formState, latitude: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700" 
              placeholder="e.g. 13.06412"
            />
          </div>

          <div>
            <label className="form-label text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Longitude (optional - left blank for geocoder)</label>
            <input 
              type="number" 
              step="0.000001" 
              value={formState.longitude} 
              onChange={e => setFormState({ ...formState, longitude: e.target.value })} 
              className="form-input text-xs dark:bg-slate-800 dark:border-slate-700" 
              placeholder="e.g. 80.28103"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-slate-800 pt-4 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => setFormState(defaultForm)} 
            className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Clear Form
          </button>
          <button 
            type="submit" 
            disabled={isSaving} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60 transition"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Add College Record
          </button>
        </div>
      </form>
    </div>
  );
}
