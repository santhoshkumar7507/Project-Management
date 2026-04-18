import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, fullName)
      }
      navigate('/')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade" style={s.page}>
      <div className="glass-panel" style={s.card}>
        <div style={s.logo}>NEXUS PM</div>
        <h2 style={s.title}>{mode === 'login' ? 'Welcome back' : 'Join the elite'}</h2>
        <p style={s.subtitle}>{mode === 'login' ? 'Secure access to your workspace' : 'Start managing projects with precision'}</p>
        
        <form onSubmit={handleSubmit} style={s.form}>
          {mode === 'register' && (
            <input
              placeholder="Full name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign in' : 'Register now'}
          </button>
        </form>
        
        <div style={s.divider}>
          <div style={s.line}></div>
          <span style={s.dividerText}>OR</span>
          <div style={s.line}></div>
        </div>

        <p style={s.toggle}>
          {mode === 'login' ? "New to Nexus? " : 'Member already? '}
          <span
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={s.link}
          >
            {mode === 'login' ? 'Create an account' : 'Log in here'}
          </span>
        </p>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { padding: '56px 48px', width: '100%', maxWidth: 460, textAlign: 'center' },
  logo: { fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#fff' },
  subtitle: { fontSize: 14, color: 'var(--text2)', marginBottom: 32 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  btn: { padding: '14px', borderRadius: 12, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 15, marginTop: 8, boxShadow: '0 4px 14px var(--accent-glow)' },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' },
  line: { flex: 1, height: 1, background: 'var(--border)' },
  dividerText: { fontSize: 11, fontWeight: 700, color: 'var(--text2)', opacity: 0.5 },
  toggle: { marginTop: 12, color: 'var(--text2)', fontSize: 14 },
  link: { color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, marginLeft: 6 },
}
