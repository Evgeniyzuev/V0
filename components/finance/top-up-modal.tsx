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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountValue = Number.parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      setError("Please enter a valid amount greater than zero")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await topUpWalletBalance(amountValue, userId)

      if (result.success && typeof result.newBalance === 'number') {
        setAmount("")
        onSuccess(result.newBalance)
        onClose()
      } else {
        setError(result.error || "Failed to top up wallet")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTonPayment = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount greater than zero")
      return
    }

    try {
      const amountInNanotons = toNano(amount).toString()
      
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60, // Valid for 60 seconds
        messages: [
          {
            address: process.env.NEXT_PUBLIC_DESTINATION_ADDRESS || "",
            amount: amountInNanotons,
          },
        ],
      }

      const result = await tonConnectUI.sendTransaction(transaction)
      console.log("Transaction sent:", result)

      // After successful transaction, update the balance
      const topUpResult = await topUpWalletBalance(Number(amount), userId)
      if (topUpResult.success && typeof topUpResult.newBalance === 'number') {
        setAmount("")
        onSuccess(topUpResult.newBalance)
        onClose()
      } else {
        setError(topUpResult.error || "Failed to update balance after TON payment")
      }
    } catch (error) {
      console.error("TON payment error:", error)
      setError("Failed to process TON payment")
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

          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => {/* TODO: Implement Google Pay */}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google Pay
          </Button>

          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => {/* TODO: Implement Apple Pay! */}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.24 1.24-.36 1.7-.79 2.73zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="#000000"/>
            </svg>
            Apple Pay
          </Button>

          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleTonPayment}
            disabled={!tonConnectUI.connected}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="#0088cc"/>
            </svg>
            Pay with TON
          </Button>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Top Up"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

