'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'

interface InviteInfo {
  tripId: string
  tripName: string
  email: string
  expiresAt: string
}

function InviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const token = searchParams.get('token')

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [error, setError] = useState('')
  const [isAccepting, setIsAccepting] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link')
      setIsFetching(false)
      return
    }

    fetch(`/api/invites/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setInviteInfo(data)
      })
      .catch(() => setError('Failed to load invite'))
      .finally(() => setIsFetching(false))
  }, [token])

  const handleAccept = async () => {
    if (!token) return
    setIsAccepting(true)

    const res = await fetch(`/api/invites/${token}`, { method: 'POST' })
    const data = await res.json()

    if (res.status === 401 && data.code === 'AUTH_REQUIRED') {
      router.push(`/login?redirect=/invite?token=${token}`)
      return
    }

    if (data.error) {
      setError(data.error)
    } else {
      router.push(`/trips/${data.tripId}`)
    }
    setIsAccepting(false)
  }

  if (authLoading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-lg">
          <Users className="h-8 w-8 text-white" />
        </div>

        {error ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Invite Unavailable</h1>
            <p className="text-red-600">{error}</p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Go to Dashboard
            </Button>
          </>
        ) : inviteInfo ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">You&apos;re Invited!</h1>
            <p className="text-gray-600">
              Join <span className="font-semibold text-gray-900">{inviteInfo.tripName}</span> on PayLater
            </p>
            {!user && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
                You&apos;ll need to sign in or create an account to accept this invite.
              </p>
            )}
            <Button
              onClick={handleAccept}
              isLoading={isAccepting}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white"
            >
              {user ? 'Accept Invite' : 'Sign In & Accept'}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <InviteContent />
    </Suspense>
  )
}
