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

// Определяем интерфейс для нового пользователя
interface NewUser {
  telegram_id: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  referrer_id?: number;
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
    
    console.log(`Processing user with Telegram ID: ${telegramId}`);
    
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
        const { error: updateError } = await supabaseAdmin
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
      
      return NextResponse.json({ success: true, user: existingUser });
    }
    
    // Если пользователя нет, создаем его
    console.log(`User not found with Telegram ID: ${telegramId}, creating new user`);
    
    // 1. Создаем запись в auth.users (необязательно в simple-auth случае, но нужно в полной интеграции)
    // 2. Создаем запись в публичной таблице users
    
    // Для упрощенного примера опустим создание auth.users и сразу создадим запись в публичной таблице
    const newUser: NewUser = {
      telegram_id: telegramId,
      telegram_username: telegramUser.username || null,
      first_name: telegramUser.first_name || null,
      last_name: telegramUser.last_name || null,
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
    
    const { data: insertedUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert(newUser)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating user:', insertError);
      console.error('Insert error details:', insertError.message);
      
      // Пробуем более минимальный набор полей в случае ошибки
      const minimalUser: NewUser = {
        telegram_id: telegramId,
        telegram_username: telegramUser.username === "" ? null : telegramUser.username || null,
        first_name: telegramUser.first_name === "" ? null : telegramUser.first_name || null,  
        last_name: telegramUser.last_name === "" ? null : telegramUser.last_name || null,
        referrer_id: newUser.referrer_id
      };
      
      console.log("Retrying with minimal but complete fields:", minimalUser);
      
      const { data: minimalInsertedUser, error: minimalInsertError } = await supabaseAdmin
        .from('users')
        .insert(minimalUser)
        .select()
        .single();
        
      if (minimalInsertError) {
        console.error('Error creating user with minimal fields:', minimalInsertError);
        console.error('Minimal insert error details:', minimalInsertError.message);
        
        // Еще одна попытка только с обязательным полем
        console.log("Making final attempt with only required fields");
        const requiredUserOnly = {
          telegram_id: telegramId
        };
        
        const { data: basicUser, error: basicError } = await supabaseAdmin
          .from('users')
          .insert(requiredUserOnly)
          .select()
          .single();
          
        if (basicError) {
          console.error('Final attempt failed:', basicError);
          return NextResponse.json(
            { error: `Database error while creating user: ${basicError.message}` },
            { status: 500 }
          );
        }
        
        console.log("Created user with only telegram_id:", basicUser);
        
        // Если пользователь создан только с telegram_id, пробуем обновить остальные поля
        if (basicUser?.id) {
          try {
            console.log("Trying to update user data separately after minimal creation");
            
            const updateFields: any = {};
            
            // Добавляем только непустые поля
            if (telegramUser.username) updateFields.telegram_username = telegramUser.username;
            if (telegramUser.first_name) updateFields.first_name = telegramUser.first_name;
            if (telegramUser.last_name) updateFields.last_name = telegramUser.last_name;
            if (newUser.referrer_id) updateFields.referrer_id = newUser.referrer_id;
            
            console.log("Update fields:", updateFields);
            
            if (Object.keys(updateFields).length > 0) {
              const { error: updateError } = await supabaseAdmin
                .from('users')
                .update(updateFields)
                .eq('id', basicUser.id);
              
              if (updateError) {
                console.error("Failed to update additional fields:", updateError);
              } else {
                console.log("Successfully updated additional fields");
                
                // Получаем обновленные данные пользователя
                const { data: updatedUser } = await supabaseAdmin
                  .from('users')
                  .select('*')
                  .eq('id', basicUser.id)
                  .single();
                
                if (updatedUser) {
                  console.log("Returning updated user:", updatedUser);
                  return NextResponse.json({ success: true, user: updatedUser });
                }
              }
            }
          } catch (updateError) {
            console.error("Error during post-creation update:", updateError);
          }
        }
        
        return NextResponse.json({ success: true, user: basicUser });
      }
      
      console.log(`Successfully created user with minimal fields for Telegram ID: ${telegramId}`);
      return NextResponse.json({ success: true, user: minimalInsertedUser });
    }
    
    console.log(`Successfully created user for Telegram ID: ${telegramId}`);
    return NextResponse.json({ success: true, user: insertedUser });
    
  } catch (e: any) {
    console.error('Error in telegram-user API:', e);
    return NextResponse.json(
      { error: e.message || 'Server error' },
      { status: 500 }
    );
  }
} 