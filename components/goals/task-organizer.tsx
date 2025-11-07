"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { useUser } from "@/components/UserContext"
import TaskCard from "@/components/tasks/TaskCard"
import { createClientSupabaseClient } from "@/lib/supabase"

type HistoryEntry = {
  date: string
  time: number
}

export default function TaskOrganizer() {
  const { refreshGoals, dbUser } = useUser() as any
  const [personalTasks, setPersonalTasks] = useState<Array<any>>([])
  const [isCompletedExpandedLocal, setIsCompletedExpandedLocal] = useState(false)

  // Tabata timer states
  const [workDurationInput, setWorkDurationInput] = useState("")
  const [restDurationInput, setRestDurationInput] = useState("")
  const [roundsInput, setRoundsInput] = useState("")
  const [workDurationMinutes, setWorkDurationMinutes] = useState(25) // Default 25 minutes
  const [restDurationMinutes, setRestDurationMinutes] = useState(5) // Default 5 minutes
  const [rounds, setRounds] = useState(4) // Default 4 rounds

  // Helper functions for min:sec format
  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes)
    const secs = Math.round((minutes - mins) * 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const parseTimeInput = (input: string) => {
    const parts = input.split(':')
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0
      const mins = parseInt(parts[1]) || 0
      const secs = parseInt(parts[2]) || 0
      return hours * 60 + mins + secs / 60
    } else if (parts.length === 2) {
      const mins = parseInt(parts[0]) || 0
      const secs = parseInt(parts[1]) || 0
      return mins + secs / 60
    }
    return parseFloat(input) || 0
  }
  const [isRunning, setIsRunning] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [currentRound, setCurrentRound] = useState(0)
  const [isWorkPhase, setIsWorkPhase] = useState(true)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // in seconds - default to 25 minutes
  const [totalWorkTime, setTotalWorkTime] = useState(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isBlinking, setIsBlinking] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false)
  const [timeThresholdInput, setTimeThresholdInput] = useState("25:00")
  const [timeThreshold, setTimeThreshold] = useState(25)
  const [lastHiddenTime, setLastHiddenTime] = useState<number | null>(null)
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null)
  const supabase = typeof window !== 'undefined' ? createClientSupabaseClient() : null

  // Load settings, timer start time and history from localStorage on mount
  useEffect(() => {
    let loadedWorkDurationMinutes = 25
    let loadedRestDurationMinutes = 5
    let loadedRounds = 4

    const savedSettings = localStorage.getItem('tabataSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      loadedWorkDurationMinutes = settings.work || 25
      loadedRestDurationMinutes = settings.rest || 5
      loadedRounds = settings.rounds || 4

      setWorkDurationMinutes(loadedWorkDurationMinutes)
      setRestDurationMinutes(loadedRestDurationMinutes)
      setRounds(loadedRounds)
      // Set input values if they exist in settings
      if (settings.workInput) setWorkDurationInput(settings.workInput)
      if (settings.restInput) setRestDurationInput(settings.restInput)
      if (settings.roundsInput) setRoundsInput(settings.roundsInput)
      if (settings.timeThresholdInput) setTimeThresholdInput(settings.timeThresholdInput)
    }

    // Load timer start time and settings, then restore timer state
    const savedTimerStartTime = localStorage.getItem('tabataTimerStartTime')
    const savedTimerSettings = localStorage.getItem('tabataTimerSettings')

    if (savedTimerStartTime && savedTimerSettings) {
      const startTime = parseInt(savedTimerStartTime)
      const timerSettings = JSON.parse(savedTimerSettings)
      const now = Date.now()
      const elapsedSeconds = Math.floor((now - startTime) / 1000)

      // Calculate using SAVED settings (the ones active when timer started)
      const savedWorkDuration = Math.round(timerSettings.workDurationMinutes * 60)
      const savedRestDuration = Math.round(timerSettings.restDurationMinutes * 60)
      const savedRounds = timerSettings.rounds
      const totalDuration = savedRounds * (savedWorkDuration + savedRestDuration)

      console.log('Timer restoration with saved settings:', {
        elapsedSeconds,
        totalDuration,
        savedWorkDuration: timerSettings.workDurationMinutes,
        savedRestDuration: timerSettings.restDurationMinutes,
        savedRounds: timerSettings.rounds
      })

      if (elapsedSeconds < totalDuration) {
        // Timer is still running - simulate timer progression to find current state
        let remainingTime = elapsedSeconds
        let currentRound = 0
        let isWorkPhase = true
        let timeLeftInPhase = savedWorkDuration
        let completedWorkTime = 0

        // Simulate timer progression through all completed phases
        while (remainingTime > 0 && currentRound < savedRounds) {
          if (remainingTime >= timeLeftInPhase) {
            // Phase completed
            remainingTime -= timeLeftInPhase

            if (isWorkPhase) {
              // Work phase completed - add to total work time
              completedWorkTime += savedWorkDuration
              // Work phase ended, move to rest (if not last round)
              if (currentRound < savedRounds - 1) {
                isWorkPhase = false
                timeLeftInPhase = savedRestDuration
              } else {
                // Last work phase completed
                break
              }
            } else {
              // Rest phase ended, move to next round work phase
              currentRound++
              isWorkPhase = true
              timeLeftInPhase = savedWorkDuration
            }
          } else {
            // Current phase still in progress
            if (isWorkPhase) {
              // If we're in work phase, add the completed part to work time
              completedWorkTime += (timeLeftInPhase - remainingTime)
            }
            timeLeftInPhase -= remainingTime
            remainingTime = 0
          }
        }

        console.log('Restored timer state:', {
          currentRound,
          isWorkPhase,
          timeLeftInPhase,
          completedWorkTime
        })

        setTimerStartTime(startTime)
        setIsRunning(true)
        setHasStarted(true)
        setCurrentRound(currentRound)
        setIsWorkPhase(isWorkPhase)
        setTimeLeft(timeLeftInPhase)
        setTotalWorkTime(completedWorkTime)
      } else {
        // Timer has completed
        setIsCompleted(true)
        setTimerStartTime(null)
        localStorage.removeItem('tabataTimerStartTime')
        localStorage.removeItem('tabataTimerSettings')
      }
    } else {
      // No saved timer, use current work duration
      const workDuration = Math.round(workDurationMinutes * 60)
      setTimeLeft(workDuration)
    }

    const savedHistory = localStorage.getItem('tabataHistory')
    if (savedHistory) {
      const hist: HistoryEntry[] = JSON.parse(savedHistory)
      setHistory(hist)
      const today = new Date().toDateString()
      const todayEntry = hist.find((h) => h.date === today)
      if (todayEntry) setTotalWorkTime(todayEntry.time)
    }
  }, [])

  // Loader for personal tasks (reusable)
  const fetchPersonalTasks = useCallback(async () => {
    if (!supabase || !dbUser) return
    try {
      const { data, error } = await supabase
        .from('personal_tasks')
        .select('*')
        .eq('user_id', dbUser.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load personal tasks', error)
        return
      }
      setPersonalTasks(data || [])
    } catch (e) {
      console.error('Error loading personal tasks', e)
    }
  }, [supabase, dbUser])

  useEffect(() => {
    fetchPersonalTasks()
  }, [fetchPersonalTasks])

  // Listen for external changes to personal tasks (created elsewhere)
  useEffect(() => {
    const handler = () => {
      fetchPersonalTasks()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('personal_tasks_changed', handler as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('personal_tasks_changed', handler as EventListener)
      }
    }
  }, [fetchPersonalTasks])

  // Save settings when they change
  useEffect(() => {
    const settings = {
      work: workDurationMinutes,
      rest: restDurationMinutes,
      rounds: rounds,
      workInput: workDurationInput,
      restInput: restDurationInput,
      roundsInput: roundsInput,
      timeThresholdInput: timeThresholdInput
    }
    localStorage.setItem('tabataSettings', JSON.stringify(settings))
  }, [workDurationMinutes, restDurationMinutes, rounds, workDurationInput, restDurationInput, roundsInput, timeThresholdInput])



  // Convert minutes to seconds
  const workDuration = Math.round(workDurationMinutes * 60)
  const restDuration = Math.round(restDurationMinutes * 60)

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (isWorkPhase) {
              setTotalWorkTime((prevTotal) => prevTotal + workDuration)
              console.log('Work phase ended')
              playBeep()
              setIsBlinking(true)
              setTimeout(() => setIsBlinking(false), 5000)
              if (currentRound < rounds - 1) {
                setIsWorkPhase(false)
                return restDuration
              } else {
                setIsRunning(false)
                setIsCompleted(true)
                setCurrentRound(0)
                setIsWorkPhase(true)
                // Save to history
                const today = new Date().toDateString()
                setHistory((prevHistory) => {
                  const newHistory = prevHistory.filter((h) => h.date !== today)
                  newHistory.push({ date: today, time: totalWorkTime + workDuration })
                  localStorage.setItem('tabataHistory', JSON.stringify(newHistory))
                  return newHistory
                })
                playCompletionSound()
                return workDuration
              }
            } else {
              console.log('Rest phase ended')
              playBeep()
              setIsBlinking(true)
              setTimeout(() => setIsBlinking(false), 5000)
              setCurrentRound((prevRound) => prevRound + 1)
              setIsWorkPhase(true)
              return workDuration
            }
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isWorkPhase, currentRound, rounds, workDuration, restDuration, totalWorkTime])



  // local quick-task helpers removed (we now rely on `personal_tasks` from DB)

  // Delete a personal task (server-side)
  const handleDeletePersonalTask = async (id: string) => {
    if (!supabase) return
    try {
      const { error } = await supabase.from('personal_tasks').delete().eq('id', id)
      if (error) throw error
      setPersonalTasks((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      console.error('Failed to delete personal task', err)
    }
  }

  const handleCancelPersonalTask = async (id: string) => {
    if (!supabase) return
    try {
      const { error, data } = await supabase.from('personal_tasks').update({ status: 'canceled' }).eq('id', id).select().single()
      if (error) throw error
      setPersonalTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
    } catch (err) {
      console.error('Failed to cancel personal task', err)
    }
  }

  const handleCompletePersonalTask = async (id: string) => {
    if (!supabase) return
    try {
      const { error, data } = await supabase.from('personal_tasks').update({ status: 'completed', progress_percentage: 100 }).eq('id', id).select().single()
      if (error) throw error
      setPersonalTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
    } catch (err) {
      console.error('Failed to complete personal task', err)
    }
  }

  const playBeep = () => {
    if (isMuted) return
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log('Audio not supported')
    }
  }

  const playCompletionSound = () => {
    if (isMuted) return
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 600
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 1)
    } catch (error) {
      console.log('Audio not supported')
    }
  }

  const startStop = () => {
    if (isRunning) {
      setIsRunning(false)
      setTimerStartTime(null)
      localStorage.removeItem('tabataTimerStartTime')
      localStorage.removeItem('tabataTimerSettings')
    } else {
      if (!hasStarted) {
        setHasStarted(true)
        setCurrentRound(0)
        setIsWorkPhase(true)
        setTimeLeft(workDuration)
        // Save start time AND current settings when timer starts
        const startTime = Date.now()
        const timerSettings = {
          workDurationMinutes,
          restDurationMinutes,
          rounds,
          startTime
        }
        setTimerStartTime(startTime)
        localStorage.setItem('tabataTimerStartTime', startTime.toString())
        localStorage.setItem('tabataTimerSettings', JSON.stringify(timerSettings))
      }
      setIsRunning(true)
    }
  }

  const reset = () => {
    setIsRunning(false)
    setHasStarted(false)
    setCurrentRound(0)
    setIsWorkPhase(true)
    setTimeLeft(workDuration)
    setIsBlinking(false)
    setIsCompleted(false)
    setTimerStartTime(null)
    localStorage.removeItem('tabataTimerStartTime')
    localStorage.removeItem('tabataTimerSettings')
  }

  // Update numeric values from inputs
  useEffect(() => {
    const work = workDurationInput ? parseTimeInput(workDurationInput) : 25
    const rest = restDurationInput ? parseTimeInput(restDurationInput) : 5
    const r = roundsInput ? parseInt(roundsInput) : 4
    setWorkDurationMinutes(work)
    setRestDurationMinutes(rest)
    setRounds(r)
  }, [workDurationInput, restDurationInput, roundsInput])

  // Update time threshold from input
  useEffect(() => {
    const parsed = parseTimeInput(timeThresholdInput)
    setTimeThreshold(parsed)
  }, [timeThresholdInput])

  // Handle page visibility changes to maintain timer accuracy
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - record the current time
        setLastHiddenTime(Date.now())
      } else {
        // Page is visible again - adjust timer if it was running
        if (isRunning && lastHiddenTime) {
          const timeElapsed = Math.floor((Date.now() - lastHiddenTime) / 1000) // Convert to seconds

          // Simply subtract elapsed time from current timeLeft
          // The regular timer interval will handle any phase transitions
          setTimeLeft((prevTimeLeft) => Math.max(0, prevTimeLeft - timeElapsed))

          setLastHiddenTime(null)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isRunning, lastHiddenTime])

  return (
    <div className="p-4 bg-white">
      {/* <h1 className="text-3xl font-bold mb-2">Task Organizer</h1>
      <p className="text-gray-600 mb-6">Manage tasks for your goals</p> */}

      {/* Add new task */}
      {/* <div className="flex mb-6">
        <Input
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1 rounded-r-none"
        />
        <Button onClick={handleAddTask} className="rounded-l-none bg-purple-500 hover:bg-purple-600">
          <Plus className="h-5 w-5" />
        </Button>
      </div> */}

      {/* Task list (saved user goals + personal tasks + local quick tasks) */}
      <div className="space-y-4">
        {/* Saved tasks (personal_tasks) - render using TaskCard to preserve UI */}
        {personalTasks && personalTasks.length > 0 ? (
          <div className="grid gap-0">
            {personalTasks.filter((t) => t.status !== 'completed').map((t) => (
              <TaskCard key={t.id} goal={t} onUpdated={fetchPersonalTasks} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No saved tasks yet</div>
        )}

        {/* Personal tasks list removed here (deduplicated). Top list uses TaskCard and Completed section below shows completed tasks. */}

          {/* Completed tasks - collapsed by default */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Completed</h4>
              <Button size="sm" variant="ghost" onClick={() => setIsCompletedExpandedLocal(!isCompletedExpandedLocal)}>
                {isCompletedExpandedLocal ? 'Collapse' : 'Expand'}
              </Button>
            </div>

            {isCompletedExpandedLocal && (
              <div className="mt-2 space-y-2">
                {personalTasks.filter((t) => t.status === 'completed').map((task) => (
                  <TaskCard key={task.id} goal={task} onUpdated={fetchPersonalTasks} />
                ))}
              </div>
            )}
          </div>
      </div>

      {/* Tabata Timer */}
      <div className="mt-4 mx-0 bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 text-white">
          <div className="grid grid-cols-3 gap-3 h-full">
            {/* Left Container */}
            <div className="flex flex-col justify-between">
              <div className="space-y-1">
                <div className="text-sm opacity-90">Round {currentRound + 1} of {rounds}</div>
                <div className="text-lg font-medium">{isWorkPhase ? 'Work' : 'Rest'}</div>
                <div className="text-xs opacity-80">
                  Today: {Math.floor(totalWorkTime / 60)}:{(totalWorkTime % 60).toString().padStart(2, '0')} worked
                </div>
              </div>
              <div className="flex justify-start">
                <Button
                  onClick={startStop}
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-gray-100 rounded-full px-6 py-2 text-sm font-semibold shadow-lg"
                >
                  {isRunning ? 'Stop' : (hasStarted ? 'Continue' : 'Start')}
                </Button>
              </div>
            </div>

            {/* Center Container */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-base font-semibold mb-2">Tabata Timer</h2>

              {/* Timer with Circular Progress */}
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="6"
                    fill="none"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - (isWorkPhase ?
                      (workDuration - timeLeft) / Math.max(workDuration, 1) :
                      (restDuration - timeLeft) / Math.max(restDuration, 1)
                    ))}`}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>

                {/* Timer Display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`text-center transition-all duration-300 ${
                    isCompleted ? 'text-green-300' :
                    isBlinking ? 'text-red-300 animate-pulse' :
                    'text-white'
                  }`}>
                    <div className="text-3xl font-bold">
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Container */}
            <div className="flex flex-col items-end justify-between">
              <Button
                onClick={() => setIsMuted(!isMuted)}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 p-2 self-end"
              >
                {isMuted ? '🔇' : '🔊'}
              </Button>

              <div className="space-y-1">
                <div className="flex items-center justify-end space-x-2">
                  <label className="text-xs opacity-80 text-white">Work</label>
                  <Input
                    type="text"
                    value={workDurationInput}
                    onChange={(e) => setWorkDurationInput(e.target.value)}
                    placeholder={formatTime(workDurationMinutes)}
                    className="w-14 h-6 text-xs bg-white/20 border-white/30 text-white placeholder-white/70 rounded"
                    style={{ color: 'white' }}
                  />
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <label className="text-xs opacity-80 text-white">Rest</label>
                  <Input
                    type="text"
                    value={restDurationInput}
                    onChange={(e) => setRestDurationInput(e.target.value)}
                    placeholder={formatTime(restDurationMinutes)}
                    className="w-14 h-6 text-xs bg-white/20 border-white/30 text-white placeholder-white/70 rounded"
                    style={{ color: 'white' }}
                  />
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <label className="text-xs opacity-80 text-white">Rounds</label>
                  <Input
                    type="text"
                    value={roundsInput}
                    onChange={(e) => setRoundsInput(e.target.value)}
                    placeholder={rounds.toString()}
                    className="w-14 h-6 text-xs bg-white/20 border-white/30 text-white placeholder-white/70 rounded"
                    style={{ color: 'white' }}
                  />
                </div>
              </div>

              <Button
                onClick={reset}
                size="sm"
                className="bg-gray-600 text-white hover:bg-gray-700 rounded-full px-5 py-2 text-sm font-semibold"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* History Container */}
      <div className="mt-6 mx-0 bg-white rounded-3xl shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center justify-between">
          <span>History</span>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={timeThresholdInput}
              onChange={(e) => setTimeThresholdInput(e.target.value)}
              placeholder="1:25:00"
              className="w-20 h-8 text-xs bg-gray-100 border-gray-300 rounded"
            />
            <Button
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              size="sm"
              className="text-xs"
            >
              {isHistoryExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </h3>
        {isHistoryExpanded && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center text-gray-500 py-4">-----</div>
            ) : (
              history.slice().reverse().map((entry) => {
                const timeInMinutes = entry.time / 60
                const hours = Math.floor(timeInMinutes / 60)
                const minutes = Math.floor(timeInMinutes % 60)
                const seconds = Math.round((timeInMinutes % 1) * 60)
                const timeDisplay = hours > 0
                  ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                  : `${minutes}:${seconds.toString().padStart(2, '0')}`
                return (
                  <div key={entry.date} className={`flex justify-between items-center p-3 rounded-lg ${
                    timeInMinutes > timeThreshold ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <span className="text-sm font-medium">{entry.date}</span>
                    <span className="text-sm text-gray-600">
                      {timeDisplay}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
