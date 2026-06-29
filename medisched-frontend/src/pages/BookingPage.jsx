// ── New Booking Page ──────────────────────────────────────────────────────────
// This replaces the BookModal triggered from hospital department page.
// Instead of using fake doctor IDs from hospital data,
// it loads REAL registered doctors from the database.
// Add this as a new tab "📅 Book" in PatientApp.jsx

import { useState, useEffect } from 'react'
import API from '../api'

const C = {
  bg: '#FDF6F0', card: '#FFF8F4', accent: '#C4704F',
  accentLight: '#F0C9B4', accentDark: '#8B4A33',
  text: '#3D2B1F', muted: '#8C6B5A', border: '#E8D5C8',
  success: '#2E6E35', successBg: '#DFF0E0',
  danger: '#B44040', dangerBg: '#FDDCDC',
  headerBg: '#FAEEE7'
}

const inp = {
  padding: '10px 14px', borderRadius: 8,
  border: `1.5px solid ${C.border}`, fontSize: 14,
  background: '#fff', color: C.text, outline: 'none',
  width: '100%', boxSizing: 'border-box', marginBottom: 12,
  fontFamily: 'Georgia, serif'
}

const btn = (v = 'primary', size = 'md') => {
  const sizes = { sm: { padding: '6px 14px', fontSize: 12 }, md: { padding: '10px 20px', fontSize: 14 } }
  const variants = {
    primary: { background: C.accent, color: '#fff', border: 'none' },
    ghost:   { background: 'transparent', color: C.accent, border: `1.5px solid ${C.accent}` },
  }
  return { borderRadius: 8, cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 600, ...sizes[size], ...variants[v] }
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

function today() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().split('T')[0]
}

