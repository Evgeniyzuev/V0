"use client"

import { useState, useEffect } from "react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useUser } from "@/components/UserContext"
import { User } from "@supabase/supabase-js"

type Referral = {
  id: string
  created_at: string
  first_name?: string
  level: number
  avatar_url?: string
}

const supabase = createClientSupabaseClient()

export default function UsersTab() {
  const { telegramUser } = useUser()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReferrals() {
      if (!telegramUser?.id) return

      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("users")
        .select("id, created_at, first_name, level, avatar_url")
        .eq("referrer_id", telegramUser.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching referrals:", error)
        setError("Failed to fetch referrals. Please check the console for details.")
      } else {
        setReferrals(data || [])
      }
      setLoading(false)
    }

    fetchReferrals()
  }, [telegramUser?.id])

  if (loading) {
    return <div className="p-4 text-center">Loading referrals...</div>
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">{error}</div>
  }

  if (referrals.length === 0) {
    return <div className="p-4 text-center">No referrals found.</div>
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Your Referrals</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {referrals.map((referral) => (
          <Card key={referral.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={referral.avatar_url || undefined} alt={referral.first_name || "User"} />
                <AvatarFallback>{referral.first_name ? referral.first_name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <CardTitle>{referral.first_name || `User ${referral.id.substring(0, 6)}`}</CardTitle>
                <p className="text-sm text-muted-foreground">Level {referral.level}</p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Joined: {new Date(referral.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 