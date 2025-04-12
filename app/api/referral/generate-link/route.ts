import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
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
  const botUsername = '@V0_aiassist_bot'; // Замените на имя вашего бота
  
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
  const supabase = createServerSupabaseClient();
  
  try {
    const body = await request.json();
    const { newUserId, referrerId } = body;
    
    if (!newUserId || !referrerId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Обновляем запись пользователя, добавляя ID реферера
    const { data, error } = await supabase
      .from('users')
      .update({ referrer_id: referrerId })
      .eq('id', newUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 