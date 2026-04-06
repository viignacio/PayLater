"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { X, User, Plus, Eye, Trash2 } from "lucide-react"
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll"

interface User {
  id: string
  name: string
  avatar?: string
  qrCode?: string
  totalOwed: number
  totalOwing: number
  deletedAt?: string
  createdAt: string
}

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
  users: User[]
  onAddUser: (name: string) => void
  onRemoveUser: (userId: string) => void
  onViewProfile: (user: User) => void
}

export function UserManagementModal({ 
  isOpen, 
  onClose, 
  users, 
  onAddUser, 
  onRemoveUser,
  onViewProfile
}: UserManagementModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userBalance, setUserBalance] = useState<{ youOwe: number; youAreOwed: number } | null>(null)

  // Prevent body scroll when modal is open
  useLockBodyScroll(isOpen)

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserName.trim()) return

    setIsLoading(true)
    try {
      await onAddUser(newUserName.trim())
      setNewUserName("")
    } catch (error) {
      console.error("Error adding user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserBalance = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/balance`)
      if (response.ok) {
        const data = await response.json()
        setUserBalance({
          youOwe: data.youOwe || 0,
          youAreOwed: data.youAreOwed || 0
        })
      }
    } catch (error) {
      console.error("Error fetching user balance:", error)
      setUserBalance({ youOwe: 0, youAreOwed: 0 })
    }
  }

  const handleDeleteClick = async (user: User) => {
    setUserToDelete(user)
    await fetchUserBalance(user.id)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    
    setIsLoading(true)
    try {
      await onRemoveUser(userToDelete.id)
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      setUserBalance(null)
    } catch (error) {
      console.error("Error removing user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setUserToDelete(null)
    setUserBalance(null)
  }

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl sm:rounded-4xl shadow-3xl border border-white/30 w-full max-w-sm sm:max-w-md transform transition-all duration-500 scale-100 max-h-[80vh] flex flex-col relative overflow-hidden">
        {/* Decorative background gradient */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-50/30 via-transparent to-emerald-50/30 rounded-3xl sm:rounded-4xl" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-2xl" />
        
        {/* Empty header space - 16px on mobile, 32px on desktop */}
        <div className="h-4 sm:h-8 flex-shrink-0"></div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto modal-scroll px-4 sm:px-8 min-h-0 relative z-10">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-gray-200/50">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 shadow-lg">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Manage Group</h2>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Add and manage members</p>
              </div>
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
            {/* Enhanced Add New User Form */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Add New Member</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <Input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter member name"
                  className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  required
                />
                <Button
                  type="submit"
                  disabled={isLoading || !newUserName.trim()}
                  className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 h-12 font-semibold shadow-lg hover:shadow-xl"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isLoading ? "Adding..." : "Add Member"}
                </Button>
              </form>
            </div>

            {/* Enhanced Search Users */}
            <div className="mb-6">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search members..."
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              />
            </div>

            {/* Enhanced Current Users */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">
                All Members ({filteredUsers.length})
              </h3>
              
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base font-medium">
                    {searchTerm ? "No members found" : "No members added yet"}
                  </p>
                  {!searchTerm && (
                    <p className="text-gray-400 text-xs mt-2">Add a new member above to get started</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm"
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-gray-900 font-semibold text-sm sm:text-base truncate block">{user.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewProfile(user)}
                          className="text-gray-400 h-8 w-8 sm:h-9 sm:w-9 rounded-lg"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(user)}
                          className="text-gray-400 h-8 w-8 sm:h-9 sm:w-9 rounded-lg"
                          title="Remove Member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center py-8 border-t border-gray-200/50">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 w-full sm:w-auto px-8"
            >
              Done
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={
          userToDelete ? (
            <div>
              <p className="mb-3">
                Are you sure you want to delete <strong>{userToDelete.name}</strong>? This action cannot be undone.
              </p>
              {userBalance && (userBalance.youOwe > 0 || userBalance.youAreOwed > 0) ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm font-medium mb-1">⚠️ Outstanding Amounts</p>
                  <p className="text-yellow-700 text-sm">
                    This user has outstanding amounts:
                    {userBalance.youOwe > 0 ? (
                      <span className="block">• Owes: ₱{userBalance.youOwe.toFixed(2)}</span>
                    ) : null}
                    {userBalance.youAreOwed > 0 ? (
                      <span className="block">• Is owed: ₱{userBalance.youAreOwed.toFixed(2)}</span>
                    ) : null}
                    <span className="block mt-1">These amounts will be preserved for settlement purposes.</span>
                  </p>
                </div>
              ) : null}
            </div>
          ) : ""
        }
        confirmText="Delete User"
        cancelText="Cancel"
        variant="danger"
        isLoading={isLoading}
      />
    </div>
  )
}
