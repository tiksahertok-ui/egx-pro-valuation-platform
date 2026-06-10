'use client'

import { useEffect, useCallback } from 'react'
import { toast } from 'sonner'

const SW_PATH = '/sw.js'
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000 // 1 hour

export function PwaRegister() {
  const registerServiceWorker = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    try {
      const registration = await navigator.serviceWorker.register(SW_PATH, {
        scope: '/',
      })

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            // New service worker has activated - notify user
            toast.info('App updated', {
              description: 'A new version is available. Refresh to get the latest.',
              action: {
                label: 'Refresh',
                onClick: () => window.location.reload(),
              },
              duration: 10000,
            })
          }
        })
      })

      // Periodic update check
      const checkForUpdates = () => {
        registration.update().catch((err) => {
          console.warn('[PWA] Update check failed:', err)
        })
      }

      // Check immediately
      checkForUpdates()

      // Then check periodically
      const interval = setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL)

      return () => clearInterval(interval)
    } catch (error) {
      console.warn('[PWA] Service worker registration failed:', error)
    }
  }, [])

  useEffect(() => {
    let cleanup: (() => void) | undefined

    registerServiceWorker().then((clean) => {
      if (clean) cleanup = clean
    })

    return () => {
      cleanup?.()
    }
  }, [registerServiceWorker])

  return null
}
