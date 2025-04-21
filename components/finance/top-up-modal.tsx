"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { topUpWalletBalance } from "@/app/actions/finance-actions"
import { useTonConnectUI } from '@tonconnect/ui-react'
import { toNano } from '@ton/core'
import { useTransactionStatus } from '@/hooks/useTransactionStatus'

// Стабильный билд
// Обновим интерфейс TopUpModalProps
interface TopUpModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newBalance: number) => void
  userId: string
}

// Обновим компонент TopUpModal
export default function TopUpModal({ isOpen, onClose, onSuccess, userId }: TopUpModalProps) {
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tonConnectUI] = useTonConnectUI()
  const { transactionStatus, startChecking } = useTransactionStatus()
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(null)

  const handleConnectWallet = async () => {
    try {
      await tonConnectUI.openModal()
    } catch (err) {
      setError("Failed to connect wallet")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountValue = Number.parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      setError("Please enter a valid amount greater than zero")
      return
    }

    if (!tonConnectUI.connected) {
      setError("Please connect your TON wallet first")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Create TON transaction
      const amountInNanotons = toNano(amount)
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address: tonWalletAddress!,
            amount: amountInNanotons.toString(),
          },
        ],
      }

      // Send transaction
      const result = await tonConnectUI.sendTransaction(transaction)
      
      // Start checking transaction status
      startChecking(result.boc)

      // Wait for transaction confirmation
      const confirmed = await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (transactionStatus?.includes('успешно')) {
            clearInterval(checkInterval)
            resolve(true)
          } else if (transactionStatus?.includes('Ошибка')) {
            clearInterval(checkInterval)
            resolve(false)
          }
        }, 1000)
      })

      if (confirmed) {
        // Update wallet balance only after transaction is confirmed
        const result = await topUpWalletBalance(amountValue, userId)
        if (result.success && typeof result.newBalance === 'number') {
          setAmount("")
          onSuccess(result.newBalance)
          onClose()
        } else {
          setError(result.error || "Failed to top up wallet")
        }
      } else {
        setError("Transaction failed or was rejected")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Top Up Wallet</DialogTitle>
          <DialogDescription>
            Add funds to your wallet to use for investments and transfers
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {!tonConnectUI.connected ? (
            <Button 
              type="button"
              onClick={handleConnectWallet}
              className="w-full"
            >
              Connect TON Wallet
            </Button>
          ) : (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Top Up"}
              </Button>
            </DialogFooter>
          )}

          {transactionStatus && (
            <div className={`mt-4 p-3 rounded ${
              transactionStatus.includes('успешно') 
                ? 'bg-green-100 text-green-700' 
                : transactionStatus.includes('Ошибка')
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {transactionStatus}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

