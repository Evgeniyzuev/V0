"use client"

import { useState, useEffect } from "react"
import { Calendar, Tag, ChevronDown, ChevronUp, Check, User } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { useUser } from "@/components/UserContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import TaskUpdater from "@/components/TaskUpdater"
import { useTaskVerification } from '@/hooks/useTaskVerification'

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
  status: string
}

export default function TasksTab() {
  const { dbUser, isLoading: isUserLoading, refreshUserData } = useUser()

  const [activeTab, setActiveTab] = useState("new")
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const { verifying, handleTaskVerification } = useTaskVerification({
    dbUser,
    refreshUserData,
    setStatusMessage,
  })

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

      if (!dbUser?.id) {
        setError("User ID is missing")
        return
      }

      // First, get the user's tasks with their status
      const { data: userTasks, error: userTasksError } = await supabase
        .from("user_tasks")
        .select("task_number, status")
        .eq("user_id", dbUser.id)
        .order("task_number", { ascending: true })

      if (userTasksError) {
        console.error("Error fetching user tasks:", userTasksError)
        setError("Failed to fetch tasks. Please try again later.")
        return
      }

      if (!userTasks || userTasks.length === 0) {
        setTasks([])
        return
      }

      // Get the task details for all task numbers
      const taskNumbers = userTasks.map(ut => ut.task_number)
      const { data: taskDetails, error: taskDetailsError } = await supabase
        .from("tasks")
        .select("number, title, reward, icon_url, description, completion_condition, due_date, notes")
        .in("number", taskNumbers)

      if (taskDetailsError) {
        console.error("Error fetching task details:", taskDetailsError)
        setError("Failed to fetch task details. Please try again later.")
        return
      }

      // Combine the user tasks with their details
      const formattedTasks = userTasks.map(userTask => {
        const taskDetail = taskDetails?.find(td => td.number === userTask.task_number)
        if (!taskDetail) return null

        return {
          number: taskDetail.number,
          title: taskDetail.title,
          reward: taskDetail.reward,
          icon_url: taskDetail.icon_url,
          description: taskDetail.description,
          completion_condition: taskDetail.completion_condition,
          due_date: taskDetail.due_date,
          notes: taskDetail.notes,
          status: userTask.status
        }
      }).filter((task): task is Task => task !== null)
      
      setTasks(formattedTasks)
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

  const filteredTasks = () => {
    switch (activeTab) {
      case "new":
        return tasks.filter((task) => 
          task.status === "assigned" || task.status === "in_progress"
        )
      case "completed":
        return tasks.filter((task) => task.status === "completed")
      default:
        return tasks.filter((task) => 
          task.status === "assigned" || task.status === "in_progress"
        )
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
      
      {/* Tabs and TaskUpdater */}
      <div className="flex items-center justify-between p-2 bg-white border-b">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeTab === "new" ? "bg-purple-500 text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => setActiveTab("new")}
          >
            New
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
        <TaskUpdater />
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
                    disabled={verifying}
                  >
                    {verifying ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800 mr-2"></span>
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
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
    </div>
  )
}
