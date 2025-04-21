"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { createClientSupabaseClient } from "@/lib/supabase"
import { format } from "date-fns"

const supabase = createClientSupabaseClient()

type InterestHistory = {
  id: number
  execution_date: string
  execution_time: string
  core_balance_before: number
  interest_amount: number
  to_core: number
  to_wallet: number
  reinvest_percentage: number
}

export default function InterestHistory({ userId }: { userId: string }) {
  const [history, setHistory] = useState<InterestHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('interest_history')
          .select('*')
          .eq('user_id', userId)
          .order('execution_time', { ascending: false })
          .limit(30)

        if (error) throw error
        setHistory(data || [])
      } catch (error) {
        console.error('Error fetching interest history:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchHistory()
    }
  }, [userId])

  if (loading) {
    return <div className="p-4">Loading history...</div>
  }

  if (history.length === 0) {
    return <div className="p-4 text-gray-500">No interest history yet</div>
  }

  return (
    <div className="space-y-2">
      {history.map((record) => (
        <Card key={record.id} className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Date:</span>
                <span className="ml-2">
                  {format(new Date(record.execution_time), 'MMM d, yyyy')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Time:</span>
                <span className="ml-2">
                  {format(new Date(record.execution_time), 'HH:mm')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Balance Before:</span>
                <span className="ml-2">${record.core_balance_before.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Interest:</span>
                <span className="ml-2 text-green-600">
                  ${record.interest_amount.toFixed(8)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">To Core:</span>
                <span className="ml-2 text-blue-600">
                  ${record.to_core.toFixed(8)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">To Wallet:</span>
                <span className="ml-2 text-purple-600">
                  ${record.to_wallet.toFixed(8)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Reinvest:</span>
                <span className="ml-2">{record.reinvest_percentage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 