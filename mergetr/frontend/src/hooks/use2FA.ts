import { useState } from 'react'

export function use2FA() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function clearError() {
    setError(null)
  }

  async function verifyOTP(email: string, code: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = data && data.error ? data.error : `Server returned ${res.status}`
        setError(msg)
        throw new Error(msg)
      }

      return await res.json()
    } finally {
      setLoading(false)
    }
  }

  return { verifyOTP, loading, error, clearError }
}
