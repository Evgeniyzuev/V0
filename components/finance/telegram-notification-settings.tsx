"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import TelegramConnectButton from "./telegram-connect-button"

const supabase = createClientSupabaseClient()

interface TelegramNotificationSettings {
  telegram_chat_id: number | null
  receive_interest_notifications: boolean
}

export default function TelegramNotificationSettings({ userId }: { userId: string }) {
  const [settings, setSettings] = useState<TelegramNotificationSettings>({
    telegram_chat_id: null,
    receive_interest_notifications: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('telegram_notification_settings')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error) throw error

        if (data) {
          setSettings({
            telegram_chat_id: data.telegram_chat_id,
            receive_interest_notifications: data.receive_interest_notifications
          })
        }
      } catch (error) {
        console.error('Error fetching notification settings:', error)
        toast({
          title: "Error",
          description: "Failed to load notification settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchSettings()
    }
  }, [userId])

  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('telegram_notification_settings')
        .upsert({
          user_id: userId,
          receive_interest_notifications: enabled,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setSettings(prev => ({
        ...prev,
        receive_interest_notifications: enabled
      }))

      toast({
        title: "Success",
        description: `Notifications ${enabled ? 'enabled' : 'disabled'} successfully`,
      })
    } catch (error) {
      console.error('Error updating notification settings:', error)
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading notification settings...</div>
  }

  return (
    <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Telegram Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive daily interest updates in Telegram
              </p>
            </div>
            <Switch
              id="notifications"
              checked={settings.receive_interest_notifications}
              onCheckedChange={handleToggleNotifications}
              disabled={!settings.telegram_chat_id}
            />
          </div>

          {!settings.telegram_chat_id ? (
            <div className="space-y-3">
              <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                <p>To receive notifications, please connect your Telegram account.</p>
              </div>
              <TelegramConnectButton userId={userId} />
            </div>
          ) : (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              <p>Telegram account connected successfully!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 