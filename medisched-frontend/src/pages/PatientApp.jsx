import { useState, useEffect } from 'react'
import BookingPage from './BookingPage'
import API, {
  getHospitals, seedHospitals,
  getMyPatients, addPatient, updatePatient, deletePatient,
  getMyAppointments, bookAppointment,
  getPatientHistory, getUserHistory, seedHistory,
  getRegularVisits, addRegularVisit, toggleReminder,
  deleteRegularVisit, seedRegularVisits
} from '../api'

// ── Theme ─────────────────────────────────────────────────────────────────────
const C = {
  bg: '#FDF6F0', card: '#FFF8F4', accent: '#C4704F',
  accentLight: '#F0C9B4', accentDark: '#8B4A33', accentDeep: '#5C2F1C',
  text: '#3D2B1F', muted: '#8C6B5A', border: '#E8D5C8',
  success: '#2E6E35', successBg: '#DFF0E0',
  danger: '#B44040', dangerBg: '#FDDCDC',
  warning: '#8A5C10', warningBg: '#FFF3CD',
  headerBg: '#FAEEE7'
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const inp = {
  padding: '10px 14px', borderRadius: 8,
  border: `1.5px solid ${C.border}`, fontSize: 14,
  background: '#fff', color: C.text, outline: 'none',
  width: '100%', boxSizing: 'border-box', marginBottom: 12,
  fontFamily: 'Georgia, serif'
}

const card = (extra = {}) => ({
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: 14, padding: '16px 18px', marginBottom: 12, ...extra
})

const btn = (v = 'primary', size = 'md') => {
  const sizes = {
    sm: { padding: '6px 14px', fontSize: 12 },
    md: { padding: '10px 20px', fontSize: 14 }
  }
  const variants = {
    primary: { background: C.accent,     color: '#fff',    border: 'none' },
    ghost:   { background: 'transparent', color: C.accent,  border: `1.5px solid ${C.accent}` },
    danger:  { background: 'transparent', color: C.danger,  border: `1.5px solid ${C.danger}` },
    success: { background: C.successBg,  color: C.success, border: `1.5px solid ${C.success}` }
  }
  return { borderRadius: 8, cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 600, ...sizes[size], ...variants[v] }
}

const statusBadge = (status) => {
  const map = {
    confirmed: { bg: C.successBg,  color: C.success },
    pending:   { bg: '#E8E8FF',    color: '#4040A0' },
    waiting:   { bg: C.warningBg,  color: C.warning },
    completed: { bg: '#E0F0FF',    color: '#2060A0' },
    cancelled: { bg: C.dangerBg,   color: C.danger  }
  }
  const s = map[status] || { bg: '#F0F0F0', color: '#555' }
  return { background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function today() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().split('T')[0]
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 9999, background: C.accentDeep, color: '#fff', borderRadius: 10, padding: '12px 18px', fontSize: 13, maxWidth: 300, boxShadow: '0 4px 18px rgba(0,0,0,0.18)' }}>
      {msg}
    </div>
  )
}

