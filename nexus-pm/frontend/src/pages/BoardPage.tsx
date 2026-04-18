import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useAuthStore } from '../store/useAuthStore'
import { useTaskStore, Task } from '../store/useTaskStore'
import { useSocket } from '../hooks/useSocket'
import toast from 'react-hot-toast'
import api from '../api/client'

const COLUMNS: { id: Task['status']; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: '#94a3b8' },
  { id: 'in_progress', label: 'In Progress', color: '#6366f1' },
  { id: 'review', label: 'Review', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#10b981' },
]

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuthStore()
  const { tasks, projects, loadTasks, loadProjects, createTask, updateTask, deleteTask } = useTaskStore()
  const navigate = useNavigate()

  const [users, setUsers] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  useSocket(projectId ?? null, user?.id ?? null)

  const project = projects.find(p => p.id === projectId)

  useEffect(() => {
    if (projectId) loadTasks(projectId)
    if (!projects.length) loadProjects()
    api.get('/auth/users/').then(r => setUsers(r.data)).catch(() => {})
  }, [projectId])

  const columnTasks = (status: Task['status']) =>
    tasks.filter(t => t.project_id === projectId && t.status === status)

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const newStatus = result.destination.droppableId as Task['status']
    const taskId = result.draggableId
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    try {
      await updateTask(taskId, { status: newStatus })
    } catch {
      toast.error('Failed to move task')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) return
    try {
      await createTask({
        project_id: projectId,
        title,
        description: desc,
      })
      toast.success('Task created!')
      setShowModal(false); setTitle(''); setDesc('')
    } catch {
      toast.error('Failed to create task')
    }
  }

  const handleDelete = async (task: Task) => {
    if (!confirm('Delete this task?')) return
    await deleteTask(task.id)
    setActiveTask(null)
    toast.success('Task deleted')
  }

  const handleAssign = async (taskId: string, userId: string) => {
    await useTaskStore.getState().assignTask(taskId, userId)
    toast.success('Task assigned')
    setActiveTask(null)
  }

  return (
    <div className="animate-fade" style={s.page}>
      <header className="glass-panel" style={s.header}>
        <div style={s.headerLeft}>
          <button onClick={() => navigate('/')} style={s.backBtn}>← Board list</button>
          <span style={s.projectName}>{project?.name || 'Board'}</span>
        </div>
        <div style={s.headerRight}>
          <span style={s.activeUsers}>Live sync active</span>
          <button onClick={() => setShowModal(true)} style={s.primaryBtn}>+ Add Task</button>
        </div>
      </header>

      <div style={s.board}>
        <DragDropContext onDragEnd={onDragEnd}>
          {COLUMNS.map(col => (
            <div key={col.id} className="glass-panel" style={s.column}>
              <div style={s.colHeader}>
                <div style={{...s.colDot, background: col.color}} />
                <span style={s.colLabel}>{col.label}</span>
                <span style={s.colCount}>{columnTasks(col.id).length}</span>
              </div>
              
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ ...s.colBody, background: snapshot.isDraggingOver ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                  >
                    {columnTasks(col.id).map((task, i) => (
                      <Draggable key={task.id} draggableId={task.id} index={i}>
                        {(drag, snap) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            className="card-hover"
                            style={{
                              ...s.taskCard,
                              opacity: snap.isDragging ? 0.8 : 1,
                              ...drag.draggableProps.style,
                            }}
                            onClick={() => setActiveTask(task)}
                          >
                            <p style={s.taskTitle}>{task.title}</p>
                            {task.priority !== 'medium' && (
                              <span style={{...s.priority, color: task.priority === 'high' ? 'var(--red)' : 'var(--text2)'}}>
                                {task.priority}
                              </span>
                            )}
                            <div style={s.taskFooter}>
                              {task.assignee_id && <div style={s.avatar}>{users.find(u => u.id === task.assignee_id)?.full_name?.[0] || 'U'}</div>}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </DragDropContext>
      </div>

      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div className="glass-panel" style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>New Task</h2>
            <form onSubmit={handleCreate} style={s.form}>
              <input placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} required />
              <textarea placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
              <div style={s.formRow}>
                <button type="button" onClick={() => setShowModal(false)} style={s.cancelBtn}>Cancel</button>
                <button type="submit" style={s.primaryBtn}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTask && (
        <div style={s.overlay} onClick={() => setActiveTask(null)}>
          <div className="glass-panel" style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ marginBottom: 16 }}>{activeTask.title}</h2>
              <button onClick={() => handleDelete(activeTask)} style={{ color: 'var(--red)', background: 'none', fontWeight: 600 }}>Delete</button>
            </div>
            <p style={{ color: 'var(--text2)', marginBottom: 24 }}>{activeTask.description || 'No description'}</p>
            
            <div style={{ display: 'grid', gap: 16 }}>
              <select 
                defaultValue="" 
                onChange={e => { if(e.target.value) handleAssign(activeTask.id, e.target.value) }}
              >
                <option value="">Assign to member...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
              <button onClick={() => setActiveTask(null)} style={s.cancelBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 70, background: 'var(--panel)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, borderRadius: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 20 },
  backBtn: { background: 'none', border: 'none', color: 'var(--text2)', fontWeight: 600, fontSize: 13 },
  projectName: { fontWeight: 800, fontSize: 18, color: '#fff' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 20 },
  activeUsers: { fontSize: 12, color: 'var(--green)', fontWeight: 600 },
  primaryBtn: { background: 'var(--accent)', color: '#fff', padding: '8px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13 },
  board: { display: 'flex', gap: 24, padding: '24px 40px', flex: 1, overflowX: 'auto', alignItems: 'flex-start' },
  column: { width: 320, minWidth: 320, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)' },
  colHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--border)' },
  colDot: { width: 8, height: 8, borderRadius: '50%' },
  colLabel: { fontWeight: 700, fontSize: 14, flex: 1 },
  colCount: { fontSize: 12, color: 'var(--text2)', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: 8 },
  colBody: { padding: 12, display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' },
  taskCard: { background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, cursor: 'pointer', transition: '0.2s' },
  taskTitle: { fontWeight: 600, fontSize: 14, marginBottom: 8 },
  priority: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase' },
  taskFooter: { display: 'flex', justifyContent: 'flex-end', marginTop: 12 },
  avatar: { width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { padding: 40, width: '100%', maxWidth: 500 },
  modalTitle: { fontSize: 22, fontWeight: 700, marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  formRow: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
  cancelBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '10px 20px', borderRadius: 10, fontWeight: 600 },
}
