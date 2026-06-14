import axios from 'axios'

const API = axios.create({ baseURL: 'https://medisched-qzer.onrender.com' })

API.interceptors.request.use(config => {
  const token = localStorage.getItem('medisched_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auth ──────────────────────────────────────────────────────────────────────
export const sendOTP = (mobile, email, name) =>
  API.post('/auth/send-otp', { mobile, email, name })
export const signUp  = (data) => API.post('/auth/signup', data)
export const signIn  = (data) => API.post('/auth/signin', data)
export const getMe   = (token) => API.get(`/auth/me?token=${token}`)

// ── Hospitals ─────────────────────────────────────────────────────────────────
export const getHospitals  = (lat, lng) =>
  API.get(`/hospitals/${lat && lng ? `?lat=${lat}&lng=${lng}` : ''}`)
export const seedHospitals = () => API.post('/hospitals/seed')

// ── Patients ──────────────────────────────────────────────────────────────────
export const getMyPatients = (userId)   => API.get(`/patients/mine?user_id=${userId}`)
export const addPatient    = (data)     => API.post('/patients/', data)
export const updatePatient = (id, data) => API.put(`/patients/${id}`, data)
export const deletePatient = (id)       => API.delete(`/patients/${id}`)

// ── Appointments ──────────────────────────────────────────────────────────────
export const bookAppointment   = (data)   => API.post('/appointments/book', data)
export const getMyAppointments = (userId) => API.get(`/appointments/mine?user_id=${userId}`)
export const updateApptStatus  = (id, status) =>
  API.put(`/appointments/${id}/status`, { status })

// ── History ───────────────────────────────────────────────────────────────────
export const getPatientHistory  = (patientId) => API.get(`/history/patient/${patientId}`)
export const getUserHistory     = (userId)    => API.get(`/history/user/${userId}`)
export const addHistory         = (data)      => API.post('/history/', data)
export const seedHistory        = (userId)    => API.post(`/history/seed/${userId}`)

// ── Regular Visits ────────────────────────────────────────────────────────────
export const getRegularVisits   = (userId)          => API.get(`/history/regular/${userId}`)
export const addRegularVisit    = (data)             => API.post('/history/regular', data)
export const toggleReminder     = (visitId, reminder) =>
  API.put(`/history/regular/${visitId}/reminder`, { reminder })
export const deleteRegularVisit = (visitId)          => API.delete(`/history/regular/${visitId}`)
export const seedRegularVisits  = (userId)           => API.post(`/history/regular/seed/${userId}`)

// ── Doctors ───────────────────────────────────────────────────────────────────
export const getDoctorProfile  = (userId)       => API.get(`/doctors/profile/${userId}`)
export const saveDoctorProfile = (data)         => API.post('/doctors/profile', data)
export const updateShift       = (userId, data) => API.put(`/doctors/shift/${userId}`, data)
export const getDoctorSchedule = (userId, date) =>
  API.get(`/doctors/schedule/${userId}${date ? `?date=${date}` : ''}`)
export const appointPatient    = (apptId)       => API.put(`/doctors/appoint/${apptId}`)
export const cancelByDoctor    = (apptId, reason) =>
  API.put(`/doctors/cancel/${apptId}`, { reason })
export const completeAppt      = (apptId, data) => API.put(`/doctors/complete/${apptId}`, data)
export const getDoctorHistory  = (userId, days) =>
  API.get(`/doctors/history/${userId}?days=${days}`)
export const seedDoctorProfile = (userId)       => API.post(`/doctors/seed/${userId}`)

export default API
