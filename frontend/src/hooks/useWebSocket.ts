import { useEffect, useRef, useState, useCallback } from 'react'

export interface WebSocketMessage<T = unknown> {
  type: string
  payload: T
}

export function useWebSocket<T = unknown>(url: string | null) {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage<T> | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!url) return

    const ws = new WebSocket(url)
    socketRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        setLastMessage(parsed)
      } catch {
        setLastMessage({ type: 'RAW', payload: event.data as T })
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    ws.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [url])

  const sendMessage = useCallback((message: unknown) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof message === 'string' ? message : JSON.stringify(message))
    }
  }, [])

  return { lastMessage, isConnected, sendMessage }
}

