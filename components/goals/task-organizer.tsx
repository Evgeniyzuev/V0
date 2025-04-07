"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

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
    </div>
  )
}

