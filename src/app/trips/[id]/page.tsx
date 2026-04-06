"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, Users, DollarSign, Receipt, Calculator, Eye, ChevronDown, ChevronUp, ChevronRight, QrCode, X, Edit } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Image from "next/image"
import dynamic from "next/dynamic"
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll"

const CreateExpenseModal = dynamic(() => import("@/components/expense/create-expense-modal").then(mod => mod.CreateExpenseModal))
const EditExpenseModal = dynamic(() => import("@/components/expense/edit-expense-modal").then(mod => mod.EditExpenseModal))
const ManageUsersModal = dynamic(() => import("@/components/trip/manage-users-modal").then(mod => mod.ManageUsersModal))
const UserProfileModal = dynamic(() => import("@/components/user/user-profile-modal").then(mod => mod.UserProfileModal))
const SettlementView = dynamic(() => import("@/components/expense/settlement-view").then(mod => mod.SettlementView))

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
  members: Array<{
    id: string
    user: {
      id: string
      name: string
    }
    role: string
  }>
}

interface User {
  id: string
  name: string
  avatar?: string
  qrCode?: string
  totalOwed: number
  totalOwing: number
  createdAt: string
}

interface Expense {
  id: string
  title: string
  description?: string
  amount: number
  date: string
  paidBy: string
  splitType: string
  payer: {
    id: string
    name: string
  }
  splits: Array<{
    id: string
    userId: string
    amount: number
    user: {
      id: string
      name: string
    }
  }>
}

