"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useUser } from "@/components/UserContext"
import { toast } from "sonner"
import type { UserGoal } from "@/types/supabase"

type Subtask = { id: string; title: string; completed: boolean }
type Resource = { id: string; type: "link" | "text" | "image"; title?: string; content: string }

interface TaskEditorProps {
  open: boolean
  onClose: () => void
  onSuccess?: (created: UserGoal | null) => void
  initial?: Partial<UserGoal> & { subtasks?: Subtask[]; resources?: Resource[] }
}

export default function TaskEditor({ open, onClose, onSuccess, initial }: TaskEditorProps) {
  const { dbUser, refreshGoals } = useUser()
  const [title, setTitle] = useState(initial?.title || "")
  const [description, setDescription] = useState(initial?.description || "")
  const [subtasks, setSubtasks] = useState<Subtask[]>(initial?.subtasks || [])
  const [resources, setResources] = useState<Resource[]>(initial?.resources || [])
  const [isSaving, setIsSaving] = useState(false)
  const [isStreakTask, setIsStreakTask] = useState(false)
  const [totalStreakDays, setTotalStreakDays] = useState(30)

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "")
      setDescription(initial?.description || "")
      setSubtasks(initial?.subtasks || [])
      setResources(initial?.resources || [])
    }
  }, [open, initial])

  const addSubtask = () => {
    const id = Date.now().toString()
    setSubtasks((s) => [...s, { id, title: "", completed: false }])
  }

  const updateSubtask = (id: string, patch: Partial<Subtask>) => {
    setSubtasks((s) => s.map((st) => (st.id === id ? { ...st, ...patch } : st)))
  }

  const removeSubtask = (id: string) => setSubtasks((s) => s.filter((st) => st.id !== id))

  const addResource = () => {
    const id = Date.now().toString()
    setResources((r) => [...r, { id, type: "link", title: "", content: "" }])
  }

  const updateResource = (id: string, patch: Partial<Resource>) => {
    setResources((r) => r.map((res) => (res.id === id ? { ...res, ...patch } : res)))
  }

  const removeResource = (id: string) => setResources((r) => r.filter((res) => res.id !== id))

  const computeProgress = (subs: Subtask[]) => {
    if (!subs.length) return 0
    const done = subs.filter((s) => s.completed).length
    return Math.round((done / subs.length) * 100)
  }

  const handleSave = async () => {
    if (!dbUser?.id) {
      toast.error("Please log in to create a task")
      return
    }

    if (!title.trim()) {
      toast.error("Please enter a task title")
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClientSupabaseClient()

      const progress_percentage = computeProgress(subtasks)

      const payload: Partial<UserGoal> = {
        user_id: dbUser.id,
        title: title.trim(),
        description: description || undefined,
        image_url: initial?.image_url ?? undefined,
        estimated_cost: initial?.estimated_cost ?? undefined,
        difficulty_level: initial?.difficulty_level ?? undefined,
        status: "not_started",
        progress_percentage: progress_percentage,
        steps: subtasks.map((s) => s.title || ""),
        progress_details: {
          subtasks,
          resources,
        },
      }

      // Insert into personal_tasks table (JSON fields for subtasks/resources)
      // If initial provided an image_url, include it as a resource (unless already present)
      const finalResources = [...resources]
      if (initial?.image_url) {
        const exists = finalResources.some((r) => r.type === 'image' && r.content === initial.image_url)
        if (!exists) {
          finalResources.unshift({ id: `img_${Date.now()}`, type: 'image', title: 'Image', content: initial.image_url })
        }
      }

      const insertPayload = {
        user_id: dbUser.id,
        title: payload.title,
        description: payload.description ?? null,
        subtasks: subtasks,
        resources: finalResources,
        status: 'open',
        progress_percentage: progress_percentage,
        is_streak_task: isStreakTask,
        total_streak_days: isStreakTask ? totalStreakDays : 0,
        current_streak_days: 0,
      }

      const { data, error } = await supabase.from('personal_tasks').insert([insertPayload]).select().single()

      if (error) {
        console.error("Error creating personal task:", error)
        toast.error(error.message || "Failed to create task")
      } else {
        toast.success("Task created")
        // notify other components to reload personal tasks
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('personal_tasks_changed', { detail: { task: data } }))
          }
        } catch (e) {
          // ignore
        }
        await refreshGoals()
        onSuccess && onSuccess(data as any)
        onClose()
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to create task")
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="sm" onClick={onClose} className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <h3 className="text-lg font-semibold">Create Task</h3>
        <div className="w-16"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <Input placeholder="Enter task title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Textarea placeholder="Enter task description" value={description || ""} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Checklist</h4>
              <Button size="sm" onClick={addSubtask}>Add Item</Button>
            </div>
            <div className="space-y-2">
              {subtasks.map((st) => (
                <div key={st.id} className="flex gap-2 items-center">
                  <input type="checkbox" checked={st.completed} onChange={(e) => updateSubtask(st.id, { completed: e.target.checked })} />
                  <Input value={st.title} onChange={(e) => updateSubtask(st.id, { title: e.target.value })} className="flex-1" />
                  <Button variant="ghost" size="sm" onClick={() => removeSubtask(st.id)}>Remove</Button>
                </div>
              ))}
              {!subtasks.length && <div className="text-sm text-gray-500">No subtasks yet</div>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Resources</h4>
              <Button size="sm" onClick={addResource}>Add Resource</Button>
            </div>
            <div className="space-y-2">
              {resources.map((res) => (
                <div key={res.id} className="flex gap-2 items-center">
                  <select value={res.type} onChange={(e) => updateResource(res.id, { type: e.target.value as any })}>
                    <option value="link">Link</option>
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                  </select>
                  <Input value={res.title || ""} placeholder="Title (optional)" onChange={(e) => updateResource(res.id, { title: e.target.value })} />
                  <Input value={res.content} placeholder="URL or text" onChange={(e) => updateResource(res.id, { content: e.target.value })} className="flex-1" />
                  <Button variant="ghost" size="sm" onClick={() => removeResource(res.id)}>Remove</Button>
                </div>
              ))}
              {!resources.length && <div className="text-sm text-gray-500">No resources yet</div>}
            </div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-orange-800">Daily Streak Task</h4>
              <Switch checked={isStreakTask} onCheckedChange={setIsStreakTask} />
            </div>
            {isStreakTask && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-orange-700">Total days:</label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={totalStreakDays}
                    onChange={(e) => setTotalStreakDays(parseInt(e.target.value) || 30)}
                    className="w-20"
                  />
                </div>
                <p className="text-xs text-orange-600">
                  Mark this task as completed each day for {totalStreakDays} consecutive days.
                  You can only mark one day per calendar day.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? "Saving..." : "Save Task"}
          </Button>
        </div>
      </div>
    </div>
  )
}
