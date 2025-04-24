import { NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'

export async function POST(request: Request) {
  try {
    const { chat_id, message } = await request.json()

    if (!chat_id || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    await sendTelegramMessage(chat_id, message)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending Telegram message:', error)
    return NextResponse.json(
      { error: 'Failed to send Telegram message' },
      { status: 500 }
    )
  }
} 