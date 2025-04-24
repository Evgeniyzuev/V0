import { createClientSupabaseClient } from "./supabase"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

export async function sendTelegramMessage(chatId: number, message: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set')
    return
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to send Telegram message:', error)
      throw new Error(`Failed to send Telegram message: ${error.description}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending Telegram message:', error)
    throw error
  }
}

export async function updateTelegramChatId(userId: string, chatId: number) {
  const supabase = createClientSupabaseClient()

  try {
    const { error } = await supabase
      .from('telegram_notification_settings')
      .upsert({
        user_id: userId,
        telegram_chat_id: chatId,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
  } catch (error) {
    console.error('Error updating Telegram chat ID:', error)
    throw error
  }
} 