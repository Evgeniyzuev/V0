"use client"

import { useState, useEffect } from "react"
import { ArrowDown, RefreshCw, Plus, ArrowRight, Send, Wallet, User, Check, Trophy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUserBalances, updateUserReinvest } from "@/app/actions/finance-actions"
import TopUpModal from "@/components/finance/top-up-modal"
import TransferModal from "@/components/finance/transfer-modal"
import SendTonModal from "@/components/finance/send-ton-modal"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/components/UserContext"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useTaskVerification } from '@/hooks/useTaskVerification'
import { useLevelCheck } from '@/hooks/useLevelCheck'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { TonConnectButton } from '@tonconnect/ui-react'
import InterestNotification from "./interest-notification"
import CoreHistory from "./core-history"

// Initialize Supabase client
const supabase = createClientSupabaseClient()

// Add notification dot component
const NotificationDot = () => (
  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
);

export default function FinanceTab() {
  const { telegramUser, dbUser, isLoading: userLoading, refreshUserData, goals } = useUser()
  const { levelUpModal, handleLevelUpModalClose, levelThresholds } = useLevelCheck()
  const [activeTab, setActiveTab] = useState<"wallet" | "core">("wallet")
  const [walletBalance, setWalletBalance] = useState(0)
  const [coreBalance, setCoreBalance] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [reinvestPercentage, setReinvestPercentage] = useState(100)
  const [reinvestInputValue, setReinvestInputValue] = useState('100')
  const [isReinvestChanged, setIsReinvestChanged] = useState(false)
  const { toast } = useToast()
  const [startCore, setStartCore] = useState<string>('0')
  const [dailyRewards, setDailyRewards] = useState<string>('10')
  const [yearsToCalculate, setYearsToCalculate] = useState<string>('30')
  const [targetCoreAmount, setTargetCoreAmount] = useState<string>('0')
  const [timeToTarget, setTimeToTarget] = useState<number | null>(null)
  const [hasCalculated, setHasCalculated] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [hasUnviewedInterest, setHasUnviewedInterest] = useState(false);
  const [showInterestNotification, setShowInterestNotification] = useState(false)
  const [unviewedInterestAmount, setUnviewedInterestAmount] = useState(0)

  const { verifying, handleTaskVerification } = useTaskVerification({
    dbUser,
    refreshUserData,
    setStatusMessage,
    onTaskComplete: (taskNumber, reward, oldCore, newCore) => {
      toast({
        title: "Task Completed!",
        description: `You've earned ${reward} Core for completing task ${taskNumber}!`,
      })
    }
  })

  // Daily APY rate (0.0633% per day = 26% APY)
  const DAILY_RATE = 0.000633

  // Format number with spaces for thousands
  const formatWithSpaces = (num: number) => {
    const [int, dec] = num.toFixed(2).split('.');
    const formattedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formattedInt}.${dec}`;
  }

  // Update local state when dbUser changes
  useEffect(() => {
    if (dbUser) {
      console.log('Setting user data from dbUser:', {
        id: dbUser.id,
        wallet_balance: dbUser.wallet_balance,
        aicore_balance: dbUser.aicore_balance,
        reinvest: dbUser.reinvest
      })
      setWalletBalance(dbUser.wallet_balance || 0)
      setCoreBalance(dbUser.aicore_balance || 0)
      const reinvestValue = dbUser.reinvest !== null && dbUser.reinvest !== undefined ? dbUser.reinvest : 100
      setReinvestPercentage(reinvestValue)
      setReinvestInputValue(reinvestValue.toString())
      setUserId(dbUser.id)
    }
  }, [dbUser])

  // Update startCore when coreBalance changes
  useEffect(() => {
    setStartCore(coreBalance.toString())
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
    // Allow empty string for better UX when typing
    if (value === '') {
      setReinvestPercentage(0)
      setIsReinvestChanged(true)
      return
    }

    const num = Number(value)
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setReinvestPercentage(num)
      setIsReinvestChanged(true)
    } else {
      // Reset to 100 for invalid inputs
      setReinvestPercentage(100)
      setReinvestInputValue('100')
      setIsReinvestChanged(true)
    }
  }

  // Save reinvest percentage
  const handleSaveReinvest = async () => {
    if (!userId) return

    try {
      await updateUserReinvest(userId, reinvestPercentage)
      await refreshUserData()
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
    const startCoreNum = parseFloat(startCore) || 0;
    const dailyRewardsNum = parseFloat(dailyRewards) || 0;
    // Initial core with compound interest
    const futureInitialCore = startCoreNum * Math.pow(1 + reinvestRate, days)

    // Daily rewards with compound interest
    const futureDailyRewards = dailyRewardsNum * ((Math.pow(1 + reinvestRate, days) - 1) / reinvestRate)

    return futureInitialCore + futureDailyRewards
  }

  // Calculate future core value using compound interest with daily rewards
  const calculateFutureCore = () => {
    const yearsNum = parseFloat(yearsToCalculate) || 0;
    const daysToCalculate = yearsNum * 365.25
    const reinvestRate = DAILY_RATE * (reinvestPercentage / 100);
    const startCoreNum = parseFloat(startCore) || 0;
    const dailyRewardsNum = parseFloat(dailyRewards) || 0;

    // Calculate future value of initial core with compound interest
    const futureInitialCore = startCoreNum * Math.pow(1 + reinvestRate, daysToCalculate)

    // Calculate future value of daily rewards with compound interest
    // Using the formula for sum of geometric sequence with daily compounding
    const futureDailyRewards = dailyRewardsNum * ((Math.pow(1 + reinvestRate, daysToCalculate) - 1) / reinvestRate)

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
    if (!targetCoreAmount || Number(targetCoreAmount) <= coreBalance) return;

    const days = findDaysToTarget(Number(targetCoreAmount));
    setTimeToTarget(days);
    setHasCalculated(true);
    // Store state in localStorage for task verification
    localStorage.setItem('timeToTargetCalculated', 'true');
  }

  // Reset calculation state when target amount changes
  useEffect(() => {
    setHasCalculated(false);
    localStorage.removeItem('timeToTargetCalculated');
  }, [targetCoreAmount]);

  // Calculate level and progress using levelThresholds from useLevelCheck
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

  // // Calculate minimum reinvest percentage based on level
  // const calculateMinReinvest = (balance: number) => {
  //   const { currentLevel } = calculateLevelProgress(balance);
  //   return Math.max(0, 100 - (5 * currentLevel));
  // };

  // Check for unviewed interest
  useEffect(() => {
    const checkUnviewedInterest = async () => {
      if (!userId) return;

      const { data: lastView } = await supabase
        .from('interest_view_tracking')
        .select('last_view_date')
        .eq('user_id', userId)
        .order('last_view_date', { ascending: false })
        .limit(1)
        .single();

      const { data: lastInterest } = await supabase
        .from('interest_execution_log')
        .select('execution_date, total_interest')
        .order('execution_date', { ascending: false })
        .limit(1)
        .single();

      if (!lastView || !lastInterest) {
        setHasUnviewedInterest(false);
        return;
      }

      const hasUnviewed = lastView.last_view_date < lastInterest.execution_date;
      setHasUnviewedInterest(hasUnviewed);
      if (hasUnviewed) {
        setUnviewedInterestAmount(lastInterest.total_interest);
      }
    };

    checkUnviewedInterest();
  }, [userId]);

  // Show notification when switching to Core tab with unviewed interest
  useEffect(() => {
    if (activeTab === "core" && hasUnviewedInterest) {
      setShowInterestNotification(true);
    }
  }, [activeTab, hasUnviewedInterest]);

  // Update view date when tab is active
  useEffect(() => {
    const updateViewDate = async () => {
      if (!userId || !hasUnviewedInterest) return;

      await supabase.rpc('update_interest_view_date', { user_id: userId });
      setHasUnviewedInterest(false);
    };

    updateViewDate();
  }, [activeTab, userId, hasUnviewedInterest]);

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

  const handleSendSuccess = (newBalance: number) => {
    setWalletBalance(newBalance)
    toast({
      title: "Success",
      description: "TON sent successfully",
    })
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100">
        <button
          className={`flex-1 py-3 text-center font-semibold text-base relative ${
            activeTab === "wallet" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("wallet")}
        >
          Wallet
          {hasUnviewedInterest && <NotificationDot />}
        </button>
        <button
          className={`flex-1 py-3 text-center font-semibold text-base relative ${
            activeTab === "core" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("core")}
        >
          Core
          {hasUnviewedInterest && <NotificationDot />}
        </button>
      </div>

      {/* Balance card */}
      <div className="p-2">
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-4 text-white shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs opacity-90 font-medium">{activeTab === "wallet" ? "Wallet Balance" : "Core Balance"}</p>
              <h1 className="text-2xl font-bold mt-1">
                ${activeTab === "wallet" ? walletBalance.toFixed(2) : coreBalance.toFixed(2)}
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/20 text-white border-white/40 hover:bg-white/30 h-7"
              onClick={refreshUserData}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>

          {/* Level Progress - Only show in Core tab */}
          {activeTab === "core" && (
            <div className="space-y-2">
              {(() => {
                const { currentLevel, nextLevelThreshold, progressPercentage } = calculateLevelProgress(coreBalance);
                return (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">Level {currentLevel}</span>
                      <span className="opacity-90">${coreBalance.toFixed(2)} / ${nextLevelThreshold}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-1.5 bg-white/20 rounded-full" />
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Daily Income Card */}
      <div className="px-2 pb-2">
        <Card className="w-full bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-base font-semibold text-gray-900">Daily Income</span>
                </div>
                <span className="text-base font-bold text-green-600">
                  ${calculateDailyIncome(coreBalance).total.toFixed(8)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Reinvest %</span>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={reinvestInputValue}
                      onChange={(e) => {
                        const value = e.target.value
                        setReinvestInputValue(value)
                        handleReinvestChange(value)
                      }}
                      className="h-8 text-sm w-16 text-center font-medium"
                    />
                    <span className="text-xs text-gray-500">%</span>
                    {isReinvestChanged && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2"
                        onClick={handleSaveReinvest}
                      >
                        <Check className="h-3 w-3 text-green-500" />
                      </Button>
                    )}
                  </div>
                </div>
                <Progress value={reinvestPercentage} className="h-1.5 bg-gray-100" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  {/* <span className="text-xs text-gray-600 block mb-1">To Wallet</span> */}
                  <span className="text-sm font-bold text-blue-700">
                    💲 ${calculateDailyIncome(coreBalance).toWallet.toFixed(8)}
                  </span>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  {/* <span className="text-xs text-gray-600 block mb-1">To Core</span> */}
                  <span className="text-sm font-bold text-green-700">
                    ⚛️ ${calculateDailyIncome(coreBalance).toCore.toFixed(8)}
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
          <div className="px-2 pb-2">
            <Card className="w-full bg-white border border-gray-100 shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-base font-semibold text-gray-900">Core Growth Calculator</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Start Core</label>
                      <Input
                        type="number"
                        value={startCore}
                        onChange={(e) => setStartCore(e.target.value)}
                        className="h-8 text-xs"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Daily Rewards</label>
                      <Input
                        type="number"
                        value={dailyRewards}
                        onChange={(e) => setDailyRewards(e.target.value)}
                        className="h-8 text-xs"
                        min={0}
                        placeholder="10"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Years</label>
                      <Input
                        type="number"
                        value={yearsToCalculate}
                        onChange={(e) => setYearsToCalculate(e.target.value)}
                        className="h-8 text-xs"
                        min={1}
                        max={100}
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-xs text-gray-600 block mb-1">Future Core Balance</span>
                      <span className="text-sm font-bold text-blue-700">
                        ${formatWithSpaces(calculateFutureCore())}
                      </span>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <span className="text-xs text-gray-600 block mb-1">Daily Income</span>
                      <span className="text-sm font-bold text-green-700">
                        ${formatWithSpaces(calculateFutureCore() * DAILY_RATE)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time to Target Calculator Card */}
          <div className="px-2 pb-2">
            <Card className="w-full bg-white border border-gray-100 shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-base font-semibold text-gray-900">Time to Target</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Target Core Amount</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={targetCoreAmount}
                          onChange={(e) => setTargetCoreAmount(e.target.value)}
                          className="h-8 text-xs flex-1"
                          placeholder="Enter target amount"
                        />
                        <Button
                          className="h-8 px-4 text-xs"
                          onClick={calculateTimeToTarget}
                          disabled={!targetCoreAmount || Number(targetCoreAmount) <= coreBalance}
                        >
                          Calculate
                        </Button>
                      </div>
                    </div>

                    {timeToTarget !== null && (
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-center">
                          <span className="text-xs text-gray-600 block mb-1">Estimated time to reach target</span>
                          <span className="text-lg font-bold text-purple-700 mb-1 block">
                            {formatTimeToTarget(timeToTarget)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Target date: {new Date(Date.now() + timeToTarget * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Action buttons - Wallet Tab */}
      {activeTab === "wallet" && (
        <div className="px-2 pb-2">
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-14 bg-white border-2 border-blue-100 hover:border-blue-200 hover:bg-blue-50 text-blue-700 font-semibold flex flex-col items-center justify-center space-y-1"
              onClick={() => setIsTopUpModalOpen(true)}
              disabled={!userId}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">Top Up</span>
            </Button>

            <Button
              className="h-14 bg-white border-2 border-green-100 hover:border-green-200 hover:bg-green-50 text-green-700 font-semibold flex flex-col items-center justify-center space-y-1"
              onClick={() => setIsTransferModalOpen(true)}
              disabled={!userId}
            >
              <ArrowRight className="h-5 w-5" />
              <span className="text-xs">Transfer to Core</span>
            </Button>

            <Button
              className="h-14 bg-white border-2 border-purple-100 hover:border-purple-200 hover:bg-purple-50 text-purple-700 font-semibold flex flex-col items-center justify-center space-y-1"
              onClick={() => setIsSendModalOpen(true)}
            >
              <Send className="h-5 w-5" />
              <span className="text-xs">Send</span>
            </Button>

            <Button
              className="h-14 bg-white border-2 border-orange-100 hover:border-orange-200 hover:bg-orange-50 text-orange-700 font-semibold flex flex-col items-center justify-center space-y-1"
              disabled
            >
              <ArrowDown className="h-5 w-5" />
              <span className="text-xs">Receive</span>
            </Button>
          </div>

          {/* TON Connect Button */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex justify-center">
              <TonConnectButton />
            </div>
          </div>
        </div>
      )}

      {/* Core Tab Content */}
      {activeTab === "core" && (
        <div className="px-2 pb-20 space-y-4">
          <Button
            className="w-full h-14 bg-white border-2 border-green-100 hover:border-green-200 hover:bg-green-50 text-green-700 font-semibold flex items-center justify-center space-x-2"
            onClick={() => setIsTransferModalOpen(true)}
            disabled={!userId}
          >
            <ArrowRight className="h-5 w-5" />
            <span className="text-sm">Transfer from Wallet</span>
          </Button>

          {/* Core History */}
          {userId && <CoreHistory userId={userId} />}
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

          <SendTonModal
            isOpen={isSendModalOpen}
            onClose={() => setIsSendModalOpen(false)}
            onSuccess={handleSendSuccess}
            userId={userId}
            currentBalance={walletBalance}
          />
        </>
      )}

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

      {/* Interest Notification */}
      {userId && (
        <InterestNotification
          isOpen={showInterestNotification}
          onClose={() => {
            setShowInterestNotification(false);
            setHasUnviewedInterest(false);
          }}
          userId={userId}
          interestAmount={unviewedInterestAmount}
        />
      )}
      
    </div>
  )
}
