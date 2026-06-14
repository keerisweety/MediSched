import { useState } from 'react'
import { sendOTP, signUp, signIn } from '../api'

export default function AuthPage({ onLogin }) {
  const [mode, setMode]       = useState('signin')
  const [role, setRole]       = useState('patient')
  const [name, setName]       = useState('')
  const [mobile, setMobile]   = useState('')
  const [email, setEmail]     = useState('')
  const [otp, setOtp]         = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Switch mode and reset all fields cleanly
  const switchMode = (m) => {
    setMode(m)
    setOtpSent(false)
    setOtp('')
    setError('')
    setName('')
    setMobile('')
    setEmail('')
  }

  const inp = {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1.5px solid #E8D5C8',
    fontSize: 14,
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: 12,
    outline: 'none',
    fontFamily: 'Georgia, serif',
    background: '#fff',
    color: '#3D2B1F'
  }

  const btn = (v = 'primary') => ({
    padding: '11px 0',
    width: '100%',
    borderRadius: 8,
    cursor: 'pointer',
    border: v === 'primary' ? 'none' : '1.5px solid #C4704F',
    background: v === 'primary' ? '#C4704F' : 'transparent',
    color: v === 'primary' ? '#fff' : '#C4704F',
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Georgia, serif'
  })

  const handleSendOTP = async () => {
    // Validate mobile
    if (!mobile || mobile.length < 10) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    // Validate email — needed for both signin and signup to receive OTP
    if (!email || !email.includes('@')) {
      setError('Enter your email address — OTP will be sent there')
      return
    }
    // Validate name only for signup
    if (mode === 'signup' && !name.trim()) {
      setError('Enter your full name')
      return
    }

    setLoading(true)
    setError('')
    try {
      await sendOTP(mobile, email, name || 'User')
      setOtpSent(true)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to send OTP. Is the backend running?')
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!otp || otp.length < 4) {
      setError('Enter the OTP from your email')
      return
    }
    setLoading(true)
    setError('')
    try {
      let res
      if (mode === 'signup') {
        res = await signUp({ name, mobile, email, otp, role })
      } else {
        res = await signIn({ mobile, otp })
      }

      const { access_token, user_id, name: uname, role: urole } = res.data

      // Save to localStorage — keeps user logged in after browser close
      localStorage.setItem('medisched_token', access_token)
      localStorage.setItem('medisched_user', JSON.stringify({
        id: user_id, name: uname, role: urole
      }))
      // Save email separately so sign in can use it next time
      localStorage.setItem('medisched_email', email)

      onLogin({ id: user_id, name: uname, role: urole })

    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong. Try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FDF0E8, #FAEEE7, #F5DDD0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: 390,
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 8px 40px rgba(180,100,60,0.13)',
        padding: '36px 36px 28px',
        border: '1px solid #E8D5C8'
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontSize: 34 }}>🏥</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#8B4A33', marginTop: 6, fontFamily: 'Georgia,serif' }}>
            MediSched Global
          </div>
          <div style={{ fontSize: 13, color: '#8C6B5A', marginTop: 3 }}>
            Healthcare Appointment Platform
          </div>
        </div>

        {/* Sign In / Sign Up tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #E8D5C8', marginBottom: 20 }}>
          {['signin', 'signup'].map(m => (
            <button key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1, padding: '10px 0',
                background: 'none', border: 'none',
                fontFamily: 'Georgia,serif',
                borderBottom: mode === m ? '3px solid #C4704F' : '3px solid transparent',
                color: mode === m ? '#C4704F' : '#8C6B5A',
                fontWeight: mode === m ? 700 : 500,
                cursor: 'pointer', fontSize: 14
              }}>
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Role picker — signup only */}
        {mode === 'signup' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {['patient', 'doctor'].map(r => (
              <button key={r} onClick={() => setRole(r)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8,
                  cursor: 'pointer', fontFamily: 'Georgia,serif',
                  border: `2px solid ${role === r ? '#C4704F' : '#E8D5C8'}`,
                  background: role === r ? '#F0C9B4' : '#fff',
                  color: role === r ? '#8B4A33' : '#8C6B5A',
                  fontWeight: 600, fontSize: 13
                }}>
                {r === 'patient' ? '👤 Patient' : '👨‍⚕️ Doctor'}
              </button>
            ))}
          </div>
        )}

        {/* Name — signup only */}
        {mode === 'signup' && (
          <input
            style={inp}
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}

        {/* Mobile — both */}
        <input
          style={inp}
          placeholder="Mobile Number (10 digits)"
          value={mobile}
          onChange={e => setMobile(e.target.value)}
        />

        {/* Email — both (needed to receive OTP) */}
        <input
          style={inp}
          placeholder="Email address (OTP will be sent here)"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        {/* Error box */}
        {error && (
          <div style={{
            color: '#B44040', fontSize: 12,
            marginBottom: 10, padding: '8px 12px',
            background: '#FDDCDC', borderRadius: 8
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* OTP flow */}
        {!otpSent ? (
          <button style={btn()} onClick={handleSendOTP} disabled={loading}>
            {loading ? 'Sending OTP…' : 'Send OTP'}
          </button>
        ) : (
          <>
            <div style={{
              fontSize: 12, color: '#8C6B5A',
              background: '#FDF6F0', borderRadius: 8,
              padding: '8px 12px', marginBottom: 10
            }}>
              📧 OTP sent to <b>{email}</b> — check your Gmail inbox
            </div>
            <input
              style={inp}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              maxLength={6}
            />
            <button style={btn()} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
            <button style={btn('ghost')} onClick={() => { setOtpSent(false); setOtp('') }}>
              ← Resend OTP
            </button>
          </>
        )}

        {/* Helper text */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#8C6B5A', marginTop: 8 }}>
          {mode === 'signin'
            ? 'New here? Click Sign Up to create an account'
            : 'Already have an account? Click Sign In'}
        </div>

      </div>
    </div>
  )
}
