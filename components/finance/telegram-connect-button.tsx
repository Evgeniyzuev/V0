"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const supabase = createClientSupabaseClient()
const BOT_USERNAME = "V0_aiassist_bot" // Имя Telegram бота

export default function TelegramConnectButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      // Генерируем уникальный токен для пользователя
      const token = Math.random().toString(36).substring(2, 15)
      
      // Сохраняем токен в базе данных
      const { error } = await supabase
        .from('telegram_connection_tokens')
        .upsert({
          user_id: userId,
          token: token,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // Токен действителен 15 минут
        })

      if (error) throw error

      // Открываем Telegram бота с токеном
      const botUrl = `https://t.me/${BOT_USERNAME}?start=${token}`
      window.open(botUrl, '_blank')

      toast({
        title: "Success",
        description: "Please complete the connection in Telegram",
      })
    } catch (error) {
      console.error('Error initiating Telegram connection:', error)
      toast({
        title: "Error",
        description: "Failed to initiate Telegram connection",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        "Connect Telegram"
      )}
    </Button>
  )
} 