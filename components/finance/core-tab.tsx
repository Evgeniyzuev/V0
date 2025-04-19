import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import TransferModal from "@/components/finance/transfer-modal"

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

// Daily APY rate (0.0633% per day = 26% APY)
const DAILY_RATE = 0.000633

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

interface CoreTabProps {
  coreBalance: number
  walletBalance: number
  userId: string
  onTransferSuccess: (newWalletBalance: number, newCoreBalance: number) => void
}

export default function CoreTab({ coreBalance, walletBalance, userId, onTransferSuccess }: CoreTabProps) {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [startCore, setStartCore] = useState(coreBalance)
  const [dailyRewards, setDailyRewards] = useState(10)
  const [yearsToCalculate, setYearsToCalculate] = useState(30)
  const [targetCoreAmount, setTargetCoreAmount] = useState<number>(0)
  const [timeToTarget, setTimeToTarget] = useState<number | null>(null)

  // Update startCore when coreBalance changes
  useEffect(() => {
    setStartCore(coreBalance)
  }, [coreBalance])

  // Calculate daily income
  const calculateDailyIncome = (balance: number) => {
    const dailyIncome = balance * DAILY_RATE
    return { total: dailyIncome }
  }

  // Calculate core value at specific day
  const calculateCoreAtDay = (days: number) => {
    // Initial core with compound interest
    const futureInitialCore = startCore * Math.pow(1 + DAILY_RATE, days)
    
    // Daily rewards with compound interest
    const futureDailyRewards = dailyRewards * ((Math.pow(1 + DAILY_RATE, days) - 1) / DAILY_RATE)
    
    return futureInitialCore + futureDailyRewards
  }

  // Calculate future core value
  const calculateFutureCore = () => {
    const daysToCalculate = yearsToCalculate * 365.25
    return calculateCoreAtDay(daysToCalculate)
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

  return (
    <>
      {/* Balance card */}
      <div className="p-3">
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs opacity-90">Core Balance</p>
              <h1 className="text-2xl font-bold mt-0.5">
                ${coreBalance.toFixed(2)}
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

          <div className="mt-4 space-y-1.5">
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
        </div>
      </div>

      {/* Daily Income Card */}
      <div className="px-3 mt-1">
        <Card className="w-full">
          <CardContent className="p-3">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium">Daily Income</span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  ${calculateDailyIncome(coreBalance).total.toFixed(8)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core Growth Calculator Card */}
      <div className="px-3 mt-1">
        <Card className="w-full">
          <CardContent className="p-3">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span className="text-sm font-medium">Core Growth Calculator</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
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
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-500">Future Core Balance</span>
                  <span className="text-sm font-medium text-blue-600">
                    ${calculateFutureCore().toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-500">Daily Income</span>
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
      <div className="px-3 mt-1">
        <Card className="w-full">
          <CardContent className="p-3">
            <div className="flex flex-col space-y-3">
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

      {/* Transfer Button */}
      <div className="px-3 mt-1">
        <Card>
          <CardContent className="p-3 flex flex-col items-center justify-center">
            <button
              className="w-full h-full flex flex-col items-center py-1.5"
              onClick={() => setIsTransferModalOpen(true)}
              disabled={!userId}
            >
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1.5">
                <RefreshCw className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-sm font-medium">Transfer from Wallet</p>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        currentWalletBalance={walletBalance}
        onSuccess={onTransferSuccess}
        userId={userId}
      />
    </>
  )
} 