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
  const [workDurationMinutes, setWorkDurationMinutes] = useState(0.33) // 20 seconds in minutes
  const [restDurationMinutes, setRestDurationMinutes] = useState(0.17) // 10 seconds in minutes
  const [rounds, setRounds] = useState(8)
  const [isRunning, setIsRunning] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [currentRound, setCurrentRound] = useState(0)
  const [isWorkPhase, setIsWorkPhase] = useState(true)
  const [timeLeft, setTimeLeft] = useState(20) // in seconds
  const [totalWorkTime, setTotalWorkTime] = useState(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isBlinking, setIsBlinking] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tabataHistory')
    if (saved) {
      const hist: HistoryEntry[] = JSON.parse(saved)
      setHistory(hist)
      const today = new Date().toDateString()
      const todayEntry = hist.find((h) => h.date === today)
      if (todayEntry) setTotalWorkTime(todayEntry.time)
    }
  }, [])

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
    const work = workDurationInput ? parseFloat(workDurationInput) : 0.33
    const rest = restDurationInput ? parseFloat(restDurationInput) : 0.17
    const r = roundsInput ? parseInt(roundsInput) : 8
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
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Tabata Timer</h2>

        {/* Configuration */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Work (min)</label>
            <Input
              type="text"
              value={workDurationInput}
              onChange={(e) => setWorkDurationInput(e.target.value)}
              placeholder="0.33"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rest (min)</label>
            <Input
              type="text"
              value={restDurationInput}
              onChange={(e) => setRestDurationInput(e.target.value)}
              placeholder="0.17"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rounds</label>
            <Input
              type="text"
              value={roundsInput}
              onChange={(e) => setRoundsInput(e.target.value)}
              placeholder="8"
            />
          </div>
        </div>

        {/* Timer Display */}
        <div className={`text-center mb-6 p-4 rounded-lg transition-colors duration-200 ${
          isCompleted ? 'bg-green-100' :
          isBlinking ? 'bg-red-100 animate-pulse' :
          'bg-transparent'
        }`}>
          <div className="text-6xl font-bold mb-2">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-lg mb-1">Round {currentRound + 1} / {rounds}</div>
          <div className="text-lg font-semibold">{isWorkPhase ? 'Work' : 'Rest'}</div>
        </div>

        {/* Controls */}
        <div className="text-center mb-6 space-x-4">
          <Button onClick={startStop} size="lg" className="px-8">
            {isRunning ? 'Stop' : (hasStarted ? 'Continue' : 'Start')}
          </Button>
          <Button onClick={reset} variant="outline" size="lg" className="px-8">
            Reset
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Total work time today: {Math.floor(totalWorkTime / 60)}:{(totalWorkTime % 60).toString().padStart(2, '0')}
          </p>
        </div>

        {/* History */}
        <div>
          <h3 className="text-lg font-semibold mb-2">History</h3>
          <div className="space-y-1">
            {history.map((entry) => (
              <div key={entry.date} className="text-sm text-gray-600">
                {entry.date}: {Math.floor(entry.time / 60)}:{(entry.time % 60).toString().padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
