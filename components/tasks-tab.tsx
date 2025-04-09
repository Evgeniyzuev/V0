"use client"

import { useState, useEffect } from "react"
import { Calendar, Tag, ChevronDown, ChevronUp, Check, User } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { useUser } from "@/components/UserContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { Dialog, DialogContent } from "@/components/ui/dialog"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Task = {
  number: number
  title: string
  reward: number
  icon_url: string
  description: string
  completion_condition: string
  due_date: string | null
  notes: string
}

export default function TasksTab() {
  const { dbUser, isLoading: isUserLoading, refreshUserData } = useUser()

  const [activeTab, setActiveTab] = useState("all")
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showResult, setShowResult] = useState<{success: boolean, message: string} | null>(null)

  useEffect(() => {
    if (dbUser?.id) {
      fetchTasks()
    } else if (!isUserLoading) {
      setLoading(false)
    }
  }, [dbUser, isUserLoading])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("number", { ascending: true })

      if (error) {
        console.error("Error fetching tasks:", error)
        setError("Failed to fetch tasks. Please try again later.")
      } else {
        setTasks(data || [])
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const toggleTaskExpansion = (taskNumber: number) => {
    if (expandedTaskId === taskNumber) {
      setExpandedTaskId(null)
    } else {
      setExpandedTaskId(taskNumber)
    }
  }

  const handleTaskVerification = async (taskNumber: number) => {
    // Обработка только для задания №1
    if (taskNumber !== 1) {
      setStatusMessage({
        type: 'error',
        text: 'Только задание №1 может быть проверено в данный момент'
      })
      setTimeout(() => setStatusMessage(null), 3000)
      return
    }

    // Проверка авторизации
    if (!dbUser?.id) {
      setShowResult({
        success: false,
        message: "Для выполнения этого задания необходимо авторизоваться"
      })
      return
    }

    try {
      // Проверяем существование задания
      const { data: existingTask } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", dbUser.id)
        .eq("task_id", taskNumber)
        .single()

      let result
      
      if (existingTask) {
        // Обновляем существующее задание
        result = await supabase
          .from("user_tasks")
          .update({
            status: "completed",
            current_step_index: existingTask.current_step_index + 1,
            progress_details: {
              ...existingTask.progress_details,
              [`step_${existingTask.current_step_index}_completed`]: true,
              last_attempt_message: "Задание успешно выполнено"
            }
          })
          .eq("id", existingTask.id)
      } else {
        // Создаем новую запись о задании
        result = await supabase
          .from("user_tasks")
          .insert({
            user_id: dbUser.id,
            task_id: taskNumber,
            status: "completed",
            current_step_index: 1,
            progress_details: {
              step_0_completed: true,
              last_attempt_message: "Задание успешно выполнено"
            }
          })
      }

      if (result.error) {
        throw result.error
      }

      // Добавляем награду пользователю
      const { data: taskData } = await supabase
        .from("tasks")
        .select("reward")
        .eq("number", taskNumber)
        .single()

      if (taskData?.reward) {
        await supabase
          .from("users")
          .update({
            wallet_balance: (dbUser.wallet_balance || 0) + taskData.reward
          })
          .eq("id", dbUser.id)
      }
      
      // Обновляем данные пользователя
      await refreshUserData()
      
      // Показываем окно поздравления
      setShowResult({
        success: true,
        message: `Поздравляем! Вы успешно выполнили задание #1 и получили вознаграждение ${taskData?.reward || 0}$`
      })
      
    } catch (err) {
      console.error("Error completing task:", err)
      setShowResult({
        success: false,
        message: "Не удалось выполнить задание. Попробуйте еще раз."
      })
    }
  }

  const closeResultDialog = () => {
    setShowResult(null)
  }

  const filteredTasks = () => {
    switch (activeTab) {
      case "today":
        const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
        return tasks.filter((task) => task.due_date === today)
      case "upcoming":
        return tasks.filter((task) => !task.due_date)
      case "completed":
        return tasks.filter((task) => task.due_date)
      default:
        return tasks
    }
  }

  if (isUserLoading) {
    return <div className="flex items-center justify-center h-full">Loading user data...</div>
  }

  if (!dbUser?.id) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center flex flex-col items-center gap-4">
              <h3 className="text-lg font-medium">Access to Tasks</h3>
              <p className="text-gray-500 mb-4">To access your tasks, please log in to the system</p>
              <Avatar className="h-20 w-20 mx-auto mb-2">
                <AvatarFallback>
                  <User className="h-10 w-10 text-gray-400" />
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

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading tasks...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">{error}</div>
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Status Message */}
      {statusMessage && (
        <div className={`p-3 text-sm ${
          statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        } transition-opacity duration-500`}>
          {statusMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-2 bg-white border-b overflow-x-auto">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium mr-2 ${
            activeTab === "all" ? "bg-purple-500 text-white" : "bg-white text-gray-700"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All Tasks
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium mr-2 ${
            activeTab === "today" ? "bg-purple-500 text-white" : "bg-white text-gray-700"
          }`}
          onClick={() => setActiveTab("today")}
        >
          Today
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium mr-2 ${
            activeTab === "upcoming" ? "bg-purple-500 text-white" : "bg-white text-gray-700"
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            activeTab === "completed" ? "bg-purple-500 text-white" : "bg-white text-gray-700"
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks().map((task) => (
          <div key={task.number} className="border-b">
            {/* Task header - Modified to include button */}
            <div className="flex items-center p-4">
              {/* Icon */}
              <img
                src={task.icon_url || "/placeholder.svg"}
                alt={task.title}
                className="flex-shrink-0 w-8 h-8 rounded-full object-cover mr-3"
              />

              {/* Title and Meta (Takes remaining space) */}
              <div className="flex-1 min-w-0 mr-4" onClick={() => toggleTaskExpansion(task.number)} style={{ cursor: 'pointer' }}>
                <h3 className="text-base text-gray-800 truncate">
                  {task.title}
                </h3>
                <div className="flex flex-wrap items-center mt-1 text-xs text-gray-500">
                  <div className="flex items-center mr-3">
                    <Calendar className="h-3 w-3 mr-1" />
                    {task.due_date || ""}
                  </div>
                  <div className="flex items-center text-green-500">
                    <Tag className="h-3 w-3 mr-1" />
                    {task.reward}$
                  </div>
                </div>
              </div>

              {/* Actions (Button and Chevron) */}
              <div className="flex items-center flex-shrink-0 ml-2 space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => { 
                      e.stopPropagation(); // Prevent expansion toggle when clicking button
                      handleTaskVerification(task.number);
                     }}
                  >
                    Check
                  </Button>
                  <div onClick={() => toggleTaskExpansion(task.number)} style={{ cursor: 'pointer' }}>
                    {expandedTaskId === task.number ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
              </div>
            </div>

            {/* Expanded task details */}
            {expandedTaskId === task.number && (
              <div className="px-4 pb-4 pt-0">
                <div className="ml-11">
                  <div className="mb-3">
                    <p className="text-sm text-gray-700">{task.description}</p>
                  </div>

                  {task.notes && (
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Notes:</h4>
                      <p className="text-xs text-gray-600">{task.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Task result dialog */}
      <Dialog open={showResult !== null} onOpenChange={(open) => !open && closeResultDialog()}>
        <DialogContent className="sm:max-w-md">
          {showResult && (
            <div className="p-4">
              <div className={`p-4 rounded-lg ${
                showResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className={`text-lg font-medium mb-2 ${
                  showResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {showResult.success ? 'Задание выполнено!' : 'Задание не выполнено'}
                </h3>
                <p className={`text-sm ${
                  showResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {showResult.message}
                </p>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button onClick={closeResultDialog}>
                  OK
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

