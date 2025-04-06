"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { getEntries } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw } from "lucide-react"

type Entry = {
  id: number
  text: string
  created_at: string
}

export function EntryList() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchEntries = async () => {
    try {
      setIsRefreshing(true)
      const result = await getEntries()

      if (result.success) {
        setEntries(result.entries)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch entries",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Saved Entries</CardTitle>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchEntries}
          disabled={isRefreshing}
          aria-label="Refresh entries"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">Loading entries...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">No entries found. Add some text above!</div>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id} className="p-3 border rounded-md bg-card">
                <p className="mb-1">{entry.text}</p>
                <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={fetchEntries} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing..." : "Refresh Entries"}
        </Button>
      </CardFooter>
    </Card>
  )
}

