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
import { useTonConnectUI } from '@tonconnect/ui-react'
import { debitWalletBalance, topUpWalletBalance } from "@/app/actions/finance-actions"

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
  const [tonConnectUI] = useTonConnectUI()

  const formatTonAmount = (amount: number): string => {
    // Форматируем число с 9 знаками после запятой и убираем trailing zeros
    return amount.toFixed(9).replace(/\.?0+$/, '')
  }

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

    let transactionSuccess = false
    let debitedBalance: number | null = null
    try {
      setIsSubmitting(true)
      setError(null)

      // Списываем сумму в базе данных
      const debitResult = await debitWalletBalance(numericAmount, userId)
      if (!debitResult.success || typeof debitResult.newBalance !== 'number') {
        setError(debitResult.error || "Failed to debit balance")
        setIsSubmitting(false)
        return
      }
      debitedBalance = debitResult.newBalance
      onSuccess(debitedBalance)

      // Convert USD to TON
      const tonAmount = convertUsdToTon(numericAmount)
      if (!tonAmount) {
        setError("Unable to convert USD to TON. Please try again later.")
        return
      }

      // Add network fee to the amount (0.005 TON)
      const networkFee = 0.005
      const totalTonAmount = tonAmount + networkFee

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

      // Форматируем сумму для отправки
      const formattedAmount = formatTonAmount(tonAmount)
      
      console.log('Sending transaction:', {
        to: destinationAddress.toString(),
        amount: tonAmount,
        formattedAmount,
        totalAmount: totalTonAmount,
        amountInNano: toNano(formattedAmount).toString()
      })

      setTransactionStatus('Sending transaction...')
      const key = await mnemonicToWalletKey(mnemonic.split(" "))
      const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 })
      
      // Используем резервные эндпоинты если основной не отвечает
      let endpoint: string
      try {
        endpoint = await getHttpEndpoint({ network: "mainnet" })
      } catch (e) {
        console.log('Failed to get primary endpoint, using fallback')
        endpoint = 'https://toncenter.com/api/v2/jsonRPC'
      }
      
      const client = new TonClient({ endpoint })

      const walletContract = client.open(wallet)
      const seqno = await walletContract.getSeqno()
      
      console.log('Sending transaction:', {
        to: destinationAddress.toString(),
        amount: tonAmount,
        formattedAmount,
        totalAmount: totalTonAmount,
        amountInNano: toNano(formattedAmount).toString()
      })

      setTransactionStatus('Sending transaction...')
      await walletContract.sendTransfer({
        secretKey: key.secretKey,
        seqno: seqno,
        messages: [
          internal({
            to: destinationAddress.toString(),
            value: toNano(formattedAmount),
            body: "Transfer from V0",
            bounce: false,
          })
        ]
      })

      // Wait for transaction confirmation
      let currentSeqno = seqno
      let attempts = 0
      const maxAttempts = 5

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
      transactionSuccess = true
      onClose()

    } catch (error) {
      console.error("Send TON error:", error)
      setTransactionStatus('Transaction failed')
      if (error instanceof Error) {
        if (error.message.includes('Invalid number')) {
          setError('Invalid amount format. Please try a different amount.')
        } else if (error.message.includes('exception in fetch')) {
          setError('Network error. Please try again.')
        } else {
          setError(error.message)
        }
      } else {
        setError("Failed to send TON")
      }
    } finally {
      setIsSubmitting(false)
      // Централизованный возврат суммы на баланс, если транзакция неуспешна
      if (!transactionSuccess && debitedBalance !== null) {
        // Возвращаем сумму в базе данных
        const rollbackResult = await topUpWalletBalance(numericAmount, userId)
        if (rollbackResult.success && typeof rollbackResult.newBalance === 'number') {
          onSuccess(rollbackResult.newBalance)
        }
      }
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
            <div className="flex items-center justify-between">
              <Label htmlFor="address">Destination Address</Label>
              {tonConnectUI.account?.address && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setAddress(tonConnectUI.account?.address || '')}
                  title="Use my TON address"
                >
                  <img 
                    src="/ton.png" 
                    alt="TON" 
                    className="h-4 w-4"
                  />
                </Button>
              )}
            </div>
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
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  ≈ {convertUsdToTon(parseFloat(amount))?.toFixed(9)} TON
                </p>
                <p className="text-xs text-gray-500">
                  Network fee: 0.005 TON
                </p>
                <p className="text-xs text-gray-500">
                  Total with fee: {formatTonAmount(convertUsdToTon(parseFloat(amount)) || 0 + 0.005)} TON
                </p>
              </div>
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