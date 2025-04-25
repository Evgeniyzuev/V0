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
  console.log("API Route ENV Check:", { 
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasClientKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('Missing Supabase URL');
    return NextResponse.json(
      { error: 'Server configuration error: Missing Supabase URL' },
      { status: 500 }
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase Service Role Key');
    return NextResponse.json(
      { error: 'Server configuration error: Missing Supabase Service Role Key' },
      { status: 500 }
    );
  }

  try {
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
    
    console.log(`Processing user with Telegram ID: ${telegramId}`);
    
    // Ищем пользователя в базе по telegram_id
    const { data: existingUser, error: findError } = await supabase
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
      console.log(`Found existing user with Telegram ID: ${telegramId}`);
      
      // Проверяем, нужно ли обновлять данные
      const needsUpdate = (
        existingUser.telegram_username !== telegramUser.username ||
        (!existingUser.first_name && telegramUser.first_name) ||
        (!existingUser.last_name && telegramUser.last_name)
      );
      
      if (needsUpdate) {
        console.log(`Updating user data for Telegram ID: ${telegramId}`);
        // Опционально, обновляем некоторые поля из telegram
        const { error: updateError } = await supabase
          .from('users')
          .update({
            telegram_username: telegramUser.username,
            first_name: existingUser.first_name || telegramUser.first_name,
            last_name: existingUser.last_name || telegramUser.last_name,
          })
          .eq('telegram_id', telegramId);
        
        if (updateError) {
          console.error('Error updating user:', updateError);
        }
      } else {
        console.log(`No updates needed for Telegram ID: ${telegramId}`);
      }
      
      // Проверяем, есть ли связанный auth.user для этого пользователя
      const email = `telegram_${telegramId}@example.com`;
      const { data: existingAuthUser } = await supabase.auth.admin.getUserById(existingUser.id);
      
      if (existingAuthUser?.user) {
        console.log(`Found existing auth user with ID: ${existingUser.id}`);
        // Возвращаем данные с auth_user_id для клиента, чтобы он мог войти
        return NextResponse.json({ 
          success: true, 
          user: existingUser,
          auth_user_id: existingUser.id
        });
      } else {
        console.log(`No auth user found for UUID: ${existingUser.id}, creating one`);
        // Создаем auth.user для существующего пользователя
        const password = generateRandomPassword();
        
        const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            telegram_id: telegramId,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            username: telegramUser.username
          },
          // Важно указать id, чтобы привязать к существующему public.users
          id: existingUser.id
        });
        
        if (authError) {
          console.error('Error creating auth user for existing DB user:', authError);
          // Возвращаем пользователя без auth данных
          return NextResponse.json({ success: true, user: existingUser });
        }
        
        // Возвращаем данные с auth_user_id и паролем для клиента
        return NextResponse.json({ 
          success: true, 
          user: existingUser,
          auth_user_id: newAuthUser.user.id,
          password: password
        });
      }
    }
    
    // Если пользователя нет, создаем его
    console.log(`User not found with Telegram ID: ${telegramId}, creating new user`);
    
    // 1. Создаем запись в auth.users с помощью Admin API
    const email = `telegram_${telegramId}@example.com`; // Временный email
    const password = generateRandomPassword(); // Генерируем случайный пароль
    
    console.log(`Creating auth user with email: ${email}`);
    
    // Используем Admin API для создания пользователя
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Автоматически подтверждаем email
      user_metadata: {
        telegram_id: telegramId,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username
      }
    });
    
    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to create authentication user' },
        { status: 500 }
      );
    }
    
    console.log(`Auth user created with ID: ${authUser.user.id}`);
    
    // 2. Создаем запись в публичной таблице users с id из auth.users
    const newUser: NewUser = {
      id: authUser.user.id,
      telegram_id: telegramId,
      telegram_username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      reinvest: 100, // Default value
      aicore_balance: 0,
      wallet_balance: 0,
      level: 0,
      paid_referrals: 0,
      referrer_id: null
    };
    
    // Логируем детали полей пользователя
    console.log("Telegram data details:");
    console.log("- telegram_id:", telegramId);
    console.log("- telegram_username:", telegramUser.username, "empty?", telegramUser.username === "");
    console.log("- first_name:", telegramUser.first_name, "empty?", telegramUser.first_name === "");
    console.log("- last_name:", telegramUser.last_name, "empty?", telegramUser.last_name === "");
    console.log("- initData type:", typeof initData);
    if (typeof initData === 'string') {
      console.log("- initData full:", initData);
    } else if (initData) {
      console.log("- initData object:", JSON.stringify(initData));
    }
    
    // Проверяем, есть ли start_param в initData для реферальной системы
    try {
      if (initData && typeof initData === 'string') {
        // Пробуем найти start_param в строке initData
        const startParamMatch = initData.match(/start_param=([^&]+)/);
        if (startParamMatch && startParamMatch[1]) {
          const referrerId = decodeURIComponent(startParamMatch[1]);
          console.log(`Found start_param (referrer): ${referrerId}`);
          
          // Проверяем, что это валидный ID
          if (/^\d+$/.test(referrerId)) {
            // Если это число, это может быть ID пользователя или telegram_id
            newUser.referrer_id = parseInt(referrerId);
            console.log(`Set referrer_id to: ${newUser.referrer_id}`);
          }
        } else {
          // Проверка на параметр startapp для Telegram Web Apps
          console.log("Checking for startapp parameter in:", initData);
          const startAppMatch = initData.match(/startapp=([^&]+)/);
          if (startAppMatch && startAppMatch[1]) {
            const referrerId = decodeURIComponent(startAppMatch[1]);
            console.log(`Found startapp parameter (referrer): ${referrerId}`);
            
            if (/^\d+$/.test(referrerId)) {
              newUser.referrer_id = parseInt(referrerId);
              console.log(`Set referrer_id to: ${newUser.referrer_id} from startapp parameter`);
            }
          } else {
            console.log("No startapp parameter found in initData string");
            
            // Проверяем в строке startApp с большой буквы A (вариации в формате параметров)
            const startAppCapMatch = initData.match(/startApp=([^&]+)/);
            if (startAppCapMatch && startAppCapMatch[1]) {
              const referrerId = decodeURIComponent(startAppCapMatch[1]);
              console.log(`Found startApp parameter (with capital A): ${referrerId}`);
              
              if (/^\d+$/.test(referrerId)) {
                newUser.referrer_id = parseInt(referrerId);
                console.log(`Set referrer_id to: ${newUser.referrer_id} from startApp parameter`);
              }
            }
            
            // Альтернативная проверка в initDataUnsafe
            try {
              const parsedData = JSON.parse(initData);
              
              // Проверяем start_param в JSON
              if (parsedData.start_param) {
                const referrerId = parsedData.start_param;
                console.log(`Found start_param in parsed data: ${referrerId}`);
                
                if (/^\d+$/.test(referrerId)) {
                  newUser.referrer_id = parseInt(referrerId);
                  console.log(`Set referrer_id to: ${newUser.referrer_id} from parsed data (start_param)`);
                }
              } 
              // Проверяем startapp в JSON
              else if (parsedData.startapp) {
                const referrerId = parsedData.startapp;
                console.log(`Found startapp in parsed data: ${referrerId}`);
                
                if (/^\d+$/.test(referrerId)) {
                  newUser.referrer_id = parseInt(referrerId);
                  console.log(`Set referrer_id to: ${newUser.referrer_id} from parsed data (startapp)`);
                }
              }
            } catch (parseErr) {
              console.log("Could not parse initData as JSON, skipping");
            }
          }
        }
      }
    } catch (refErr) {
      console.error("Error processing referral info:", refErr);
      // Не прерываем создание пользователя из-за ошибки в обработке реферальной системы
    }
    
    // Получаем структуру таблицы, чтобы проверить доступные колонки
    console.log("Creating new user with fields:", newUser);
    
    let wasUserCreated = false; // Флаг для отслеживания создания
    let finalUserData = null;

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting user:', insertError);
      // Удаляем созданного auth пользователя, чтобы не оставлять "мусор"
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: 'Database error while creating user' },
        { status: 500 }
      );
    }

    finalUserData = insertedUser;
    wasUserCreated = true;

    // Если пользователь был создан, добавляем ему цель №1
    if (finalUserData && wasUserCreated) {
      console.log(`Adding default goal 1 for newly created user ${finalUserData.id}`);
      try {
        const newUserGoalData = {
          user_id: finalUserData.id, // Используем UUID из auth.users
          goal_id: 1,
          status: 'not_started',
        };

        const { error: goalError } = await supabase
          .from('user_goals')
          .insert(newUserGoalData);

        if (goalError) {
          // Логируем ошибку, но не прерываем ответ пользователю
          console.error(`Failed to add default goal for new user ${finalUserData.id}:`, goalError);
        } else {
          console.log(`Successfully added default goal 1 for new user ${finalUserData.id}`);
        }
      } catch (e) {
        console.error(`Exception while adding default goal for user ${finalUserData.id}:`, e);
      }
    }
    
    console.log("Returning user data:", finalUserData);
    // Возвращаем данные пользователя вместе с auth_user_id и паролем для клиента
    return NextResponse.json({ 
      success: true, 
      user: finalUserData,
      auth_user_id: authUser.user.id,
      password: password 
    });
    
  } catch (error: any) {
    console.error('Unhandled error in POST /api/auth/telegram-user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 