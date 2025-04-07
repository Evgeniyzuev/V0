"use client"

import { useState, useEffect } from "react"
import { ArrowDown, RefreshCw, Plus, ArrowRight, Send, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUserBalances } from "@/app/actions/finance-actions"
import TopUpModal from "@/components/finance/top-up-modal"
import TransferModal from "@/components/finance/transfer-modal"
import { useToast } from "@/hooks/use-toast"

export default function FinanceTab() {
  const [activeTab, setActiveTab] = useState("wallet")
  const [walletBalance, setWalletBalance] = useState(0)
  const [coreBalance, setCoreBalance] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const { toast } = useToast()

  // Сохраняем userId в localStorage при его изменении
  useEffect(() => {
    if (userId) {
      localStorage.setItem("financeUserId", userId)
    }
  }, [userId])

  // Получаем userId из localStorage при инициализации
  useEffect(() => {
    const savedUserId = localStorage.getItem("financeUserId")
    if (savedUserId) {
      setUserId(savedUserId)
    }
  }, [])

  const fetchBalances = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Используем сохраненный userId для получения данных того же пользователя
      const result = await getUserBalances(userId || undefined)

      if (result.success) {
        setWalletBalance(result.walletBalance)
        setCoreBalance(result.coreBalance)

        // Устанавливаем userId только если его еще нет
        if (!userId && result.userId) {
          setUserId(result.userId)
        }
      } else {
        setError(result.error || "Failed to fetch balances")
        toast({
          title: "Error",
          description: result.error || "Failed to fetch balances",
          variant: "destructive",
        })
      }
    } catch (err) {
      setError("An unexpected error occurred")
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Загружаем данные при первой загрузке или при изменении userId
  useEffect(() => {
    fetchBalances()
  }, [userId])

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
      description: "Transfer to Core completed successfully",
    })
  }

  // Функция для сброса пользователя (для тестирования)
  const resetUser = () => {
    localStorage.removeItem("financeUserId")
    setUserId(null)
    // После сброса userId, useEffect загрузит нового пользователя
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Tabs */}
      <div className="flex bg-white border-b">
        <button
          className={`flex-1 py-3 text-center font-medium text-sm ${
            activeTab === "wallet" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("wallet")}
        >
          Wallet
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium text-sm ${
            activeTab === "core" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("core")}
        >
          Core
        </button>
      </div>

      {/* Balance card */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-90">{activeTab === "wallet" ? "Wallet Balance" : "Core Balance"}</p>
              <h1 className="text-4xl font-bold mt-1">
                ${activeTab === "wallet" ? walletBalance.toFixed(2) : coreBalance.toFixed(2)}
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/20 text-white border-white/40 hover:bg-white/30"
              onClick={fetchBalances}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
          {userId && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-white/80">User ID: {userId.substring(0, 8)}...</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={resetUser}
              >
                Change User
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons - Wallet Tab */}
      {activeTab === "wallet" && (
        <div className="px-4 grid grid-cols-2 gap-4 mb-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <button
                className="w-full h-full flex flex-col items-center py-2"
                onClick={() => setIsTopUpModalOpen(true)}
                disabled={!userId}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Plus className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-sm font-medium">Top Up</p>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <button
                className="w-full h-full flex flex-col items-center py-2"
                onClick={() => setIsTransferModalOpen(true)}
                disabled={!userId}
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <ArrowRight className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-sm font-medium">Transfer to Core</p>
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Wallet Actions */}
      {activeTab === "wallet" && (
        <div className="px-4 grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Send className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-sm font-medium">Send</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <ArrowDown className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm font-medium">Receive</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Core Tab Content */}
      {activeTab === "core" && (
        <div className="px-4 grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <Wallet className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-sm font-medium">Core Balance</p>
              <p className="text-lg font-bold mt-1">${coreBalance.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <button
                className="w-full h-full flex flex-col items-center py-2"
                onClick={() => setIsTransferModalOpen(true)}
                disabled={!userId}
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <ArrowRight className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-sm font-medium">Transfer from Wallet</p>
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      {userId && (
        <>
          <TopUpModal
            isOpen={isTopUpModalOpen}
            onClose={() => setIsTopUpModalOpen(false)}
            onSuccess={handleTopUpSuccess}
            userId={userId}
          />

          <TransferModal
            isOpen={isTransferModalOpen}
            onClose={() => setIsTransferModalOpen(false)}
            currentWalletBalance={walletBalance}
            onSuccess={handleTransferSuccess}
            userId={userId}
          />
        </>
      )}
    </div>
  )
}

