import { NextResponse } from 'next/server'
import crypto from 'crypto'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Verify the authentication data
    const { hash, ...userData } = data
    
    // Create a check string
    const checkArr = Object.entries(userData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
    
    const checkString = checkArr.join('\n')
    
    // Create a secret key from bot token
    const secretKey = crypto
      .createHash('sha256')
      .update(BOT_TOKEN || '')
      .digest()
    
    // Calculate hmac
    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex')
    
    // Verify the hash
    if (hmac !== hash) {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 401 }
      )
    }
    
    // Here you would typically:
    // 1. Create or update user in your database
    // 2. Create a session or JWT token
    // 3. Set cookies or return token
    
    // For now, we'll just return the verified user data
    return NextResponse.json({
      success: true,
      user: userData
    })
    
  } catch (error) {
    console.error('Telegram auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
} 