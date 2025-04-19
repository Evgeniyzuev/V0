"use client"

import { useState, useEffect } from "react"
import { ArrowDown, RefreshCw, Plus, ArrowRight, Send, Wallet, User, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUserBalances, updateUserReinvest } from "@/app/actions/finance-actions"
import TopUpModal from "@/components/finance/top-up-modal"
import TransferModal from "@/components/finance/transfer-modal"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/components/UserContext"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

// Define level thresholds
const levelThresholds = [
  { level: 1, core: 2 },
  { level: 2, core: 4 },
  { level: 3, core: 8 },
  { level: 4, core: 16 },
  { level: 5, core: 32 },
  { level: 6, core: 64 },
  { level: 7, core: 125 },
  { level: 8, core: 250 },
  { level: 9, core: 500 },
  { level: 10, core: 1000 },
  { level: 11, core: 2000 },
  { level: 12, core: 4000 },
  { level: 13, core: 8000 },
  { level: 14, core: 16000 },
  { level: 15, core: 32000 },
  { level: 16, core: 64000 },
  { level: 17, core: 125000 },
  { level: 18, core: 250000 },
  { level: 19, core: 500000 },
  { level: 20, core: 1000000 },
  { level: 21, core: 2000000 },
  { level: 22, core: 4000000 },
  { level: 23, core: 8000000 },
  { level: 24, core: 16000000 },
  { level: 25, core: 32000000 },
  { level: 26, core: 64000000 },
  { level: 27, core: 125000000 },
  { level: 28, core: 250000000 },
  { level: 29, core: 500000000 },
  { level: 30, core: 1000000000 },
];

// Calculate level and progress
const calculateLevelProgress = (balance: number) => {
  // Find current level and next level threshold
  let currentLevel = 0;
  let nextLevelThreshold = levelThresholds[0].core;
  
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (balance >= levelThresholds[i].core) {
      currentLevel = levelThresholds[i].level;
      nextLevelThreshold = levelThresholds[i + 1]?.core || levelThresholds[i].core * 2;
      break;
    }
  }

  // Calculate progress to next level
  const currentLevelThreshold = currentLevel > 0 
    ? levelThresholds.find(t => t.level === currentLevel)?.core || 0 
    : 0;
  
  const progressToNext = balance - currentLevelThreshold;
  const totalNeeded = nextLevelThreshold - currentLevelThreshold;
  const progressPercentage = (progressToNext / totalNeeded) * 100;

  return {
    currentLevel,
    nextLevelThreshold,
    progressToNext,
    totalNeeded,
    progressPercentage: Math.min(progressPercentage, 100)
  };
};

// Calculate minimum reinvest percentage based on level
const calculateMinReinvest = (balance: number) => {
  const { currentLevel } = calculateLevelProgress(balance);
  return Math.max(0, 100 - (5 * currentLevel));
};

