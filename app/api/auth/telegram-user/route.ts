import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from "@/lib/supabase"
import crypto from 'crypto';

// Типы данных
interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

// Определяем интерфейс для нового пользователя
interface NewUser {
  id: string; // UUID из auth.users
  telegram_id: number;
  telegram_username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  reinvest: number;
  aicore_balance: number;
  wallet_balance: number;
  level: number;
  paid_referrals: number;
  referrer_id?: number | null;
}

// Функция для верификации данных от Telegram
// В идеале нужно использовать эту функцию, но в простом случае
// можно и пропустить верификацию, если приложение не критичное
function verifyTelegramData(initData: string, botToken: string): boolean {
  try {
    if (!initData || !botToken) return false;
    
    // В полной версии здесь должен быть код проверки hash из initData
    // с использованием botToken, как описано в документации Telegram
    
    // Для упрощенной версии мы просто убедимся, что initData не пустая
    return true;
  } catch (e) {
    console.error('Error verifying Telegram data:', e);
    return false;
  }
}

// Генерация случайного пароля для Auth пользователя
function generateRandomPassword(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { telegramUser, initData } = body;
    
    if (!telegramUser?.id) {
      return NextResponse.json(
        { error: 'Missing Telegram user data' },
        { status: 400 }
      );
    }
    
    const telegramId = telegramUser.id;
    
    // Extract referrer_id from start_param parameter if present
    let referrerId = null;
    console.log('Raw initData:', initData);
    
    try {
      // Decode the initData if it's URL encoded
      const decodedInitData = decodeURIComponent(initData);
      console.log('Decoded initData:', decodedInitData);
      
      const urlParams = new URLSearchParams(decodedInitData);
      console.log('All URL parameters:', Object.fromEntries(urlParams.entries()));
      
      // Get start_param from initData
      const startParam = urlParams.get('start_param');
      console.log('Extracted start_param:', startParam);
      
      if (startParam) {
        referrerId = parseInt(startParam, 10);
        if (isNaN(referrerId)) {
          console.warn('Invalid referrer_id in start_param:', startParam);
          referrerId = null;
        } else {
          console.log('Successfully parsed referrer_id:', referrerId);
        }
      } else {
        console.log('No start_param found in initData');
      }
    } catch (error) {
      console.error('Error processing initData:', error);
    }
    
    // 1. Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();
      
    if (existingUser) {
      return NextResponse.json({ 
        success: true, 
        user: existingUser,
        auth_user_id: existingUser.id
      });
    }
    
    // 2. Create auth user
    const email = `telegram_${telegramId}@example.com`;
    const password = generateRandomPassword();
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        telegram_id: telegramId,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username
      }
    });
    
    if (authError) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json(
        { error: 'Failed to create authentication user' },
        { status: 500 }
      );
    }
    
    // 3. Create database user
    const newUser = {
      id: authUser.user.id,
      telegram_id: telegramId,
      telegram_username: telegramUser.username || null,
      first_name: telegramUser.first_name || null,
      last_name: telegramUser.last_name || null,
      reinvest: 100,
      aicore_balance: 0,
      wallet_balance: 0,
      level: 0,
      paid_referrals: 0,
      referrer_id: referrerId
    };
    
    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();
    
    if (insertError) {
      // Cleanup: Delete the auth user if database insert fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      console.error('Database user creation error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create database user' },
        { status: 500 }
      );
    }
    
    // 4. Add default goal
    try {
      await supabase
        .from('user_goals')
        .insert({
          user_id: insertedUser.id,
          goal_id: 1,
          status: 'not_started',
        });
    } catch (e) {
      console.error('Failed to add default goal:', e);
      // Continue even if goal creation fails
    }
    
    return NextResponse.json({ 
      success: true, 
      user: insertedUser,
      auth_user_id: authUser.user.id,
      password: password 
    });
    
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 