"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronRight, Plus, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Note {
  id: string
  text: string
  createdAt: number
  executionTime: number
  isUrgent: boolean
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string>("")
  const [editingExecutionTime, setEditingExecutionTime] = useState<string>("")

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem("notes")
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes))
      } catch (error) {
        console.error("Failed to load notes:", error)
      }
    }
  }, [])

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem("notes", JSON.stringify(notes))
    }
  }, [notes])

  const handleToggleExpand = (noteId: string, noteText: string) => {
    if (expandedId === noteId) {
      setExpandedId(null)
      setEditingText("")
      setEditingExecutionTime("")
    } else {
      setExpandedId(noteId)
      setEditingText(noteText)
      const note = notes.find((n) => n.id === noteId)
      if (note) {
        setEditingExecutionTime(timestampToDatetimeLocal(note.executionTime))
      }
    }
  }

  const handleSaveEdit = (noteId: string) => {
    const parsedDate = datetimeLocalToTimestamp(editingExecutionTime)
    if (parsedDate) {
      setNotes(
        notes.map((note) => (note.id === noteId ? { ...note, text: editingText, executionTime: parsedDate } : note)),
      )
    }
    setExpandedId(null)
    setEditingText("")
    setEditingExecutionTime("")
  }

  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      text: "",
      createdAt: Date.now(),
      executionTime: Date.now() + 86400000, // +1 day
      isUrgent: false,
    }
    setNotes([newNote, ...notes])
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const day = String(date.getDate()).padStart(2, "0")
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    const month = monthNames[date.getMonth()]
    const year = String(date.getFullYear()).slice(-2)
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${day} ${month} ${year} ${hours}:${minutes}`
  }

  const timestampToDatetimeLocal = (timestamp: number): string => {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const datetimeLocalToTimestamp = (datetimeLocal: string): number | null => {
    const date = new Date(datetimeLocal)
    return isNaN(date.getTime()) ? null : date.getTime()
  }

  const sortedNotes = [...notes].sort((a, b) => a.executionTime - b.executionTime)

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Notes</h1>
          <Button onClick={handleAddNote} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {sortedNotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Click add to create your first note.
            </div>
          ) : (
            sortedNotes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "border border-border rounded-lg overflow-hidden transition-all",
                  expandedId === note.id ? "bg-card" : "bg-card hover:bg-accent/50",
                )}
              >
                {/* Collapsed view - one line panel */}
                <button
                  onClick={() => handleToggleExpand(note.id, note.text)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left"
                >
                  {expandedId === note.id ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}

                  {note.isUrgent && <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />}

                  <span className="flex-1 truncate text-foreground font-medium">{note.text}</span>

                  <span className="text-sm text-muted-foreground flex-shrink-0 whitespace-nowrap">
                    {formatDate(note.executionTime)}
                  </span>
                </button>

                {/* Expanded view - editable */}
                {expandedId === note.id && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Note text</label>
                      <Textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={4}
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                        <p className="text-sm text-foreground">{formatDate(note.createdAt)}</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Execute by</label>
                        <Input
                          type="datetime-local"
                          value={editingExecutionTime}
                          onChange={(e) => setEditingExecutionTime(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`urgent-${note.id}`}
                        checked={note.isUrgent}
                        onChange={(e) => {
                          setNotes(notes.map((n) => (n.id === note.id ? { ...n, isUrgent: e.target.checked } : n)))
                        }}
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor={`urgent-${note.id}`}
                        className="text-sm font-medium text-foreground cursor-pointer"
                      >
                        Urgent note
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => handleSaveEdit(note.id)} className="flex-1">
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setExpandedId(null)
                          setEditingText("")
                          setEditingExecutionTime("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setNotes(notes.filter((n) => n.id !== note.id))
                          setExpandedId(null)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
