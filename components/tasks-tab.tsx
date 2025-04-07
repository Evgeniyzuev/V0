"use client"

import { useState } from "react"
import { Calendar, Clock, Tag, ChevronDown, ChevronUp, Check } from "lucide-react"

// Sample task data with images
const sampleTasks = [
  {
    id: 1,
    title: "Research online piano courses",
    completed: true,
    date: "Jun 15",
    time: "09:00 AM",
    priority: "Medium",
    priorityColor: "text-amber-500",
    description: "Find at least 3 reputable online piano courses that offer beginner to intermediate lessons.",
    imageUrl: "/placeholder.svg?height=200&width=300",
    notes: "Look for courses that include music theory and offer certificates upon completion.",
  },
  {
    id: 2,
    title: "Set up weekly practice schedule",
    completed: false,
    date: "Jun 20",
    time: "09:00 AM",
    priority: "High",
    priorityColor: "text-red-500",
    description: "Create a consistent weekly schedule for piano practice sessions.",
    imageUrl: "/placeholder.svg?height=200&width=300",
    notes: "Aim for at least 30 minutes of practice 5 days a week.",
  },
  {
    id: 3,
    title: "Research Japan visa requirements",
    completed: false,
    date: "Jul 1",
    time: "09:00 AM",
    priority: "Medium",
    priorityColor: "text-amber-500",
    description: "Gather information about tourist visa requirements for Japan.",
    imageUrl: "/placeholder.svg?height=200&width=300",
    notes: "Check if there are any COVID-related entry restrictions still in place.",
  },
  {
    id: 4,
    title: "Start saving ¥10,000 per month",
    completed: false,
    date: "Jun 30",
    time: "09:00 AM",
    priority: "High",
    priorityColor: "text-red-500",
    description: "Set up automatic transfers to savings account for Japan trip.",
    imageUrl: "/placeholder.svg?height=200&width=300",
    notes: "Consider opening a separate savings account specifically for travel funds.",
  },
  {
    id: 5,
    title: "Create business plan draft",
    completed: false,
    date: "Aug 15",
    time: "09:00 AM",
    priority: "Low",
    priorityColor: "text-blue-500",
    description: "Draft initial business plan for passive income project.",
    imageUrl: "/placeholder.svg?height=200&width=300",
    notes: "Include market analysis, financial projections, and marketing strategy.",
  },
]

export default function TasksTab() {
  const [activeTab, setActiveTab] = useState("all")
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [tasks, setTasks] = useState(sampleTasks)

  const toggleTaskExpansion = (taskId: number) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null)
    } else {
      setExpandedTaskId(taskId)
    }
  }

  const toggleTaskCompletion = (taskId: number) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
  }

  const filteredTasks = () => {
    switch (activeTab) {
      case "today":
        return tasks.filter((task) => task.date === "Jun 15") // Just for demo
      case "upcoming":
        return tasks.filter((task) => !task.completed)
      case "completed":
        return tasks.filter((task) => task.completed)
      default:
        return tasks
    }
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
          <div key={task.id} className="border-b">
            {/* Task header */}
            <div className="flex items-start p-4 cursor-pointer" onClick={() => toggleTaskExpansion(task.id)}>
              <button
                className={`flex-shrink-0 w-6 h-6 rounded-full border ${
                  task.completed ? "bg-purple-500 border-purple-500 text-white" : "bg-white border-gray-300"
                } flex items-center justify-center mr-3 mt-1`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleTaskCompletion(task.id)
                }}
              >
                {task.completed && <Check className="h-4 w-4" />}
              </button>

              <div className="flex-1">
                <h3 className={`text-base ${task.completed ? "line-through text-gray-500" : "text-gray-800"}`}>
                  {task.title}
                </h3>

                <div className="flex flex-wrap items-center mt-1 text-xs text-gray-500">
                  <div className="flex items-center mr-3">
                    <Calendar className="h-3 w-3 mr-1" />
                    {task.date}
                  </div>
                  <div className="flex items-center mr-3">
                    <Clock className="h-3 w-3 mr-1" />
                    {task.time}
                  </div>
                  <div className={`flex items-center ${task.priorityColor}`}>
                    <Tag className="h-3 w-3 mr-1" />
                    {task.priority}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 ml-2">
                {expandedTaskId === task.id ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded task details */}
            {expandedTaskId === task.id && (
              <div className="px-4 pb-4 pt-0">
                <div className="ml-9">
                  <div className="mb-3">
                    <p className="text-sm text-gray-700">{task.description}</p>
                  </div>

                  {task.imageUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden">
                      <img src={task.imageUrl || "/placeholder.svg"} alt={task.title} className="w-full h-auto" />
                    </div>
                  )}

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

