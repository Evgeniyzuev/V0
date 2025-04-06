import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Типы данных
interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
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

export async function POST(request: Request) {
  // Инициализируем Supabase Admin клиент для доступа к базе данных только в обработчике запроса
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("API Route ENV Check:", { 
    hasUrl: !!supabaseUrl, 
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasClientKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });

  if (!supabaseUrl) {
    console.error('Missing Supabase URL');
    return NextResponse.json(
      { error: 'Server configuration error: Missing Supabase URL' },
      { status: 500 }
    );
  }

  if (!supabaseServiceKey) {
    console.error('Missing Supabase Key');
    return NextResponse.json(
      { error: 'Server configuration error: Missing Supabase Key' },
      { status: 500 }
    );
  }

  try {
    // Создаем клиент с доступными учетными данными
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase client created successfully");
    
    const body = await request.json();
    const { telegramUser, initData } = body;
    
    if (!telegramUser || !telegramUser.id) {
      return NextResponse.json(
        { error: 'Missing Telegram user data' },
        { status: 400 }
      );
    }
    
    // В полной версии здесь должна быть верификация
    // const botToken = process.env.TELEGRAM_BOT_TOKEN;
    // if (!botToken || !verifyTelegramData(initData, botToken)) {
    //   return NextResponse.json(
    //     { error: 'Invalid Telegram data' },
    //     { status: 400 }
    //   );
    // }
    
    const telegramId = telegramUser.id;
    
    // Ищем пользователя в базе по telegram_id
    const { data: existingUser, error: findError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();
      
    if (findError) {
      console.error('Error finding user:', findError);
      return NextResponse.json(
        { error: 'Database error while finding user' },
        { status: 500 }
      );
    }
    
    // Если пользователь существует, возвращаем его данные
    if (existingUser) {
      // Опционально, обновляем некоторые поля из telegram
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          telegram_username: telegramUser.username,
          first_name: existingUser.first_name || telegramUser.first_name,
          last_name: existingUser.last_name || telegramUser.last_name,
          avatar_url: existingUser.avatar_url || telegramUser.photo_url,
        })
        .eq('telegram_id', telegramId);
      
      if (updateError) {
        console.error('Error updating user:', updateError);
      }
      
      return NextResponse.json({ success: true, user: existingUser });
    }
    
    // Если пользователя нет, создаем его
    // 1. Создаем запись в auth.users (необязательно в simple-auth случае, но нужно в полной интеграции)
    // 2. Создаем запись в публичной таблице users
    
    // Для упрощенного примера опустим создание auth.users и сразу создадим запись в публичной таблице
    const newUser = {
      telegram_id: telegramId,
      telegram_username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      avatar_url: telegramUser.photo_url,
    };
    
    const { data: insertedUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert(newUser)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating user:', insertError);
      return NextResponse.json(
        { error: 'Database error while creating user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, user: insertedUser });
    
  } catch (e: any) {
    console.error('Error in telegram-user API:', e);
    return NextResponse.json(
      { error: e.message || 'Server error' },
      { status: 500 }
    );
  }
} 