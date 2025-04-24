"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { useUser } from "@/components/UserContext"

const supabase = createClientSupabaseClient()
const BOT_USERNAME = "V0_aiassist_bot" // Имя Telegram бота

export default function TelegramConnectButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { telegramUser, dbUser } = useUser()

  // Автоматическое подключение при наличии telegram_id
  useEffect(() => {
    const autoConnect = async () => {
      // Проверяем есть ли уже подключение
      const { data: existingSettings } = await supabase
        .from('telegram_notification_settings')
        .select('telegram_chat_id')
        .eq('user_id', userId)
        .single()

      // Если уже подключено или нет telegram_id, не делаем ничего
      if (existingSettings?.telegram_chat_id || (!dbUser?.telegram_id && !telegramUser?.id)) {
        return
      }

      setIsLoading(true)
      try {
        // Используем telegram_id из dbUser или telegramUser
        const telegram_id = dbUser?.telegram_id || telegramUser?.id

        if (telegram_id) {
          // Автоматически подключаем уведомления
          const { error } = await supabase
            .from('telegram_notification_settings')
            .upsert({
              user_id: userId,
              telegram_chat_id: telegram_id,
              updated_at: new Date().toISOString()
            })

          if (error) throw error

          toast({
            title: "Success",
            description: "Telegram notifications automatically connected",
          })
        }
      } catch (error) {
        console.error('Error auto-connecting Telegram:', error)
        toast({
          title: "Error",
          description: "Failed to auto-connect Telegram notifications",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    autoConnect()
  }, [userId, dbUser, telegramUser, toast])

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      // Если есть telegram_id, используем его напрямую
      if (dbUser?.telegram_id || telegramUser?.id) {
        const telegram_id = dbUser?.telegram_id || telegramUser?.id
        const { error } = await supabase
          .from('telegram_notification_settings')
          .upsert({
            user_id: userId,
            telegram_chat_id: telegram_id,
            updated_at: new Date().toISOString()
          })

        if (error) throw error

        toast({
          title: "Success",
          description: "Telegram notifications connected",
        })
        return
      }

      // Если нет telegram_id, используем стандартный процесс с токеном
      const token = Math.random().toString(36).substring(2, 15)
      
      const { error } = await supabase
        .from('telegram_connection_tokens')
        .upsert({
          user_id: userId,
          token: token,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        })

      if (error) throw error

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