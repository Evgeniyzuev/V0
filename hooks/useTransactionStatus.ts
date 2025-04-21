import { useState, useCallback } from 'react'
import TonWeb from 'tonweb'

export function useTransactionStatus() {
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null)

  const startChecking = useCallback(async (transactionBoc: string) => {
    try {
      const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC', {
        apiKey: process.env.NEXT_PUBLIC_MAINNET_TONCENTER_API_KEY
      }))

      setTransactionStatus('Checking transaction...')

      // Parse transaction and get its hash
      const cell = TonWeb.boc.Cell.fromBoc(transactionBoc)[0]
      const hash = TonWeb.utils.bytesToHex(await cell.hash())

      let attempts = 0
      const maxAttempts = 10

      const checkTransaction = async () => {
        try {
          const transaction = await tonweb.getTransactions(hash)
          
          if (transaction && transaction.length > 0) {
            setTransactionStatus('Transaction completed successfully')
            return true
          }
          
          if (attempts >= maxAttempts) {
            setTransactionStatus('Error: Transaction timeout')
            return false
          }

          attempts++
          setTimeout(checkTransaction, 3000) // Check every 3 seconds
          return null
        } catch (error) {
          console.error('Error checking transaction:', error)
          setTransactionStatus('Error checking transaction')
          return false
        }
      }

      await checkTransaction()
    } catch (error) {
      console.error('Error starting transaction check:', error)
      setTransactionStatus('Error starting transaction check')
    }
  }, [])

  return { transactionStatus, startChecking }
} 