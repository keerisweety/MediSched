import { useState } from 'react'
import AuthPage from './pages/AuthPage'
import PatientApp from './pages/PatientApp'
import DoctorApp from './pages/DoctorApp'

export default function App() {

  // useState with a function inside = lazy initializer.
  // This function runs ONCE when the app first loads.
  // It checks localStorage for a previously saved user.
  // If found → user is already logged in, skip AuthPage.
  // If not found → show AuthPage.
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('medisched_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null   // if JSON.parse fails for any reason, treat as logged out
       }
  })

  const handleLogin = (userData) => {
    setUser(userData)
    // Note: token + user are already saved to localStorage inside AuthPage.jsx
    // handleLogin just updates the React state so the UI re-renders
  }

  const handleLogout = () => {
    localStorage.removeItem('medisched_token')
    localStorage.removeItem('medisched_user')
    setUser(null)   // this triggers a re-render → AuthPage shows up
  }

  // Route based on login state and role
  if (!user)                  return <AuthPage onLogin={handleLogin} />
  if (user.role === 'doctor') return <DoctorApp  user={user} onLogout={handleLogout} />
  return                             <PatientApp user={user} onLogout={handleLogout} />
}