interface Settlement {
  id: string
  paidBy: string
  paidTo: string
  amount: number
}

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tripId = params.id as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isCreateExpenseModalOpen, setIsCreateExpenseModalOpen] = useState(false)
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isManageUsersModalOpen, setIsManageUsersModalOpen] = useState(false)
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [selectedUserForQr, setSelectedUserForQr] = useState<User | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Prevent body scroll when QR modal is open
    useLockBodyScroll(isQrModalOpen)

  const handleShowQrCode = (user: User) => {
    setSelectedUserForQr(user)
    setIsQrModalOpen(true)
  }

  const handleCloseQrModal = () => {
    setIsQrModalOpen(false)
    setSelectedUserForQr(null)
  }

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense)
    setIsEditExpenseModalOpen(true)
  }

  const handleEditExpenseSubmit = async (expenseId: string, expenseData: {
    title: string
    description?: string
    amount: number
    paidBy: string
    splitType: string
    splits: Array<{ userId: string; amount: number }>
  }) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      })

      if (!response.ok) {
        throw new Error('Failed to update expense')
      }

      // Reload trip data to get updated expenses
      await loadTripData()
    } catch (error) {
      console.error('Error updating expense:', error)
      throw error
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete expense')
      }

      // Reload trip data to get updated expenses
      await loadTripData()
    } catch (error) {
      console.error('Error deleting expense:', error)
      throw error
    }
  }
  // Get active tab from URL search params, default to 'expenses'
  const getActiveTab = useCallback((): 'expenses' | 'settlement' => {
    const tab = searchParams.get('tab')
    return tab === 'settlement' ? 'settlement' : 'expenses'
  }, [searchParams])
  
  const [activeTab, setActiveTab] = useState<'expenses' | 'settlement'>(getActiveTab())
  const [isTripDetailsExpanded, setIsTripDetailsExpanded] = useState(false)
  const [expandedExpenses, setExpandedExpenses] = useState<Set<string>>(new Set())

  // Sync activeTab with URL search params
  useEffect(() => {
    const tabFromUrl = getActiveTab()
    setActiveTab(tabFromUrl)
  }, [getActiveTab])

  // Function to update URL when tab changes
  const updateTabInUrl = (tab: 'expenses' | 'settlement') => {
    const url = new URL(window.location.href)
    if (tab === 'expenses') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', tab)
    }
    router.replace(url.pathname + url.search, { scroll: false })
  }

  const loadTripData = useCallback(async () => {
    try {
      // Parallelize all data fetching
      const [tripRes, usersRes, expensesRes, settlementsRes] = await Promise.all([
        fetch(`/api/trips/${tripId}`),
        fetch('/api/users'),
        fetch(`/api/expenses?tripId=${tripId}`),
        fetch(`/api/settlements?tripId=${tripId}`)
      ])

      if (tripRes.ok) {
        const tripData = await tripRes.json()
        setTrip(tripData.trip)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json()
        setExpenses(expensesData.expenses || [])
      }

      if (settlementsRes.ok) {
        const settlementsData = await settlementsRes.json()
        setSettlements(settlementsData.settlements || [])
      }
    } catch (error) {
      console.error('Error loading trip data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    if (tripId) {
      loadTripData()
    }
  }, [tripId, loadTripData])

  const handleCreateExpense = async (expenseData: {
    tripId: string
    title: string
    description?: string
    amount: number
    paidBy: string
    splitType: 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'SHARES'
    splits: { userId: string; amount: number }[]
  }) => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      })

      if (!response.ok) {
        throw new Error('Failed to create expense')
      }

      const result = await response.json()
      setExpenses(prev => [result.expense, ...prev])
      console.log("Expense created successfully:", result.expense)
    } catch (error) {
      console.error("Error creating expense:", error)
      alert("Failed to create expense. Please try again.")
    }
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/members/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove user from trip')
      }

      // Reload trip data to get updated members
      loadTripData()
    } catch (error) {
      console.error("Error removing user:", error)
      alert("Failed to remove user. Please try again.")
    }
  }

  const handleViewProfile = (partialUser: { id: string; name: string; avatar?: string | null }) => {
    const fullUser = users.find(u => u.id === partialUser.id) ?? {
      ...partialUser,
      avatar: partialUser.avatar ?? undefined,
      totalOwed: 0,
      totalOwing: 0,
      createdAt: new Date().toISOString(),
    }
    setSelectedUser(fullUser)
    setIsUserProfileModalOpen(true)
  }

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + parseFloat(expense.amount.toString()), 0)
  }

  const getExpenseCount = () => {
    return expenses.length
  }

  const toggleExpenseExpansion = (expenseId: string) => {
    setExpandedExpenses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId)
      } else {
        newSet.add(expenseId)
      }
      return newSet
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Trip not found</h1>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 glass shadow-medium border-b border-white/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
                className="mr-2 sm:mr-3 text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {trip.name}
                  {trip.startDate ? (
                    <span className="text-gray-500 font-normal ml-2">
                      - {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  ) : null}
                </h1>
                {trip.description ? (
                  <p className="text-sm text-gray-600 truncate">{trip.description}</p>
                ) : null}
              </div>
            </div>
            

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:py-12 px-3 sm:px-4 lg:px-8">
        {/* Trip Details Card */}
        <div className="glass-card rounded-[2rem] shadow-soft mb-8 overflow-hidden">
          {/* Header - Always Visible */}
          <div 
            className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50/50 transition-colors duration-200"
            onClick={() => setIsTripDetailsExpanded(!isTripDetailsExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1 mr-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mr-3 sm:mr-4">
                  <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Trip Details</h2>
                  <p className="text-xs text-gray-600">View expenses, members, and totals</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="text-right min-w-0 flex-1">
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-gray-900 truncate">₱ {formatCurrency(getTotalExpenses())}</p>
                </div>
                {isTripDetailsExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>

          {/* Expandable Content */}
          {isTripDetailsExpanded && (
            <div className="border-t border-gray-200/50 p-4 sm:p-6 bg-gray-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* Total Expenses */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mr-3">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-lg font-bold text-gray-900">₱ {formatCurrency(getTotalExpenses())}</p>
                    </div>
                  </div>
                </div>

                {/* Expense Count */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-3">
                      <Receipt className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expenses</p>
                      <p className="text-lg font-bold text-gray-900">{getExpenseCount()}</p>
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mr-3">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Members</p>
                        <p className="text-lg font-bold text-gray-900">{trip.members.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsManageUsersModalOpen(true)
                        }}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-100/50 border border-purple-200 h-8 w-8 rounded-full"
                        title="View Members"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 border border-gray-200/80 rounded-[1.25rem] p-1.5 mb-8 relative overflow-hidden isolate">
          <button
            onClick={() => {
              setActiveTab('expenses')
              updateTabInUrl('expenses')
            }}
            className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'expenses'
                ? "bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-white/50"
            }`}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Expenses
          </button>
          <button
            onClick={() => {
              setActiveTab('settlement')
              updateTabInUrl('settlement')
            }}
            className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'settlement'
                ? "bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-white/50"
            }`}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Settlement
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Expenses</h2>
              <Button
                onClick={() => setIsCreateExpenseModalOpen(true)}
                className="bg-gradient-to-br from-success-500 to-success-700 hover:from-success-600 hover:to-success-800 text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2 h-8 sm:h-10"
              >
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Add New Expense</span>
                <span className="sm:hidden">Add New Expense</span>
              </Button>
            </div>

          {/* Expenses List */}
          {expenses.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-center border border-white/20 shadow-xl">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Receipt className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                No expenses yet
              </h3>
              <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg max-w-md mx-auto px-4">
                Add your first expense to start tracking shared costs
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => {
                const isExpanded = expandedExpenses.has(expense.id)
                return (
                  <div 
                    key={expense.id} 
                    className="glass-card rounded-[1.5rem] p-4 sm:p-6 shadow-soft cursor-pointer sm:hover:bg-white/20 sm:hover:shadow-medium sm:hover:scale-[1.01] transition-all duration-300"
                    onClick={() => toggleExpenseExpansion(expense.id)}
                  >
                    {/* Main Expense Info - Always Visible */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-base sm:text-lg font-bold text-gray-900">{expense.title}</h4>
                        </div>
                        {expense.description && (
                          <p className="text-gray-600 text-sm mb-2">{expense.description}</p>
                        )}
                        <div className="text-sm text-gray-500">
                          <span>Paid by {expense.payer.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-lg sm:text-xl font-bold text-gray-900">₱ {formatCurrency(expense.amount)}</p>
                          <p className="text-xs text-gray-500">Split {expense.splitType.toLowerCase()}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditExpense(expense)
                          }}
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex-shrink-0"
                          title="Edit Expense"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Split Details Toggle */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">Split between:</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{expense.splits.length} people</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Expandable Split Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200/50 pt-3 mt-3">
                        <div className="space-y-1">
                          {expense.splits.map((split) => (
                            <div key={split.id} className="flex items-center text-sm">
                              <span className="text-gray-600 flex-shrink-0">{split.user.name}</span>
                              <div className="flex-1 mx-2 border-b border-dotted border-gray-300 min-h-[1px]"></div>
                              <span className="font-medium text-gray-900 flex-shrink-0">₱ {formatCurrency(split.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}


          </div>
        )}

        {activeTab === 'settlement' && (
          <SettlementView
            tripId={tripId}
            users={users.filter(user =>
              trip?.members.some(member => member.user.id === user.id)
            )}
            expenses={expenses}
            settlements={settlements}
            onShowQrCode={handleShowQrCode}
            onSettlementRecorded={loadTripData}
          />
        )}
      </main>

      {/* Create Expense Modal */}
      <CreateExpenseModal
        isOpen={isCreateExpenseModalOpen}
        onClose={() => setIsCreateExpenseModalOpen(false)}
        tripId={tripId}
        users={users.filter(user => 
          trip?.members.some(member => member.user.id === user.id)
        )}
        onCreateExpense={handleCreateExpense}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={isEditExpenseModalOpen}
        onClose={() => {
          setIsEditExpenseModalOpen(false)
          setSelectedExpense(null)
        }}
        expense={selectedExpense}
        users={users.filter(user => 
          trip?.members.some(member => member.user.id === user.id)
        )}
        onEditExpense={handleEditExpenseSubmit}
        onDeleteExpense={handleDeleteExpense}
      />

      {/* Manage Users Modal */}
      <ManageUsersModal
        isOpen={isManageUsersModalOpen}
        onClose={() => setIsManageUsersModalOpen(false)}
        tripId={tripId}
        tripMembers={(trip?.members ?? []).map(member => ({
          id: member.user.id,
          name: member.user.name,
          role: member.role,
        }))}
        onRemoveUser={handleRemoveUser}
        onViewProfile={handleViewProfile}
      />

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal
          isOpen={isUserProfileModalOpen}
          onClose={() => {
            setIsUserProfileModalOpen(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
          onUpdateUser={(userId, updates) => {
            setUsers(prev => prev.map(user => 
              user.id === userId ? { ...user, ...updates } : user
            ))
            setSelectedUser(prev => prev ? { ...prev, ...updates } : null)
          }}
        />
      )}

      {/* QR Code Modal */}
      {isQrModalOpen && selectedUserForQr ? (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-premium rounded-[2rem] shadow-glow w-full max-w-sm sm:max-w-md transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col">
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
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedUserForQr.name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseQrModal}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 border border-gray-300 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-full"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>

              {/* QR Code Display */}
              <div className="pt-4 sm:pt-6 text-center">
                <div className="inline-block p-2 sm:p-4 bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 mb-4 sm:mb-6">
                  <Image
                    src={selectedUserForQr.qrCode!}
                    alt="Payment QR Code"
                    width={320}
                    height={320}
                    className="rounded-xl w-64 h-64 sm:w-80 sm:h-80"
                    priority
                  />
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Scan to Pay</h3>
                  <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
                    Use your phone&apos;s camera to scan this code and make a payment to {selectedUserForQr.name}.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="py-8 px-4 sm:px-8 border-t border-gray-200/50 space-y-3">
              {/* Download QR Code */}
              {selectedUserForQr.qrCode && selectedUserForQr.qrCode.startsWith('data:image') && (
                <button
                  onClick={() => {
                    // Create download link for base64 image
                    const link = document.createElement('a')
                    link.href = selectedUserForQr.qrCode!
                    link.download = `${selectedUserForQr.name}-qr-code.png`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors duration-200"
                >
                  Download QR Code
                </button>
              )}
              
              <Button
                onClick={handleCloseQrModal}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
