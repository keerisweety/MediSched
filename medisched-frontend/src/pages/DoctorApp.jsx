import { useState, useEffect, useRef } from 'react'
import API from '../api'

// ── Theme ─────────────────────────────────────────────────────────────────────
const C = {
  bg: '#FDF6F0', card: '#FFF8F4', accent: '#C4704F',
  accentLight: '#F0C9B4', accentDark: '#8B4A33', accentDeep: '#5C2F1C',
  text: '#3D2B1F', muted: '#8C6B5A', border: '#E8D5C8',
  success: '#2E6E35', successBg: '#DFF0E0',
  danger: '#B44040', dangerBg: '#FDDCDC',
  warning: '#8A5C10', warningBg: '#FFF3CD',
  info: '#4040A0', infoBg: '#E8E8FF',
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
    md: { padding: '10px 20px', fontSize: 14 },
    lg: { padding: '13px 24px', fontSize: 15 }
  }
  const variants = {
    primary: { background: C.accent,     color: '#fff',    border: 'none' },
    ghost:   { background: 'transparent', color: C.accent,  border: `1.5px solid ${C.accent}` },
    danger:  { background: 'transparent', color: C.danger,  border: `1.5px solid ${C.danger}` },
    success: { background: C.successBg,  color: C.success, border: `1.5px solid ${C.success}` },
    warning: { background: C.warningBg,  color: C.warning, border: `1.5px solid #C47A30` },
    dark:    { background: C.accentDeep, color: '#fff',    border: 'none' }
  }
  return {
    borderRadius: 8, cursor: 'pointer',
    fontFamily: 'Georgia, serif', fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    ...sizes[size], ...variants[v]
  }
}

const statusBadge = (status) => {
  const map = {
    confirmed: { bg: C.successBg,  color: C.success },
    pending:   { bg: C.infoBg,     color: C.info    },
    waiting:   { bg: C.warningBg,  color: C.warning },
    completed: { bg: '#E0F0FF',    color: '#2060A0' },
    cancelled: { bg: C.dangerBg,   color: C.danger  }
  }
  const s = map[status] || { bg: '#F0F0F0', color: '#555' }
  return {
    background: s.bg, color: s.color,
    padding: '3px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 600, display: 'inline-block'
  }
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function today() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().split('T')[0]
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type = 'default' }) {
  if (!msg) return null
  const bg = type === 'success' ? C.success : type === 'danger' ? C.danger : C.accentDeep
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 20, zIndex: 9999,
      background: bg, color: '#fff', borderRadius: 10,
      padding: '12px 18px', fontSize: 13, maxWidth: 320,
      boxShadow: '0 4px 18px rgba(0,0,0,0.2)'
    }}>
      {msg}
    </div>
  )
}

// ── Complete Modal (diagnosis + prescription) ─────────────────────────────────
function CompleteModal({ appt, onClose, onDone }) {
  const [diagnosis, setDiagnosis]       = useState('')
  const [prescription, setPrescription] = useState('')
  const [notes, setNotes]               = useState('')
  const [loading, setLoading]           = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      await API.put(`/doctors/complete/${appt._id}`, { diagnosis, prescription, notes })
      onDone()
    } catch (e) {
      alert('Failed to complete: ' + (e.response?.data?.detail || e.message))
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,20,10,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: 400, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: C.accentDark, marginBottom: 4 }}>Complete Consultation</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>
          {appt.patientName} · Token {appt.token_number}
        </div>
        <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Diagnosis</label>
        <input style={inp} placeholder="e.g. Hypertension Stage 1" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
        <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Prescription</label>
        <input style={inp} placeholder="e.g. Amlodipine 5mg, Lifestyle changes" value={prescription} onChange={e => setPrescription(e.target.value)} />
        <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Notes (optional)</label>
        <textarea style={{ ...inp, height: 70, resize: 'none' }} placeholder="Any additional notes..." value={notes} onChange={e => setNotes(e.target.value)} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...btn('success'), flex: 1, justifyContent: 'center' }} onClick={submit} disabled={loading}>
            {loading ? 'Saving…' : '✔ Mark Complete'}
          </button>
          <button style={{ ...btn('ghost'), flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────
function CancelModal({ appt, onClose, onCancelled }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      await API.put(`/doctors/cancel/${appt._id}`, { reason: reason || 'Cancelled by doctor' })
      onCancelled()
    } catch (e) {
      alert('Failed to cancel: ' + (e.response?.data?.detail || e.message))
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,20,10,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: 380 }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: C.danger, marginBottom: 4 }}>Cancel Appointment</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>
          {appt.patientName} · {appt.appointment_date} {formatTime(appt.appointment_time)}
        </div>
        <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Reason (optional)</label>
        <input style={inp} placeholder="e.g. Doctor unavailable, Emergency" value={reason} onChange={e => setReason(e.target.value)} />
        <div style={{ fontSize: 12, color: C.muted, background: C.bg, borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
          📧 Patient will be notified by email immediately.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...btn('danger'), flex: 1, justifyContent: 'center' }} onClick={submit} disabled={loading}>
            {loading ? 'Cancelling…' : '✖ Confirm Cancel'}
          </button>
          <button style={{ ...btn('ghost'), flex: 1, justifyContent: 'center' }} onClick={onClose}>Go Back</button>
        </div>
      </div>
    </div>
  )
}

