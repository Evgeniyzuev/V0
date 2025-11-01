"use client"

import { useState, useEffect } from "react"
import { Calendar, Tag, ChevronDown, ChevronUp, Check, User, Trophy } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useUser } from "@/components/UserContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Link from "next/link"
import TaskUpdater from "@/components/TaskUpdater"
import { useTaskVerification } from '@/hooks/useTaskVerification'
import { useLevelCheck } from '@/hooks/useLevelCheck'

// Initialize Supabase client
const supabase = createClientSupabaseClient();

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
  assigned_at: string
  current_step_index: number
  progress_details: string
  steps_total?: number
}

export default function TasksTab() {
  const { dbUser, isLoading: isUserLoading, refreshUserData, goals } = useUser()
  const { levelUpModal, handleLevelUpModalClose, levelThresholds } = useLevelCheck()

  const [activeTab, setActiveTab] = useState("new")
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [completionModal, setCompletionModal] = useState<{
    isOpen: boolean;
    taskNumber: number;
    reward: number;
    oldCore?: number;
    newCore?: number;
  } | null>(null)

  const { verifying, handleTaskVerification, verifyTask }: { verifying: boolean; handleTaskVerification: (taskNumber: number, currentGoals: any[] | null) => Promise<void>; verifyTask: (taskNumber: number) => void } = useTaskVerification({
    dbUser,
    refreshUserData,
    setStatusMessage,
    onTaskComplete: (taskNumber: number, reward: number, oldCore: number, newCore: number) => {
      setCompletionModal({
        isOpen: true,
        taskNumber,
        reward,
        oldCore,
        newCore
      });
    }
  })

  useEffect(() => {
    if (dbUser?.id) {
      fetchTasks()
    } else if (!isUserLoading) {
      setLoading(false)
    }
  }, [dbUser?.id, isUserLoading])

  const fetchTasks = async () => {
    if (!dbUser?.id) return;
    
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("user_tasks")
        .select(`
          *,
          task:tasks(*)
        `)
        .eq("user_id", dbUser.id)
        .order("assigned_at", { ascending: false })

      if (error) {
        console.error("Error fetching tasks:", error)
        setError("Failed to fetch tasks. Please try again later.")
      } else {
        // Transform the data to match the Task interface
        const transformedTasks = data.map(userTask => ({
          ...userTask.task,
          status: userTask.status,
          assigned_at: userTask.assigned_at,
          current_step_index: userTask.current_step_index,
          progress_details: userTask.progress_details,
          steps_total: userTask.task.steps_total
        }))
        setTasks(transformedTasks)
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
      case "new":
        return tasks.filter((task) => task.status === 'assigned' || task.status === 'in_progress')
      case "completed":
        return tasks.filter((task) => task.status === 'completed')
      default:
        return tasks.filter((task) => task.status === 'assigned' || task.status === 'in_progress')
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
    <div className="min-h-screen bg-gray-50 mobile-container">
      {/* Status Message */}
      {statusMessage && (
        <div className={`p-3 text-sm ${
          statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        } transition-opacity duration-500`}>
          {statusMessage.text}
        </div>
      )}

      {/* Completion Modal */}
      <Dialog open={completionModal?.isOpen} onOpenChange={(open) => {
        if (!open) {
          setCompletionModal(null);
          fetchTasks(); // Refresh tasks when closing the modal
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Task Completed!
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">Congratulations!</p>
              <p className="text-gray-600">
                You've successfully completed Task {completionModal?.taskNumber}
              </p>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-700 mb-2">Rewards:</p>
                <div className="flex justify-center items-center gap-2 text-2xl font-bold text-purple-700">
                  +${completionModal?.reward}
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">Core Progress:</p>
                <div className="flex justify-center items-center gap-2">
                  <span className="text-xl text-blue-700">${completionModal?.oldCore || 0}</span>
                  <ChevronUp className="h-6 w-6 text-green-500" />
                  <span className="text-2xl font-bold text-blue-700">${completionModal?.newCore || 0}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => {
                setCompletionModal(null);
                fetchTasks(); // Refresh tasks when clicking Continue
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
        {/* Task Categories Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* New Tasks */}
          <button
            onClick={() => setActiveTab("new")}
            className={`bg-white rounded-xl p-4 text-left border border-gray-200 hover:bg-gray-50 transition-all ${
              activeTab === "new" ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📋</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {tasks.filter((task) => task.status === 'assigned' || task.status === 'in_progress').length}
              </span>
            </div>
            <div className="text-sm text-gray-600 font-medium">New Tasks</div>
          </button>

          {/* Completed Tasks */}
          <button
            onClick={() => setActiveTab("completed")}
            className={`bg-white rounded-xl p-4 text-left border border-gray-200 hover:bg-gray-50 transition-all ${
              activeTab === "completed" ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {tasks.filter((task) => task.status === 'completed').length}
              </span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Completed</div>
          </button>
        </div>

        {/* TaskUpdater */}
        <div className="flex justify-center">
          <TaskUpdater onUpdate={fetchTasks} />
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {filteredTasks().map((task) => (
            <div key={task.number} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Full-width circular image */}
              <div className="relative w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img
                    src={task.icon_url || "/placeholder.svg"}
                    alt={task.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Task content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {task.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {task.assigned_at ? new Date(task.assigned_at).toLocaleDateString() : "Not started"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        ${task.reward}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {task.status !== 'completed' && (
                      <Button
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskVerification(task.number, goals);
                        }}
                        disabled={verifying}
                      >
                        {verifying ? (
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Check
                          </>
                        )}
                      </Button>
                    )}
                    <button
                      onClick={() => toggleTaskExpansion(task.number)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      {expandedTaskId === task.number ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {task.description}
                </p>

                {/* Progress bar */}
                {task.current_step_index !== null && (
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-500">
                        {task.current_step_index + 1} of {task.steps_total || '?'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(task.current_step_index / (task.steps_total || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Expanded details */}
                {expandedTaskId === task.number && (
                  <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                    {task.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {task.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
