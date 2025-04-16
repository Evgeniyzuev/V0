"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useMemo } from "react";
// Удаляем прямой импорт
// import WebApp from '@twa-dev/sdk';
import { createClient } from '@supabase/supabase-js';
import { createClientSupabaseClient } from "@/lib/supabase"
// Удаляем неиспользуемый импорт
// import type { User as TelegramUser, WebApp as TelegramWebApp } from '@grammyjs/web-app'
import { addUserGoal, fetchUserGoals } from '@/lib/api/goals' // Import fetchUserGoals
import { User, Session } from "@supabase/supabase-js";
import type { UserGoal, UserTask } from '@/types/supabase'; // Import types

// Интерфейс для WebApp для TypeScript
interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      language_code?: string;
      is_premium?: boolean;
    };
    [key: string]: any;
  };
  openTelegramLink: (url: string) => void;
}

// Добавляем типы для Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    }
  }
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
  authUser: User | null;
  dbUser: DbUser | null;
  isLoading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
  goals: any[] | null;  // Change type to any[] temporarily until we can properly type the response
  tasks: UserTask[] | null;
  refreshGoals: () => Promise<void>;
  refreshTasks: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Убираем инициализацию Supabase с верхнего уровня

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [goals, setGoals] = useState<any[] | null>(null);  // Change type to any[]
  const [tasks, setTasks] = useState<UserTask[] | null>(null);
  
  // Флаги для предотвращения повторных запросов
  const apiCalledRef = useRef(false);
  const userLoadedRef = useRef(false);
  
  // Используем централизованный Supabase клиент
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null; // На сервере не создаем клиента
    return createClientSupabaseClient();
  }, []);

  // Функция для обновления данных пользователя из БД
  const refreshUserData = async (force = false) => {
    if (!supabase) return;
    
    // Reset userLoadedRef if forcing refresh
    if (force) userLoadedRef.current = false;

    if (userLoadedRef.current) {
      console.log("User data already loaded, skipping refresh");
      return;
    }
    
    try {
      // Если у нас есть authUser (пользователь из Supabase Auth), загружаем данные по UUID
      if (authUser) {
        console.log("Refreshing user data from DB for auth user ID:", authUser.id);
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user data by auth ID:', fetchError);
          setError('Ошибка при получении данных пользователя');
        } else if (data) {
          console.log("User data loaded from DB by auth ID:", data);
          setDbUser(data);
          userLoadedRef.current = true;
          return;
        }
      }
      
      // Запасной вариант: если у нас есть telegram_id, загружаем по нему
      if (telegramUser?.id) {
        console.log("Refreshing user data from DB for Telegram ID:", telegramUser.id);
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', telegramUser.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user data by Telegram ID:', fetchError);
          setError('Ошибка при получении данных пользователя');
        } else if (data) {
          console.log("User data loaded from DB by Telegram ID:", data);
          setDbUser(data);
          userLoadedRef.current = true;
        }
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

  // Получение и отслеживание сессии Supabase
  useEffect(() => {
    if (!supabase) return;

    // Получаем начальную сессию
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        setAuthUser(initialSession.user);
        console.log("Auth user loaded from session:", initialSession.user);
      }
    });

    // Подписываемся на изменения состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setAuthUser(newSession?.user || null);
        if (newSession?.user) {
          console.log("Auth state changed, new user:", newSession.user);
        } else {
          console.log("Auth state changed: user signed out");
        }
        // Сбрасываем флаг загрузки пользователя при изменении сессии
        userLoadedRef.current = false;
      }
    );

    // Отписываемся при размонтировании
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Загружаем данные пользователя из БД, когда у нас есть authUser
  useEffect(() => {
    if (authUser && !userLoadedRef.current) {
      refreshUserData();
    }
  }, [authUser]);

  // Загрузка Telegram SDK
  useEffect(() => {
    const initTelegramSdk = async () => {
      if (typeof window !== 'undefined') {
        try {
          console.log('Starting Telegram WebApp SDK initialization...');
          
          // Check if we're in development environment
          const isDevelopment = process.env.NODE_ENV === 'development';
          
          // Check if Telegram WebApp is already available globally
          if (window.Telegram?.WebApp) {
            console.log('Found global Telegram WebApp object');
            const globalWebApp = window.Telegram.WebApp;
            globalWebApp.ready();
            globalWebApp.expand();
            setWebApp(globalWebApp as unknown as TelegramWebApp);
            
            if (globalWebApp.initDataUnsafe?.user) {
              console.log('Found user in global WebApp:', globalWebApp.initDataUnsafe.user);
              setTelegramUser(globalWebApp.initDataUnsafe.user);
            } else {
              console.log(isDevelopment ? 'No user data in global WebApp (expected in development)' : 'No user data in global WebApp');
            }
            return;
          }

          // Fallback to @twa-dev/sdk if global object not available
          console.log('Falling back to @twa-dev/sdk...');
          const WebAppSdk = (await import('@twa-dev/sdk')).default;
          if (WebAppSdk) {
            console.log('Successfully imported @twa-dev/sdk');
            WebAppSdk.ready();
            WebAppSdk.expand();
            setWebApp(WebAppSdk as unknown as TelegramWebApp);
            
            if (WebAppSdk.initDataUnsafe?.user) {
              console.log('Found user in SDK:', WebAppSdk.initDataUnsafe.user);
              setTelegramUser(WebAppSdk.initDataUnsafe.user);
            } else {
              console.log(isDevelopment ? 'No user data in SDK (expected in development)' : 'No user data in SDK WebApp');
              // Try to wait a bit and check again
              setTimeout(() => {
                if (WebAppSdk.initDataUnsafe?.user) {
                  console.log('Found user after delay:', WebAppSdk.initDataUnsafe.user);
                  setTelegramUser(WebAppSdk.initDataUnsafe.user);
                } else {
                  if (!isDevelopment) {
                    console.error('Still no user data after delay');
                    setError("Не удалось получить данные пользователя Telegram");
                  } else {
                    console.log('No user data available (expected in development environment)');
                  }
                }
              }, 1000);
            }
          }
        } catch (e) {
          const isDevelopment = process.env.NODE_ENV === 'development';
          if (!isDevelopment) {
            console.error('Failed to load or init Telegram WebApp SDK:', e);
            setError("Не удалось инициализировать Telegram WebApp");
          } else {
            console.log('Telegram WebApp SDK not available (expected in development)');
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    initTelegramSdk();
  }, []);

  // Инициализация пользователя через Telegram и отправка на API
  useEffect(() => {
    const initUser = async () => {
      if (!webApp || !supabase) return;
      
      // Prevent API call if already done or если у нас уже есть authUser
      if (apiCalledRef.current || authUser) {
        console.log("API call already made or auth user exists, skipping initUser");
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
          setError("Не удалось получить данные инициализации или пользователя Telegram");
          setIsLoading(false);
          return;
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
          
          // После успешного создания пользователя через API, логинимся в Supabase
          // Используем email и пароль, которые были созданы на сервере
          const email = `telegram_${user.id}@example.com`;
          const password = result.password || ""; // Если сервер не вернул пароль, используем пустую строку
          
          if (result.auth_user_id) {
            // Если сервер вернул auth_user_id, пытаемся получить сессию для этого пользователя
            console.log("Signing in with created auth user");
            try {
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
              });
              
              if (signInError) {
                console.error("Error signing in after user creation:", signInError);
              } else if (signInData?.user) {
                console.log("Successfully signed in with Supabase Auth:", signInData.user);
                setAuthUser(signInData.user);
              }
            } catch (signInErr) {
              console.error("Exception during sign in:", signInErr);
            }
          }
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

    initUser();
  }, [webApp, supabase, authUser]);

  // Обеспечиваем загрузку данных пользователя, как только у нас появился telegramUser
  useEffect(() => {
    if (telegramUser && !authUser && !userLoadedRef.current) {
      refreshUserData();
    }
  }, [telegramUser, authUser]);

  // Add function to refresh goals
  const refreshGoals = async () => {
    if (!authUser?.id) return;
    try {
      const userGoals = await fetchUserGoals(authUser.id);
      setGoals(userGoals);
    } catch (err) {
      console.error('Error refreshing goals:', err);
      setError('Ошибка при обновлении целей');
    }
  };

  // Add function to refresh tasks
  const refreshTasks = async () => {
    if (!authUser?.id || !supabase) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('user_tasks')
        .select(`
          *,
          task:tasks(*)
        `)
        .eq('user_id', authUser.id)
        .order('assigned_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTasks(data);
    } catch (err) {
      console.error('Error refreshing tasks:', err);
      setError('Ошибка при обновлении заданий');
    }
  };

  // Load goals and tasks when user is authenticated
  useEffect(() => {
    if (authUser?.id) {
      refreshGoals();
      refreshTasks();
    }
  }, [authUser?.id]);

  // Формируем значение контекста
  const contextValue = useMemo(() => ({
    telegramUser,
    authUser,
    dbUser,
    isLoading,
    error,
    refreshUserData: manualRefresh,
    goals,
    tasks,
    refreshGoals,
    refreshTasks,
  }), [telegramUser, authUser, dbUser, isLoading, error, manualRefresh, goals, tasks]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
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