"use client"

import { Receipt, User, QrCode } from "lucide-react"
import { formatCurrency, calculateBalances, applySettlements, generateSettlementSuggestions } from "@/lib/balance-calculator"

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
    amount: number
    user: {
      id: string
      name: string
    }
  }>
}

interface SettlementViewProps {
  tripId: string
  users: User[]
  expenses: Expense[]
  settlements: Array<{ id: string; paidBy: string; paidTo: string; amount: number }>
  onShowQrCode: (user: User) => void
  onSettlementRecorded: () => void
}

export function SettlementView({ tripId, users, expenses, settlements, onShowQrCode, onSettlementRecorded }: SettlementViewProps) {
  const rawBalances = calculateBalances(
    expenses.map(e => ({
      id: e.id,
      amount: e.amount,
      paidBy: e.paidBy,
      splits: (e.splits ?? []).map((s) => ({ userId: s.user?.id, amount: s.amount })),
    })),
    users.map(u => ({ id: u.id, name: u.name }))
  )

  const adjustedBalances = applySettlements(rawBalances, settlements)
  const suggestions = generateSettlementSuggestions(adjustedBalances)

  const handleRecordSettlement = async (fromUserId: string, toUserId: string, amount: number) => {
    const res = await fetch('/api/settlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId, paidBy: fromUserId, paidTo: toUserId, amount }),
    })
    if (res.ok) {
      onSettlementRecorded()
    }
  }

  const showQrCode = (user: User) => {
    onShowQrCode(user)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Settlement</h2>
      </div>

      {/* Settlement Suggestions */}
      <div className="space-y-4 sm:space-y-6">
        {suggestions.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Receipt className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm sm:text-base">No expenses to settle yet</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Add some expenses to see the breakdown</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {suggestions.map((suggestion, index) => {
              const payerUser = users.find(u => u.id === suggestion.toUserId)
              return (
                <div key={index} className="glass-card rounded-[2rem] p-4 sm:p-6 shadow-soft">
                  {/* Suggestion Header */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 truncate">{suggestion.fromUserName}</h4>
                        <p className="text-xs text-gray-600">owes {suggestion.toUserName}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg sm:text-xl font-bold text-gray-900">
                        ₱ {formatCurrency(suggestion.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200/50 my-3"></div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2">
                    {payerUser?.qrCode && (
                      <button
                        onClick={() => showQrCode(payerUser)}
                        className="w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 rounded-full transition-colors duration-200"
                        title="Show QR Code"
                      >
                        <QrCode className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRecordSettlement(suggestion.fromUserId, suggestion.toUserId, suggestion.amount)}
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 hover:from-primary-600 hover:to-primary-800 rounded-xl transition-all duration-300 shadow-medium hover:shadow-glow active:scale-95"
                    >
                      Settle Up
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
