"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { transferToCore } from "@/app/actions/finance-actions"

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  currentWalletBalance: number
  onSuccess: (newWalletBalance: number, newCoreBalance: number) => void
  userId: string
}

export default function TransferModal({
  isOpen,
  onClose,
  currentWalletBalance,
  onSuccess,
  userId,
}: TransferModalProps) {
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountValue = Number.parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      setError("Please enter a valid amount greater than zero")
      return
    }

    if (amountValue > currentWalletBalance) {
      setError("Insufficient funds in wallet")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await transferToCore(amountValue, userId)

      if (result.success && typeof result.newWalletBalance === 'number' && typeof result.newCoreBalance === 'number') {
        setAmount("")
        onSuccess(result.newWalletBalance, result.newCoreBalance)
        onClose()
      } else {
        setError(result.error || "Failed to transfer to core")
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
          <DialogTitle>Transfer to Core</DialogTitle>
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
                max={currentWalletBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8"
              />
            </div>
            <p className="text-xs text-gray-500">Available balance: ${currentWalletBalance.toFixed(2)}</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

