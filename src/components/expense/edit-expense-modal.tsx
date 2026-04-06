"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, DollarSign, ChevronDown, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
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

interface ExpenseSplit {
  id: string
  userId: string
  amount: number
  user: {
    id: string
    name: string
  }
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
  splits: ExpenseSplit[]
}

interface EditExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  expense: Expense | null
  users: User[]
  onEditExpense: (expenseId: string, expenseData: {
    title: string
    description?: string
    amount: number
    paidBy: string
    splitType: string
    splits: Array<{ userId: string; amount: number }>
  }) => Promise<void>
  onDeleteExpense?: (expenseId: string) => Promise<void>
}

export function EditExpenseModal({ 
  isOpen, 
  onClose, 
  expense,
  users, 
  onEditExpense,
  onDeleteExpense 
}: EditExpenseModalProps) {
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    paidBy: "",
    splitType: "EQUAL" as "EQUAL" | "EXACT"
  })

  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [splits, setSplits] = useState<Array<{ userId: string; amount: number; user: { id: string; name: string } }>>([])
  const [splitInputValues, setSplitInputValues] = useState<{ userId: string; value: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Prevent body scroll when modal is open
    useLockBodyScroll(isOpen)

  // Initialize form data when expense changes
  useEffect(() => {
    if (expense && isOpen) {
      setFormData({
        title: expense.title,
        description: expense.description || "",
        amount: (Math.round(expense.amount * 100) / 100).toString(),
        paidBy: expense.paidBy,
        splitType: expense.splitType as "EQUAL" | "EXACT"
      })

      // Set selected users from existing splits
      const userIds = expense.splits.map(split => split.userId)
      setSelectedUsers(userIds)

      // Initialize splits and input values
      const initialSplits = expense.splits.map(split => ({
        userId: split.userId,
        amount: split.amount,
        user: split.user
      }))
      setSplits(initialSplits)

      const initialInputValues = expense.splits.map(split => ({
        userId: split.userId,
        value: (Math.round(split.amount * 100) / 100).toString()
      }))
      setSplitInputValues(initialInputValues)
    }
  }, [expense, isOpen])

  // Calculate splits when amount, selected users, or split type changes
  useEffect(() => {
    if (selectedUsers.length > 0 && formData.amount) {
      const amount = parseFloat(formData.amount) || 0
      const amountPerUser = Math.round((amount / selectedUsers.length) * 100) / 100

      if (formData.splitType === "EQUAL") {
        const newSplits = selectedUsers.map(userId => {
          const user = users.find(u => u.id === userId)
          return {
            userId,
            amount: amountPerUser,
            user: { id: userId, name: user?.name || "" }
          }
        })
        setSplits(newSplits)

        const newInputValues = selectedUsers.map(userId => ({
          userId,
          value: amountPerUser.toString()
        }))
        setSplitInputValues(newInputValues)
      }
    }
  }, [formData.amount, selectedUsers, formData.splitType, users])

  // Handle split type changes
  useEffect(() => {
    if (formData.splitType === "EQUAL" && selectedUsers.length > 0 && formData.amount) {
      const amount = parseFloat(formData.amount) || 0
      const amountPerUser = Math.round((amount / selectedUsers.length) * 100) / 100
      
      const newSplits = selectedUsers.map(userId => {
        const user = users.find(u => u.id === userId)
        return {
          userId,
          amount: amountPerUser,
          user: { id: userId, name: user?.name || "" }
        }
      })
      setSplits(newSplits)

      const newInputValues = selectedUsers.map(userId => ({
        userId,
        value: amountPerUser.toString()
      }))
      setSplitInputValues(newInputValues)
    } else if (formData.splitType === "EXACT") {
      // For EXACT mode, we need to preserve existing values or initialize with 0
      setSplits(prevSplits => {
        const newSplits = selectedUsers.map(userId => {
          const existingSplit = prevSplits.find(s => s.userId === userId)
          const user = users.find(u => u.id === userId)
          return {
            userId,
            amount: existingSplit?.amount || 0,
            user: { id: userId, name: user?.name || "" }
          }
        })
        return newSplits
      })

      setSplitInputValues(prevInputValues => {
        const newInputValues = selectedUsers.map(userId => {
          const existingInput = prevInputValues.find(s => s.userId === userId)
          return {
            userId,
            value: existingInput?.value || "0"
          }
        })
        return newInputValues
      })
    }
  }, [formData.splitType, selectedUsers, formData.amount, users])

  const handleInputChange = (field: string, value: string) => {
    if (field === "amount") {
      const numericRegex = /^(\d*\.?\d*)$/
      if (value === "" || numericRegex.test(value)) {
        setFormData(prev => ({ ...prev, [field]: value }))
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  const handleSplitAmountChange = (userId: string, value: string) => {
    const numericRegex = /^(\d*\.?\d*)$/
    if (value === "" || numericRegex.test(value)) {
      setSplitInputValues(prev => prev.map(input =>
        input.userId === userId ? { ...input, value } : input
      ))
      const numericAmount = value === "" ? 0 : Math.round((parseFloat(value) || 0) * 100) / 100
      setSplits(prev => prev.map(split =>
        split.userId === userId ? { ...split, amount: numericAmount } : split
      ))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expense) return

    if (selectedUsers.length === 0) {
      alert("Please select at least one person to split the expense with.")
      return
    }

    const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0)
    const expenseAmount = parseFloat(formData.amount) || 0

    if (Math.abs(totalSplitAmount - expenseAmount) > 0.01) {
      alert("The split amounts must equal the total expense amount.")
      return
    }

    setIsLoading(true)
    try {
      const expenseData = {
        title: formData.title,
        description: formData.description,
        amount: expenseAmount,
        paidBy: formData.paidBy,
        splitType: formData.splitType,
        splits: splits.map(split => ({
          userId: split.userId,
          amount: split.amount
        }))
      }

      await onEditExpense(expense.id, expenseData)
      onClose()
    } catch (error) {
      console.error("Error editing expense:", error)
      alert("Failed to edit expense. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalSplitAmount = () => {
    return splits.reduce((sum, split) => sum + split.amount, 0)
  }

  const getRemainingAmount = () => {
    const total = parseFloat(formData.amount) || 0
    const split = getTotalSplitAmount()
    return total - split
  }

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
  }

  const handleConfirmDelete = async () => {
    if (!expense || !onDeleteExpense) return

    try {
      setIsDeleting(true)
      await onDeleteExpense(expense.id)
      setIsDeleteDialogOpen(false)
      onClose()
    } catch (error) {
      console.error('Error deleting expense:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !expense) return null

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
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Edit Expense</h2>
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
                
                {/* Total and Remaining */}
                <div className="pt-3 border-t border-gray-200/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Split:</span>
                    <span className="font-medium">₱ {formatCurrency(getTotalSplitAmount())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining:</span>
                    <span className={`font-medium ${getRemainingAmount() === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₱ {formatCurrency(getRemainingAmount())}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          </form>
        </div>

        {/* Actions */}
        <div className="py-8 px-4 sm:px-8 border-t border-gray-200/50">
          <div className="flex flex-col gap-4">
            {/* Save Changes Button - Full Width */}
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || isDeleting || selectedUsers.length === 0}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl h-12 font-semibold"
              isLoading={isLoading}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
            
            {/* Delete and Cancel Buttons - Side by Side */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteClick}
                className="flex-1 h-12 font-semibold"
                disabled={isLoading || isDeleting}
                isLoading={isDeleting}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Delete Expense
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 font-semibold"
                disabled={isLoading || isDeleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Expense"
        message={
          expense ? (
            <div>
              <p className="mb-3">
                Are you sure you want to delete <strong>&ldquo;{expense.title}&rdquo;</strong>? This action cannot be undone.
              </p>
              <p className="text-sm text-gray-600">
                This expense and all its split data will be permanently deleted.
              </p>
            </div>
          ) : ""
        }
        confirmText="Delete Expense"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
