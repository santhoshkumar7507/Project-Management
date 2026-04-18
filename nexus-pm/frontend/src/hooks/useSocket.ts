import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useTaskStore } from '../store/useTaskStore'

export function useSocket(projectId: string | null, userId: string | null) {
  const socketRef = useRef<Socket | null>(null)
  const applyLiveEvent = useTaskStore(s => s.applyLiveEvent)

  useEffect(() => {
    if (!projectId || !userId) return

    const socket = io('/', { path: '/ws/socket.io', transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join_project', { project_id: projectId, user_id: userId })
    })

    socket.on('task_event', (event: any) => {
      applyLiveEvent(event)
      const topic = event._topic
      if (topic === 'task.assigned' && event.assignee_id === userId) {
        toast('📋 You were assigned: ' + event.title, { icon: '🔔' })
      } else if (topic === 'task.updated') {
        toast(`🔄 ${event.title}: ${event.old_status} → ${event.new_status}`)
      } else if (topic === 'task.created') {
        toast(`✅ New task: ${event.title}`)
      }
    })

    return () => { socket.disconnect() }
  }, [projectId, userId])

  return socketRef
}
