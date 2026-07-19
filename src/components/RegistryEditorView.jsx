import React from 'react';
import { 
  Building2, 
  Search, 
  Database, 
  GraduationCap, 
  Save, 
  Loader2, 
  Check, 
  AlertTriangle,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';

export default function RegistryEditorView({
  colleges,
  selectedAdminCollege,
  handleSelectAdminCollege,
  adminSearchText,
  setAdminSearchText,
  adminTab,
  setAdminTab,
  adminCourses,
  loadingAdminCourses,
  editingCourse,
  isAddingCourse,
  courseForm,
  setCourseForm,
  courseSaveStatus,
  courseSaveMessage,
  handleAddCourseClick,
  handleEditCourseClick,
  handleCourseSave,
  handleCourseDelete,
  formState,
  setFormState,
  isSaving,
  saveStatus,
  saveMessage,
  handleSave,
  naacGrades,
  hostelFacilities,
  getNaacBadgeClass,
  uniqueCourseNames
}) {
  return (
    <div>
      <div className="mb-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registry Editor</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Select a college to edit its NAAC, NIRF, contact, and affiliation data.</p>
        </div>
        {selectedAdminCollege && adminTab === 'courses' && !isAddingCourse && !editingCourse && (
          <button 
            type="button" 
            onClick={handleAddCourseClick} 
            className="btn-primary flex items-center justify-center gap-1.5 self-start sm:self-auto" 
            style={{ padding: '0.45rem 1rem', fontSize: '0.72rem' }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Course
          </button>
        )}
      </div>
      <div className="admin-panel">
        {/* College List */}
        <div className="panel-card" style={{ maxHeight: 700, display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: '0 0 0.625rem' }}>Select College to Edit</p>
            <div className="filter-search-wrap">
              <Search className="filter-search-icon" />
              <input 
                type="text" 
                placeholder="Search by name..." 
                value={adminSearchText} 
                onChange={e => setAdminSearchText(e.target.value)} 
                className="filter-input dark:bg-slate-800 dark:border-slate-700" 
                style={{ width: '100%' }} 
              />
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {colleges.filter(c => c.college_name.toLowerCase().includes(adminSearchText.toLowerCase())).map(college => {
              const isSel = selectedAdminCollege?.college_id === college.college_id;
              return (
                <button 
                  key={college.college_id} 
                  type="button" 
                  onClick={() => handleSelectAdminCollege(college)} 
                  style={{ width: '100%', textAlign: 'left', padding: '0.625rem 1rem', background: isSel ? 'var(--accent-light)' : 'transparent', borderLeft: isSel ? '3px solid #7C3AED' : '3px solid transparent', border: 'none', borderBottom: '1px solid var(--card-border)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
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
                          <input type={field.type} value={formState[field.key]} onChange={e => setFormState({ ...formState, [field.key]: e.target.value })} className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs" />
                        </div>
                      ))}
                      <div>
                        <label className="form-label">NAAC Grade</label>
                        <select value={formState.naac_grade} onChange={e => setFormState({ ...formState, naac_grade: e.target.value })} className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs">
                          {naacGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Autonomous Status</label>
                        <select value={formState.autonomous} onChange={e => setFormState({ ...formState, autonomous: e.target.value })} className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs">
                          {['Yes', 'No', 'Unknown'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">NIRF Rank (numeric)</label>
                        <input type="number" value={formState.nirf_rank} onChange={e => setFormState({ ...formState, nirf_rank: e.target.value })} className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs" placeholder="e.g. 45" />
                      </div>
                      <div>
                        <label className="form-label">NIRF Rank (raw text)</label>
                        <input type="text" value={formState.nirf_rank_raw} onChange={e => setFormState({ ...formState, nirf_rank_raw: e.target.value })} className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs" placeholder="e.g. #45" />
                      </div>
                      <div>
                        <label className="form-label">University Category</label>
                        <input type="text" value={formState.university_category} onChange={e => setFormState({ ...formState, university_category: e.target.value })} className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs" />
                      </div>
                      <div>
                        <label className="form-label">Hostel Facility</label>
                        <select value={formState.hostel_facility} onChange={e => setFormState({ ...formState, hostel_facility: e.target.value })} className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs">
                          {hostelFacilities.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      
                      {/* Added new fields to Registry Editor */}
                      <div>
                        <label className="form-label">Ownership</label>
                        <select value={formState.ownership || 'Private'} onChange={e => setFormState({ ...formState, ownership: e.target.value })} className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs">
                          <option value="Private">Private</option>
                          <option value="Government">Government</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Google Maps Rating (1.0 - 5.0)</label>
                        <input type="number" step="0.1" value={formState.google_rating || '4.0'} onChange={e => setFormState({ ...formState, google_rating: e.target.value })} className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs" />
                      </div>
                      <div>
                        <label className="form-label">Latitude</label>
                        <input type="number" step="0.000001" value={formState.latitude || ''} onChange={e => setFormState({ ...formState, latitude: e.target.value })} className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs" placeholder="e.g. 13.0827" />
                      </div>
                      <div>
                        <label className="form-label">Longitude</label>
                        <input type="number" step="0.000001" value={formState.longitude || ''} onChange={e => setFormState({ ...formState, longitude: e.target.value })} className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs" placeholder="e.g. 80.2707" />
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid var(--card-border)', background: 'var(--page-bg)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
                    <button type="button" onClick={() => handleSelectAdminCollege(selectedAdminCollege)} disabled={isSaving} className="btn-ghost text-xs">Discard Edits</button>
                    <button type="submit" disabled={isSaving} className="btn-primary text-xs">
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
                            className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs" 
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
                            className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs"
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
                            className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs"
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
                            className="form-input dark:bg-slate-800 dark:border-slate-700 text-xs" 
                            required 
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--card-border)', paddingTop: '0.875rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button type="button" onClick={() => { setIsAddingCourse(false); setEditingCourse(null); }} className="btn-ghost text-xs">Cancel</button>
                        <button type="submit" className="btn-primary text-xs">
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
  );
}
