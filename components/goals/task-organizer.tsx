"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

type HistoryEntry = {
  date: string
  time: number
}

// Sample tasks data
const initialTasks = [
  {
    id: 1,
    title: "Research online piano courses",
    completed: true,
    date: "Jun 15",
  },
  {
    id: 2,
    title: "Set up weekly practice schedule",
    completed: false,
    date: "Jun 20",
  },
  {
    id: 3,
    title: "Research Japan visa requirements",
    completed: false,
    date: "Jul 1",
  },
  {
    id: 4,
    title: "Start saving ¥10,000 per month",
    completed: false,
    date: "Jun 30",
  },
  {
    id: 5,
    title: "Create business plan draft",
    completed: false,
    date: "Aug 15",
  },
]

export default function TaskOrganizer() {
  const [tasks, setTasks] = useState(initialTasks)
  const [newTaskTitle, setNewTaskTitle] = useState("")

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
    if (parts.length === 2) {
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
  const [timeLeft, setTimeLeft] = useState(20) // in seconds
  const [totalWorkTime, setTotalWorkTime] = useState(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isBlinking, setIsBlinking] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Load settings and history from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('tabataSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setWorkDurationMinutes(settings.work || 25)
      setRestDurationMinutes(settings.rest || 5)
      setRounds(settings.rounds || 4)
      // Set input values if they exist in settings
      if (settings.workInput) setWorkDurationInput(settings.workInput)
      if (settings.restInput) setRestDurationInput(settings.restInput)
      if (settings.roundsInput) setRoundsInput(settings.roundsInput)
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

  // Save settings when they change
  useEffect(() => {
    const settings = {
      work: workDurationMinutes,
      rest: restDurationMinutes,
      rounds: rounds,
      workInput: workDurationInput,
      restInput: restDurationInput,
      roundsInput: roundsInput
    }
    localStorage.setItem('tabataSettings', JSON.stringify(settings))
  }, [workDurationMinutes, restDurationMinutes, rounds, workDurationInput, restDurationInput, roundsInput])

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

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return

    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      completed: false,
      date: "Jun 30", // Default date for demo
    }

    setTasks([...tasks, newTask])
    setNewTaskTitle("")
  }

  const handleToggleComplete = (taskId: number) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
  }

  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
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
    } else {
      if (!hasStarted) {
        setHasStarted(true)
        setCurrentRound(0)
        setIsWorkPhase(true)
        setTimeLeft(workDuration)
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

  return (
    <div className="p-4 bg-white">
      <h1 className="text-3xl font-bold mb-2">Task Organizer</h1>
      <p className="text-gray-600 mb-6">Manage tasks for your goals</p>

      {/* Add new task */}
      <div className="flex mb-6">
        <Input
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1 rounded-r-none"
        />
        <Button onClick={handleAddTask} className="rounded-l-none bg-purple-500 hover:bg-purple-600">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <button
                className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${
                  task.completed ? "bg-purple-500 border-purple-500 text-white" : "bg-white border-gray-300"
                }`}
                onClick={() => handleToggleComplete(task.id)}
              >
                {task.completed && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>

              <span className={task.completed ? "line-through text-gray-500" : ""}>{task.title}</span>
            </div>

            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-3">{task.date}</span>
              <button className="text-gray-400 hover:text-red-500" onClick={() => handleDeleteTask(task.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
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
        <h3 className="text-lg font-semibold mb-3 text-center">Workout History</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No workouts yet</div>
          ) : (
            history.map((entry) => (
              <div key={entry.date} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">{entry.date}</span>
                <span className="text-sm text-gray-600">
                  {Math.floor(entry.time / 60)}:{(entry.time % 60).toString().padStart(2, '0')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
