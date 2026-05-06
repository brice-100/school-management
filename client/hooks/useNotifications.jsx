import { useState, useEffect, useRef, useCallback } from 'react'
import { getMyNotifications } from '../services/notificationService'

const POLL_INTERVAL = 30000 // 30 secondes

// ── Son via Web Audio API ────────────────────────────────────────
function playSound() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const now  = ctx.currentTime

    const beep = (t, freq, dur, vol = 0.25) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(vol, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
      osc.start(t)
      osc.stop(t + dur + 0.05)
    }

    beep(now,        880,  0.12)
    beep(now + 0.16, 1100, 0.15)
    setTimeout(() => ctx.close(), 1000)
  } catch {
    // navigateur sans Web Audio — silencieux
  }
}

// ── Notification navigateur ──────────────────────────────────────
function showBrowserNotif(sujet, message) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(sujet || 'ÉcoleManager — Nouveau message', {
      body:   message.slice(0, 150),
      icon:   '/favicon.ico',
      silent: false,
    })
  } catch { /* silencieux */ }
}

async function askPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

// ── Hook principal ───────────────────────────────────────────────
export function useNotifications(role) {
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [notifications, setNotifications] = useState([])
  const lastIdRef   = useRef(null)  // dernier ID connu au moment du check
  const isParent    = role === 'parent'

  // Premier chargement : initialise lastId sans jouer de son
  const init = useCallback(async () => {
    if (!isParent) return
    try {
      const { data } = await getMyNotifications()
      const list = data.data   || []
      const nb   = data.unread || 0
      setNotifications(list)
      setUnreadCount(nb)
      if (list.length > 0) lastIdRef.current = list[0].id
    } catch { /* silencieux */ }
  }, [isParent])

  // Poll : détecte les nouvelles notifs et joue le son
  const poll = useCallback(async () => {
    if (!isParent) return
    try {
      const { data } = await getMyNotifications()
      const list = data.data   || []
      const nb   = data.unread || 0

      setNotifications(list)
      setUnreadCount(nb)

      if (list.length > 0) {
        const latestId = list[0].id
        if (lastIdRef.current !== null && latestId > lastIdRef.current) {
          // Nouvelles notifs non lues depuis le dernier check
          const nouvelles = list.filter(n => n.id > lastIdRef.current && !n.lu)
          if (nouvelles.length > 0) {
            playSound()
            nouvelles.forEach(n => showBrowserNotif(n.sujet, n.message))
          }
        }
        lastIdRef.current = latestId
      }
    } catch { /* silencieux */ }
  }, [isParent])

  useEffect(() => {
    if (!isParent) return

    askPermission()
    init()

    const timer = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [isParent, init, poll])

  // Rafraîchir manuellement (après markRead)
  const refresh = useCallback(() => { if (isParent) init() }, [isParent, init])

  return { unreadCount, notifications, refresh }
}