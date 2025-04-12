"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useMemo } from "react";
// Удаляем прямой импорт
// import WebApp from '@twa-dev/sdk';
import { createClient } from '@supabase/supabase-js';
import { createClientSupabaseClient } from "@/lib/supabase"
// Удаляем неиспользуемый импорт
// import type { User as TelegramUser, WebApp as TelegramWebApp } from '@grammyjs/web-app'
import { addUserGoal } from '@/lib/api/goals' // Import the function to add goals

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
      // Добавим недостающие поля, если они ожидаются SDK
      language_code?: string;
      is_premium?: boolean;
    };
    [key: string]: any;
  };
  expand: () => void; // Добавим метод expand
}

// Типы данных
interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string; // Добавим поле
  is_premium?: boolean; // Добавим поле
}

interface DbUser {
  id: string;
  user_id?: string;
  telegram_id: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone_number?: string;
  created_at?: string;
  // Добавляем поля, которые используются в компоненте профиля
  wallet_balance?: number;
  aicore_balance?: number;
  level?: number;
  core?: number;
  paid_referrals?: number;
  reinvest_setup?: number;
  // Добавляем поле для реферальной системы
  referrer_id?: number;
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
  
  // Флаги для предотвращения повторных запросов
  const apiCalledRef = useRef(false);
  const userLoadedRef = useRef(false);
  const initialGoalAddedRef = useRef(false); // Ref to track if goal 1 was added
  
  // Используем централизованный Supabase клиент
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null; // На сервере не создаем клиента
    return createClientSupabaseClient();
  }, []);

  // Функция для обновления данных пользователя из БД
  const refreshUserData = async (force = false) => {
    if (!telegramUser?.id || !supabase) return;
    // Reset userLoadedRef if forcing refresh
    if (force) userLoadedRef.current = false;

    if (userLoadedRef.current) {
      console.log("User data already loaded, skipping refresh");
      return;
    }
    
    try {
      console.log("Refreshing user data from DB for Telegram ID:", telegramUser.id);
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {  // PGRST116 = 'не найдено'
        console.error('Error fetching user data:', fetchError);
        setError('Ошибка при получении данных пользователя');
      } else if (data) {
        console.log("User data loaded from DB:", data);
        setDbUser(data);
        userLoadedRef.current = true;
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError('Ошибка при обновлении данных пользователя');
    }
  };

  // Функция для ручного обновления (публичная)
  const manualRefresh = async () => {
    await refreshUserData(true); // Принудительное обновление
  };

  // Загрузка Telegram SDK
  useEffect(() => {
    const initTelegramSdk = async () => {
      if (typeof window !== 'undefined') {
        try {
          // Используем динамический импорт @twa-dev/sdk
          const WebAppSdk = (await import('@twa-dev/sdk')).default;
          if (WebAppSdk) {
            WebAppSdk.ready();
            WebAppSdk.expand();
            setWebApp(WebAppSdk as unknown as TelegramWebApp); // Приводим тип, если нужно
            setTelegramUser(WebAppSdk.initDataUnsafe.user || null);
            console.log('Telegram WebApp SDK Initialized:', WebAppSdk);
            console.log('Telegram User:', WebAppSdk.initDataUnsafe.user);
          }
        } catch (e) {
          console.error('Failed to load or init Telegram WebApp SDK:', e);
          setError("Не удалось инициализировать Telegram WebApp");
          setIsLoading(false);
        }
      } else {
        // Случай, когда код выполняется не в браузере (SSR/SSG)
        setIsLoading(false);
      }
    };
    initTelegramSdk();
  }, []);

  // Инициализация пользователя и отправка на API
  useEffect(() => {
    const initUser = async () => {
      if (!webApp || !supabase) return;
      
      // Prevent API call if already done
      if (apiCalledRef.current) {
        console.log("API call already made, skipping initUser");
        return; 
      }
      apiCalledRef.current = true; // Mark API call as attempted

      setIsLoading(true);
      setError(null);
      userLoadedRef.current = false; // Reset loaded flag on new init attempt

      try {
        const initData = webApp.initData;
        const user = webApp.initDataUnsafe?.user;
        
        if (!initData || !user) {
          throw new Error("Не удалось получить данные инициализации или пользователя Telegram");
        }

        // Send data to your API endpoint
        console.log("===== START SENDING TO API =====");
        console.log("Telegram User Being Sent:", user);
        console.log("InitData Being Sent:", initData);

        let finalInitData = initData; // Start with the original initData
        const urlParams = new URLSearchParams(initData);
        if (!urlParams.has('startapp')) {
          const currentParams = new URLSearchParams(window.location.search);
          const startAppParam = currentParams.get('startapp');
          if (startAppParam) {
            finalInitData += `&startapp=${encodeURIComponent(startAppParam)}`;
            console.log("Added startapp parameter to initData:", finalInitData);
          }
        }

        // Используем локальный интерфейс TelegramUser
        const userToSend: Partial<TelegramUser> = {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          photo_url: user.photo_url,
          // Добавляем поля, если они есть в user
          language_code: user.language_code,
          is_premium: user.is_premium,
        };

        console.log("Cleaned User Object Being Sent:", userToSend);
        console.log("===== END SENDING TO API =====");
        
        const response = await fetch('/api/auth/telegram-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            telegramUser: userToSend,
            initData: finalInitData,
          }),
        });

        const result = await response.json();
        console.log("API response:", result);
        
        if (!response.ok) {
          throw new Error(result.error || 'Ошибка при сохранении данных пользователя');
        }
        
        if (result.user) {
          console.log("User object from API:", result.user);
          setDbUser(result.user);
          userLoadedRef.current = true;
        } else {
          // Try loading from DB if API didn't return a user
          await refreshUserData();
        }
      } catch (apiError: any) {
        console.error('API communication error:', apiError);
        setError(`Ошибка API: ${apiError.message}`);
        // Try loading data directly from the database as a fallback
        if (supabase) {
          await refreshUserData();
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (webApp && supabase && !apiCalledRef.current) {
      initUser(); 
    }
  }, [webApp, supabase]);

  // Effect to add default goal once user data is loaded
  useEffect(() => {
    if (dbUser && !initialGoalAddedRef.current) {
      console.log("User data loaded, checking and adding goal 1 if needed.");
      initialGoalAddedRef.current = true; // Mark as attempted
      addUserGoal(dbUser.id, 1)
        .then(addedGoal => {
          if (addedGoal) {
            console.log("Successfully ensured user has goal 1:", addedGoal);
            // Optionally invalidate user goals query if needed immediately
            // queryClient.invalidateQueries({ queryKey: ['user-goals'] })
          } else {
            console.log("User already had goal 1 or failed to add it (check previous logs).");
          }
        })
        .catch(error => {
          console.error("Error trying to add default goal:", error);
          // Potentially reset initialGoalAddedRef.current = false; to retry later?
        });
    }
  }, [dbUser]); // Run when dbUser changes

  const value = {
    telegramUser,
    dbUser,
    isLoading,
    error,
    refreshUserData: manualRefresh, // Используем функцию-обертку для публичного API
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

const createSupabaseClient = () => {
  return createClientSupabaseClient();
} 