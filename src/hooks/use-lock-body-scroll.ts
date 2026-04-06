"use client"

import { useLayoutEffect } from 'react'

export function useLockBodyScroll(enabled: boolean = true) {
  useLayoutEffect(() => {
    if (!enabled) return

    // Get original body overflow
    const originalStyle = window.getComputedStyle(document.body).overflow
    
    // Prevent scrolling on mount
    document.body.style.overflow = 'hidden'
    
    // Re-enable scrolling on unmount or when disabled
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [enabled])
}