// ── Shift Modal ───────────────────────────────────────────────────────────────
function ShiftModal({ currentShift, userId, onClose, onSaved }) {
  const [start, setStart] = useState(currentShift?.shift_start || '08:00')
  const [end, setEnd]     = useState(currentShift?.shift_end   || '13:00')
  const [loading, setLoading] = useState(false)

  const TIME_OPTIONS = [
    ['06:00','6:00 AM'],['06:30','6:30 AM'],['07:00','7:00 AM'],['07:30','7:30 AM'],
    ['08:00','8:00 AM'],['08:30','8:30 AM'],['09:00','9:00 AM'],['09:30','9:30 AM'],
    ['10:00','10:00 AM'],['10:30','10:30 AM'],['11:00','11:00 AM'],['11:30','11:30 AM'],
    ['12:00','12:00 PM'],['12:30','12:30 PM'],['13:00','1:00 PM'],['13:30','1:30 PM'],
    ['14:00','2:00 PM'],['14:30','2:30 PM'],['15:00','3:00 PM'],['15:30','3:30 PM'],
    ['16:00','4:00 PM'],['16:30','4:30 PM'],['17:00','5:00 PM'],['17:30','5:30 PM'],
    ['18:00','6:00 PM'],['18:30','6:30 PM'],['19:00','7:00 PM'],['20:00','8:00 PM'],
  ]

  const save = async () => {
    if (start >= end) { alert('Shift end must be after shift start'); return }
    setLoading(true)
    try {
      await API.put(`/doctors/shift/${userId}`, {
        shift_start: start,
        shift_end: end,
        shift_date: today()
      })
      onSaved({ shift_start: start, shift_end: end })
    } catch (e) {
      alert('Failed to save shift: ' + (e.response?.data?.detail || e.message))
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,20,10,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: 340 }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: C.accentDark, marginBottom: 18 }}>Set Today's Shift</div>
        <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Shift Start</label>
        <select style={inp} value={start} onChange={e => setStart(e.target.value)}>
          {TIME_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Shift End</label>
        <select style={inp} value={end} onChange={e => setEnd(e.target.value)}>
          {TIME_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div style={{ fontSize: 12, color: C.muted, background: C.bg, borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
          Appointments are only accepted during this window.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...btn(), flex: 1, justifyContent: 'center' }} onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save Shift'}</button>
          <button style={{ ...btn('ghost'), flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Appointment Card ──────────────────────────────────────────────────────────
function ApptCard({ appt, onAppoint, onCancel, onComplete }) {
  return (
    <div style={{ ...card({ marginBottom: 8 }) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.accentDark, flexShrink: 0 }}>
              {initials(appt.patientName || appt.patient_name || '?')}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{appt.patientName || appt.patient_name}</div>
              <div style={{ fontSize: 12, color: C.muted }}>Age: {appt.patientAge || appt.patient_age || '—'} · Token: <b>{appt.token_number}</b></div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginLeft: 44 }}>
            🕒 {formatTime(appt.appointment_time)}
            {appt.notes && <span> · 📝 {appt.notes}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={statusBadge(appt.status)}>{appt.status}</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {(appt.status === 'waiting' || appt.status === 'pending') && (
              <button style={btn('success', 'sm')} onClick={() => onAppoint(appt)}>✅ Confirm</button>
            )}
            {appt.status === 'confirmed' && (
              <button style={btn('primary', 'sm')} onClick={() => onComplete(appt)}>✔ Done</button>
            )}
            {appt.status !== 'completed' && appt.status !== 'cancelled' && (
              <button style={btn('danger', 'sm')} onClick={() => onCancel(appt)}>✖ Cancel</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Profile Setup Form ────────────────────────────────────────────────────────
function ProfileSetupForm({ user, onSaved }) {
  const [form, setForm] = useState({
    name: user.name || '',
    qualification: '',
    experience_years: '',
    age: '',
    department: '',
    hospital_name: '',
    hospital_address: '',
    hospital_block: '',
    room_number: '',
    registration_no: '',
    shift_start: '08:00',
    shift_end: '13:00'
  })
  const [loading, setLoading] = useState(false)

  const TIME_OPTIONS = [
    ['06:00','6:00 AM'],['07:00','7:00 AM'],['08:00','8:00 AM'],['09:00','9:00 AM'],
    ['10:00','10:00 AM'],['11:00','11:00 AM'],['12:00','12:00 PM'],['13:00','1:00 PM'],
    ['14:00','2:00 PM'],['15:00','3:00 PM'],['16:00','4:00 PM'],['17:00','5:00 PM'],
    ['18:00','6:00 PM'],['19:00','7:00 PM'],['20:00','8:00 PM'],
  ]

  const save = async () => {
    if (!form.department || !form.hospital_name) {
      alert('Department and hospital name are required')
      return
    }
    setLoading(true)
    try {
      await API.post('/doctors/profile', {
        ...form,
        user_id: user.id,
        experience_years: parseInt(form.experience_years) || 0,
        age: parseInt(form.age) || null
      })
      onSaved()
    } catch (e) {
      alert('Failed to save: ' + (e.response?.data?.detail || e.message))
    }
    setLoading(false)
  }

  const field = (key, label, type = 'text') => (
    <div key={key}>
      <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>{label}</label>
      <input style={inp} type={type} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  )

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ ...card({ textAlign: 'center', padding: '24px 20px', marginBottom: 20 }) }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>👨‍⚕️</div>
        <div style={{ fontWeight: 700, fontSize: 20, color: C.accentDark }}>Complete Your Profile</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Fill in your details to start accepting appointments</div>
      </div>

      <div style={{ fontWeight: 600, fontSize: 14, color: C.accentDark, marginBottom: 12 }}>Personal Details</div>
      {field('name', 'Full Name (with Dr.)')}
      {field('qualification', 'Qualification (e.g. MD, DM Cardiology)')}
      {field('experience_years', 'Years of Experience', 'number')}
      {field('age', 'Age', 'number')}
      {field('registration_no', 'Medical Registration Number')}

      <div style={{ fontWeight: 600, fontSize: 14, color: C.accentDark, margin: '16px 0 12px' }}>Hospital Details</div>
      {field('department', 'Department (e.g. Cardiology)')}
      {field('hospital_name', 'Hospital Name')}
      {field('hospital_address', 'Hospital Address')}
      {field('hospital_block', 'Block / Wing (e.g. Block A)')}
      {field('room_number', 'Room Number (e.g. Room 204)')}

      <div style={{ fontWeight: 600, fontSize: 14, color: C.accentDark, margin: '16px 0 12px' }}>Default Shift Timing</div>
      <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Shift Start</label>
      <select style={inp} value={form.shift_start} onChange={e => setForm({ ...form, shift_start: e.target.value })}>
        {TIME_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <label style={{ fontSize: 13, color: C.muted, display: 'block', marginBottom: 4 }}>Shift End</label>
      <select style={inp} value={form.shift_end} onChange={e => setForm({ ...form, shift_end: e.target.value })}>
        {TIME_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>

      <button style={{ ...btn('primary', 'lg'), width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={save} disabled={loading}>
        {loading ? 'Saving…' : 'Save Profile & Continue'}
      </button>
    </div>
  )
}

// ── Main Doctor App ───────────────────────────────────────────────────────────
export default function DoctorApp({ user, onLogout }) {
  const [tab, setTab]             = useState('schedule')
  const [profile, setProfile]     = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [schedule, setSchedule]   = useState(null)
  const [histRange, setHistRange] = useState(30)
  const [histData, setHistData]   = useState(null)
  const [shiftModal, setShiftModal] = useState(false)
  const [completeModal, setCompleteModal] = useState(null)
  const [cancelModal, setCancelModal] = useState(null)
  const [toast, setToast]         = useState(null)
  const [toastType, setToastType] = useState('default')
  const pollRef = useRef(null)

  useEffect(() => {
    loadProfile()
    // Poll schedule every 15 seconds for real-time updates
    pollRef.current = setInterval(() => {
      if (tab === 'schedule') loadSchedule()
    }, 15000)
    return () => clearInterval(pollRef.current)
  }, [])

  useEffect(() => {
    if (tab === 'schedule') loadSchedule()
    if (tab === 'history')  loadHistory()
  }, [tab, histRange])

  const showToast = (msg, type = 'default') => {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(null), 4000)
  }

  const loadProfile = async () => {
    try {
      const res = await API.get(`/doctors/profile/${user.id}`)
      setProfile(res.data)
    } catch (e) {
      if (e.response?.status === 404) {
        setProfile(null)
      }
    }
    setProfileLoaded(true)
  }

  const loadSchedule = async () => {
    try {
      const res = await API.get(`/doctors/schedule/${user.id}?date=${today()}`)
      setSchedule(res.data)
    } catch (e) { console.error(e) }
  }

  const loadHistory = async () => {
    try {
      const res = await API.get(`/doctors/history/${user.id}?days=${histRange}`)
      setHistData(res.data)
    } catch (e) { console.error(e) }
  }

  const handleAppoint = async (appt) => {
    try {
      await API.put(`/doctors/appoint/${appt._id}`)
      showToast(`✅ ${appt.patientName || appt.patient_name} confirmed & notified`, 'success')
      loadSchedule()
    } catch (e) { showToast('Failed to appoint patient', 'danger') }
  }

  const handleCancelDone = () => {
    setCancelModal(null)
    showToast('Appointment cancelled. Patient notified by email.', 'danger')
    loadSchedule()
  }

  const handleCompleteDone = () => {
    setCompleteModal(null)
    showToast('✔ Consultation completed. History record created.', 'success')
    loadSchedule()
  }

  // Download CSV
  const downloadCSV = () => {
    if (!histData?.records?.length) { showToast('No records to download'); return }
    const rows = [
      ['Date', 'Token', 'Patient Name', 'Time', 'Status', 'Hospital'],
      ...histData.records.map(a => [
        a.appointment_date, a.token_number, a.patientName || a.patient_name || '',
        a.appointment_time, a.status, a.hospital_name || ''
      ])
    ]
    const csv  = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `history_${histRange}days.csv`; a.click()
    showToast(`Downloaded ${histData.records.length} records as CSV`)
  }

  // Download PDF (print)
  const downloadPDF = () => {
    if (!histData?.records?.length) { showToast('No records to download'); return }
    const content = `
      <html><head><title>Work History — ${profile?.name || user.name}</title>
      <style>
        body { font-family: Georgia, serif; padding: 32px; color: #3D2B1F; }
        h2   { color: #8B4A33; }
        .info { color: #8C6B5A; font-size: 13px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 8px 12px; border: 1px solid #E8D5C8; font-size: 13px; }
        th { background: #FDF0E8; font-weight: 700; }
        tr:nth-child(even) { background: #FFF8F4; }
      </style></head><body>
      <h2>MediSched Global — Work History</h2>
      <div class="info">
        Doctor: ${profile?.name || user.name} &nbsp;|&nbsp;
        Dept: ${profile?.department || '—'} &nbsp;|&nbsp;
        Hospital: ${profile?.hospital_name || '—'}<br>
        Period: Last ${histRange} day${histRange > 1 ? 's' : ''} &nbsp;|&nbsp;
        Total Patients: ${histData.total} &nbsp;|&nbsp;
        Generated: ${new Date().toLocaleDateString('en-IN')}
      </div>
      <table>
        <tr><th>Date</th><th>Token</th><th>Patient</th><th>Time</th><th>Hospital</th></tr>
        ${histData.records.map(a => `
          <tr>
            <td>${a.appointment_date}</td>
            <td>${a.token_number}</td>
            <td>${a.patientName || a.patient_name || ''}</td>
            <td>${formatTime(a.appointment_time)}</td>
            <td>${a.hospital_name || ''}</td>
          </tr>`).join('')}
      </table>
      </body></html>`
    const w = window.open('', '_blank')
    w.document.write(content)
    w.document.close()
    w.print()
  }

  const tabStyle = (t) => ({
    padding: '10px 18px', cursor: 'pointer', background: 'none', border: 'none',
    borderBottom: tab === t ? `3px solid ${C.accent}` : '3px solid transparent',
    color: tab === t ? C.accent : C.muted,
    fontWeight: tab === t ? 700 : 500, fontSize: 14,
    fontFamily: 'Georgia, serif', whiteSpace: 'nowrap'
  })

  // Show profile setup if no profile yet
  if (profileLoaded && !profile) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia, serif' }}>
        <div style={{ background: C.headerBg, borderBottom: `1px solid ${C.border}`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: C.accentDark }}>🏥 MediSched <span style={{ fontWeight: 400, fontSize: 13, color: C.muted }}>Doctor Portal</span></div>
          <button style={btn('ghost', 'sm')} onClick={onLogout}>Logout</button>
        </div>
        <ProfileSetupForm user={user} onSaved={() => { loadProfile(); loadSchedule() }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia, serif', color: C.text }}>

      <Toast msg={toast} type={toastType} />

      {/* Modals */}
      {shiftModal   && <ShiftModal currentShift={profile} userId={user.id} onClose={() => setShiftModal(false)} onSaved={(s) => { setShiftModal(false); setProfile(p => ({ ...p, ...s })); loadSchedule(); showToast('Shift updated!', 'success') }} />}
      {completeModal && <CompleteModal appt={completeModal} onClose={() => setCompleteModal(null)} onDone={handleCompleteDone} />}
      {cancelModal  && <CancelModal   appt={cancelModal}   onClose={() => setCancelModal(null)}   onCancelled={handleCancelDone} />}

      {/* Header */}
      <div style={{ background: C.headerBg, borderBottom: `1px solid ${C.border}`, padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ padding: '14px 0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: C.accentDark }}>🏥 MediSched <span style={{ fontWeight: 400, fontSize: 13, color: C.muted }}>Doctor Portal</span></div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: C.muted }}>{profile?.name || user.name}</span>
              <button style={btn('ghost', 'sm')} onClick={onLogout}>Logout</button>
            </div>
          </div>
          <div style={{ display: 'flex', overflowX: 'auto', gap: 2, paddingBottom: 2 }}>
            {[['profile', '👨‍⚕️ Profile'], ['schedule', '📋 Schedule'], ['history', '📁 History']].map(([k, v]) => (
              <button key={k} style={tabStyle(k)} onClick={() => setTab(k)}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── PROFILE TAB ───────────────────────────────────────── */}
        {tab === 'profile' && profile && (
          <div>
            {/* Doctor profile card */}
            <div style={{ ...card({ textAlign: 'center', padding: '28px 20px' }) }}>
              <div style={{ width: 70, height: 70, borderRadius: '50%', background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: C.accentDark, margin: '0 auto 12px' }}>
                {initials(profile.name || user.name)}
              </div>
              <div style={{ fontWeight: 700, fontSize: 21, color: C.accentDark }}>{profile.name || user.name}</div>
              <div style={{ fontSize: 14, color: C.muted, marginTop: 2 }}>{profile.qualification}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {[
                  profile.department,
                  `${profile.experience_years} yrs exp`,
                  `Age ${profile.age}`,
                  `Reg: ${profile.registration_no}`
                ].filter(Boolean).map(t => (
                  <span key={t} style={{ background: C.accentLight, color: C.accentDark, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Hospital details */}
            <div style={card()}>
              <div style={{ fontWeight: 600, fontSize: 15, color: C.accentDark, marginBottom: 12 }}>🏥 Hospital Details</div>
              {[
                ['Hospital',    profile.hospital_name],
                ['Address',     profile.hospital_address],
                ['Block / Wing', profile.hospital_block],
                ['Room No.',    profile.room_number],
                ['Department',  profile.department],
              ].map(([k, v]) => v && (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                  <span style={{ color: C.muted }}>{k}</span>
                  <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Shift timing */}
            <div style={card()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: C.accentDark }}>⏰ Today's Shift</div>
                <button style={btn('ghost', 'sm')} onClick={() => setShiftModal(true)}>Change Shift</button>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, background: C.bg, borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.accentDark }}>{formatTime(profile.shift_start)}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Start</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: C.muted }}>→</div>
                <div style={{ flex: 1, background: C.bg, borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.accentDark }}>{formatTime(profile.shift_end)}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>End</div>
                </div>
              </div>
            </div>

            {/* Today's summary */}
            {schedule && (
              <div style={card()}>
                <div style={{ fontWeight: 600, fontSize: 15, color: C.accentDark, marginBottom: 12 }}>📊 Today's Summary</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    ['✅', 'Confirmed', schedule.schedule.confirmed.length, C.successBg, C.success],
                    ['⏳', 'Pending',   schedule.schedule.pending.length,   C.infoBg,    C.info],
                    ['🕐', 'Waiting',   schedule.schedule.waiting.length,   C.warningBg, C.warning],
                    ['✔️', 'Completed', schedule.schedule.completed.length, '#E0F0FF',   '#2060A0'],
                  ].map(([ic, label, count, bg, color]) => (
                    <div key={label} style={{ background: bg, borderRadius: 10, padding: '10px 16px', textAlign: 'center', minWidth: 80, flex: 1 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color }}>{count}</div>
                      <div style={{ fontSize: 11, color }}>{ic} {label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SCHEDULE TAB ──────────────────────────────────────── */}
        {tab === 'schedule' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: C.accentDark }}>Today's Schedule</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: C.muted }}>🔄 Auto-updates every 15s</span>
                <button style={btn('ghost', 'sm')} onClick={loadSchedule}>Refresh</button>
              </div>
            </div>

            {profile && (
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                &nbsp;·&nbsp; Shift: {formatTime(profile.shift_start)} – {formatTime(profile.shift_end)}
                <button style={{ ...btn('ghost', 'sm'), marginLeft: 12 }} onClick={() => setShiftModal(true)}>Change</button>
              </div>
            )}

            {!schedule && (
              <div style={{ textAlign: 'center', color: C.muted, padding: 40 }}>
                Loading schedule…
              </div>
            )}

            {schedule && (
              <>
                {/* Stats bar */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  {[
                    ['Confirmed', schedule.schedule.confirmed.length, C.successBg, C.success],
                    ['Pending',   schedule.schedule.pending.length,   C.infoBg,    C.info],
                    ['Waiting',   schedule.schedule.waiting.length,   C.warningBg, C.warning],
                    ['Completed', schedule.schedule.completed.length, '#E0F0FF',   '#2060A0'],
                  ].map(([label, count]) => (
                    <div key={label} style={{ fontSize: 13, color: C.muted }}>
                      <b style={{ color: C.text }}>{count}</b> {label}
                      {label !== 'Completed' ? <span style={{ color: C.border }}> · </span> : ''}
                    </div>
                  ))}
                  <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: C.accentDark }}>
                    {schedule.total_attended} attended today
                  </div>
                </div>

                {/* Confirmed */}
                <div style={{ fontWeight: 600, fontSize: 14, color: C.accentDark, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Confirmed Appointments
                  <span style={{ ...statusBadge('confirmed') }}>{schedule.schedule.confirmed.length}</span>
                </div>
                {schedule.schedule.confirmed.length === 0 && <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>None.</div>}
                {schedule.schedule.confirmed.map(a => (
                  <ApptCard key={a._id} appt={a} onAppoint={handleAppoint} onCancel={setCancelModal} onComplete={setCompleteModal} />
                ))}

                {/* Pending */}
                <div style={{ fontWeight: 600, fontSize: 14, color: C.accentDark, margin: '14px 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Pending Requests
                  <span style={{ ...statusBadge('pending') }}>{schedule.schedule.pending.length}</span>
                </div>
                {schedule.schedule.pending.length === 0 && <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>None.</div>}
                {schedule.schedule.pending.map(a => (
                  <ApptCard key={a._id} appt={a} onAppoint={handleAppoint} onCancel={setCancelModal} onComplete={setCompleteModal} />
                ))}

                {/* Waiting */}
                <div style={{ fontWeight: 600, fontSize: 14, color: C.accentDark, margin: '14px 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Waiting List
                  <span style={{ ...statusBadge('waiting') }}>{schedule.schedule.waiting.length}</span>
                </div>
                {schedule.schedule.waiting.length === 0 && <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>None.</div>}
                {schedule.schedule.waiting.map(a => (
                  <ApptCard key={a._id} appt={a} onAppoint={handleAppoint} onCancel={setCancelModal} onComplete={setCompleteModal} />
                ))}

                {/* Completed */}
                <div style={{ fontWeight: 600, fontSize: 14, color: C.accentDark, margin: '14px 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Completed Today
                  <span style={{ ...statusBadge('completed') }}>{schedule.schedule.completed.length}</span>
                </div>
                {schedule.schedule.completed.length === 0 && <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>None yet.</div>}
                {schedule.schedule.completed.map(a => (
                  <div key={a._id} style={{ ...card({ marginBottom: 8, opacity: 0.75 }) }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{a.patientName || a.patient_name}</span>
                        <span style={{ fontSize: 12, color: C.muted }}> · Age {a.patientAge || a.patient_age || '—'} · Token {a.token_number}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 12, color: C.muted }}>{formatTime(a.appointment_time)}</span>
                        <span style={statusBadge('completed')}>done</span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ───────────────────────────────────────── */}
        {tab === 'history' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: C.accentDark }}>Work History</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={btn('ghost', 'sm')} onClick={downloadCSV}>⬇ CSV</button>
                <button style={btn('primary', 'sm')} onClick={downloadPDF}>🖨 PDF</button>
              </div>
            </div>

            {/* Range selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[[1, '1 Day'], [10, '10 Days'], [30, '30 Days'], [365, '1 Year']].map(([d, label]) => (
                <button key={d} style={btn(histRange === d ? 'primary' : 'ghost', 'sm')} onClick={() => setHistRange(d)}>
                  {label}
                </button>
              ))}
            </div>

            {/* Summary */}
            {histData && (
              <div style={card()}>
                <div style={{ fontWeight: 600, color: C.accentDark, marginBottom: 8 }}>
                  Summary — Last {histRange} day{histRange > 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ background: C.accentLight, borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: C.accentDark }}>{histData.total}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Patients Attended</div>
                  </div>
                  <div style={{ background: C.successBg, borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: C.success }}>{Object.keys(histData.grouped || {}).length}</div>
                    <div style={{ fontSize: 11, color: C.success }}>Days Worked</div>
                  </div>
                  <div style={{ background: C.infoBg, borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: C.info }}>
                      {Object.keys(histData.grouped || {}).length > 0
                        ? Math.round(histData.total / Object.keys(histData.grouped).length)
                        : 0}
                    </div>
                    <div style={{ fontSize: 11, color: C.info }}>Avg/Day</div>
                  </div>
                </div>
              </div>
            )}

            {/* Grouped by date */}
            {histData && Object.keys(histData.grouped || {}).sort((a, b) => b.localeCompare(a)).map(date => (
              <div key={date}>
                <div style={{ fontWeight: 600, fontSize: 13, color: C.muted, margin: '14px 0 8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{formatDate(date)}</span>
                  <span>{histData.grouped[date].length} patients</span>
                </div>
                {histData.grouped[date].map(a => (
                  <div key={a._id} style={{ ...card({ padding: '11px 16px', marginBottom: 6 }) }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{a.patientName || a.patient_name || '—'}</span>
                        <span style={{ fontSize: 12, color: C.muted }}> · Age {a.patientAge || a.patient_age || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: C.muted }}>{formatTime(a.appointment_time)}</span>
                        <span style={{ background: C.accentLight, color: C.accentDark, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{a.token_number}</span>
                        <span style={statusBadge('completed')}>done</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {histData && histData.total === 0 && (
              <div style={{ textAlign: 'center', color: C.muted, padding: 32, fontSize: 13 }}>
                No completed appointments in the last {histRange} day{histRange > 1 ? 's' : ''}.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
