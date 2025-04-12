"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useMemo } from "react";
// Удаляем прямой импорт
// import WebApp from '@twa-dev/sdk';
import { createClient } from '@supabase/supabase-js';
import { createClientSupabaseClient } from "@/lib/supabase"
// Удаляем неиспользуемый импорт
// import type { User as TelegramUser, WebApp as TelegramWebApp } from '@grammyjs/web-app'
import { addUserGoal } from '@/lib/api/goals' // Import the function to add goals
import type { User as AuthUser, Session } from '@supabase/supabase-js'; // Import Supabase Auth types

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
  telegram_id: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone_number?: string;
  wallet_balance?: number;
  aicore_balance?: number;
  level?: number;
  core?: number;
  paid_referrals?: number;
  reinvest_setup?: number;
  referrer_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface UserContextType {
  authUser: AuthUser | null;
  dbUser: DbUser | null;
  isLoading: boolean;
  error: string | null;
  refreshDbUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Убираем инициализацию Supabase с верхнего уровня

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profileLoadedRef = useRef(false); // Track if profile has been loaded for current authUser

  const supabase = useMemo(() => {
      if (typeof window === 'undefined') return null;
      return createClientSupabaseClient(); // Client-side Supabase client
  }, []);

  // Function to load user profile from public.users
  const loadUserProfile = async (userId: string) => {
    if (!supabase) return;
    console.log(`Loading profile for user ID: ${userId}`);
    profileLoadedRef.current = false; // Reset loaded flag
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('users') // Your public users table
        .select('*')
        .eq('id', userId) // Match the UUID
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') { // Not found
            console.warn(`Profile not found for user ${userId}. Might be created shortly.`);
            // Profile might not exist immediately after auth user creation, handle gracefully
            setDbUser(null); // Explicitly set to null if not found
        } else {
            console.error('Error fetching user profile:', fetchError);
            setError('Ошибка при получении профиля пользователя');
            setDbUser(null);
        }
      } else if (data) {
        console.log("User profile loaded:", data);
        setDbUser(data as DbUser);
        profileLoadedRef.current = true;
      }
    } catch (err: any) {
      console.error('Error in loadUserProfile:', err);
      setError(err.message || 'Ошибка при загрузке профиля');
      setDbUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to listen for Supabase auth changes
  useEffect(() => {
    if (!supabase) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        console.log("Initial session:", session);
        setAuthUser(session?.user ?? null);
        if (session?.user) {
            loadUserProfile(session.user.id);
        } else {
            setIsLoading(false); // No user, stop loading
        }
    }).catch(err => {
        console.error("Error getting initial session:", err);
        setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        const newAuthUser = session?.user ?? null;
        setAuthUser(newAuthUser);

        // Load profile only if the user ID changes or if it was null before
        if (newAuthUser && newAuthUser.id !== authUser?.id) {
            loadUserProfile(newAuthUser.id);
        } else if (!newAuthUser) {
            // User signed out
            setDbUser(null);
            profileLoadedRef.current = false;
            setIsLoading(false);
        }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]); // Depend only on supabase client instance

  // Function to manually refresh profile data
  const refreshDbUser = async () => {
    if (authUser?.id) {
      await loadUserProfile(authUser.id);
    } else {
      console.warn("Cannot refresh profile, no authenticated user.");
    }
  };

  const value = {
    authUser,
    dbUser,
    isLoading,
    error,
    refreshDbUser,
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