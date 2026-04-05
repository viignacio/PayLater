// Removed unused imports: Expense, User from '@prisma/client'

export interface BalanceCalculation {
  userId: string
  userName: string
  totalOwed: number
  totalOwing: number
  netBalance: number // positive = should receive, negative = should pay
}

export interface SettlementSuggestion {
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  amount: number
}

export interface DetailedBalance {
  userId: string
  userName: string
  totalOwed: number
  totalOwing: number
  netBalance: number
  owesTo: Array<{
    userId: string
    userName: string
    amount: number
  }>
  owedBy: Array<{
    userId: string
    userName: string
    amount: number
  }>
}

/**
 * Calculate balances for all users in a trip based on expenses
 */
export function calculateBalances(
  expenses: Array<{
    id: string
    amount: number
    paidBy: string
    splits: Array<{
      userId: string
      amount: number
    }>
  }>,
  users: Array<{ id: string; name: string }>
): BalanceCalculation[] {
  const balances = new Map<string, BalanceCalculation>()

  // Initialize balances for all users
  users.forEach(user => {
    balances.set(user.id, {
      userId: user.id,
      userName: user.name,
      totalOwed: 0,
      totalOwing: 0,
      netBalance: 0
    })
  })

  // Process each expense
  expenses.forEach(expense => {
    const payerId = expense.paidBy
    const payerBalance = balances.get(payerId)
    
    if (payerBalance) {
      // Payer is owed money (they paid for others)
      payerBalance.totalOwing += expense.amount
    }

    // Process splits
    expense.splits.forEach(split => {
      const userBalance = balances.get(split.userId)
      if (userBalance) {
        // If this user is the payer, they don't owe themselves
        if (split.userId === payerId) {
          // Payer's own share reduces what they are owed (they effectively paid their own share)
          userBalance.totalOwing -= split.amount
        } else {
          // Non-payer owes money for this expense
          userBalance.totalOwed += split.amount
        }
      }
    })
  })

  // Calculate net balances
  balances.forEach(balance => {
    balance.netBalance = balance.totalOwing - balance.totalOwed
  })

  return Array.from(balances.values())
}

/**
 * Generate settlement suggestions to minimize the number of transactions
 * Uses a greedy algorithm to find the minimum number of payments needed
 */
export function generateSettlementSuggestions(
  balances: BalanceCalculation[]
): SettlementSuggestion[] {
  const suggestions: SettlementSuggestion[] = []
  
  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors = balances
    .filter(b => b.netBalance > 0)
    .sort((a, b) => b.netBalance - a.netBalance)
  
  const debtors = balances
    .filter(b => b.netBalance < 0)
    .sort((a, b) => a.netBalance - b.netBalance)

  // Greedy algorithm: match largest creditor with largest debtor
  let creditorIndex = 0
  let debtorIndex = 0

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]

    // Calculate the amount to transfer (minimum of what creditor is owed and what debtor owes)
    const transferAmount = Math.min(creditor.netBalance, Math.abs(debtor.netBalance))

    if (transferAmount > 0) {
      suggestions.push({
        fromUserId: debtor.userId,
        fromUserName: debtor.userName,
        toUserId: creditor.userId,
        toUserName: creditor.userName,
        amount: transferAmount
      })

      // Update balances
      creditor.netBalance -= transferAmount
      debtor.netBalance += transferAmount

      // Move to next creditor/debtor if current one is settled
      if (creditor.netBalance === 0) {
        creditorIndex++
      }
      if (debtor.netBalance === 0) {
        debtorIndex++
      }
    } else {
      // This shouldn't happen, but break to avoid infinite loop
      break
    }
  }

  return suggestions
}

/**
 * Calculate total amount owed by a specific user across all trips
 */
