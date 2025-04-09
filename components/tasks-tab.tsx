"use client"

import { useState, useEffect } from "react"
import { Calendar, Tag, ChevronDown, ChevronUp, Check } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

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
  due_date: string | null
  notes: string
}

export default function TasksTab() {
  const [activeTab, setActiveTab] = useState("all")
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [])

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

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading tasks...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">{error}</div>
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
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
            {/* Task header */}
            <div className="flex items-start p-4 cursor-pointer" onClick={() => toggleTaskExpansion(task.number)}>
              <img
                src={task.icon_url || "/placeholder.svg"}
                alt={task.title}
                className="flex-shrink-0 w-8 h-8 rounded-full object-cover mr-3 mt-1"
              />

              <div className="flex-1">
                <h3 className="text-base text-gray-800">
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

              <div className="flex-shrink-0 ml-2">
                {expandedTaskId === task.number ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
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

