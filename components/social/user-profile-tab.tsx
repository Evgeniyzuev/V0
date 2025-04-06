"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, User, Wallet, Award, Users, Calendar, Phone, MessageCircle } from "lucide-react"
import { useUser } from "@/components/UserContext"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export default function UserProfileTab() {
  const { telegramUser, dbUser, isLoading, error, refreshUserData } = useUser()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setRefreshMessage(null)
    
    try {
      console.log("Manual refresh requested by user")
      await refreshUserData()
      setRefreshMessage("Данные обновлены")
      
      // Автоматически скроем сообщение через 3 секунды
      setTimeout(() => {
        setRefreshMessage(null)
      }, 3000)
    } catch (e) {
      setRefreshMessage("Ошибка при обновлении")
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <p>Loading user data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Показываем специальное сообщение если пользователь не из Telegram
  if (!telegramUser && !dbUser) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Для доступа к профилю, пожалуйста, откройте приложение через Telegram.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <CardTitle className="text-sm">Профиль пользователя</CardTitle>
          <div className="flex items-center gap-2">
            {refreshMessage && (
              <span className="text-xs text-green-600 animate-fade-in-out">
                {refreshMessage}
              </span>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh user data"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col items-center mb-6">
            <Avatar className="w-20 h-20 mb-3">
              <AvatarImage src={telegramUser?.photo_url} />
              <AvatarFallback className="bg-purple-100">
                <User className="h-10 w-10 text-purple-600" />
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">
              {dbUser?.first_name || telegramUser?.first_name} {dbUser?.last_name || telegramUser?.last_name}
            </h2>
            <p className="text-gray-500">@{dbUser?.telegram_username || telegramUser?.username || "username"}</p>
            {telegramUser && (
              <p className="text-sm text-purple-600 mt-1">
                Telegram ID: {telegramUser.id}
              </p>
            )}
          </div>

          {dbUser && (
            <>
              {/* Показываем данные баланса только если они есть в dbUser */}
              {(typeof dbUser.wallet_balance === 'number' || typeof dbUser.aicore_balance === 'number') && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {typeof dbUser.wallet_balance === 'number' && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <Wallet className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-xs text-gray-500">Баланс кошелька</span>
                      </div>
                      <p className="text-lg font-semibold">${dbUser.wallet_balance.toFixed(2)}</p>
                    </div>
                  )}
                  
                  {typeof dbUser.aicore_balance === 'number' && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <Award className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-xs text-gray-500">Баланс AICore</span>
                      </div>
                      <p className="text-lg font-semibold">${dbUser.aicore_balance.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {dbUser.phone_number && (
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm">Телефон</span>
                    </div>
                    <span className="font-medium">{dbUser.phone_number}</span>
                  </div>
                )}

                {typeof dbUser.level === 'number' && (
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center">
                      <Award className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm">Уровень</span>
                    </div>
                    <span className="font-medium">{dbUser.level}</span>
                  </div>
                )}

                {typeof dbUser.paid_referrals === 'number' && (
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm">Оплаченные рефералы</span>
                    </div>
                    <span className="font-medium">{dbUser.paid_referrals}</span>
                  </div>
                )}

                {typeof dbUser.reinvest_setup === 'number' && (
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm">Настройка реинвестирования</span>
                    </div>
                    <span className="font-medium">{dbUser.reinvest_setup}%</span>
                  </div>
                )}

                {dbUser.created_at && (
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm">Участник с</span>
                    </div>
                    <span className="font-medium text-sm">{new Date(dbUser.created_at).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Специальный раздел для информации из Telegram */}
                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-medium mb-3 flex items-center">
                    <MessageCircle className="h-4 w-4 text-purple-600 mr-2" />
                    Telegram данные
                  </h3>
                  <p className="text-sm text-gray-600">
                    ID: {dbUser.telegram_id || telegramUser?.id || 'Нет данных'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Имя пользователя: @{dbUser.telegram_username || telegramUser?.username || 'Нет данных'}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Если есть только telegramUser, но нет dbUser */}
          {telegramUser && !dbUser && (
            <div className="text-center mt-4">
              <p>Информация загружается из Telegram...</p>
              <Button className="mt-4" onClick={handleRefresh}>
                Обновить
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

