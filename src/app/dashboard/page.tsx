"use client"

import { Button } from "@/components/ui/button"
import { Plus, Users, Sparkles, MapPin, Menu, X, ChevronDown, Edit3, LogOut, User } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loading } from "@/components/ui/loading"
import { useUser, useClerk } from "@clerk/nextjs"
import dynamic from "next/dynamic"
import { useClickOutside } from "@/hooks/use-click-outside"

const CreateTripModal = dynamic(() => import("@/components/trip/create-trip-modal").then(mod => mod.CreateTripModal))
const EditTripModal = dynamic(() => import("@/components/trip/edit-trip-modal").then(mod => mod.EditTripModal))
const UserManagementModal = dynamic(() => import("@/components/user/user-management-modal").then(mod => mod.UserManagementModal))
const UserProfileModal = dynamic(() => import("@/components/user/user-profile-modal").then(mod => mod.UserProfileModal))

interface Trip {
  id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  createdAt: string
  creator: {
    id: string
    name: string
  }
}

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

interface ApiUser {
  id: string
  name: string
  avatar?: string
  qrCode?: string
  totalOwed: string | number
  totalOwing: string | number
  deletedAt?: string
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { signOut } = useClerk()
  const { user } = useUser()
  const [trips, setTrips] = useState<Trip[]>([]) // Will be populated from API later
  const [users, setUsers] = useState<User[]>([]) // Global users list
  const [isLoading, setIsLoading] = useState(true) // Loading state for initial data fetch
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false)
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [isManageUsersModalOpen, setIsManageUsersModalOpen] = useState(false)
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isManageDropdownOpen, setIsManageDropdownOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const manageDropdownRef = useRef<HTMLDivElement>(null)

  const handleCreateTrip = async (tripData: {
    name: string
    description?: string
    startDate?: string
    endDate?: string
  }) => {
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      })

      if (!response.ok) {
        throw new Error('Failed to create trip')
      }

      const result = await response.json()
      const newTrip: Trip = {
        id: result.trip.id,
        name: result.trip.name,
        description: result.trip.description,
        startDate: result.trip.startDate,
        endDate: result.trip.endDate,
        createdAt: result.trip.createdAt,
        creator: result.trip.creator
      }
      
      setTrips(prev => [...prev, newTrip])
      console.log("Trip created successfully:", newTrip)
    } catch (error) {
      console.error("Error creating trip:", error)
      alert("Failed to create trip. Please try again.")
    }
  }

  const handleAddUser = async (name: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error('Failed to add user')
      }

      const result = await response.json()
      const newUser: User = {
        id: result.user.id,
        name: result.user.name,
        avatar: result.user.avatar,
        qrCode: result.user.qrCode,
        totalOwed: parseFloat(String(result.user.totalOwed)) || 0,
        totalOwing: parseFloat(String(result.user.totalOwing)) || 0,
        deletedAt: result.user.deletedAt,
        createdAt: result.user.createdAt
      }
      
      setUsers(prev => [...prev, newUser])
      console.log("User added successfully:", newUser)
    } catch (error) {
      console.error("Error adding user:", error)
      alert("Failed to add user. Please try again.")
    }
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove user')
      }

      // Reload active users (deleted user will be excluded from list)
      const usersResponse = await fetch('/api/users/active')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        const mappedUsers = (usersData.users || []).map((user: ApiUser) => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          qrCode: user.qrCode,
          totalOwed: parseFloat(String(user.totalOwed)) || 0,
          totalOwing: parseFloat(String(user.totalOwing)) || 0,
          deletedAt: user.deletedAt,
          createdAt: user.createdAt
        }))
        setUsers(mappedUsers)
      }
      console.log("User removed successfully:", userId)
    } catch (error) {
      console.error("Error removing user:", error)
      alert("Failed to remove user. Please try again.")
    }
  }

  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip)
    setIsEditTripModalOpen(true)
  }

  const handleViewProfile = (user: User) => {
    setSelectedUser(user)
    setIsUserProfileModalOpen(true)
  }

  const handleOpenMyProfile = () => {
    if (!user) return
    const me = users.find(u => u.id === user.id) ?? {
      id: user.id,
      name: user.fullName || "Me",
      avatar: user.imageUrl,
      totalOwed: 0,
      totalOwing: 0,
      createdAt: new Date().toISOString(),
    }
    setSelectedUser(me)
    setIsUserProfileModalOpen(true)
  }

  const handleUpdateUser = async (userId: string, updates: { name?: string; qrCode?: string }) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId, ...updates }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      const result = await response.json()
      const updatedUser: User = {
        id: result.user.id,
        name: result.user.name,
        avatar: result.user.avatar,
        qrCode: result.user.qrCode,
        totalOwed: parseFloat(String(result.user.totalOwed)) || 0,
        totalOwing: parseFloat(String(result.user.totalOwing)) || 0,
        createdAt: result.user.createdAt
      }

      // Update the user in the local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? updatedUser : user
      ))

      // Update selected user if it's the same user
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(updatedUser)
      }

      console.log("User updated successfully:", updatedUser)
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Failed to update user. Please try again.")
    }
  }

  const handleEditTripSubmit = async (tripId: string, tripData: {
    name: string
    description?: string
    startDate?: string
    endDate?: string
  }) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      })

      if (!response.ok) {
        throw new Error('Failed to update trip')
      }

      const result = await response.json()
      const updatedTrip: Trip = {
        id: result.trip.id,
        name: result.trip.name,
        description: result.trip.description,
        startDate: result.trip.startDate,
        endDate: result.trip.endDate,
        createdAt: result.trip.createdAt,
        creator: result.trip.creator
      }

      // Update the trip in the local state
      setTrips(prev => prev.map(trip => 
        trip.id === tripId ? updatedTrip : trip
      ))

      console.log("Trip updated successfully:", updatedTrip)
    } catch (error) {
      console.error("Error updating trip:", error)
      alert("Failed to update trip. Please try again.")
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle unsettled amounts error
        if (errorData.code === 'UNSETTLED_AMOUNTS') {
          alert(errorData.error)
          return
        }
        
        throw new Error(errorData.error || 'Failed to delete trip')
      }

      // Remove the trip from local state
      setTrips(prev => prev.filter(trip => trip.id !== tripId))
      
      console.log("Trip deleted successfully:", tripId)
      
      // Redirect to dashboard (this will happen automatically since we're already on dashboard)
    } catch (error) {
      console.error("Error deleting trip:", error)
      alert("Failed to delete trip. Please try again.")
      throw error // Re-throw so the modal can handle the error state
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  // Load existing trips and users on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Parallelize loading trips and users
        const [tripsResponse, usersResponse] = await Promise.all([
          fetch('/api/trips'),
          fetch('/api/users/active')
        ])

        if (tripsResponse.ok) {
          const tripsData = await tripsResponse.json()
          const mappedTrips = (tripsData.trips || []).map((trip: Trip) => ({
            id: trip.id,
            name: trip.name,
            description: trip.description,
            startDate: trip.startDate,
            endDate: trip.endDate,
            createdAt: trip.createdAt,
            creator: trip.creator
          }))
          setTrips(mappedTrips)
        }

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          const mappedUsers = (usersData.users || []).map((user: ApiUser) => ({
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            qrCode: user.qrCode,
            totalOwed: parseFloat(String(user.totalOwed)) || 0,
            totalOwing: parseFloat(String(user.totalOwing)) || 0,
            deletedAt: user.deletedAt,
            createdAt: user.createdAt
          }))
          setUsers(mappedUsers)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Use hooks for outside clicks
  useClickOutside(mobileMenuRef, () => setIsMobileMenuOpen(false))
  useClickOutside(manageDropdownRef, () => setIsManageDropdownOpen(false))

  return (
    <>
      {/* Enhanced Header */}
      <header id="dashboard-header" className="sticky top-0 z-50 glass border-b border-white/20 shadow-medium" suppressHydrationWarning>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 sm:h-20">
              <div className="flex items-center min-w-0 flex-1">
                <div className="relative group mr-3 sm:mr-4">
                  <Image src="/paylater.png" alt="PayLater Logo" width={32} height={32} priority className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                    PayLater
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium hidden sm:block">
                    Split expenses with friends
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden h-8 w-8 sm:h-10 sm:w-10 text-gray-700 hover:text-gray-900 hover:bg-gray-200/50"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
                
                {/* Desktop Menu Items */}
                <div className="hidden md:flex items-center space-x-3">
                  {/* Profile Avatar Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenMyProfile}
                    className="bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white hover:shadow-lg transition-all duration-200"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>

                  <div className="relative" ref={manageDropdownRef}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsManageDropdownOpen(!isManageDropdownOpen)}
                      className="bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white hover:shadow-lg transition-all duration-200"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage
                      <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-200 ${isManageDropdownOpen ? 'rotate-180' : ''}`} />
                    </Button>
                    
                    {/* Manage Dropdown */}
                    {isManageDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 py-2 z-50">
                        <button
                          onClick={() => {
                            setIsCreateTripModalOpen(true)
                            setIsManageDropdownOpen(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-white/50 transition-colors duration-200 flex items-center"
                        >
                          <Plus className="mr-3 h-4 w-4 text-indigo-600" />
                          <div>
                            <div className="font-medium text-gray-900">Create New Trip</div>
                            <div className="text-sm text-gray-500">Start a new trip</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setIsManageUsersModalOpen(true)
                            setIsManageDropdownOpen(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-white/50 transition-colors duration-200 flex items-center"
                        >
                          <Users className="mr-3 h-4 w-4 text-green-600" />
                          <div>
                            <div className="font-medium text-gray-900">Manage Group</div>
                            <div className="text-sm text-gray-500">Add or remove members</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Logout Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/40 relative overflow-hidden">
          {/* Enhanced animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-300/25 to-purple-300/25 rounded-full blur-3xl animate-float" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-300/25 to-pink-300/25 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-gradient-to-r from-indigo-200/15 to-purple-200/15 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '4s' }} />
            <div className="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-2xl animate-bounce-gentle" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-32 right-1/4 w-48 h-48 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-2xl animate-bounce-gentle" style={{ animationDelay: '3s' }} />
          </div>
          
          <div className="relative z-10">
            {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div ref={mobileMenuRef} className="md:hidden fixed top-16 sm:top-20 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-white/20 shadow-lg z-40">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
              <div className="flex flex-col space-y-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleOpenMyProfile()
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full justify-start bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white hover:shadow-lg transition-all duration-200"
                >
                  <User className="mr-3 h-4 w-4" />
                  My Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateTripModalOpen(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full justify-start bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="mr-3 h-4 w-4" />
                  Create New Trip
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsManageUsersModalOpen(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full justify-start bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white hover:shadow-lg transition-all duration-200"
                >
                  <Users className="mr-3 h-4 w-4" />
                  Manage Members
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleLogout()
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full justify-start bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Main Content */}
        <main id="dashboard-main" className="max-w-7xl mx-auto py-8 sm:py-16 px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
          <div className="text-center mb-12 sm:mb-20">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl mb-6 sm:mb-8 shadow-lg animate-bounce-gentle">
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-600" />
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-4 sm:mb-6 animate-fade-in sm:leading-relaxed lg:leading-loose">
              Welcome back! 
              <br className="sm:hidden" />
              <span className="block sm:inline"> Where to next?</span>
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto animate-fade-in-delay px-4 leading-relaxed">
              Create trips, add members, and split expenses easily with your friends. 
              <span className="block sm:inline mt-2 sm:mt-0"> Make every adventure memorable and fair!</span>
            </p>
          </div>

          {/* Quick Actions section removed - buttons moved to navbar */}

          {/* Enhanced Trips List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24">
              <Loading 
                size="lg"
                variant="spinner"
                color="primary"
                text="Loading your adventures..."
                subtext="Fetching trips and user data"
                className="min-h-[200px]"
              />
            </div>
          ) : trips.length === 0 ? (
            <div className="group max-w-2xl mx-auto">
              <div className="glass-premium rounded-[2.5rem] p-8 sm:p-12 lg:p-16 text-center shadow-glow transform transition-all duration-500 group-hover:scale-[1.02] relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 rounded-3xl sm:rounded-4xl" />
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-2xl" />
                
                <div className="relative z-10">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-3xl mb-6 sm:mb-8 group-hover:scale-110 transition-all duration-500 shadow-lg">
                    <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-indigo-600" />
                    <div className="absolute inset-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-3xl blur-xl opacity-60 animate-pulse-soft" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                    Ready for your first adventure?
                  </h3>
                  <p className="text-gray-600 mb-8 sm:mb-12 text-lg sm:text-xl max-w-lg mx-auto px-4 leading-relaxed">
                    Create your first trip to start tracking shared expenses with your friends. 
                    <span className="block mt-2 text-indigo-600 font-medium">Let&apos;s make every adventure memorable and fair!</span>
                  </p>
                  <Button 
                    size="lg"
                    variant="default"
                    onClick={() => setIsCreateTripModalOpen(true)}
                    className="h-12 sm:h-14 px-8 sm:px-10 text-lg"
                  >
                    <Sparkles className="mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                    Create Your First Trip
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                <div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                    Your Adventures
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {trips.length} {trips.length === 1 ? 'trip' : 'trips'} created
                  </p>
                </div>
                <Button
                  onClick={() => setIsCreateTripModalOpen(true)}
                  variant="default"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Trip
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {trips.map((trip, index) => (
                  <div key={trip.id} className="group h-full animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="glass-card rounded-[2rem] p-6 sm:p-8 shadow-medium transform transition-all duration-500 sm:group-hover:scale-[1.05] sm:group-hover:shadow-glow sm:group-hover:-translate-y-3 h-full flex flex-col relative overflow-hidden">
                      {/* Decorative background gradient */}
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50/30 via-transparent to-purple-50/30 rounded-3xl sm:rounded-4xl" />
                      
                      {/* Header Section */}
                      <div className="flex items-start justify-between mb-4 sm:mb-6 relative z-10">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg sm:group-hover:shadow-xl transition-all duration-300 sm:group-hover:scale-110">
                          <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                        </div>
                        <div className="text-right">
                          <span className="text-xs sm:text-sm text-gray-600 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/50 shadow-sm">
                            {trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            }) : 'No date'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Content Section - Flexible */}
                      <div className="flex-1 flex flex-col relative z-10">
                        <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 line-clamp-2 leading-tight">{trip.name}</h4>
                        {trip.description ? (
                          <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 line-clamp-3 flex-1 leading-relaxed">{trip.description}</p>
                        ) : null}
                      </div>
                      
                      {/* Footer Section - Fixed at bottom */}
                      <div className="flex flex-col gap-3 sm:gap-4 mt-auto relative z-10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm text-gray-500 font-medium">
                            Created {new Date(trip.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-pulse" />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/trips/${trip.id}`)}
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 w-full sm:flex-1 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            View Trip
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTrip(trip)}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300 w-full sm:flex-1 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            <Edit3 className="mr-1 h-3 w-3" />
                            Edit Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
          </div>
          
          {/* Enhanced floating particles */}
          <div className="absolute top-20 right-20 w-32 h-32 border border-indigo-300/40 rounded-full animate-spin shadow-lg" style={{ animationDuration: '20s' }} />
          <div className="absolute bottom-20 left-20 w-24 h-24 border border-purple-300/40 rounded-full animate-spin shadow-lg" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
          <div className="absolute top-1/2 left-1/2 w-16 h-16 border border-pink-300/40 rounded-full animate-spin shadow-lg" style={{ animationDuration: '25s' }} />
          <div className="absolute top-1/3 right-1/3 w-20 h-20 border border-emerald-300/30 rounded-full animate-float shadow-md" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-1/3 left-1/3 w-12 h-12 border border-amber-300/30 rounded-full animate-bounce-gentle shadow-md" style={{ animationDuration: '6s' }} />
        </div>

      {/* Modals */}
      <CreateTripModal
        isOpen={isCreateTripModalOpen}
        onClose={() => setIsCreateTripModalOpen(false)}
        onCreateTrip={handleCreateTrip}
      />

      <EditTripModal
        isOpen={isEditTripModalOpen}
        onClose={() => {
          setIsEditTripModalOpen(false)
          setSelectedTrip(null)
        }}
        trip={selectedTrip}
        onEditTrip={handleEditTripSubmit}
        onDeleteTrip={handleDeleteTrip}
      />

      <UserManagementModal
        isOpen={isManageUsersModalOpen}
        onClose={() => setIsManageUsersModalOpen(false)}
        users={users}
        onAddUser={handleAddUser}
        onRemoveUser={handleRemoveUser}
        onViewProfile={handleViewProfile}
      />

      <UserProfileModal
        isOpen={isUserProfileModalOpen}
        onClose={() => {
          setIsUserProfileModalOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onUpdateUser={handleUpdateUser}
      />
    </>
  )
}
