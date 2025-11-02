"use client"

import { useState, useEffect } from "react"
import { Calendar, Tag, ChevronDown, ChevronUp, Check, User, Trophy, X } from "lucide-react"
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

type Challenge = {
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

export default function ChallengesTab() {
  const { dbUser, isLoading: isUserLoading, refreshUserData, goals } = useUser()
  const { levelUpModal, handleLevelUpModalClose, levelThresholds } = useLevelCheck()

  const [activeTab, setActiveTab] = useState("new")
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [tasks, setTasks] = useState<Challenge[]>([])
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
  const [selectedTask, setSelectedTask] = useState<Challenge | null>(null)

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
        setError("Failed to fetch challenges. Please try again later.")
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
        // Sort tasks by number (id) in ascending order
        transformedTasks.sort((a, b) => a.number - b.number)
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
              <h3 className="text-lg font-medium">Access to Challenges</h3>
              <p className="text-gray-500 mb-4">To access your challenges, please log in to the system</p>
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
    return <div className="flex items-center justify-center h-full">Loading challenges...</div>
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
              Challenge Completed!
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">Congratulations!</p>
              <p className="text-gray-600">
                You've successfully completed Challenge {completionModal?.taskNumber}
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

      {/* Search Bar and Controls in one narrow line */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* New/Completed tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("new")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "new" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              New ({tasks.filter((task) => task.status === 'assigned' || task.status === 'in_progress').length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "completed" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Completed ({tasks.filter((task) => task.status === 'completed').length})
            </button>
          </div>

          {/* TaskUpdater */}
          <TaskUpdater onUpdate={fetchTasks} />
        </div>
      </div>

      {/* Task Grid - Tile Layout */}
      <div className="p-4 pb-20">
        <div className="grid grid-cols-3 gap-1">
          {filteredTasks().map((task) => (
            <div
              key={task.number}
              className="image-item animate-fade-in rounded overflow-hidden shadow-md aspect-square cursor-pointer"
              onClick={() => setSelectedTask(task)}
            >
              <div className="relative w-full h-full">
                <img
                  src={task.icon_url || "/placeholder.svg"}
                  alt={task.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                  <div className="p-3 text-white">
                    <div className="text-sm font-medium line-clamp-2">{task.title}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <img
                  src={selectedTask.icon_url || "/placeholder.svg"}
                  alt={selectedTask.title}
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => setSelectedTask(null)}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedTask.title}</h2>
                    <p className="text-gray-600">{selectedTask.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedTask.status !== 'completed' && (
                      <Button
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskVerification(selectedTask.number, goals);
                          setSelectedTask(null);
                        }}
                        disabled={verifying}
                      >
                        {verifying ? (
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Check Challenge
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium mr-1">Assigned:</span>
                    {selectedTask.assigned_at ? new Date(selectedTask.assigned_at).toLocaleDateString() : "Not started"}
                  </div>

                  <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-green-600" />
                    <span className="font-medium mr-1">Reward:</span>
                    ${selectedTask.reward}
                  </div>

                  <div className="flex items-center">
                    <span className="font-medium mr-1">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedTask.status === 'completed' ? 'bg-green-100 text-green-700' :
                      selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedTask.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                {selectedTask.current_step_index !== null && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-500">
                        {selectedTask.current_step_index + 1} of {selectedTask.steps_total || '?'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(selectedTask.current_step_index / (selectedTask.steps_total || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedTask.notes && (
                  <div>
                    <h4 className="font-medium mb-2 text-gray-700">Notes</h4>
                    <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                      {selectedTask.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
