"use client";

import React from 'react';
import { useUser } from '@/components/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

/**
 * Компонент для демонстрации и тестирования автоматического логина
 * Показывается только в development режиме
 */
export const AutoLoginDemo = () => {
  const { authUser, dbUser, isLoading, signOut, hasAuthData } = useUser();

  // Показываем только в development режиме
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Демо автоматического логина</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Демо автоматического логина</CardTitle>
        <CardDescription>
          Тестирование функциональности автоматического входа в систему
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Этот компонент виден только в development режиме. 
            Для тестирования автологина откройте приложение через Telegram WebApp.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Статус аутентификации</h4>
            <p className="text-sm text-muted-foreground">
              {authUser ? 'Авторизован' : 'Не авторизован'}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Сохраненные данные</h4>
            <p className="text-sm text-muted-foreground">
              {hasAuthData() ? 'Есть' : 'Нет'}
            </p>
          </div>
        </div>

        {authUser && (
          <div className="space-y-2">
            <h4 className="font-medium">Информация о пользователе</h4>
            <div className="text-sm space-y-1">
              <p><strong>ID:</strong> {authUser.id}</p>
              <p><strong>Email:</strong> {authUser.email}</p>
              {dbUser && (
                <p><strong>Telegram ID:</strong> {dbUser.telegram_id}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {authUser ? (
            <Button onClick={signOut} variant="outline">
              Выйти из системы
            </Button>
          ) : (
            <Button disabled variant="outline">
              Войдите через Telegram
            </Button>
          )}
          
          <Button 
            onClick={() => {
              console.log('Auth data:', localStorage.getItem('v0_auth_data'));
            }}
            variant="secondary"
            size="sm"
          >
            Проверить localStorage
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Инструкции для тестирования:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Откройте приложение через Telegram WebApp</li>
            <li>Дождитесь успешного входа</li>
            <li>Обновите страницу или закройте/откройте браузер</li>
            <li>Проверьте, что вход произошел автоматически</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