export function calculateUserTotalBalance(
  userId: string,
  allExpenses: Array<{
    amount: number
    paidBy: string
    splits: Array<{
      userId: string
      amount: number
    }>
  }>,
  settlements: Array<{ paidBy: string; paidTo: string; amount: number }> = []
): { totalOwed: number; totalOwing: number; netBalance: number } {
  let totalOwed = 0
  let totalOwing = 0

  allExpenses.forEach(expense => {
    // If user paid for this expense, they are owed money
    if (expense.paidBy === userId) {
      totalOwing += expense.amount
    }

    // Check if user owes money for this expense
    const userSplit = expense.splits.find(split => split.userId === userId)
    if (userSplit) {
      totalOwed += userSplit.amount

      // If user paid for this expense, they don't owe themselves
      if (expense.paidBy === userId) {
        totalOwing -= userSplit.amount
      }
    }
  })

  // Apply settlements: settlements paid by this user reduce their debt
  settlements.forEach(s => {
    if (s.paidBy === userId) totalOwed -= s.amount
    if (s.paidTo === userId) totalOwing -= s.amount
  })

  return {
    totalOwed: Math.max(0, totalOwed),
    totalOwing: Math.max(0, totalOwing),
    netBalance: totalOwing - totalOwed,
  }
}

/**
 * Adjust net balances to account for recorded settlements.
 * Call this after calculateBalances() to get the remaining balance.
 */
export function applySettlements(
  balances: BalanceCalculation[],
  settlements: Array<{ paidBy: string; paidTo: string; amount: number }>
): BalanceCalculation[] {
  const balanceMap = new Map(balances.map(b => [b.userId, { ...b }]))

  settlements.forEach(settlement => {
    const payer = balanceMap.get(settlement.paidBy)
    const receiver = balanceMap.get(settlement.paidTo)
    if (payer) payer.netBalance += settlement.amount
    if (receiver) receiver.netBalance -= settlement.amount
  })

  return Array.from(balanceMap.values())
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Get balance status text and color
 */
export function getBalanceStatus(netBalance: number): {
  text: string
  color: string
  bgColor: string
} {
  if (netBalance > 0) {
    return {
      text: `You're owed ₱ ${formatCurrency(netBalance)}`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  } else if (netBalance < 0) {
    return {
      text: `You owe ₱ ${formatCurrency(Math.abs(netBalance))}`,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  } else {
    return {
      text: 'All settled up!',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  }
}

/**
 * Calculate detailed balances showing who owes whom
 */
export function calculateDetailedBalances(
  expenses: Array<{
    id: string
    amount: number
    paidBy: string
    splits: Array<{
      userId: string
      amount: number
    }>
  }>,
  users: Array<{ id: string; name: string }>
): DetailedBalance[] {
  const userMap = new Map(users.map(user => [user.id, user.name]))
  const detailedBalances = new Map<string, DetailedBalance>()

  // Initialize detailed balances for all users
  users.forEach(user => {
    detailedBalances.set(user.id, {
      userId: user.id,
      userName: user.name,
      totalOwed: 0,
      totalOwing: 0,
      netBalance: 0,
      owesTo: [],
      owedBy: []
    })
  })

  // Process each expense to build detailed breakdowns
  expenses.forEach(expense => {
    const payerId = expense.paidBy
    const payerBalance = detailedBalances.get(payerId)
    
    if (!payerBalance) return

    // Process each split
    expense.splits.forEach(split => {
      const splitUserId = split.userId
      const splitUserBalance = detailedBalances.get(splitUserId)
      
      if (!splitUserBalance || splitUserId === payerId) return

      // The split user owes the payer
      splitUserBalance.totalOwed += split.amount
      payerBalance.totalOwing += split.amount

      // Add to detailed breakdown
      const existingOwedTo = splitUserBalance.owesTo.find(item => item.userId === payerId)
      if (existingOwedTo) {
        existingOwedTo.amount += split.amount
      } else {
        splitUserBalance.owesTo.push({
          userId: payerId,
          userName: userMap.get(payerId) || 'Unknown',
          amount: split.amount
        })
      }

      const existingOwedBy = payerBalance.owedBy.find(item => item.userId === splitUserId)
      if (existingOwedBy) {
        existingOwedBy.amount += split.amount
      } else {
        payerBalance.owedBy.push({
          userId: splitUserId,
          userName: userMap.get(splitUserId) || 'Unknown',
          amount: split.amount
        })
      }
    })
  })

  // Calculate net balances
  detailedBalances.forEach(balance => {
    balance.netBalance = balance.totalOwing - balance.totalOwed
  })

  return Array.from(detailedBalances.values())
}
