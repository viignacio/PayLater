"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, DollarSign, ChevronDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
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

interface CreateExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  users: User[]
  onCreateExpense: (expenseData: {
    tripId: string
    title: string
    description?: string
    amount: number
    paidBy: string
    splitType: 'EQUAL' | 'EXACT'
    splits: { userId: string; amount: number }[]
  }) => void
}

export function CreateExpenseModal({ 
  isOpen, 
  onClose, 
  tripId, 
  users, 
  onCreateExpense 
}: CreateExpenseModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    paidBy: "",
    splitType: "EQUAL" as 'EQUAL' | 'EXACT'
  })
  const [splits, setSplits] = useState<{ userId: string; amount: number }[]>([])
  const [splitInputValues, setSplitInputValues] = useState<{ userId: string; value: string }[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Prevent body scroll when modal is open
  useLockBodyScroll(isOpen)

  // Initialize splits when users are selected
  useEffect(() => {
    if (selectedUsers.length > 0 && formData.amount) {
      if (formData.splitType === 'EQUAL') {
        const amountPerUser = Math.round((parseFloat(formData.amount) / selectedUsers.length) * 100) / 100
        setSplits(selectedUsers.map(userId => ({
          userId,
          amount: amountPerUser
        })))
        setSplitInputValues(selectedUsers.map(userId => ({
          userId,
          value: amountPerUser.toString()
        })))
      } else if (formData.splitType === 'EXACT') {
        // Initialize with 0 amounts for exact amounts - user will input manually
        setSplits(selectedUsers.map(userId => ({
          userId,
          amount: 0
        })))
        setSplitInputValues(selectedUsers.map(userId => ({
          userId,
          value: ""
        })))
      }
    }
  }, [selectedUsers, formData.amount, formData.splitType])

  // Handle split type changes
  useEffect(() => {
    if (selectedUsers.length > 0 && formData.amount && splits.length > 0) {
      if (formData.splitType === 'EQUAL') {
        // Switch to equal split - recalculate amounts
        const amountPerUser = Math.round((parseFloat(formData.amount) / selectedUsers.length) * 100) / 100
        setSplits(selectedUsers.map(userId => ({
          userId,
          amount: amountPerUser
        })))
        setSplitInputValues(selectedUsers.map(userId => ({
          userId,
          value: amountPerUser.toString()
        })))
      } else if (formData.splitType === 'EXACT') {
        // Switch to exact amounts - keep current amounts or set to empty if not set
        setSplits(prev => {
          const newSplits = selectedUsers.map(userId => {
            const existingSplit = prev.find(s => s.userId === userId)
            return {
              userId,
              amount: existingSplit ? existingSplit.amount : 0
            }
          })
          return newSplits
        })
        setSplitInputValues(prev => {
          const newInputValues = selectedUsers.map(userId => {
            const existingInput = prev.find(s => s.userId === userId)
            return {
              userId,
              value: existingInput ? existingInput.value : ""
            }
          })
          return newInputValues
        })
      }
    }
  }, [formData.splitType, selectedUsers, formData.amount, splits.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.amount || !formData.paidBy || splits.length === 0) return

    setIsLoading(true)
    try {
      await onCreateExpense({
        tripId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        amount: parseFloat(formData.amount),
        paidBy: formData.paidBy,
        splitType: formData.splitType,
        splits
      })
      
      // Reset form
      setFormData({ title: "", description: "", amount: "", paidBy: "", splitType: "EQUAL" })
      setSplits([])
      setSplitInputValues([])
      setSelectedUsers([])
      onClose()
    } catch (error) {
      console.error("Error creating expense:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    // For amount field, validate numeric input
    if (field === "amount") {
      // Allow empty string, numbers, and one decimal point
      const numericRegex = /^(\d*\.?\d*)$/
      if (value === "" || numericRegex.test(value)) {
        setFormData(prev => ({ ...prev, [field]: value }))
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleUserToggle = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
      setSplits(prev => prev.filter(split => split.userId !== userId))
    } else {
      setSelectedUsers(prev => [...prev, userId])
    }
  }

  const handleSplitAmountChange = (userId: string, value: string) => {
    // Validate numeric input (allow empty string, numbers, and one decimal point)
    const numericRegex = /^(\d*\.?\d*)$/
    if (value === "" || numericRegex.test(value)) {
      // Update the input value (string) - allow empty string for clearing
      setSplitInputValues(prev => prev.map(input => 
        input.userId === userId ? { ...input, value } : input
      ))
      
      // Update the numeric amount for calculations
      const numericAmount = value === "" ? 0 : Math.round((parseFloat(value) || 0) * 100) / 100
      setSplits(prev => prev.map(split => 
        split.userId === userId ? { ...split, amount: numericAmount } : split
      ))
    }
  }

  const getTotalSplitAmount = () => {
    return Math.round(splits.reduce((total, split) => total + split.amount, 0) * 100) / 100
  }

  const getRemainingAmount = () => {
    return Math.round((parseFloat(formData.amount) - getTotalSplitAmount()) * 100) / 100
  }


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
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Add Expense</h2>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="pt-2 sm:pt-3 space-y-4 sm:space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Expense Title *
              </label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Dinner at Restaurant"
                className="w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Optional description..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm sm:text-base"
                rows={2}
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₱) *
              </label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="0.00"
                className="w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 mb-2">
                Paid By *
              </label>
              <div className="relative">
                <select
                  id="paidBy"
                  value={formData.paidBy}
                  onChange={(e) => handleInputChange("paidBy", e.target.value)}
                  className="w-full h-12 px-3 sm:px-4 pr-10 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base bg-white appearance-none"
                  required
                >
                  <option value="">Select who paid</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Split Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Split Type
              </label>
              <div className="relative">
                <select
                  value={formData.splitType}
                  onChange={(e) => handleInputChange("splitType", e.target.value)}
                  className="w-full h-12 px-3 sm:px-4 pr-10 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base bg-white appearance-none"
                >
                  <option value="EQUAL">Equal Split</option>
                  <option value="EXACT">Exact Amounts</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Split Between
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900">{user.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Split Amounts */}
            {selectedUsers.length > 0 && formData.amount ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Split Amounts
                  </label>
                  <div className="text-xs text-gray-500">
                    Total: ₱ {formatCurrency(getTotalSplitAmount())} / ₱ {formatCurrency(parseFloat(formData.amount))}
                  </div>
                </div>
                
                {splits.map((split) => {
                  const user = users.find(u => u.id === split.userId)
                  const inputValue = splitInputValues.find(input => input.userId === split.userId)?.value || ""
                  return (
                    <div key={split.userId} className="flex items-center justify-between space-x-2 sm:space-x-4">
                      <span className="text-sm text-gray-600 flex-1 sm:flex-none sm:w-32 sm:min-w-0 truncate">{user?.name}</span>
                      <div className="flex-1 sm:flex-none sm:w-1/2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          value={inputValue}
                          onChange={(e) => handleSplitAmountChange(split.userId, e.target.value)}
                          className="w-full text-right"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )
                })}

                {getRemainingAmount() !== 0 ? (
                  <div className={`text-xs ${getRemainingAmount() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {getRemainingAmount() > 0 ? 'Remaining: ₱ ' : 'Over by: ₱ '}{formatCurrency(Math.abs(getRemainingAmount()))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          </form>
        </div>

        {/* Actions */}
        <div className="py-8 px-4 sm:px-8 border-t border-gray-200/50">
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={isLoading || !formData.title.trim() || !formData.amount || !formData.paidBy || splits.length === 0}
            >
              {isLoading ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
