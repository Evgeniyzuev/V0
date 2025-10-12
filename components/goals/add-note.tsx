"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Note {
  id: string
  text: string
  createdAt: number
  executionTime: number
  color: string
  emoji: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string>("")
  const [editingExecutionTime, setEditingExecutionTime] = useState<string>("")
  const [editingEmoji, setEditingEmoji] = useState<string>("")

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
      setEditingEmoji("")
    } else {
      setExpandedId(noteId)
      setEditingText(noteText)
      const note = notes.find((n) => n.id === noteId)
      if (note) {
        setEditingExecutionTime(timestampToDatetimeLocal(note.executionTime))
        setEditingEmoji(note.emoji)
      }
    }
  }

  const handleSaveEdit = (noteId: string) => {
    const parsedDate = datetimeLocalToTimestamp(editingExecutionTime)
    if (parsedDate) {
      setNotes(
        notes.map((note) => (note.id === noteId ? { ...note, text: editingText, executionTime: parsedDate, emoji: editingEmoji } : note)),
      )
    }
    setExpandedId(null)
    setEditingText("")
    setEditingExecutionTime("")
    setEditingEmoji("")
  }

  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      text: "",
      createdAt: Date.now(),
      executionTime: Date.now() + 86400000, // +1 day
      color: "#6b7280",
      emoji: "📝",
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

  const formatDateShort = (timestamp: number) => {
    const date = new Date(timestamp)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = String(date.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
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
          <Button
            onClick={handleAddNote}
            className="flex items-center gap-2 bg-white text-black border-2 border-black hover:bg-gray-100"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="space-y-0">
          {sortedNotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Click add to create your first note.</div>
          ) : (
            sortedNotes.map((note, index) => (
              <div
                key={note.id}
                className={cn(
                  "overflow-hidden transition-all border-b border-gray-200",
                  expandedId === note.id ? "bg-card" : "bg-card hover:bg-accent/50",
                  index === sortedNotes.length - 1 ? "border-b-0" : ""
                )}
              >
                <button
                  onClick={() => handleToggleExpand(note.id, note.text)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground">
                        {note.text.split('\n')[0] || 'Untitled'}
                      </div>
                      {note.text.split('\n').slice(1, 4).map((line, index) => (
                        <div key={index} className="text-sm text-muted-foreground mt-1">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>

                  <span className="text-sm text-muted-foreground flex-shrink-0 whitespace-nowrap">
                    {formatDateShort(note.createdAt)}
                  </span>
                </button>

                {/* Expanded view - editable */}
                {expandedId === note.id && (
                  <div className="px-4 pb-4 pt-4">
                    <div className="mb-2">
                      <Input
                        type="text"
                        value={editingEmoji}
                        onChange={(e) => setEditingEmoji(e.target.value)}
                        className="text-lg inline-block w-16"
                        placeholder="📝"
                        maxLength={2}
                      />
                    </div>
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full min-h-[120px] text-foreground bg-transparent border-none resize-none focus:ring-0 p-0"
                      placeholder="Enter your note text..."
                    />

                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => handleSaveEdit(note.id)} className="flex-1">
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setExpandedId(null)
                          setEditingText("")
                          setEditingExecutionTime("")
                          setEditingEmoji("")
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
