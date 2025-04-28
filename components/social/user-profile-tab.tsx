"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, User, Wallet, Award, Users, Calendar, Phone, MessageCircle, Link, Copy, Check, Send, Share2, Trophy } from "lucide-react"
import { useUser } from "@/components/UserContext"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useLevelCheck } from '@/hooks/useLevelCheck'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

// Добавляем интерфейс для utils
interface TelegramUtils {
  openTelegramLink: (url: string) => void;
}

// Функция инициализации утилит Telegram
function initUtils(): TelegramUtils {
  // Проверяем наличие Telegram WebApp
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    return {
      openTelegramLink: (url: string) => {
        window.Telegram?.WebApp?.openTelegramLink(url);
      }
    };
  }
  
  // Фолбек для случаев, когда Telegram WebApp недоступен
  return {
    openTelegramLink: (url: string) => {
      window.open(url, '_blank');
    }
  };
}

// Добавим компонент для реферальной ссылки
function ReferralLinkSection({ userId, telegramId }: { userId?: string, telegramId?: number }) {
  const [referralLink, setReferralLink] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Имя вашего Telegram бота - в реальном приложении его нужно взять из конфигурации
  const botUsername = 'V0_aiassist_bot/V0app' // Замените на имя вашего бота
  
  // Генерируем реферальную ссылку
  const generateLink = async () => {
    if (!userId && !telegramId) return
    
    setIsLoading(true)
    
    try {
      // Используем telegram_id для реферальной ссылки, если доступен
      const paramToUse = telegramId || userId
      
      // Прямая генерация ссылки без обращения к API (можно также использовать API если нужна дополнительная логика)
      const link = `https://t.me/${botUsername}?start=${paramToUse}`
      console.log('Generated referral link:', link);
      setReferralLink(link)
    } catch (error) {
      console.error("Error generating referral link:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Генерируем ссылку при первом рендеринге
  useEffect(() => {
    if (!referralLink) {
      generateLink()
    }
  }, [userId, telegramId, referralLink])
  
  // Функция для копирования ссылки в буфер обмена
  const copyToClipboard = () => {
    if (!referralLink) return
    
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        setCopied(true)
        // Сбросить статус "скопировано" через 2 секунды
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(err => {
        console.error("Could not copy text: ", err)
      })
  }
  
  // Функция для отправки ссылки через Telegram
  const handleInviteFriend = () => {
    if (!referralLink) return
    
    try {
      // Инициализируем утилиты
      const utils = initUtils()
      
      // Имя бота берется из внешней области видимости (line 52)
      
      // Используем telegram_id или userId из пропсов
      const paramToUse = telegramId || userId
      const INVITE_URL = `https://t.me/${botUsername}`
      const shareText = "Join our app! Use my referral link:"
      
      // Формируем ссылку с использованием startapp параметра
      const inviteLink = `${INVITE_URL}?startapp=${paramToUse}`
      const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`
      
      // Используем утилиты для открытия ссылки
      utils.openTelegramLink(fullUrl)
    } catch (err) {
      console.error("Error sharing link:", err)
    }
  }
  
  if (!userId && !telegramId) return null
  
  return (
    <div className="mt-6 pt-4 border-t">
      <h3 className="font-medium mb-3 flex items-center">
        <Link className="h-4 w-4 text-purple-600 mr-2" />
        Your referral link
      </h3>
      
      <div className="flex items-center mb-2">
        <div className="bg-gray-50 rounded-md p-2 flex-1 text-sm overflow-hidden overflow-ellipsis whitespace-nowrap">
          {isLoading ? "Loading..." : referralLink || "Failed to generate link"}
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          className="ml-2"
          onClick={copyToClipboard}
          disabled={!referralLink || isLoading}
          title="Copy link"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mb-3">
        Share this link with your friends to invite them to the app
      </p>
      
      {/* Кнопка "Пригласить друга" */}
      <Button 
        variant="secondary" 
        className="w-full mt-2 bg-purple-100 hover:bg-purple-200 text-purple-800"
        onClick={handleInviteFriend}
        disabled={!referralLink || isLoading}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Invite a friend on Telegram
      </Button>
    </div>
  )
}

export default function UserProfileTab() {
  const { telegramUser, dbUser, isLoading, error, refreshUserData } = useUser()
  const { levelUpModal, handleLevelUpModalClose, levelThresholds } = useLevelCheck()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)

  // Функция для отправки приглашения через Telegram
  const handleInviteFriend = () => {
    if (!dbUser?.telegram_id && !telegramUser?.id) return
    
    try {
      // Инициализируем утилиты
      const utils = initUtils()
      
      // Имя бота (в реальном приложении лучше получать из конфигурации)
      const botUsername = 'V0_aiassist_bot/V0app'
      
      // Используем формат из запроса пользователя
      const userId = dbUser?.telegram_id || telegramUser?.id
      const INVITE_URL = `https://t.me/${botUsername}`
      const shareText = "Join our app! Use my referral link:"
      
      // Формируем ссылку с использованием startapp параметра
      const inviteLink = `${INVITE_URL}?startapp=${userId}`
      const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`
      
      // Используем утилиты для открытия ссылки
      utils.openTelegramLink(fullUrl)
    } catch (err) {
      console.error("Error sharing link:", err)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setRefreshMessage(null)
    
    try {
      console.log("Manual refresh requested by user")
      await refreshUserData()
      setRefreshMessage("Data updated")
      
      // Автоматически скроем сообщение через 3 секунды
      setTimeout(() => {
        setRefreshMessage(null)
      }, 3000)
    } catch (e) {
      setRefreshMessage("Error updating")
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
            <div className="text-center flex flex-col items-center gap-4">
              <h3 className="text-lg font-medium">Profile Login</h3>
              <p className="text-gray-500 mb-4">Choose login method</p>
              <Avatar className="h-20 w-20 mx-auto mb-2">
                <AvatarFallback>
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {/* Telegram Login Button */}
                <Button 
                  className="bg-[#0088cc] hover:bg-[#0077b5] text-white flex items-center gap-2"
                  onClick={() => window.open('https://t.me/V0_aiassist_bot/V0app', '_blank')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.296c-.146.658-.537.818-1.084.51l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.054 5.56-5.022c.242-.213-.054-.334-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.658-.643.136-.953l11.59-4.463c.538-.196 1.006.128.813.946z" />
                  </svg>
                  Telegram
                </Button>

                {/* Google Login Button */}
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => {/* TODO: Implement Google login */}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>

                {/* Apple Login Button */}
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => {/* TODO: Implement Apple login */}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.24 1.24-.74 2.49-1.38 3.73zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="#000000"/>
                  </svg>
                  Apple
                </Button>

                {/* Phone Login Button */}
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => {/* TODO: Implement phone login */}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1zM21 6h-3V3h-2v3h-3v2h3v3h2V8h3z" fill="#000000"/>
                  </svg>
                  Телефон
                </Button>

                {/* Facebook Login Button */}
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => {/* TODO: Implement Facebook login */}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fill="#1877F2"/>
                  </svg>
                  Facebook
                </Button>

                {/* Twitter Login Button */}
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => {/* TODO: Implement Twitter login */}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" fill="#1DA1F2"/>
                  </svg>
                  Twitter
                </Button>

                {/* GitHub Login Button */}
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => {/* TODO: Implement GitHub login */}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="#000000"/>
                  </svg>
                  GitHub
                </Button>

                {/* Email Login Button */}
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => {/* TODO: Implement Email login */}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#000000"/>
                  </svg>
                  Email
                </Button>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                After logging in, you will get access to all application features
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <CardTitle className="text-sm">User Profile</CardTitle>
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
              
              {/* Добавляем кнопку "Пригласить друга" */}
              <Button 
                variant="secondary" 
                className="mt-4 bg-purple-100 hover:bg-purple-200 text-purple-800"
                onClick={handleInviteFriend}
                disabled={!dbUser && !telegramUser}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Invite a friend
              </Button>
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
                          <span className="text-xs text-gray-500">Wallet Balance</span>
                        </div>
                        <p className="text-lg font-semibold">${dbUser.wallet_balance.toFixed(2)}</p>
                      </div>
                    )}
                    
                    {typeof dbUser.aicore_balance === 'number' && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center mb-1">
                          <Award className="h-4 w-4 text-purple-600 mr-2" />
                          <span className="text-xs text-gray-500">AICore Balance</span>
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
                        <span className="text-sm">Phone</span>
                      </div>
                      <span className="font-medium">{dbUser.phone_number}</span>
                    </div>
                  )}

                  {typeof dbUser.level === 'number' && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-sm">Level</span>
                      </div>
                      <span className="font-medium">{dbUser.level}</span>
                    </div>
                  )}

                  {typeof dbUser.paid_referrals === 'number' && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-sm">Referrals</span>
                      </div>
                      <span className="font-medium">{dbUser.paid_referrals}</span>
                    </div>
                  )}

                  {typeof dbUser.reinvest === 'number' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reinvestment</span>
                      <span className="font-medium">{dbUser.reinvest}%</span>
                    </div>
                  )}

                  {dbUser.created_at && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-sm">Member Since</span>
                      </div>
                      <span className="font-medium text-sm">{new Date(dbUser.created_at).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Добавляем секцию с реферальной ссылкой */}
                  <ReferralLinkSection 
                    userId={dbUser.id}
                    telegramId={dbUser.telegram_id}
                  />
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

      {/* Level Up Modal */}
      <Dialog open={levelUpModal?.isOpen} onOpenChange={(open) => {
        if (!open) {
          handleLevelUpModalClose();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Level Up!
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">Congratulations!</p>
              <p className="text-gray-600">
                You've reached Level <span className="font-bold text-purple-600">{levelUpModal?.newLevel}</span>!
              </p>
              <div className="bg-purple-50 p-4 rounded-lg">
                 <p className="text-sm text-purple-700 mb-2">Keep growing your Core!</p>
                 {levelUpModal?.newLevel && levelUpModal.newLevel < levelThresholds.length && (
                    <p className="text-xs text-purple-600">
                        Next level at ${levelThresholds[levelUpModal.newLevel].core} Core.
                    </p>
                 )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={handleLevelUpModalClose}
            >
              Awesome!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

