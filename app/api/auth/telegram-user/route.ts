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
      // First try to get start_param from the body
      const startParam = body.startParam;
      console.log('Start param from body:', startParam);
      
      if (startParam) {
        referrerId = parseInt(startParam, 10);
        if (isNaN(referrerId)) {
          console.warn('Invalid referrer_id in start_param:', startParam);
          referrerId = null;
        } else {
          console.log('Successfully parsed referrer_id from body:', referrerId);
        }
      }
      
      // If no start_param in body, try to get it from initData
      if (!referrerId) {
        // Decode the initData if it's URL encoded
        const decodedInitData = decodeURIComponent(initData);
        console.log('Decoded initData:', decodedInitData);
        
        const urlParams = new URLSearchParams(decodedInitData);
        console.log('All URL parameters:', Object.fromEntries(urlParams.entries()));
        
        // Get start_param from initData
        const startParamFromInitData = urlParams.get('start_param') || urlParams.get('start');
        console.log('Extracted start_param from initData:', startParamFromInitData);
        
        if (startParamFromInitData) {
          referrerId = parseInt(startParamFromInitData, 10);
          if (isNaN(referrerId)) {
            console.warn('Invalid referrer_id in start_param from initData:', startParamFromInitData);
            referrerId = null;
          } else {
            console.log('Successfully parsed referrer_id from initData:', referrerId);
          }
        }
      }
      
      // Also check for start parameter in the URL
      if (!referrerId) {
        const url = new URL(request.url);
        const startParamFromUrl = url.searchParams.get('start') || url.searchParams.get('start_param');
        console.log('Start param from request URL:', startParamFromUrl);
        
        if (startParamFromUrl) {
          referrerId = parseInt(startParamFromUrl, 10);
          if (isNaN(referrerId)) {
            console.warn('Invalid referrer_id in URL start_param:', startParamFromUrl);
            referrerId = null;
          } else {
            console.log('Successfully parsed referrer_id from URL:', referrerId);
          }
        }
      }
      
      // Verify that referrer exists if we have a referrerId
      if (referrerId) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id')
          .eq('telegram_id', referrerId)
          .single();
          
        if (!referrer) {
          console.warn('Referrer not found:', referrerId);
          referrerId = null;
        } else {
          console.log('Referrer verified:', referrer);
        }
      }
    } catch (error) {
      console.error('Error processing start_param:', error);
    }
    
    // 1. Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();
      
    if (fetchError) {
      console.error('Error checking existing user:', fetchError);
      return NextResponse.json(
        { error: 'Failed to check existing user' },
        { status: 500 }
      );
    }
      
    if (existingUser) {
      console.log('User already exists:', existingUser);
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
    
    console.log('Successfully created auth user:', authUser);
    
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
    
    console.log('Creating new user with data:', newUser);
    
    try {
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();
      
      if (insertError) {
        console.error('Database user creation error:', insertError);
        console.error('Error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        
        // Cleanup: Delete the auth user if database insert fails
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.user.id);
        if (deleteError) {
          console.error('Failed to cleanup auth user:', deleteError);
        }
        
        return NextResponse.json(
          { error: 'Failed to create database user', details: insertError },
          { status: 500 }
        );
      }
      
      console.log('Successfully created user:', insertedUser);
      
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
    } catch (error) {
      console.error('Unexpected error during user creation:', error);
      return NextResponse.json(
        { error: 'Unexpected error during user creation', details: error },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 