export default function FinanceTab() {
  const { telegramUser, dbUser, isLoading: userLoading, refreshUser } = useUser()
  const [activeTab, setActiveTab] = useState<"wallet" | "core">("wallet")
  const [walletBalance, setWalletBalance] = useState(0)
  const [coreBalance, setCoreBalance] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [reinvestPercentage, setReinvestPercentage] = useState(100)
  const [isReinvestChanged, setIsReinvestChanged] = useState(false)
  const { toast } = useToast()
  const [startCore, setStartCore] = useState(0)
  const [dailyRewards, setDailyRewards] = useState(10)
  const [yearsToCalculate, setYearsToCalculate] = useState(30)
  const [targetCoreAmount, setTargetCoreAmount] = useState<number>(0)
  const [timeToTarget, setTimeToTarget] = useState<number | null>(null)

  // Daily APY rate (0.0633% per day = 26% APY)
  const DAILY_RATE = 0.000633

  // Update local state when dbUser changes
  useEffect(() => {
    if (dbUser) {
      setWalletBalance(dbUser.wallet_balance || 0)
      setCoreBalance(dbUser.aicore_balance || 0)
      setReinvestPercentage(dbUser.reinvest || 100)
      setUserId(dbUser.id)
    }
  }, [dbUser])

  // Update startCore when coreBalance changes
  useEffect(() => {
    setStartCore(coreBalance)
  }, [coreBalance])

  // Calculate daily income
  const calculateDailyIncome = (balance: number) => {
    const dailyIncome = balance * DAILY_RATE
    const toCore = dailyIncome * (reinvestPercentage / 100)
    const toWallet = dailyIncome * ((100 - reinvestPercentage) / 100)
    return { total: dailyIncome, toCore, toWallet }
  }

  // Handle reinvest percentage change
  const handleReinvestChange = (value: string) => {
    const num = Number(value)
    if (!isNaN(num)) {
      const minReinvest = calculateMinReinvest(coreBalance);
      // Allow any number during typing, but clamp between minReinvest-100
      const clampedNum = Math.max(minReinvest, Math.min(100, num))
      setReinvestPercentage(clampedNum)
      setIsReinvestChanged(true)
    }
  }

  // Save reinvest percentage
  const handleSaveReinvest = async () => {
    if (!userId) return

    try {
      await updateUserReinvest(userId, reinvestPercentage)
      await refreshUser()
      setIsReinvestChanged(false)
      toast({
        title: "Success",
        description: "Reinvest percentage updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reinvest percentage",
        variant: "destructive",
      })
    }
  }

  // Calculate core value at specific day
  const calculateCoreAtDay = (days: number) => {
    const reinvestRate = DAILY_RATE * (reinvestPercentage / 100);
    // Initial core with compound interest
    const futureInitialCore = startCore * Math.pow(1 + reinvestRate, days)
    
    // Daily rewards with compound interest
    const futureDailyRewards = dailyRewards * ((Math.pow(1 + reinvestRate, days) - 1) / reinvestRate)
    
    return futureInitialCore + futureDailyRewards
  }

  // Calculate future core value using compound interest with daily rewards
  const calculateFutureCore = () => {
    const daysToCalculate = yearsToCalculate * 365.25
    const reinvestRate = DAILY_RATE * (reinvestPercentage / 100);
    
    // Calculate future value of initial core with compound interest
    const futureInitialCore = startCore * Math.pow(1 + reinvestRate, daysToCalculate)
    
    // Calculate future value of daily rewards with compound interest
    // Using the formula for sum of geometric sequence with daily compounding
    const futureDailyRewards = dailyRewards * ((Math.pow(1 + reinvestRate, daysToCalculate) - 1) / reinvestRate)
    
    return futureInitialCore + futureDailyRewards
  }

  // Binary search to find days to target
  const findDaysToTarget = (target: number) => {
    let left = 0
    let right = 36525 // 100 years in days as upper limit
    
    while (left < right - 1) {
      const mid = Math.floor((left + right) / 2)
      const midValue = calculateCoreAtDay(mid)
      
      if (Math.abs(midValue - target) < 0.01) {
        return mid
      }
      
      if (midValue < target) {
        left = mid
      } else {
        right = mid
      }
    }
    
    return right
  }

  // Format number of days to readable format
  const formatTimeToTarget = (days: number) => {
    const years = Math.floor(days / 365.25)
    const remainingDays = Math.round(days % 365.25)
    
    if (years === 0) {
      return `${remainingDays} days`
    } else if (remainingDays === 0) {
      return `${years} year${years > 1 ? 's' : ''}`
    } else {
      return `${years} year${years > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`
    }
  }

  // Calculate time to target
  const calculateTimeToTarget = () => {
    if (!targetCoreAmount || targetCoreAmount <= coreBalance) return
    
    const days = findDaysToTarget(targetCoreAmount)
    setTimeToTarget(days)
  }

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
      description: "Transfer to Core completed successfully",
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

      {/* Balance card */}
      <div className="p-2">
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-2 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs opacity-90">{activeTab === "wallet" ? "Wallet Balance" : "Core Balance"}</p>
              <h1 className="text-2xl font-bold mt-0.5">
                ${activeTab === "wallet" ? walletBalance.toFixed(2) : coreBalance.toFixed(2)}
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

          {/* Level Progress - Only show in Core tab */}
          {activeTab === "core" && (
            <div className="mt-2 space-y-1.5">
              {(() => {
                const { currentLevel, nextLevelThreshold, progressPercentage } = calculateLevelProgress(coreBalance);
                return (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">Level {currentLevel}</span>
                      <span>${coreBalance.toFixed(2)} / ${nextLevelThreshold}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-1.5 bg-white/20" />
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Daily Income Card */}
      <div className="px-2">
        <Card className="w-full bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <CardContent className="p-2">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium">Daily Income</span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  ${calculateDailyIncome(coreBalance).total.toFixed(8)}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 w-16">Reinvest %</span>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      value={reinvestPercentage}
                      onChange={(e) => handleReinvestChange(e.target.value)}
                      className="h-6 text-sm w-20"
                      min={calculateMinReinvest(coreBalance)}
                      max={100}
                    />
                    <div className="w-8 flex justify-center">
                      {isReinvestChanged && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={handleSaveReinvest}
                        >
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <Progress value={reinvestPercentage} className="h-1.5" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">To Core</span>
                  <span className="text-sm font-medium text-green-600">
                    ${calculateDailyIncome(coreBalance).toCore.toFixed(8)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">To Wallet</span>
                  <span className="text-sm font-medium text-green-600">
                    ${calculateDailyIncome(coreBalance).toWallet.toFixed(8)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core Growth Calculator Card */}
      {activeTab === "core" && (
        <>
          <div className="px-2">
            <Card className="w-full bg-gradient-to-r from-purple-500/10 to-blue-500/10">
              <CardContent className="p-2">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      <span className="text-sm font-medium">Core Growth Calculator</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <div>
                      <label className="text-xs text-gray-500">Start Core $</label>
                      <Input
                        type="number"
                        value={startCore}
                        onChange={(e) => setStartCore(Number(e.target.value))}
                        className="h-6 text-sm mt-1"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Daily Rewards $/d</label>
                      <Input
                        type="number"
                        value={dailyRewards}
                        onChange={(e) => setDailyRewards(Number(e.target.value))}
                        className="h-6 text-sm mt-1"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Years</label>
                      <Input
                        type="number"
                        value={yearsToCalculate}
                        onChange={(e) => setYearsToCalculate(Number(e.target.value))}
                        className="h-6 text-sm mt-1"
                        min={1}
                        max={100}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Future Core Balance</span>
                      <span className="text-sm font-medium text-blue-600">
                        ${calculateFutureCore().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Daily Income</span>
                      <span className="text-sm font-medium text-green-600">
                        ${(calculateFutureCore() * DAILY_RATE).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time to Target Calculator Card */}
          <div className="px-2">
            <Card className="w-full bg-gradient-to-r from-purple-500/10 to-blue-500/10">
              <CardContent className="p-2">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                      <span className="text-sm font-medium">Time to Target</span>
                    </div>
                  </div>

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Target Core Amount $</label>
                      <Input
                        type="number"
                        value={targetCoreAmount}
                        onChange={(e) => setTargetCoreAmount(Number(e.target.value))}
                        className="h-6 text-sm mt-1"
                        min={0}
                      />
                    </div>
                    <Button 
                      className="h-6 text-xs"
                      onClick={calculateTimeToTarget}
                      disabled={!targetCoreAmount || targetCoreAmount <= coreBalance}
                    >
                      Calculate
                    </Button>
                  </div>

                  {timeToTarget !== null && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">Estimated time:</span>
                        <span className="font-medium">
                          {formatTimeToTarget(timeToTarget)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(Date.now() + timeToTarget * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Action buttons - Wallet Tab */}
      {activeTab === "wallet" && (
        <div className="px-2 grid grid-cols-2 gap-1">
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <CardContent className="p-2 flex flex-col items-center justify-center">
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

          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <CardContent className="p-2 flex flex-col items-center justify-center">
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
      )}

      {/* Additional Wallet Actions */}
      {activeTab === "wallet" && (
        <div className="px-2 grid grid-cols-2 gap-1">
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <CardContent className="p-2 flex flex-col items-center justify-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1.5">
                <Send className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-sm font-medium">Send</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <CardContent className="p-2 flex flex-col items-center justify-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1.5">
                <ArrowDown className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-sm font-medium">Receive</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Core Tab Content */}
      {activeTab === "core" && (
        <div className="px-2">
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <CardContent className="p-2 flex flex-col items-center justify-center">
              <button
                className="w-full h-full flex flex-col items-center py-1.5"
                onClick={() => setIsTransferModalOpen(true)}
                disabled={!userId}
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1.5">
                  <ArrowRight className="h-4 w-4 text-green-500" />
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
            userId={userId || ''}
          />
        </>
      )}
    </div>
  )
}

