import { NextResponse } from 'next/server'
import { createClientSupabaseClient } from '@/lib/supabase'

const supabase = createClientSupabaseClient()

export async function POST(request: Request) {
  try {
    const update = await request.json()
    
    // Проверяем, что это команда /start
    if (update.message?.text?.startsWith('/start')) {
      const token = update.message.text.split(' ')[1]
      const chatId = update.message.chat.id

      if (!token) {
        return NextResponse.json({ error: 'No token provided' }, { status: 400 })
      }

      // Находим пользователя по токену
      const { data: tokenData, error: tokenError } = await supabase
        .from('telegram_connection_tokens')
        .select('user_id')
        .eq('token', token)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (tokenError || !tokenData) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 400 }
        )
      }

      // Обновляем настройки пользователя
      const { error: updateError } = await supabase
        .from('telegram_notification_settings')
        .upsert({
          user_id: tokenData.user_id,
          telegram_chat_id: chatId,
          updated_at: new Date().toISOString()
        })

      if (updateError) {
        throw updateError
      }

      // Помечаем токен как использованный
      await supabase
        .from('telegram_connection_tokens')
        .update({ is_used: true })
        .eq('token', token)

      // Отправляем подтверждение пользователю
      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: '✅ Your Telegram account has been successfully connected! You will now receive daily interest notifications.'
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error processing Telegram webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 