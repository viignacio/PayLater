"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, User, Trash2, Eye } from "lucide-react"

interface ManageUsersModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  tripMembers: Array<{ id: string; name: string; avatar?: string | null; role: string }>
  onRemoveUser: (userId: string) => void
  onViewProfile: (user: { id: string; name: string; avatar?: string | null }) => void
}

export function ManageUsersModal({
  isOpen,
  onClose,
  tripId,
  tripMembers,
  onRemoveUser,
  onViewProfile
}: ManageUsersModalProps) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState('')
  const [isSendingInvite, setIsSendingInvite] = useState(false)

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setIsSendingInvite(true)
    setInviteError('')
    setInviteUrl(null)

    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId, email: inviteEmail.trim() }),
    })
    const data = await res.json()

    if (data.error) {
      setInviteError(data.error)
    } else {
      setInviteUrl(data.inviteUrl)
      setInviteEmail('')
    }
    setIsSendingInvite(false)
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      await onRemoveUser(userId)
    } catch (error) {
      console.error("Error removing user:", error)
    }
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store the current scroll position
      const scrollY = window.scrollY

      // Prevent scrolling on the body
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'

      return () => {
        // Restore scrolling when modal closes
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''

        // Restore scroll position
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm sm:max-w-md transform transition-all duration-300 scale-100 max-h-[80vh] flex flex-col">
        {/* Empty header space - 16px on mobile, 32px on desktop */}
        <div className="h-4 sm:h-8 flex-shrink-0"></div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto modal-scroll px-4 sm:px-8 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-gray-200/50">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg sm:rounded-2xl flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Add Gastadors</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 border border-gray-300 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-full"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          <div className="pt-2 sm:pt-3">
          {/* Invite by Email */}
          <div className="mb-4 sm:mb-6">
            <form onSubmit={handleSendInvite} className="space-y-3">
              <Input
                type="email"
                label="Invite by email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="friend@example.com"
                required
              />
              {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
              {inviteUrl && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                  <p className="text-sm text-green-700 font-medium">Invite link created!</p>
                  <p className="text-xs text-green-600 break-all">{inviteUrl}</p>
                  <button
                    type="button"
                    className="text-xs text-indigo-600 underline"
                    onClick={() => navigator.clipboard.writeText(inviteUrl)}
                  >
                    Copy link
                  </button>
                </div>
              )}
              <Button type="submit" isLoading={isSendingInvite} disabled={!inviteEmail.trim()}>
                Send Invite
              </Button>
            </form>
          </div>

          {/* Current Trip Members */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Trip Members ({tripMembers.length})
            </h3>

            {tripMembers.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No members added yet</p>
                <p className="text-gray-400 text-xs mt-1">Invite people using the form above</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                {tripMembers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg sm:rounded-xl border border-gray-200/50"
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-gray-900 font-medium text-sm sm:text-base truncate block">{user.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewProfile(user)}
                        className="text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 h-7 w-7 sm:h-8 sm:w-8"
                        title="View Profile"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveUser(user.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-7 w-7 sm:h-8 sm:w-8"
                        title="Remove from Trip"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 py-8 border-t border-gray-200/50">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 order-1 sm:order-2"
            >
              Done
            </Button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
