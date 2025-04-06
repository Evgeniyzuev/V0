import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // Получаем URL параметры
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || '';
  const telegramId = url.searchParams.get('telegramId') || '';
  
  if (!userId && !telegramId) {
    return NextResponse.json(
      { error: 'Missing user ID or Telegram ID parameter' },
      { status: 400 }
    );
  }
  
  // Базовый URL Telegram-бота
  // В идеале это должно быть в .env
  const botUsername = 'YOUR_BOT_USERNAME'; // Замените на имя вашего бота
  
  // Создаем ссылку t.me/{botUsername}?start={userId/telegramId}
  const referralParam = userId || telegramId;
  const referralLink = `https://t.me/${botUsername}?start=${referralParam}`;
  
  // Конструируем глубокую ссылку для Telegram Web App (если применимо)
  // Это опционально и зависит от вашей реализации
  const deepLink = `tg://resolve?domain=${botUsername}&start=${referralParam}`;
  
  return NextResponse.json({ 
    success: true,
    referralLink,
    deepLink,
    referralId: referralParam
  });
}

// Опционально: обработчик POST для сохранения реферала
export async function POST(request: Request) {
  // Инициализируем Supabase клиент для доступа к базе данных
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Server configuration error: Missing Supabase credentials' },
      { status: 500 }
    );
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { newUserId, referrerId } = body;
    
    if (!newUserId || !referrerId) {
      return NextResponse.json(
        { error: 'Missing user IDs' },
        { status: 400 }
      );
    }
    
    // Обновляем запись пользователя, добавляя ID реферера
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ referrer_id: referrerId })
      .eq('id', newUserId)
      .select();
      
    if (error) {
      console.error('Error saving referral:', error);
      return NextResponse.json(
        { error: 'Failed to save referral information' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Referral saved successfully',
      data
    });
  } catch (e: any) {
    console.error('Error in referral API:', e);
    return NextResponse.json(
      { error: e.message || 'Server error' },
      { status: 500 }
    );
  }
} 