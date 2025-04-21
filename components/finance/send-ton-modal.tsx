"use client"

import React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toNano, fromNano, Address } from '@ton/core'
import { useTonPrice } from "@/contexts/TonPriceContext"
import { mnemonicToWalletKey } from "@ton/crypto"
import { WalletContractV4, TonClient, internal } from "@ton/ton"
import { getHttpEndpoint } from "@orbs-network/ton-access"
import { useUser } from "@/components/UserContext"

interface SendTonModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newBalance: number) => void
  userId: string
  currentBalance: number
}

export default function SendTonModal({ isOpen, onClose, onSuccess, userId, currentBalance }: SendTonModalProps) {
  const [amount, setAmount] = useState("")
  const [address, setAddress] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionStatus, setTransactionStatus] = useState<string>("")
  const { convertUsdToTon, tonPrice } = useTonPrice()

  const handleSendTon = async () => {
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount greater than zero")
      return
    }

    if (numericAmount > currentBalance) {
      setError("Insufficient balance")
      return
    }

    if (!address) {
      setError("Please enter a destination address")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Convert USD to TON
      const tonAmount = convertUsdToTon(numericAmount)
      if (!tonAmount) {
        setError("Unable to convert USD to TON. Please try again later.")
        return
      }

      // Validate TON address
      let destinationAddress: Address
      try {
        destinationAddress = Address.parse(address)
      } catch {
        setError("Invalid TON address")
        return
      }

      setTransactionStatus('Initializing transaction...')
      const mnemonic = process.env.NEXT_PUBLIC_DEPLOYER_WALLET_MNEMONIC
      if (!mnemonic) {
        throw new Error("Mnemonic is not configured")
      }

      const key = await mnemonicToWalletKey(mnemonic.split(" "))
      const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 })
      
      const endpoint = await getHttpEndpoint({ network: "mainnet" })
      const client = new TonClient({ endpoint })

      const walletContract = client.open(wallet)
      const seqno = await walletContract.getSeqno()
      
      setTransactionStatus('Sending transaction...')
      await walletContract.sendTransfer({
        secretKey: key.secretKey,
        seqno: seqno,
        messages: [
          internal({
            to: destinationAddress.toString(),
            value: toNano(tonAmount.toString()),
            body: "Transfer from V0",
            bounce: false,
          })
        ]
      })

      // Wait for transaction confirmation
      let currentSeqno = seqno
      let attempts = 0
      const maxAttempts = 10

      while (currentSeqno === seqno && attempts < maxAttempts) {
        setTransactionStatus('Waiting for transaction confirmation...')
        await sleep(1500)
        currentSeqno = await walletContract.getSeqno()
        attempts++
      }

      if (attempts >= maxAttempts) {
        throw new Error('Transaction was not confirmed in time')
      }

      setTransactionStatus('Transaction successfully confirmed!')
      console.log('Transaction completed')
      onSuccess(currentBalance - numericAmount)
      onClose()

    } catch (error) {
      console.error("Send TON error:", error)
      setTransactionStatus('Transaction failed')
      setError(error instanceof Error ? error.message : "Failed to send TON")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send TON</DialogTitle>
          <DialogDescription>
            Send TON to any address
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Destination Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter TON address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount in USD</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                max={currentBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8"
              />
            </div>
            {amount && !isNaN(parseFloat(amount)) && tonPrice && (
              <p className="text-sm text-muted-foreground">
                ≈ {convertUsdToTon(parseFloat(amount))?.toFixed(4)} TON
              </p>
            )}
            <p className="text-xs text-gray-500">Available balance: ${currentBalance.toFixed(2)}</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {transactionStatus && (
              <p className={`text-sm ${
                transactionStatus.includes('success') 
                  ? 'text-green-500' 
                  : transactionStatus.includes('failed')
                  ? 'text-red-500'
                  : 'text-blue-500'
              }`}>
                {transactionStatus}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSendTon} 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? "Sending..." : "Send TON"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
} 