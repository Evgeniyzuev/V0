"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClientSupabaseClient } from "@/lib/supabase"
import { toast } from "sonner"
// TaskCard works with both legacy `user_goals` rows and new `personal_tasks` rows.
// We accept a generic `any` for compatibility.
import { Check, Trash2, Flame } from "lucide-react"

type SubtaskType = { id: string; title: string; completed?: boolean }

interface TaskCardProps {
  goal: any
  onUpdated?: () => void
}

export default function TaskCard({ goal, onUpdated }: TaskCardProps) {
  const [open, setOpen] = useState(false)
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; completed?: boolean }>>([])
  const [resources, setResources] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // personal_tasks store subtasks/resources at top-level (subtasks, resources)
    // legacy user_goals store them inside progress_details
    const isPersonal = Array.isArray(goal?.subtasks)
    if (isPersonal) {
      setSubtasks((goal.subtasks || []).map((s: any) => ({ id: s.id ?? String(Math.random()), title: s.title ?? "", completed: !!s.completed })))
      setResources(goal.resources || [])
    } else {
      const pd = goal.progress_details as any
      if (pd?.subtasks && Array.isArray(pd.subtasks)) {
        setSubtasks(pd.subtasks.map((s: any) => ({ id: s.id ?? String(Math.random()), title: s.title ?? "", completed: !!s.completed })))
      } else if (goal.steps && Array.isArray(goal.steps)) {
        setSubtasks(goal.steps.map((s: any, i: number) => ({ id: String(i), title: s || "", completed: false })))
      } else {
        setSubtasks([])
      }
      if (pd?.resources && Array.isArray(pd.resources)) setResources(pd.resources)
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [goal])

  // choose image from resources if available
  const imageResource = resources.find((r) => r?.type === 'image' || (r?.type === 'link' && /\.(jpe?g|png|webp|gif|svg)$/i.test(r.content || '')) )

  const computeProgress = (subs: SubtaskType[]) => {
    if (!subs.length) return 0
    const done = subs.filter((s) => s.completed).length
    return Math.round((done / subs.length) * 100)
  }

  const toggleSubtask = async (id: string) => {
    const next = subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    setSubtasks(next)
    // persist to appropriate table (personal_tasks or user_goals)
    await saveSubtasks(next)
  }

  const saveSubtasks = async (nextSubs?: SubtaskType[]) => {
    const next = nextSubs ?? subtasks
    try {
      setSaving(true)
      const supabase = createClientSupabaseClient()
      const progress_percentage = computeProgress(next)

      // If this is a personal_tasks row, update that table; otherwise update legacy user_goals
      if (Array.isArray(goal?.subtasks)) {
        const { error } = await supabase.from('personal_tasks').update({ subtasks: next, progress_percentage }).eq('id', goal.id)
        if (error) throw error
      } else {
        const progress_details = { ...(goal.progress_details || {}), subtasks: next }
        const { error } = await supabase.from('user_goals').update({ progress_details, progress_percentage }).eq('id', goal.id)
        if (error) throw error
      }
      onUpdated && onUpdated()
      toast.success('Saved')
    } catch (err: any) {
      console.error('Failed to save subtasks:', err)
      toast.error(err?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim()) return
    const s = { id: Date.now().toString(), title: newSubtaskTitle.trim(), completed: false }
    const next = [...subtasks, s]
    setSubtasks(next)
    setNewSubtaskTitle("")
    await saveSubtasks(next)
  }

  const updateSubtaskTitle = async (id: string, title: string) => {
    const next = subtasks.map((st) => (st.id === id ? { ...st, title } : st))
    setSubtasks(next)
    // debounce save to reduce requests (400ms)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveSubtasks(next)
      saveTimerRef.current = null
    }, 400)
  }

  const removeSubtask = async (id: string) => {
    const next = subtasks.filter((st) => st.id !== id)
    setSubtasks(next)
    await saveSubtasks(next)
  }

  return (
    <>
      <div
        className="flex items-center p-0 bg-white rounded-lg shadow-sm hover:shadow-md cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="w-16 h-16 bg-gray-100 rounded-l-lg flex items-center justify-center overflow-hidden">
          {imageResource ? (
            <img src={imageResource.content} alt={goal.title} className="w-full h-full object-cover" />
          ) : goal.image_url ? (
            <img src={goal.image_url} alt={goal.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-400 text-2xl">🎯</div>
          )}
        </div>
        <div className="flex-1 px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="font-medium text-gray-900 line-clamp-1">{goal.title}</div>
            <div className="flex items-center gap-1">
              {goal.is_streak_task && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm">{goal.current_streak_days || 0}/{goal.total_streak_days || 0}</span>
                </div>
              )}
              {!goal.is_streak_task && (
                <div className="text-sm text-gray-500">{goal.progress_percentage ?? 0}%</div>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
            <div className={`h-2 rounded-full ${goal.is_streak_task ? 'bg-orange-500' : 'bg-purple-500'}`} style={{
              width: goal.is_streak_task
                ? `${((goal.current_streak_days || 0) / (goal.total_streak_days || 1)) * 100}%`
                : `${goal.progress_percentage ?? 0}%`
            }} />
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl bg-white rounded-lg p-4 max-h-[85vh] overflow-y-auto relative">
            <div className="flex items-start justify-between pb-2">
              <div>
                <h3 className="text-lg font-semibold">{goal.title}</h3>
                {goal.description && <p className="text-sm text-gray-600">{goal.description}</p>}
                {goal.is_streak_task && (
                  <div className="flex items-center gap-2 mt-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium text-orange-600">
                      Streak: {goal.current_streak_days || 0} / {goal.total_streak_days || 0} days
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Checklist</h4>
              {subtasks.length === 0 && <div className="text-sm text-gray-500">No subtasks</div>}
              <div className="space-y-2">
                {subtasks.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <input type="checkbox" checked={!!s.completed} onChange={() => toggleSubtask(s.id)} disabled={saving} />
                    <Input
                      value={s.title}
                      onChange={(e) => updateSubtaskTitle(s.id, e.target.value)}
                      onBlur={() => saveSubtasks()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur()
                          saveSubtasks()
                        }
                      }}
                      className={s.completed ? 'line-through text-gray-500' : 'text-gray-800'}
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeSubtask(s.id)} disabled={saving}>Remove</Button>
                  </div>
                ))}

                <div className="flex items-center gap-2 mt-2">
                  <Input placeholder="New subtask" value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addSubtask() }} />
                  <Button onClick={addSubtask} disabled={saving || !newSubtaskTitle.trim()}>Add</Button>
                </div>
              </div>
            </div>

            {/* Streak marking section */}
            {goal.is_streak_task && Array.isArray(goal?.subtasks) && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium mb-2 text-orange-800">Daily Streak</h4>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-orange-700">
                    {(() => {
                      const today = new Date().toDateString()
                      const lastStreakDate = goal.last_streak_date
                      const canMarkToday = !lastStreakDate || lastStreakDate !== today

                      if (!canMarkToday) {
                        return "Already marked today! Come back tomorrow."
                      }

                      // Check if streak is broken (more than 1 day gap)
                      if (lastStreakDate) {
                        const lastDate = new Date(lastStreakDate)
                        const yesterday = new Date()
                        yesterday.setDate(yesterday.getDate() - 1)
                        const isConsecutive = lastDate.toDateString() === yesterday.toDateString()

                        if (!isConsecutive) {
                          return "Streak was broken. Starting fresh today!"
                        }
                      }

                      return "Ready to mark today's progress!"
                    })()}
                  </div>
                  <Button
                    onClick={async () => {
                      if (!Array.isArray(goal?.subtasks)) return

                      const today = new Date().toDateString()
                      const lastStreakDate = goal.last_streak_date

                      // Check if already marked today
                      if (lastStreakDate === today) {
                        toast.error("Already marked today!")
                        return
                      }

                      // Check if streak is broken
                      let newStreakCount = (goal.current_streak_days || 0) + 1
                      if (lastStreakDate) {
                        const lastDate = new Date(lastStreakDate)
                        const yesterday = new Date()
                        yesterday.setDate(yesterday.getDate() - 1)
                        const isConsecutive = lastDate.toDateString() === yesterday.toDateString()

                        if (!isConsecutive) {
                          // Streak broken, reset to 1
                          newStreakCount = 1
                        }
                      } else {
                        // First time marking
                        newStreakCount = 1
                      }

                      // Don't exceed total days
                      if (newStreakCount > (goal.total_streak_days || 0)) {
                        toast.error("Streak goal already completed!")
                        return
                      }

                      try {
                        setSaving(true)
                        const supabase = createClientSupabaseClient()
                        const updates: any = {
                          current_streak_days: newStreakCount,
                          last_streak_date: today
                        }

                        // Set start date if this is the first mark
                        if (!goal.streak_start_date) {
                          updates.streak_start_date = today
                        }

                        // Mark as completed if reached total days
                        if (newStreakCount >= (goal.total_streak_days || 0)) {
                          updates.status = 'completed'
                          updates.progress_percentage = 100
                        }

                        const { error } = await supabase
                          .from('personal_tasks')
                          .update(updates)
                          .eq('id', goal.id)

                        if (error) throw error

                        toast.success(`Day ${newStreakCount} marked! 🔥`)
                        onUpdated && onUpdated()
                        setOpen(false)
                      } catch (err: any) {
                        console.error('Failed to mark streak day:', err)
                        toast.error(err?.message || 'Failed to mark day')
                      } finally {
                        setSaving(false)
                      }
                    }}
                    disabled={saving || (() => {
                      const today = new Date().toDateString()
                      return goal.last_streak_date === today
                    })()}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Flame className="h-4 w-4 mr-2" />
                    Mark Today
                  </Button>
                </div>
              </div>
            )}

            {resources.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Resources</h4>
                <div className="space-y-2">
                  {resources.map((r, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">{r.title || (r.type === 'link' ? r.content : 'Resource')}</div>
                      {r.type === 'link' && <a href={r.content} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">Open link</a>}
                      {r.type === 'text' && <div className="text-sm text-gray-600">{r.content}</div>}
                      {r.type === 'image' && <img src={r.content} alt={r.title || 'image'} className="mt-2 max-h-40 object-contain" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button className="bg-green-500 text-white hover:bg-green-600" onClick={async () => {
                  // Quick mark all done
                  const all = subtasks.map(s => ({ ...s, completed: true }))
                  setSubtasks(all)
                  setSaving(true)
                  try {
                    // Save subtasks and progress
                    await saveSubtasks(all)

                    // If this is a personal_tasks row, also mark the task as completed
                    if (Array.isArray(goal?.subtasks)) {
                      try {
                        const supabase = createClientSupabaseClient()
                        const { error } = await supabase.from('personal_tasks').update({ status: 'completed', progress_percentage: 100 }).eq('id', goal.id)
                        if (error) throw error
                      } catch (err) {
                        console.error('Failed to mark personal task as completed:', err)
                        // don't block UI; continue
                      }
                    }

                    toast.success('Updated')
                    onUpdated && onUpdated()
                  } catch (err: any) {
                    console.error(err)
                    toast.error(err?.message || 'Failed')
                  } finally {
                    setSaving(false)
                    setOpen(false)
                  }
                }}>Mark all done</Button>
            </div>

            {/* Delete button in bottom-left of modal */}
            <div className="absolute left-4 bottom-4">
              <Button className="bg-red-500 text-white hover:bg-red-600" onClick={async () => {
                // delete personal task if applicable
                if (!Array.isArray(goal?.subtasks)) {
                  toast.error('Cannot delete this goal')
                  return
                }
                if (!confirm('Delete this task?')) return
                try {
                  const supabase = createClientSupabaseClient()
                  const { error } = await supabase.from('personal_tasks').delete().eq('id', goal.id)
                  if (error) throw error
                  toast.success('Deleted')
                  onUpdated && onUpdated()
                  setOpen(false)
                } catch (err: any) {
                  console.error('Failed to delete personal task', err)
                  toast.error(err?.message || 'Delete failed')
                }
              }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
