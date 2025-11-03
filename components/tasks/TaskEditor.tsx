"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

      const { error } = await supabase.from("user_goals").insert([payload])

      if (error) {
        console.error("Error creating task (user_goal):", error)
        toast.error(error.message || "Failed to create task")
      } else {
        toast.success("Task created")
        await refreshGoals()
        onSuccess && onSuccess(null)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Create Task</h3>

        <div className="space-y-3 mb-4">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Description" value={description || ""} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Checklist</h4>
            <Button size="sm" onClick={addSubtask}>Add</Button>
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

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Resources</h4>
            <Button size="sm" onClick={addResource}>Add</Button>
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

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Task"}</Button>
        </div>
      </div>
    </div>
  )
}
