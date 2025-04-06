"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
// Удаляем прямой импорт
// import WebApp from '@twa-dev/sdk';
import { createClient } from '@supabase/supabase-js';

// Интерфейс для WebApp для TypeScript
interface TelegramWebApp {
  ready: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
    [key: string]: any;
  };
}

// Типы данных
interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface DbUser {
  id: string;
  user_id: string;
  telegram_id: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone_number?: string;
  created_at: string;
  // Добавьте другие поля из вашей таблицы users
}

interface UserContextType {
  telegramUser: TelegramUser | null;
  dbUser: DbUser | null;
  isLoading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Убираем инициализацию Supabase с верхнего уровня

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  
  // Инициализируем Supabase клиент внутри компонента
  const supabase = React.useMemo(() => {
    if (typeof window === 'undefined') return null; // На сервере не создаем клиента
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return null;
    }
    
    return createClient(supabaseUrl, supabaseAnonKey);
  }, []);

  // Функция для обновления данных пользователя из БД
  const refreshUserData = async () => {
    if (!telegramUser?.id || !supabase) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {  // PGRST116 = 'не найдено'
        console.error('Error fetching user data:', fetchError);
        setError('Ошибка при получении данных пользователя');
      } else {
        setDbUser(data);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError('Ошибка при обновлении данных пользователя');
    }
  };

  useEffect(() => {
    // Функция для загрузки Telegram WebApp SDK на клиенте
    const loadTelegramWebApp = async () => {
      // Проверка, что код выполняется в браузере
      if (typeof window !== 'undefined') {
        try {
          // Динамический импорт SDK только на клиенте
          const TelegramWebApp = (await import('@twa-dev/sdk')).default;
          setWebApp(TelegramWebApp);
        } catch (e) {
          console.error('Failed to load Telegram WebApp SDK:', e);
        }
      }
    };

    loadTelegramWebApp();
  }, []);

  useEffect(() => {
    // Функция для инициализации данных пользователя из Telegram и проверки/создания в БД
    const initUser = async () => {
      if (!webApp) return; // Выходим, если SDK еще не загружен
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Проверяем, запущены ли мы в Telegram
        let isTelegram = false;
        let userData: TelegramUser | null = null;
        
        try {
          webApp.ready();
          const initData = webApp.initDataUnsafe;
          
          if (initData?.user) {
            isTelegram = true;
            userData = initData.user;
            console.log('Telegram user data:', userData);
            setTelegramUser(userData);
          }
        } catch (e) {
          console.log('Not running inside Telegram or WebApp not available');
        }

        // Если мы получили данные пользователя из Telegram
        if (isTelegram && userData?.id) {
          try {
            // Отправляем данные на API для верификации и сохранения
            console.log("Sending Telegram user data to API:", { telegramId: userData.id });
            const response = await fetch('/api/auth/telegram-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                telegramUser: userData,
                initData: webApp.initData,  // Для верификации на сервере
              }),
            });

            const result = await response.json();
            console.log("API response:", result);
            
            if (!response.ok) {
              throw new Error(result.error || 'Ошибка при сохранении данных пользователя');
            }
            
            if (result.user) {
              setDbUser(result.user);
            } else {
              await refreshUserData();  // Пробуем загрузить из БД если API не вернул пользователя
            }
          } catch (apiError: any) {
            console.error('API communication error:', apiError);
            setError(`Ошибка API: ${apiError.message}`);
            
            // Пробуем загрузить данные напрямую из базы как запасной вариант
            if (supabase) {
              await refreshUserData();
            }
          }
        }
      } catch (e: any) {
        console.error('Error initializing user:', e);
        setError(e.message || 'Ошибка при инициализации пользователя');
      } finally {
        setIsLoading(false);
      }
    };

    if (webApp) {
      initUser(); // Вызываем инициализацию только после загрузки SDK
    }
  }, [webApp, refreshUserData, supabase]); // Добавляем supabase в зависимости

  const value = {
    telegramUser,
    dbUser,
    isLoading,
    error,
    refreshUserData,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Hook для использования контекста в компонентах
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 