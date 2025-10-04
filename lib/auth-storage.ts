/**
 * Утилиты для сохранения и восстановления данных аутентификации в localStorage
 */

export interface AuthStorageData {
  email: string;
  password: string;
  telegramId: number;
  userId: string;
  timestamp: number;
}

const AUTH_STORAGE_KEY = 'v0_auth_data';
const STORAGE_EXPIRY_DAYS = 30; // Данные действительны 30 дней

/**
 * Сохраняет данные аутентификации в localStorage
 */
export const saveAuthData = (data: Omit<AuthStorageData, 'timestamp'>): void => {
  if (typeof window === 'undefined') return;
  
  const authData: AuthStorageData = {
    ...data,
    timestamp: Date.now(),
  };
  
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    console.log('Auth data saved to localStorage');
  } catch (error) {
    console.error('Failed to save auth data to localStorage:', error);
  }
};

/**
 * Получает сохраненные данные аутентификации из localStorage
 */
export const getAuthData = (): AuthStorageData | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    
    const authData: AuthStorageData = JSON.parse(stored);
    
    // Проверяем, не истекли ли данные
    const now = Date.now();
    const expiryTime = STORAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // в миллисекундах
    
    if (now - authData.timestamp > expiryTime) {
      console.log('Auth data expired, removing from localStorage');
      removeAuthData();
      return null;
    }
    
    return authData;
  } catch (error) {
    console.error('Failed to get auth data from localStorage:', error);
    return null;
  }
};

/**
 * Удаляет данные аутентификации из localStorage
 */
export const removeAuthData = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    console.log('Auth data removed from localStorage');
  } catch (error) {
    console.error('Failed to remove auth data from localStorage:', error);
  }
};

/**
 * Проверяет, есть ли сохраненные данные аутентификации
 */
export const hasAuthData = (): boolean => {
  return getAuthData() !== null;
};

/**
 * Обновляет timestamp сохраненных данных (для продления срока действия)
 */
export const refreshAuthDataTimestamp = (): void => {
  const authData = getAuthData();
  if (authData) {
    saveAuthData({
      email: authData.email,
      password: authData.password,
      telegramId: authData.telegramId,
      userId: authData.userId,
    });
  }
};