// ── Hospital Components ───────────────────────────────────────────────────────
function HospitalCard({ h, onClick }) {
  const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`
  return (
    <div style={card({ display: 'flex', gap: 14 })}>
      <div style={{ width: 64, height: 64, borderRadius: 10, background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🏥</div>
      <div style={{ flex: 1 }}>
        <div onClick={() => onClick(h)} style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4, cursor: 'pointer' }}>{h.name}</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>📍 {h.address}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ background: C.accentLight, color: C.accentDark, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{h.type}</span>
          <span style={{ fontSize: 12, color: C.muted }}>⭐ {h.rating}</span>
          {h.distance_km && <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>📏 {h.distance_km} km</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btn('ghost', 'sm')} onClick={() => onClick(h)}>View Departments</button>
          <a href={dirUrl} target="_blank" rel="noreferrer" style={{ ...btn('primary', 'sm'), textDecoration: 'none' }}>🗺 Directions</a>
        </div>
      </div>
    </div>
  )
}

function HospitalDetail({ h, onBook, onBack }) {
  const [openDept, setOpenDept] = useState(null)
  const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`
  return (
    <div>
      <button style={{ ...btn('ghost'), marginBottom: 16 }} onClick={onBack}>← Back</button>
      <div style={card()}>
        <div style={{ fontWeight: 700, fontSize: 18, color: C.accentDark }}>{h.name}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>📍 {h.address}</div>
        <div style={{ fontSize: 13, color: C.muted }}>📞 {h.phone} · ⭐ {h.rating}</div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <a href={dirUrl} target="_blank" rel="noreferrer" style={{ ...btn('primary', 'sm'), textDecoration: 'none' }}>🗺 Directions</a>
          <a href={`tel:${h.phone}`} style={{ ...btn('ghost', 'sm'), textDecoration: 'none' }}>📞 Call</a>
        </div>
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, color: C.accentDark, marginBottom: 10 }}>Departments</div>
      {(h.departments || []).map(d => (
        <div key={d.id} style={card()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpenDept(openDept === d.id ? null : d.id)}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: C.muted }}>📍 {d.floor} · 📞 {h.phone} {d.phone}</div>
            </div>
            <span style={{ color: C.accent }}>{openDept === d.id ? '▲' : '▼'}</span>
          </div>
          {openDept === d.id && (
            <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
              {(d.doctors || []).map(doc => (
                <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>🕒 {doc.timing} · {doc.days} · {doc.exp} yrs exp</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: doc.available ? C.success : C.danger }}>{doc.available ? '● Available' : '● Unavailable'}</span>
                    {doc.available && <button style={btn('primary', 'sm')} onClick={() => onBook({ hospital: h, dept: d, doctor: doc })}>Book</button>}
                  </div>
                </div>
              ))}
              {(d.doctors || []).length === 0 && <div style={{ fontSize: 13, color: C.muted }}>No doctors listed yet.</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Book Modal ────────────────────────────────────────────────────────────────
// ── Book Modal — FIXED VERSION ────────────────────────────────────────────────
// Replace the existing BookModal function in PatientApp.jsx with this one.
// Key fix: uses doc.user_id (real MongoDB _id) as doctor_user_id.
// Also saves patientAge so doctor schedule shows patient age correctly.

function BookModal({ booking, patients, userId, onClose, onBooked }) {
  const [selPat, setSelPat] = useState(patients[0]?._id || '')
  const [date, setDate]     = useState(today)
  const [time, setTime]     = useState('09:00')
  const [note, setNote]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const confirm = async () => {
    if (!date)   { setError('Please select a date');    return }
    if (!selPat) { setError('Please select a patient'); return }

    // Get selected patient details for age
    const selectedPatient = patients.find(p => p._id === selPat)

    // IMPORTANT: use booking.doctor.user_id (real MongoDB _id)
    // Fall back to booking.doctor.id only if user_id is null
    const doctorUserId = booking.doctor.user_id || booking.doctor.id

    if (!doctorUserId || doctorUserId === null) {
      setError('This doctor has not registered on MediSched yet. Please choose another doctor.')
      return
    }

    setLoading(true)
    try {
      await bookAppointment({
        doctor_user_id:    doctorUserId,
        patient_id:        selPat,
        booked_by_user_id: userId,
        appointment_date:  date,
        appointment_time:  time,
        notes:             note,
        hospital_name:     booking.hospital.name,
        dept_name:         booking.dept.name,
        doctor_name:       booking.doctor.name,
        patientName:       selectedPatient?.name || '',
        patientAge:        selectedPatient?.age  || ''
      })
      onBooked()
    } catch (e) {
      setError(e.response?.data?.detail || 'Booking failed. Try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,20,10,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: 380, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: C.accentDark, marginBottom: 4 }}>Book Appointment</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>
          {booking.doctor.name} · {booking.dept.name}
          {(!booking.doctor.user_id) && (
            <div style={{ color: '#C47A30', fontSize: 12, marginTop: 6, background: '#FFF3CD', padding: '6px 10px', borderRadius: 6 }}>
              ⚠️ Doctor not yet registered on MediSched
            </div>
          )}
        </div>

        <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Patient</label>
        <select style={inp} value={selPat} onChange={e => setSelPat(e.target.value)}>
          {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.relationship})</option>)}
        </select>

        <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Date</label>
        <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} min={today()} />

        <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Preferred Time</label>
        <select style={inp} value={time} onChange={e => setTime(e.target.value)}>
          <optgroup label="Morning">
            {[['08:00','8:00 AM'],['08:30','8:30 AM'],['09:00','9:00 AM'],['09:30','9:30 AM'],
              ['10:00','10:00 AM'],['10:30','10:30 AM'],['11:00','11:00 AM'],['11:30','11:30 AM'],
              ['12:00','12:00 PM']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </optgroup>
          <optgroup label="Afternoon">
            {[['12:30','12:30 PM'],['13:00','1:00 PM'],['13:30','1:30 PM'],['14:00','2:00 PM'],
              ['14:30','2:30 PM'],['15:00','3:00 PM'],['15:30','3:30 PM'],['16:00','4:00 PM'],
              ['16:30','4:30 PM']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </optgroup>
          <optgroup label="Evening">
            {[['17:00','5:00 PM'],['17:30','5:30 PM'],['18:00','6:00 PM']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </optgroup>
        </select>

        <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Note (optional)</label>
        <textarea style={{ ...inp, height: 56, resize: 'none' }} value={note} onChange={e => setNote(e.target.value)} />

        <div style={{ fontSize: 12, color: C.muted, background: C.bg, borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
          📞 Reception will call to confirm. 📧 Email reminder will be sent.
        </div>

        {error && (
          <div style={{ color: C.danger, fontSize: 12, marginBottom: 10, background: C.dangerBg, padding: '8px 12px', borderRadius: 8 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...btn(), flex: 1, justifyContent: 'center' }}
            onClick={confirm} disabled={loading || !booking.doctor.user_id}>
            {loading ? 'Booking…' : 'Confirm Booking'}
          </button>
          <button style={{ ...btn('ghost'), flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}


// ── Patient Modal ─────────────────────────────────────────────────────────────
function PatientModal({ existing, userId, onClose, onSaved }) {
  const [form, setForm] = useState(existing || { name: '', age: '', blood_group: '', location: '', mobile: '', relationship: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!form.name) { setError('Name is required'); return }
    setLoading(true)
    try {
      const payload = { ...form, age: form.age ? parseInt(form.age) : null }
      if (existing) {
        await updatePatient(existing._id, payload)
      } else {
        await addPatient({ ...payload, owner_user_id: userId })
      }
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || 'Save failed')
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,20,10,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: 380, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: C.accentDark, marginBottom: 18 }}>
          {existing ? 'Edit Patient' : 'Add New Patient'}
        </div>
        {[['name','Full Name','text'],['age','Age','number'],['blood_group','Blood Group (e.g. O+)','text'],['location','Location / Area','text'],['mobile','Mobile Number','text'],['relationship','Relationship (Self / Mother / Son...)','text']].map(([k,label,type])=>(
          <div key={k}>
            <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>{label}</label>
            <input style={inp} type={type} value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} />
          </div>
        ))}
        {error && <div style={{ color: C.danger, fontSize: 12, marginBottom: 10 }}>⚠️ {error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...btn(), flex: 1 }} onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          <button style={{ ...btn('ghost'), flex: 1 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Add Regular Visit Modal ───────────────────────────────────────────────────
function RegularVisitModal({ userId, onClose, onSaved }) {
  const [form, setForm] = useState({ hospital: '', department: '', doctor: '', frequency: 'Every 3 months', next_date: today() })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!form.hospital || !form.department) { setError('Hospital and department are required'); return }
    setLoading(true)
    try {
      await addRegularVisit({ ...form, owner_user_id: userId, reminder: false })
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || 'Save failed')
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,20,10,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: 380, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: C.accentDark, marginBottom: 18 }}>Add Regular Visit</div>
        {[['hospital','Hospital Name'],['department','Department'],['doctor','Doctor Name (optional)']].map(([k,label])=>(
          <div key={k}>
            <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>{label}</label>
            <input style={inp} value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} />
          </div>
        ))}
        <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Frequency</label>
        <select style={inp} value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
          {['Every month','Every 2 months','Every 3 months','Every 6 months','Every year'].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Next Visit Date</label>
        <input type="date" style={inp} value={form.next_date} onChange={e => setForm({ ...form, next_date: e.target.value })} min={today()} />
        {error && <div style={{ color: C.danger, fontSize: 12, marginBottom: 10 }}>⚠️ {error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...btn(), flex: 1 }} onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          <button style={{ ...btn('ghost'), flex: 1 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── History Card ──────────────────────────────────────────────────────────────
function HistoryCard({ record }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={card()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{record.hospital}</div>
          <div style={{ fontSize: 13, color: C.muted }}>{record.department} · {record.doctor}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            {record.patient_name && <span>Patient: <b>{record.patient_name}</b> · </span>}
            📅 {formatDate(record.date)}
          </div>
        </div>
        <span style={{ color: C.accent, fontSize: 14, marginLeft: 8 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            <b>Diagnosis:</b> {record.diagnosis}
          </div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            <b>Prescription:</b> {record.prescription}
          </div>
          {record.notes && (
            <div style={{ fontSize: 12, color: C.muted, background: C.bg, borderRadius: 8, padding: '8px 12px' }}>
              📝 {record.notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main PatientApp ───────────────────────────────────────────────────────────
export default function PatientApp({ user, onLogout }) {
  const [tab, setTab]             = useState('hospitals')
  const [hospitals, setHospitals] = useState([])
  const [selHospital, setSelHospital] = useState(null)
  const [patients, setPatients]   = useState([])
  const [selPatient, setSelPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [history, setHistory]     = useState([])
  const [regularVisits, setRegularVisits] = useState([])
  const [booking, setBooking]     = useState(null)
  const [patientModal, setPatientModal] = useState(null)
  const [regularModal, setRegularModal] = useState(false)
  const [loc, setLoc]             = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [search, setSearch]       = useState('')
  const [slideIdx, setSlideIdx]   = useState(0)
  const [toast, setToast]         = useState(null)

  const SLIDES = ['Madurai Rajaji Government Hospital', 'Apollo Hospitals Madurai', 'Meenakshi Mission Hospital', 'Velammal Medical College Hospital']

  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i + 1) % SLIDES.length), 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    initLoad()
  }, [])

  const initLoad = async () => {
    await seedHospitals().catch(() => {})
    await loadHospitals()
    await loadPatients()
    await loadAppointments()
    await loadHistory()
    await loadRegularVisits()
    // Seed dummy history and regular visits if none exist
    await seedHistory(user.id).catch(() => {})
    await seedRegularVisits(user.id).catch(() => {})
    // Reload after seed
    await loadHistory()
    await loadRegularVisits()
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const loadHospitals   = async (lat = null, lng = null) => {
    try {
      const params = lat && lng ? `?lat=${lat}&lng=${lng}` : ''
      const res = await API.get(`/hospitals/${params}`)
      setHospitals(res.data)
    } catch (e) { console.error(e) }
  }

  const loadPatients    = async () => {
    try { const r = await getMyPatients(user.id); setPatients(r.data) } catch (e) { console.error(e) }
  }

  const loadAppointments = async () => {
    try { const r = await getMyAppointments(user.id); setAppointments(r.data) } catch (e) { console.error(e) }
  }

  const loadHistory     = async () => {
    try { const r = await getUserHistory(user.id); setHistory(r.data) } catch (e) { console.error(e) }
  }

  const loadRegularVisits = async () => {
    try { const r = await getRegularVisits(user.id); setRegularVisits(r.data) } catch (e) { console.error(e) }
  }

  const getLocation = () => {
    if (!navigator.geolocation) { showToast('Geolocation not supported'); return }
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setLoc({ lat, lng })
        setLocLoading(false)
        loadHospitals(lat, lng)
        showToast('Location detected! Hospitals sorted by distance.')
      },
      err => { setLocLoading(false); showToast('Location denied: ' + err.message) }
    )
  }

  const handleToggleReminder = async (visit) => {
    try {
      await toggleReminder(visit._id, !visit.reminder)
      await loadRegularVisits()
      showToast(visit.reminder ? 'Reminder turned off' : '🔔 Reminder set!')
    } catch (e) { showToast('Failed to update reminder') }
  }

  const handleDeleteRegular = async (visitId) => {
    try {
      await deleteRegularVisit(visitId)
      await loadRegularVisits()
      showToast('Regular visit removed')
    } catch (e) { showToast('Failed to delete') }
  }

  const filtered = hospitals.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.type?.toLowerCase().includes(search.toLowerCase()) ||
    h.address?.toLowerCase().includes(search.toLowerCase())
  )

  const tabStyle = (t) => ({
    padding: '10px 14px', cursor: 'pointer', background: 'none', border: 'none',
    borderBottom: tab === t ? `3px solid ${C.accent}` : '3px solid transparent',
    color: tab === t ? C.accent : C.muted,
    fontWeight: tab === t ? 700 : 500, fontSize: 13,
    fontFamily: 'Georgia, serif', whiteSpace: 'nowrap'
  })

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia, serif', color: C.text }}>

      <Toast msg={toast} />

      {/* Modals */}
      {booking && (
        <BookModal booking={booking} patients={patients} userId={user.id}
          onClose={() => setBooking(null)}
          onBooked={() => { setBooking(null); loadAppointments(); showToast('✅ Appointment booked! Check your email.') }}
        />
      )}
      {patientModal !== null && (
        <PatientModal
          existing={patientModal === 'new' ? null : patientModal}
          userId={user.id}
          onClose={() => setPatientModal(null)}
          onSaved={async () => {
            setPatientModal(null)
            await loadPatients()
            if (selPatient) {
              const r = await getMyPatients(user.id)
              const updated = r.data.find(p => p._id === selPatient._id)
              if (updated) setSelPatient(updated)
            }
            showToast('Patient saved successfully!')
          }}
        />
      )}
      {regularModal && (
        <RegularVisitModal userId={user.id}
          onClose={() => setRegularModal(false)}
          onSaved={() => { setRegularModal(false); loadRegularVisits(); showToast('Regular visit added!') }}
        />
      )}

      {/* Header */}
      <div style={{ background: C.headerBg, borderBottom: `1px solid ${C.border}`, padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ padding: '14px 0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: C.accentDark }}>🏥 MediSched <span style={{ fontWeight: 400, fontSize: 13, color: C.muted }}>Global</span></div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: C.muted }}>Hi, {user.name}</span>
              <button style={btn('ghost', 'sm')} onClick={onLogout}>Logout</button>
            </div>
          </div>
          <div style={{ display: 'flex', overflowX: 'auto', gap: 2, paddingBottom: 2 }}>
             {[['hospitals','🏥 Hospitals'],['book','📅 Book'],['patients','👨‍👩‍👧 Patients'],['regular','🔁 Regular'],['appointments','📋 Bookings'],['about','👤 About Me']].map(([k,v]) => (
              <button key={k} style={tabStyle(k)} onClick={() => setTab(k)}>{v}</button>
              ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── HOSPITALS TAB ─────────────────────────────────────── */}
        {tab === 'hospitals' && !selHospital && (
          <>
            <div style={{ background: C.accentLight, borderRadius: 14, padding: '14px 20px', marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: C.accentDark, fontWeight: 600, marginBottom: 4 }}>⭐ FEATURED</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{SLIDES[slideIdx]}</div>
            </div>
            <div style={card({ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 })}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div style={{ flex: 1, fontSize: 13 }}>
                {loc ? <span style={{ color: C.success, fontWeight: 600 }}>Location detected · Hospitals sorted by distance</span>
                     : locLoading ? <span style={{ color: C.muted }}>Detecting location…</span>
                     : <span style={{ color: C.muted }}>Enable location for nearby hospitals</span>}
              </div>
              {!loc && <button style={btn('primary', 'sm')} onClick={getLocation} disabled={locLoading}>{locLoading ? '…' : 'Use My Location'}</button>}
            </div>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <span style={{ position: 'absolute', left: 12, top: 11, color: C.muted }}>🔍</span>
              <input style={{ ...inp, paddingLeft: 36, marginBottom: 0 }}
                placeholder="Search hospitals by name, type, area…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, color: C.muted, marginBottom: 10 }}>
              {loc ? '📍 Nearest hospitals first' : '📍 Hospitals in Madurai'}
            </div>
            {filtered.map(h => <HospitalCard key={h._id} h={h} onClick={setSelHospital} />)}
            {filtered.length === 0 && <div style={{ textAlign: 'center', color: C.muted, padding: 24 }}>No hospitals found.</div>}
          </>
        )}

        {tab === 'hospitals' && selHospital && (
          <HospitalDetail h={selHospital} onBook={setBooking} onBack={() => setSelHospital(null)} />
        )}

        {tab === 'book' && (
          <BookingPage
            user={user}
            patients={patients}
            onBooked={loadAppointments}
            showToast={showToast}
          />
        )}

        {/* ── PATIENTS TAB ──────────────────────────────────────── */}
        {tab === 'patients' && !selPatient && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: C.accentDark }}>My Patients</div>
              <button style={btn()} onClick={() => setPatientModal('new')}>+ Add Patient</button>
            </div>
            {patients.length === 0 && (
              <div style={{ textAlign: 'center', color: C.muted, padding: 32 }}>
                No patients added yet.
                <br />
                <button style={{ ...btn('ghost'), marginTop: 12 }} onClick={() => setPatientModal('new')}>Add Your First Patient</button>
              </div>
            )}
            {patients.map(p => (
              <div key={p._id} style={{ ...card({ cursor: 'pointer' }) }} onClick={() => setSelPatient(p)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: C.accentDark }}>
                      {initials(p.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>Age: {p.age} · 🩸 {p.blood_group} · 📍 {p.location}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>📱 {p.mobile}</div>
                    </div>
                  </div>
                  <span style={{ background: C.accentLight, color: C.accentDark, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{p.relationship}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'patients' && selPatient && (
          <div>
            <button style={{ ...btn('ghost'), marginBottom: 16 }} onClick={() => setSelPatient(null)}>← Back</button>
            <div style={{ ...card({ textAlign: 'center', padding: '24px 20px' }) }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: C.accentDark, margin: '0 auto 12px' }}>
                {initials(selPatient.name)}
              </div>
              <div style={{ fontWeight: 700, fontSize: 19, color: C.accentDark }}>{selPatient.name}</div>
              <div style={{ fontSize: 13, color: C.muted }}>{selPatient.relationship}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {[['🎂','Age',selPatient.age],['🩸','Blood',selPatient.blood_group],['📍','Location',selPatient.location],['📱','Mobile',selPatient.mobile]].map(([ic,k,v]) => (
                  <div key={k} style={{ background: C.bg, borderRadius: 10, padding: '7px 14px', fontSize: 13 }}><b>{ic} {k}:</b> {v}</div>
                ))}
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button style={btn('ghost', 'sm')} onClick={() => setPatientModal(selPatient)}>✏ Edit</button>
              </div>
            </div>

            {/* Patient history */}
            <div style={{ fontWeight: 600, fontSize: 15, margin: '16px 0 10px', color: C.accentDark }}>Consultation History</div>
            {history.filter(h => h.patient_id === selPatient._id).map(r => (
              <HistoryCard key={r._id} record={r} />
            ))}
            {history.filter(h => h.patient_id === selPatient._id).length === 0 && (
              <div style={{ color: C.muted, textAlign: 'center', padding: 16, fontSize: 13 }}>No history yet for this patient.</div>
            )}

            {/* Patient appointments */}
            <div style={{ fontWeight: 600, fontSize: 15, margin: '16px 0 10px', color: C.accentDark }}>Appointments</div>
            {appointments.filter(a => a.patient_id === selPatient._id).map(a => (
              <div key={a._id} style={card()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{a.doctor_name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{a.dept_name} · {a.hospital_name}</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>📅 {a.appointment_date} · 🕒 {a.appointment_time}</div>
                  </div>
                  <span style={statusBadge(a.status)}>{a.status}</span>
                </div>
              </div>
            ))}
            {appointments.filter(a => a.patient_id === selPatient._id).length === 0 && (
              <div style={{ color: C.muted, textAlign: 'center', padding: 16, fontSize: 13 }}>No appointments yet.</div>
            )}
          </div>
        )}

        {/* ── REGULAR VISITS TAB ────────────────────────────────── */}
        {tab === 'regular' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: C.accentDark }}>Regular Checkup Schedule</div>
              <button style={btn()} onClick={() => setRegularModal(true)}>+ Add</button>
            </div>

            {regularVisits.length === 0 && (
              <div style={{ textAlign: 'center', color: C.muted, padding: 32 }}>
                No regular visits added yet.
                <br />
                <button style={{ ...btn('ghost'), marginTop: 12 }} onClick={() => setRegularModal(true)}>Add Regular Visit</button>
              </div>
            )}

            {regularVisits.map(v => (
              <div key={v._id} style={card()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{v.hospital}</div>
                    <div style={{ fontSize: 13, color: C.muted }}>{v.department}{v.doctor ? ` · ${v.doctor}` : ''}</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>🔁 {v.frequency}</div>
                    <div style={{ fontSize: 13, color: C.accentDark, marginTop: 2 }}>
                      Next visit: <b>{formatDate(v.next_date)}</b>
                    </div>
                    {v.reminder && (
                      <div style={{ fontSize: 12, color: C.success, marginTop: 4 }}>
                        🔔 Reminder is ON
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <button
                      style={btn(v.reminder ? 'success' : 'ghost', 'sm')}
                      onClick={() => handleToggleReminder(v)}>
                      {v.reminder ? '🔔 ON' : '🔕 Set Reminder'}
                    </button>
                    <button style={btn('danger', 'sm')} onClick={() => handleDeleteRegular(v._id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BOOKINGS TAB ──────────────────────────────────────── */}
        {tab === 'appointments' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: C.accentDark, marginBottom: 14 }}>My Appointments</div>
            {appointments.length === 0 && (
              <div style={{ textAlign: 'center', color: C.muted, padding: 32 }}>
                No appointments yet.<br />Go to Hospitals tab to book.
              </div>
            )}
            {appointments.map(a => (
              <div key={a._id} style={card()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.doctor_name}</div>
                    <div style={{ fontSize: 13, color: C.muted }}>{a.dept_name} · {a.hospital_name}</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>📅 {a.appointment_date} · 🕒 {a.appointment_time}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Token: <b>{a.token_number}</b></div>
                  </div>
                  <span style={statusBadge(a.status)}>{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ABOUT ME TAB ──────────────────────────────────────── */}
        {tab === 'about' && (
          <div>
            {/* User profile card */}
            <div style={{ ...card({ textAlign: 'center', padding: '28px 20px' }) }}>
              <div style={{ width: 70, height: 70, borderRadius: '50%', background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: C.accentDark, margin: '0 auto 12px' }}>
                {initials(user.name)}
              </div>
              <div style={{ fontWeight: 700, fontSize: 20, color: C.accentDark }}>{user.name}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Patient Account</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                {[
                  [`${patients.length} Patients`, C.accentLight, C.accentDark],
                  [`${appointments.length} Appointments`, C.successBg, C.success],
                  [`${history.length} Consultations`, '#E0F0FF', '#2060A0'],
                  [`${regularVisits.length} Regular Visits`, C.warningBg, C.warning],
                ].map(([label, bg, color]) => (
                  <div key={label} style={{ background: bg, color, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{label}</div>
                ))}
              </div>
            </div>

            {/* Full consultation history across all patients */}
            <div style={{ fontWeight: 600, fontSize: 15, margin: '16px 0 10px', color: C.accentDark }}>
              All Consultation History ({history.length})
            </div>
            {history.length === 0 && (
              <div style={{ color: C.muted, textAlign: 'center', padding: 20, fontSize: 13 }}>No history records yet.</div>
            )}
            {history.map(r => <HistoryCard key={r._id} record={r} />)}
          </div>
        )}

      </div>
    </div>
  )
}
