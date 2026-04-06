"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Upload, QrCode, DollarSign, CreditCard, Camera, Edit3, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils"
import { createClient } from '@/lib/supabase/client'
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll"

interface User {
  id: string
  name: string
  avatar?: string
  qrCode?: string
  totalOwed: number
  totalOwing: number
  createdAt: string
}

interface TripBalance {
  tripId: string
  tripName: string
  youOwe: number
  youAreOwed: number
}

interface UserBalance {
  userId: string
  youOwe: number
  youAreOwed: number
  netBalance: number
  tripBalances: TripBalance[]
}

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onUpdateUser: (userId: string, updates: { name?: string; qrCode?: string }) => void
}

export function UserProfileModal({ isOpen, onClose, user, onUpdateUser }: UserProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(user?.name || "")
  const [isUploading, setIsUploading] = useState(false)
  const [isQrViewerOpen, setIsQrViewerOpen] = useState(false)
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [expandedCard, setExpandedCard] = useState<'owed' | 'owing' | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Prevent body scroll when modal is open
    useLockBodyScroll(isOpen || isQrViewerOpen)

  const fetchUserBalance = useCallback(async () => {
    if (!user) return
    
    setIsLoadingBalance(true)
    try {
      const response = await fetch(`/api/users/${user.id}/balance`)
      if (response.ok) {
        const balanceData = await response.json()
        setUserBalance(balanceData)
      }
    } catch (error) {
      console.error('Error fetching user balance:', error)
    } finally {
      setIsLoadingBalance(false)
    }
  }, [user])

  // Update edited name when user changes
  useEffect(() => {
    setEditedName(user?.name || "")
  }, [user])

  // Fetch user balance data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchUserBalance()
    }
  }, [isOpen, user, fetchUserBalance])

  // Close QR viewer when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsQrViewerOpen(false)
    }
  }, [isOpen])

  // Generate signed URL for QR code from Supabase Storage
  useEffect(() => {
    const fetchQrUrl = async () => {
      if (!user?.qrCode) { setQrUrl(null); return }
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('qr-codes')
        .createSignedUrl(user.qrCode, 3600)
      setQrUrl(data?.signedUrl ?? null)
    }
    fetchQrUrl()
  }, [user?.qrCode])

  if (!isOpen || !user) return null

  const handleSave = async () => {
    if (editedName.trim() && editedName !== user.name) {
      await onUpdateUser(user.id, { name: editedName.trim() })
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedName(user.name)
    setIsEditing(false)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setIsUploading(true)
    try {
      await handleQrUpload(file)
    } catch (error) {
      console.error('Error uploading QR code:', error)
      alert('Failed to upload QR code')
    } finally {
      setIsUploading(false)
    }
  }

  const handleQrUpload = async (file: File) => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const ext = file.name.split('.').pop()
    const path = `${authUser.id}/qr.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      console.error('QR upload failed:', uploadError.message)
      return
    }

    // Save the storage path to the profile
    await fetch('/api/users/qr', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode: path }),
    })
  }

  const handleRemoveQRCode = async () => {
    await onUpdateUser(user.id, { qrCode: "" })
  }

  const handleCardClick = (cardType: 'owed' | 'owing') => {
    if (expandedCard === cardType) {
      setExpandedCard(null)
    } else {
      setExpandedCard(cardType)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm sm:max-w-2xl transform transition-all duration-300 scale-100 max-h-[80vh] flex flex-col">
        {/* Empty header space - 16px on mobile, 32px on desktop */}
        <div className="h-4 sm:h-8 flex-shrink-0"></div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto modal-scroll px-4 sm:px-8 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-gray-200/50">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">User Profile</h2>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage user details and payment methods</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-200/50 border border-gray-300 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-full"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="space-y-4 sm:space-y-6">
            {/* User Profile Card */}
            <div className="bg-gradient-to-br from-white to-neutral-50 rounded-xl border border-neutral-200 px-3 py-2 sm:px-4 sm:py-3">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg sm:rounded-xl flex items-center justify-center shadow-soft flex-shrink-0">
                  <span className="text-lg sm:text-xl font-bold text-primary-700">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="text-base sm:text-lg font-semibold"
                        placeholder="Enter name"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSave} className="flex-1">
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 truncate">
                          {user.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-600">
                          Member since {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditing(true)}
                        className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex-shrink-0"
                        title="Edit Name"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Balance Overview */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-primary-600" />
                Balance Overview
              </h3>
              
              {isLoadingBalance ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-3 sm:p-4 animate-pulse">
                    <div className="h-16"></div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-3 sm:p-4 animate-pulse">
                    <div className="h-16"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Total Owed Card */}
                  <div 
                    className="bg-gradient-to-br from-error-50 to-error-100 border border-error-200 rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-200"
                    onClick={() => handleCardClick('owed')}
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-error-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-error-600" />
                        </div>
                        <p className="text-xs sm:text-sm text-error-600 font-medium">You Owe</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-error-600 bg-error-200 px-2 py-1 rounded-full">
                          DEBT
                        </span>
                        {expandedCard === 'owed' ? (
                          <ChevronUp className="h-4 w-4 text-error-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-error-600" />
                        )}
                      </div>
                    </div>
                    <div>
                      {isLoadingBalance ? (
                        <div className="h-6 sm:h-8 bg-error-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-lg sm:text-2xl font-bold text-error-700">
                          ₱ {userBalance ? formatCurrency(userBalance.youOwe) : '0.00'}
                        </p>
                      )}
                    </div>
                    
                    {/* Expanded Content */}
                    {expandedCard === 'owed' ? (
                      <div className="mt-3 pt-3 border-t border-error-200">
                        {isLoadingBalance ? (
                          <div className="space-y-2">
                            <p className="text-xs text-error-600 font-medium mb-2">Amounts you owe by trip:</p>
                            <div className="space-y-2">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center text-sm ml-4 mr-4 animate-pulse">
                                  <div className="h-4 bg-error-200 rounded w-24 flex-shrink-0"></div>
                                  <div className="flex-1 mx-2 border-b border-dotted border-error-200 min-h-[1px]"></div>
                                  <div className="h-4 bg-error-200 rounded w-16 flex-shrink-0"></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : userBalance && userBalance.tripBalances.filter(trip => trip.youOwe > 0).length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs text-error-600 font-medium mb-2">Amounts you owe by trip:</p>
                            {userBalance.tripBalances
                              .filter(trip => trip.youOwe > 0)
                              .map(trip => (
                                <div key={trip.tripId} className="flex items-center text-sm ml-4 mr-4">
                                  <span className="text-error-700 truncate flex-shrink-0">{trip.tripName}</span>
                                  <div className="flex-1 mx-2 border-b border-dotted border-error-300 min-h-[1px]"></div>
                                  <span className="text-error-600 font-medium flex-shrink-0">₱ {formatCurrency(trip.youOwe)}</span>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-xs text-error-500">No outstanding amounts</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                  
                  {/* Total Owing Card */}
                  <div 
                    className="bg-gradient-to-br from-success-50 to-success-100 border border-success-200 rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-200"
                    onClick={() => handleCardClick('owing')}
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-success-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-success-600" />
                        </div>
                        <p className="text-xs sm:text-sm text-success-600 font-medium">You&apos;re Owed</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-success-600 bg-success-200 px-2 py-1 rounded-full">
                          CREDIT
                        </span>
                        {expandedCard === 'owing' ? (
                          <ChevronUp className="h-4 w-4 text-success-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-success-600" />
                        )}
                      </div>
                    </div>
                    <div>
                      {isLoadingBalance ? (
                        <div className="h-6 sm:h-8 bg-success-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-lg sm:text-2xl font-bold text-success-700">
                          ₱ {userBalance ? formatCurrency(userBalance.youAreOwed) : '0.00'}
                        </p>
                      )}
                    </div>
                    
                    {/* Expanded Content */}
                    {expandedCard === 'owing' ? (
                      <div className="mt-3 pt-3 border-t border-success-200">
                        {isLoadingBalance ? (
                          <div className="space-y-2">
                            <p className="text-xs text-success-600 font-medium mb-2">Amounts you&apos;re owed by trip:</p>
                            <div className="space-y-2">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center text-sm ml-4 mr-4 animate-pulse">
                                  <div className="h-4 bg-success-200 rounded w-24 flex-shrink-0"></div>
                                  <div className="flex-1 mx-2 border-b border-dotted border-success-200 min-h-[1px]"></div>
                                  <div className="h-4 bg-success-200 rounded w-16 flex-shrink-0"></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : userBalance && userBalance.tripBalances.filter(trip => trip.youAreOwed > 0).length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs text-success-600 font-medium mb-2">Amounts you&apos;re owed by trip:</p>
                            {userBalance.tripBalances
                              .filter(trip => trip.youAreOwed > 0)
                              .map(trip => (
                                <div key={trip.tripId} className="flex items-center text-sm ml-4 mr-4">
                                  <span className="text-success-700 truncate flex-shrink-0">{trip.tripName}</span>
                                  <div className="flex-1 mx-2 border-b border-dotted border-success-300 min-h-[1px]"></div>
                                  <span className="text-success-600 font-medium flex-shrink-0">₱ {formatCurrency(trip.youAreOwed)}</span>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-xs text-success-500">No outstanding amounts</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Section */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center">
                <QrCode className="h-4 w-4 mr-2 text-primary-600" />
                Payment Method
              </h3>
              
              <div className="bg-gradient-to-br from-white to-neutral-50 border border-neutral-200 rounded-xl p-3 sm:p-4">
                {user.qrCode ? (
                  <div className="space-y-3 sm:space-y-4">
                    {/* QR Code Display */}
                    <div className="text-center">
                      <div className="inline-block p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-soft border border-neutral-200">
                        {qrUrl ? (
                          <Image
                            src={qrUrl}
                            alt="Payment QR Code"
                            width={120}
                            height={120}
                            className="rounded-lg w-24 h-24 sm:w-40 sm:h-40"
                          />
                        ) : null}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {/* View QR Code Button - First Row */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsQrViewerOpen(true)}
                        className="w-full"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        View QR Code
                      </Button>
                      
                      {/* Replace and Remove Buttons - Second Row */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="flex-1"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {isUploading ? "Uploading..." : "Replace"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveQRCode}
                          className="flex-1 text-error-600 border-error-200 hover:bg-error-50"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3 sm:space-y-4">
                    {/* Empty State */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-100 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto">
                      <QrCode className="h-6 w-6 sm:h-8 sm:w-8 text-neutral-400" />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm sm:text-base font-semibold text-neutral-900">No QR Code Added</h4>
                      <p className="text-neutral-600 text-xs sm:text-sm max-w-sm mx-auto">
                        Add a QR code to make payments easier for your friends
                      </p>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {isUploading ? "Uploading..." : "Add QR Code"}
                    </Button>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500 text-center">
                    Supported formats: JPG, PNG, GIF (max 5MB)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex justify-center py-8 border-t border-gray-200/50 px-4 sm:px-8">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto px-8"
          >
            Close
          </Button>
        </div>
      </div>

      {/* QR Code Viewer Modal */}
      {isQrViewerOpen && user.qrCode ? (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm sm:max-w-md transform transition-all duration-300 scale-100 max-h-[80vh] flex flex-col">
            {/* Empty header space - 16px on mobile, 32px on desktop */}
            <div className="h-4 sm:h-8 flex-shrink-0"></div>
            
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto modal-scroll px-4 sm:px-8 min-h-0">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-gray-200/50">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg sm:rounded-2xl flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                    <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Payment QR Code</h2>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{user.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsQrViewerOpen(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 border border-gray-300 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-full flex items-center justify-center"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>

              {/* QR Code Display */}
              <div className="pt-4 sm:pt-6 text-center">
                <div className="inline-block p-2 sm:p-4 bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 mb-4 sm:mb-6">
                  {qrUrl ? (
                    <Image
                      src={qrUrl}
                      alt="Payment QR Code"
                      width={320}
                      height={320}
                      className="rounded-xl w-72 h-72 sm:w-80 sm:h-80"
                      priority
                    />
                  ) : null}
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Scan to Pay</h3>
                  <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
                    Use your phone&apos;s camera to scan this code and make a payment to {user.name}.
                  </p>
                </div>
              </div>

              {/* Download QR Code */}
              {user.qrCode && user.qrCode.startsWith('data:image') ? (
                <div className="pt-4 sm:pt-6 border-t border-gray-200/50 mt-4 sm:mt-6">
                  <Button
                    onClick={() => {
                      // Create download link for base64 image
                      const link = document.createElement('a')
                      link.href = user.qrCode!
                      link.download = `${user.name}-qr-code.png`
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                    className="w-full text-green-600 border-green-200 hover:bg-green-50"
                  >
                    Download QR Code
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}