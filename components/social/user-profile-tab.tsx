"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, User, Wallet, Award, Users, Calendar } from "lucide-react"
import { getCurrentUser, type User as UserType } from "@/app/actions/user-actions"

export default function UserProfileTab() {
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchUser = async () => {
    try {
      setIsRefreshing(true)
      setError(null)

      const result = await getCurrentUser()

      if (!result.success) {
        setError(result.error || "Failed to fetch user data")
      } else {
        setUser(result.user)
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
    fetchUser()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <p>Loading user data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchUser}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>No user data found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <CardTitle className="text-sm">User Profile</CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchUser}
            disabled={isRefreshing}
            aria-label="Refresh user data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <User className="h-10 w-10 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-gray-500">@{user.username || "username"}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center mb-1">
                <Wallet className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-xs text-gray-500">Wallet Balance</span>
              </div>
              <p className="text-lg font-semibold">${user.wallet_balance.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center mb-1">
                <Award className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-xs text-gray-500">AICore Balance</span>
              </div>
              <p className="text-lg font-semibold">${user.aicore_balance.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center">
                <Award className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm">Level</span>
              </div>
              <span className="font-medium">{user.level}</span>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm">Paid Referrals</span>
              </div>
              <span className="font-medium">{user.paid_referrals}</span>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm">Reinvest Setup</span>
              </div>
              <span className="font-medium">{user.reinvest_setup}%</span>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm">Member Since</span>
              </div>
              <span className="font-medium text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm">Last Login</span>
              </div>
              <span className="font-medium text-sm">{new Date(user.last_login_date).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

