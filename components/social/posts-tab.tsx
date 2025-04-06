"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

type Entry = {
  id: number
  text: string
  created_at: string
}

export default function PostsTab() {
  const [text, setText] = useState("")
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchEntries = async () => {
    try {
      setIsRefreshing(true)
      setError(null)

      const { data, error } = await supabase.from("entries").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching entries:", error)
        setError(error.message)
      } else {
        setEntries(data || [])
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!text.trim()) {
      setError("Please enter some text")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { error } = await supabase.from("entries").insert([{ text: text.trim() }])

      if (error) {
        console.error("Error saving entry:", error)
        setError(error.message)
      } else {
        setText("")
        setSuccessMessage("Entry saved successfully")
        fetchEntries()
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("Failed to save entry")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccessMessage(null)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [error, successMessage])

  return (
    <div className="p-4">
      <div className="space-y-6">
        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Share with community..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sharing..." : "Share"}
              </Button>
            </form>

            {error && <div className="mt-4 p-2 bg-red-100 text-red-800 rounded-md text-sm">{error}</div>}

            {successMessage && (
              <div className="mt-4 p-2 bg-green-100 text-green-800 rounded-md text-sm">{successMessage}</div>
            )}
          </CardContent>
        </Card>

        {/* Entries List Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <CardTitle className="text-sm">Community Posts</CardTitle>
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
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <div className="flex justify-center py-6">Loading posts...</div>
            ) : entries.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No posts found. Be the first to share!</div>
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
        </Card>
      </div>
    </div>
  )
}

