"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Note {
  id: string
  text: string
  createdAt: number
  executionTime: number
  color: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string>("")

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
    } else {
      localStorage.removeItem("notes")
    }
  }, [notes])

  const handleStartEdit = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (note) {
      setEditingId(noteId)
      setEditingText(note.text)
    }
  }

  const handleSaveEdit = () => {
    if (editingId && editingText.trim()) {
      setNotes(
        notes.map((note) =>
          note.id === editingId
            ? { ...note, text: editingText.trim() }
            : note
        )
      )
    } else if (editingId && !editingText.trim()) {
      // Delete empty note
      setNotes(notes.filter((n) => n.id !== editingId))
    }
    setEditingId(null)
    setEditingText("")
  }

  // Removed keyboard handling for mobile

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingText("")
  }

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (editingId && !(e.target as Element).closest('.note-item')) {
      handleSaveEdit()
    }
  }

  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      text: "",
      createdAt: Date.now(),
      executionTime: Date.now() + 86400000, // +1 day
      color: "#6b7280",
    }
    setNotes([newNote, ...notes])
  }

  const formatDateShort = (timestamp: number) => {
    const date = new Date(timestamp)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = String(date.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
  }

  const sortedNotes = [...notes].sort((a, b) => a.executionTime - b.executionTime)

  return (
    <div className="min-h-screen bg-background p-4 mobile-container" onClick={handleOutsideClick}>
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
                  "note-item overflow-hidden transition-all border-b border-gray-200",
                  index === sortedNotes.length - 1 ? "border-b-0" : ""
                )}
              >
                {editingId === note.id ? (
                  // Editing mode
                  <div className="px-4 py-3">
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full min-h-[120px] text-foreground bg-transparent border-none resize-none focus:ring-0 p-0 mobile-textarea"
                      placeholder="Enter your note text..."
                      onBlur={handleSaveEdit}
                      autoFocus
                      style={{
                        WebkitAppearance: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        WebkitUserModify: 'read-write-plaintext-only'
                      }}
                    />
                  </div>
                ) : (
                  // Display mode
                  <button
                    onClick={() => handleStartEdit(note.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-accent/50"
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
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
