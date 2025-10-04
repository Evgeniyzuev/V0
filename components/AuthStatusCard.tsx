"use client";

import React from 'react';
import { useUser } from '@/components/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const AuthStatusCard = () => {
  const { authUser, dbUser, isLoading, signOut, hasAuthData } = useUser();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Статус аутентификации</CardTitle>
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
        <CardTitle>Статус аутентификации</CardTitle>
        <CardDescription>
          Информация о текущем состоянии входа в систему
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">Статус:</span>
          {authUser ? (
            <Badge variant="default" className="bg-green-500">
              Авторизован
            </Badge>
          ) : (
            <Badge variant="secondary">
              Не авторизован
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium">Сохраненные данные:</span>
          {hasAuthData() ? (
            <Badge variant="default" className="bg-blue-500">
              Есть
            </Badge>
          ) : (
            <Badge variant="outline">
              Нет
            </Badge>
          )}
        </div>

        {authUser && (
          <div className="space-y-2">
            <div>
              <span className="font-medium">ID пользователя:</span>
              <p className="text-sm text-muted-foreground">{authUser.id}</p>
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <p className="text-sm text-muted-foreground">{authUser.email}</p>
            </div>
            {dbUser && (
              <div>
                <span className="font-medium">Telegram ID:</span>
                <p className="text-sm text-muted-foreground">{dbUser.telegram_id}</p>
              </div>
            )}
          </div>
        )}

        {authUser && (
          <Button 
            onClick={signOut}
            variant="outline"
            className="w-full"
          >
            Выйти из системы
          </Button>
        )}

        {!authUser && (
          <div className="text-center text-sm text-muted-foreground">
            <p>Для автоматического входа откройте приложение через Telegram</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
