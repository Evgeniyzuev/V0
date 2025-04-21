import { useState, useCallback, useEffect } from 'react';

export const useTransactionStatus = () => {
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [transactionHash, setTransactionHash] = useState<string>('');

  async function checkTransactionStatus(hash: string) {
    try {
      const response = await fetch(`https://toncenter.com/api/v3/transactions?msg_hash=${hash}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_MAINNET_TONCENTER_API_KEY || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction status');
      }

      const data = await response.json();
      if (data && data.transactions && data.transactions.length > 0) {
        const transaction = data.transactions[0];
        if (transaction.description && transaction.description.compute_ph) {
          if (transaction.description.compute_ph.success) {
            console.log('Transaction confirmed:', hash);
            setTransactionStatus('confirmed');
          } else {
            console.log('Transaction failed:', hash);
            setTransactionStatus('failed');
          }
        } else {
          console.log('Transaction status unknown:', hash);
          setTransactionStatus('unknown');
        }
      } else {
        console.log('Transaction not found:', hash);
        setTransactionStatus('not found');
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
      setTransactionStatus('error');
    }
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (transactionHash && transactionStatus === 'checking') {
      intervalId = setInterval(() => {
        checkTransactionStatus(transactionHash);
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [transactionHash, transactionStatus]);

  const startChecking = useCallback((hash: string) => {
    setTransactionHash(hash);
    setTransactionStatus('checking');
  }, []);

  return { transactionStatus, startChecking };
}; 