import { describe, it, expect } from 'vitest'
import {
  calculateBalances,
  applySettlements,
  calculateUserTotalBalance,
} from './balance-calculator'

describe('applySettlements', () => {
  it('reduces net balance of payer and receiver after settlement', () => {
    const balances = [
      { userId: 'a', userName: 'Alice', totalOwed: 0, totalOwing: 100, netBalance: 100 },
      { userId: 'b', userName: 'Bob', totalOwed: 100, totalOwing: 0, netBalance: -100 },
    ]
    const settlements = [{ paidBy: 'b', paidTo: 'a', amount: 60 }]
    const result = applySettlements(balances, settlements)
    const alice = result.find(r => r.userId === 'a')!
    const bob = result.find(r => r.userId === 'b')!
    expect(alice.netBalance).toBe(40)  // was owed 100, received 60
    expect(bob.netBalance).toBe(-40)   // owed 100, paid 60
  })

  it('fully settles a debt', () => {
    const balances = [
      { userId: 'a', userName: 'Alice', totalOwed: 0, totalOwing: 50, netBalance: 50 },
      { userId: 'b', userName: 'Bob', totalOwed: 50, totalOwing: 0, netBalance: -50 },
    ]
    const settlements = [{ paidBy: 'b', paidTo: 'a', amount: 50 }]
    const result = applySettlements(balances, settlements)
    expect(result.find(r => r.userId === 'a')!.netBalance).toBe(0)
    expect(result.find(r => r.userId === 'b')!.netBalance).toBe(0)
  })

  it('returns balances unchanged when no settlements', () => {
    const balances = [
      { userId: 'a', userName: 'Alice', totalOwed: 0, totalOwing: 100, netBalance: 100 },
    ]
    const result = applySettlements(balances, [])
    expect(result[0].netBalance).toBe(100)
  })
})

describe('calculateUserTotalBalance with settlements', () => {
  it('factors in settlements when calculating balance', () => {
    const expenses = [
      { amount: 100, paidBy: 'a', splits: [{ userId: 'b', amount: 50 }] },
    ]
    const settlements = [{ paidBy: 'b', paidTo: 'a', amount: 50 }]
    const balance = calculateUserTotalBalance('b', expenses, settlements)
    expect(balance.netBalance).toBe(0) // paid back 50, owed 50
  })
})

describe('calculateBalances', () => {
  it('calculates correct balances for equal split', () => {
    const expenses = [
      { id: '1', amount: 100, paidBy: 'a', splits: [
        { userId: 'a', amount: 50 },
        { userId: 'b', amount: 50 },
      ]},
    ]
    const users = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }]
    const result = calculateBalances(expenses, users)
    const alice = result.find(r => r.userId === 'a')!
    const bob = result.find(r => r.userId === 'b')!
    expect(alice.netBalance).toBe(50)  // paid 100, owes 50 → net +50
    expect(bob.netBalance).toBe(-50)   // owes 50
  })
})
