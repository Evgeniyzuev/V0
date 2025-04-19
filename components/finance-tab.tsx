"use client"

import { useState, useEffect } from "react"
import { ArrowDown, RefreshCw, Plus, ArrowRight, Send, Wallet, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUserBalances } from "@/app/actions/finance-actions"
import TopUpModal from "@/components/finance/top-up-modal"
import TransferModal from "@/components/finance/transfer-modal"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/components/UserContext"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import CoreTab from "@/components/finance/core-tab"

export default function FinanceTab() {
  const { telegramUser, dbUser, isLoading: userLoading, refreshUser } = useUser()
  const [activeTab, setActiveTab] = useState<"wallet" | "core">("wallet")
  const [walletBalance, setWalletBalance] = useState(0)
  const [coreBalance, setCoreBalance] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const { toast } = useToast()

  // Update local state when dbUser changes
  useEffect(() => {
    if (dbUser) {
      setWalletBalance(dbUser.wallet_balance || 0)
      setCoreBalance(dbUser.aicore_balance || 0)
      setUserId(dbUser.id)
    }
  }, [dbUser])

  // Показываем индикатор загрузки
  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <p>Loading financial data...</p>
      </div>
    )
  }

  // Отображаем интерфейс входа, если пользователь не авторизован
  if (!telegramUser && !dbUser && !userLoading) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center flex flex-col items-center gap-4">
              <h3 className="text-lg font-medium">Access to Finance</h3>
              <p className="text-gray-500 mb-4">To access your balance, please log in to the system</p>
              <Avatar className="h-20 w-20 mx-auto mb-2">
                <AvatarFallback>
                  <Wallet className="h-10 w-10 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-6"
                onClick={() => {
                  const socialButton = document.querySelector('button[aria-label="Social"]');
                  if (socialButton instanceof HTMLElement) {
                    socialButton.click();
                  }
                }}
              >
                <User className="h-5 w-5" />
                Go to Profile
              </Button>

              <p className="text-xs text-gray-400 mt-4">
                After logging in, you will get access to all application features
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleTopUpSuccess = (newBalance: number) => {
    setWalletBalance(newBalance)
    toast({
      title: "Success",
      description: `Wallet topped up successfully. New balance: $${newBalance.toFixed(2)}`,
    })
  }

  const handleTransferSuccess = (newWalletBalance: number, newCoreBalance: number) => {
    setWalletBalance(newWalletBalance)
    setCoreBalance(newCoreBalance)
    toast({
      title: "Success",
      description: "Transfer completed successfully",
    })
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Tabs */}
      <div className="flex bg-white border-b">
        <button
          className={`flex-1 py-1.5 text-center font-medium text-sm ${
            activeTab === "wallet" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("wallet")}
        >
          Wallet
        </button>
        <button
          className={`flex-1 py-1.5 text-center font-medium text-sm ${
            activeTab === "core" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("core")}
        >
          Core
        </button>
      </div>

      {/* Wallet Tab Content */}
      {activeTab === "wallet" && (
        <>
          {/* Balance card */}
          <div className="p-3">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs opacity-90">Wallet Balance</p>
                  <h1 className="text-2xl font-bold mt-0.5">
                    ${walletBalance.toFixed(2)}
                  </h1>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 text-white border-white/40 hover:bg-white/30 h-7"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-3 grid grid-cols-2 gap-2 mt-1 mb-2">
            <Card>
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <button
                  className="w-full h-full flex flex-col items-center py-1.5"
                  onClick={() => setIsTopUpModalOpen(true)}
                  disabled={!userId}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1.5">
                    <Plus className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium">Top Up</p>
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <button
                  className="w-full h-full flex flex-col items-center py-1.5"
                  onClick={() => setIsTransferModalOpen(true)}
                  disabled={!userId}
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1.5">
                    <ArrowRight className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-sm font-medium">Transfer to Core</p>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Actions */}
          <div className="px-3 grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1.5">
                  <Send className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-sm font-medium">Send</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1.5">
                  <ArrowDown className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-sm font-medium">Receive</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Up Modal */}
          {userId && (
            <TopUpModal
              isOpen={isTopUpModalOpen}
              onClose={() => setIsTopUpModalOpen(false)}
              onSuccess={handleTopUpSuccess}
              userId={userId}
            />
          )}

          {/* Transfer Modal */}
          {userId && (
            <TransferModal
              isOpen={isTransferModalOpen}
              onClose={() => setIsTransferModalOpen(false)}
              currentWalletBalance={walletBalance}
              onSuccess={handleTransferSuccess}
              userId={userId}
            />
          )}
        </>
      )}

      {/* Core Tab Content */}
      {activeTab === "core" && userId && (
        <CoreTab
          coreBalance={coreBalance}
          walletBalance={walletBalance}
          userId={userId}
          onTransferSuccess={handleTransferSuccess}
        />
      )}
    </div>
  )
}

