import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { format } from "date-fns"

const supabase = createClientSupabaseClient()

interface CoreOperation {
  id: string
  user_id: string
  amount: number
  type: 'interest' | 'transfer' | 'reinvest'
  created_at: string
}

interface CoreHistoryProps {
  userId: string
}

export default function CoreHistory({ userId }: CoreHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [operations, setOperations] = useState<CoreOperation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadOperations = async () => {
    console.log('Loading operations for userId:', userId)
    setIsLoading(true)
    try {
      // Сначала проверим, есть ли вообще записи в таблице
      const { count } = await supabase
        .from('core_operations')
        .select('*', { count: 'exact', head: true })

      console.log('Total records in table:', count)
      
      // Проверим все записи без фильтра по user_id
      const { data: allData, error: allError } = await supabase
        .from('core_operations')
        .select('*')
        .limit(5)

      console.log('Sample records from table:', allData)
      
      // Затем выполним основной запрос
      const { data, error } = await supabase
        .from('core_operations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading operations:', error)
        throw error
      }
      
      console.log('Query details:', {
        table: 'core_operations',
        filter: { user_id: userId },
        resultCount: data?.length || 0
      })
      
      console.log('Loaded operations:', data)
      setOperations(data || [])
    } catch (error) {
      console.error('Error loading operations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('CoreHistory mounted/updated with userId:', userId)
    loadOperations()
  }, [userId])

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'interest':
        return '💰'
      case 'transfer':
        return '↔️'
      case 'reinvest':
        return '🔄'
      default:
        return '📝'
    }
  }

  const getOperationLabel = (type: string) => {
    switch (type) {
      case 'interest':
        return 'Interest Earned'
      case 'transfer':
        return 'Transfer'
      case 'reinvest':
        return 'Reinvest'
      default:
        return 'Operation'
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={toggleExpand}
        className="w-full flex items-center justify-between p-2 bg-white rounded-lg border hover:bg-gray-50"
      >
        <span className="font-medium">Core History</span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      <div className={`space-y-2 ${isExpanded ? 'block' : 'hidden'}`}>
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">Loading history...</div>
        ) : operations.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No operations yet</div>
        ) : (
          <div className="space-y-2">
            {operations.map((op) => (
              <div
                key={op.id}
                className="flex items-center justify-between p-2 bg-white rounded-lg border"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getOperationIcon(op.type)}</span>
                  <div>
                    <div className="font-medium">{getOperationLabel(op.type)}</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(op.created_at), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
                <div className={`font-medium ${op.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {op.amount >= 0 ? '+' : ''}{op.amount.toFixed(8)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 