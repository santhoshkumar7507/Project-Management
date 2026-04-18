import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useTaskStore } from '../store/useTaskStore'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const { projects, loadProjects, createProject } = useTaskStore()
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const navigate = useNavigate()

  useEffect(() => { loadProjects() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const p = await createProject(name, desc, user!.id)
      toast.success('Project created!')
      setShowModal(false); setName(''); setDesc('')
      navigate(`/board/${p.id}`)
    } catch { toast.error('Failed to create project') }
  }

  return (
    <div className="animate-fade" style={s.page}>
      <header className="glass-panel" style={s.header}>
        <div style={s.logo}>⚡ NEXUS PM</div>
        <div style={s.headerRight}>
          <span style={s.userTag}>{user?.full_name || 'Administrator'} · {user?.role || 'Lead Designer'}</span>
          <button onClick={logout} style={s.logoutBtn}>Logout</button>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.topRow}>
          <div>
            <h1 style={s.pageTitle}>Project workspace</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>Manage and monitor your team's progress</p>
          </div>
          <button onClick={() => setShowModal(true)} style={s.primaryBtn}>Create Project</button>
        </div>

        {projects.length === 0 ? (
          <div className="glass-panel" style={s.empty}>
            <div style={s.emptyIcon}>🚀</div>
            <h3>Ready to build?</h3>
            <p>Your workspace is currently empty. Get started by creating your first project.</p>
            <button onClick={() => setShowModal(true)} style={{...s.primaryBtn, marginTop: 24}}>Initialize Project</button>
          </div>
        ) : (
          <div style={s.grid}>
            {projects.map(p => (
              <div key={p.id} className="glass-panel card-hover" style={s.card} onClick={() => navigate(`/board/${p.id}`)}>
                <div style={s.cardTop}>
                  <div style={s.cardDot} />
                  <span style={s.statusBadge}>{p.status}</span>
                </div>
                <h3 style={s.cardTitle}>{p.name}</h3>
                <p style={s.cardDesc}>{p.description || 'Enterprise project management and tracking framework.'}</p>
                <div style={s.cardFooter}>
                  <div style={s.team}>
                    <div style={s.miniAvatar}>V</div>
                    <div style={{...s.miniAvatar, marginLeft: -8, background: '#8b5cf6'}}>S</div>
                    <div style={{...s.miniAvatar, marginLeft: -8, background: '#10b981'}}>K</div>
                  </div>
                  <span style={s.date}>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div className="glass-panel" style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>New Project</h2>
            <form onSubmit={handleCreate} style={s.form}>
              <input placeholder="Project name" value={name} onChange={e => setName(e.target.value)} required />
              <textarea placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
              <div style={s.formRow}>
                <button type="button" onClick={() => setShowModal(false)} style={s.cancelBtn}>Cancel</button>
                <button type="submit" style={s.primaryBtn}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 80, background: 'var(--panel)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, borderRadius: 0 },
  logo: { fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '0.05em' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 20 },
  userTag: { fontSize: 13, color: 'var(--text2)', background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: 10, border: '1px solid var(--border)', fontWeight: 500 },
  logoutBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--text2)', padding: '6px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, transition: '0.2s' },
  main: { padding: '48px 40px', maxWidth: 1280, margin: '0 auto', width: '100%' },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 },
  pageTitle: { fontSize: 32, fontWeight: 700, marginBottom: 4, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  primaryBtn: { background: 'var(--accent)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 600, fontSize: 15, boxShadow: '0 4px 14px var(--accent-glow)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 },
  card: { padding: 32, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardDot: { width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 10px var(--green)' },
  statusBadge: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(255,255,255,0.05)', color: 'var(--text2)' },
  cardTitle: { fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#fff' },
  cardDesc: { fontSize: 14, color: 'var(--text2)', marginBottom: 24, lineHeight: 1.7 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.03)' },
  team: { display: 'flex', alignItems: 'center' },
  miniAvatar: { width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  date: { fontSize: 12, color: 'var(--text2)', fontWeight: 500 },
  empty: { textAlign: 'center', padding: '100px 40px', color: 'var(--text2)' },
  emptyIcon: { fontSize: 64, marginBottom: 24 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { padding: 40, width: '100%', maxWidth: 500 },
  modalTitle: { fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  formRow: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 },
  cancelBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '12px 24px', borderRadius: 12, fontSize: 15, fontWeight: 600 },
}
