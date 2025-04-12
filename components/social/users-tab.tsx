"use client"

import { useState, useEffect } from "react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// Define the type for a user, adjust based on your actual users table schema
type User = {
  id: string
  created_at: string
  username?: string // Optional username field
  email?: string    // Optional email field
  avatar_url?: string // Optional avatar URL field
  // Add other fields from your 'users' table as needed
}

// Initialize Supabase client - Replace with your actual credentials or central client instance
// It's better practice to use the environment variables as done in posts-tab.tsx
const supabase = createClientSupabaseClient();

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      setError(null)
      // Fetch data from the 'users' table. Adjust 'users' if your table name is different.
      const { data, error } = await supabase.from("users").select("*")

      if (error) {
        console.error("Error fetching users:", error)
        setError("Failed to fetch users. Please check the console for details.")
      } else {
        setUsers(data || [])
      }
      setLoading(false)
    }

    fetchUsers()
  }, [])

  if (loading) {
    return <div className="p-4 text-center">Loading users...</div>
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">{error}</div>
  }

  if (users.length === 0) {
    return <div className="p-4 text-center">No users found.</div>
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">All Users</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url || undefined} alt={user.username || "User"} />
                <AvatarFallback>{user.username ? user.username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                 <CardTitle>{user.username || `User ${user.id.substring(0, 6)}`}</CardTitle>
                 {/* Optionally display email or other info */}
                 {/* <p className="text-sm text-muted-foreground">{user.email}</p> */}
              </div>
            </CardHeader>
            {/* <CardContent>
              <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>
              Add more user details here if needed
            </CardContent> */}
          </Card>
        ))}
      </div>
    </div>
  )
} 