export default function BookingPage({ user, patients, onBooked, showToast }) {
  const [doctors, setDoctors]     = useState([])
  const [selDoc, setSelDoc]       = useState(null)
  const [selPat, setSelPat]       = useState(patients[0]?._id || '')
  const [date, setDate] = useState(today)
  const [time, setTime]           = useState('09:00')
  const [note, setNote]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [fetching, setFetching]   = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')

  useEffect(() => {
    loadDoctors()
  }, [])

  const loadDoctors = async () => {
    setFetching(true)
    try {
      const res = await API.get('/appointments/registered-doctors')
      setDoctors(res.data)
    } catch (e) {
      console.error(e)
    }
    setFetching(false)
  }

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.department.toLowerCase().includes(search.toLowerCase()) ||
    d.hospital_name.toLowerCase().includes(search.toLowerCase())
  )

  const book = async () => {
    if (!selDoc)  { setError('Select a doctor');  return }
    if (!selPat)  { setError('Select a patient'); return }
    if (!date)    { setError('Select a date');    return }
    setLoading(true)
    setError('')
    try {
      const patient = patients.find(p => p._id === selPat)
      const res = await API.post('/appointments/book', {
        doctor_user_id:    selDoc.user_id,
        patient_id:        selPat,
        booked_by_user_id: user.id,
        appointment_date:  date,
        appointment_time:  time,
        notes:             note,
        hospital_name:     selDoc.hospital_name,
        dept_name:         selDoc.department,
        doctor_name:       selDoc.name,
        patientName:       patient?.name  || '',
        patientAge:        patient?.age   || ''
      })
      showToast(`✅ Booked! Token: ${res.data.token_number}. Check your email.`)
      setSelDoc(null)
      setDate(today())
      setNote('')
      onBooked()
    } catch (e) {
      setError(e.response?.data?.detail || 'Booking failed')
    }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 17, color: C.accentDark, marginBottom: 14 }}>
        Book Appointment
      </div>

      {/* Doctor search */}
      {!selDoc && (
        <>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <span style={{ position: 'absolute', left: 12, top: 11, color: C.muted }}>🔍</span>
            <input style={{ ...inp, paddingLeft: 36, marginBottom: 0 }}
              placeholder="Search doctor by name, department, hospital..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {fetching && <div style={{ textAlign: 'center', color: C.muted, padding: 24 }}>Loading doctors...</div>}

          {!fetching && filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: C.muted, padding: 24 }}>
              No registered doctors found.<br />
              <span style={{ fontSize: 12 }}>Doctors need to sign up and complete their profile first.</span>
            </div>
          )}

          {filtered.map(d => (
            <div key={d.user_id}
              onClick={() => setSelDoc(d)}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{d.name}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{d.department} · {d.hospital_name}</div>
                  {d.qualification && <div style={{ fontSize: 12, color: C.muted }}>{d.qualification} · {d.experience_years} yrs exp</div>}
                  {d.shift_start && (
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                      🕒 {formatTime(d.shift_start)} – {formatTime(d.shift_end)}
                    </div>
                  )}
                </div>
                <button style={btn('primary', 'sm')}>Select</button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Booking form — shown after doctor is selected */}
      {selDoc && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 18px' }}>
          {/* Selected doctor */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.accentDark }}>{selDoc.name}</div>
              <div style={{ fontSize: 13, color: C.muted }}>{selDoc.department} · {selDoc.hospital_name}</div>
              {selDoc.shift_start && (
                <div style={{ fontSize: 12, color: C.muted }}>
                  Shift: {formatTime(selDoc.shift_start)} – {formatTime(selDoc.shift_end)}
                </div>
              )}
            </div>
            <button style={btn('ghost', 'sm')} onClick={() => setSelDoc(null)}>Change</button>
          </div>

          {/* Patient */}
          <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Patient</label>
          {patients.length === 0
            ? <div style={{ fontSize: 13, color: C.danger, marginBottom: 12 }}>No patients added. Go to Patients tab and add one first.</div>
            : <select style={inp} value={selPat} onChange={e => setSelPat(e.target.value)}>
                {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.relationship})</option>)}
              </select>
          }

          {/* Date */}
          <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Date</label>
          <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} min={today()} />

          {/* Time */}
          <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Preferred Time</label>
          <select style={inp} value={time} onChange={e => setTime(e.target.value)}>
            <optgroup label="Morning">
              {[['08:00','8:00 AM'],['08:30','8:30 AM'],['09:00','9:00 AM'],['09:30','9:30 AM'],
                ['10:00','10:00 AM'],['10:30','10:30 AM'],['11:00','11:00 AM'],['11:30','11:30 AM'],
                ['12:00','12:00 PM']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </optgroup>
            <optgroup label="Afternoon">
              {[['12:30','12:30 PM'],['13:00','1:00 PM'],['13:30','1:30 PM'],['14:00','2:00 PM'],
                ['14:30','2:30 PM'],['15:00','3:00 PM'],['15:30','3:30 PM'],['16:00','4:00 PM'],
                ['16:30','4:30 PM']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </optgroup>
            <optgroup label="Evening">
              {[['17:00','5:00 PM'],['17:30','5:30 PM'],['18:00','6:00 PM']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </optgroup>
          </select>

          {/* Note */}
          <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Note (optional)</label>
          <textarea style={{ ...inp, height: 56, resize: 'none' }}
            placeholder="Any symptoms or notes for the doctor..."
            value={note} onChange={e => setNote(e.target.value)} />

          <div style={{ fontSize: 12, color: C.muted, background: C.bg, borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
            📞 Reception will call to confirm. 📧 Confirmation email will be sent.
          </div>

          {error && (
            <div style={{ color: C.danger, fontSize: 12, marginBottom: 12,
              background: C.dangerBg, padding: '8px 12px', borderRadius: 8 }}>
              ⚠️ {error}
            </div>
          )}

          <button
            style={{ ...btn(), width: '100%', justifyContent: 'center' }}
            onClick={book}
            disabled={loading || patients.length === 0}>
            {loading ? 'Booking…' : 'Confirm Appointment'}
          </button>
        </div>
      )}
    </div>
  )
}
