"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { topUpWalletBalance } from "@/app/actions/finance-actions"
import { useTonConnectUI, TonConnectButton } from '@tonconnect/ui-react'
import { toNano } from '@ton/core'
import { useTransactionStatus } from '@/hooks/useTransactionStatus'

// Project wallet address where funds will be sent
const PROJECT_WALLET_ADDRESS = process.env.NEXT_PUBLIC_DESTINATION_ADDRESS

if (!PROJECT_WALLET_ADDRESS) {
  throw new Error("Project wallet address is not configured. Please set NEXT_PUBLIC_DESTINATION_ADDRESS in .env.local")
}

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

  // Subscribe to wallet connection status
  useEffect(() => {
    if (!tonConnectUI) return

    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        console.log("Wallet connected:", wallet)
      } else {
        console.log("Wallet disconnected")
      }
    })

    return () => {
      unsubscribe()
    }
  }, [tonConnectUI])

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
      const transaction: {
        validUntil: number
        messages: Array<{
          address: string
          amount: string
        }>
      } = {
        validUntil: Math.floor(Date.now() / 1000) + 60, // 60 seconds
        messages: [
          {
            address: PROJECT_WALLET_ADDRESS as string, // We can safely assert this as we check it at the top
            amount: amountInNanotons.toString(),
          }
        ]
      }

      console.log("Sending transaction to:", PROJECT_WALLET_ADDRESS)

      // Send transaction
      const result = await tonConnectUI.sendTransaction(transaction)
      console.log("Transaction sent:", result)
      
      // Start checking transaction status
      if (result.boc) {
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
      }
    } catch (err) {
      console.error("Transaction error:", err)
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
            <Label htmlFor="amount">Amount in TON</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-4"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex flex-col items-center gap-4">
            <TonConnectButton />

            {tonConnectUI.connected && (
              <DialogFooter className="w-full">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Top Up"}
                </Button>
              </DialogFooter>
            )}
          </div>

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

