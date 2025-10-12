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

  const sortedNotes = [...notes].sort((a, b) => a.executionTime - b.executionTime)

  return (
    <div className="min-h-screen bg-background mobile-container" onClick={handleOutsideClick}>
      <div className="max-w-4xl mx-auto">
        <div className="space-y-0">
          {sortedNotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Click add to create your first note.</div>
          ) : (
            sortedNotes.map((note, index) => (
              <div
                key={note.id}
                className={cn(
                  "note-item overflow-hidden transition-all",
                  index < sortedNotes.length - 1 ? "border-b border-gray-100" : ""
                )}
              >
                {editingId === note.id ? (
                  // Editing mode
                  <div className="px-2 py-1">
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full min-h-[80px] text-foreground bg-transparent border-none resize-none focus:ring-0 focus:outline-none focus:border-none p-0 mobile-textarea"
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
                    className="w-full px-4 py-1 flex items-center gap-3 text-left hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground">
                          {note.text.split('\n')[0] || 'Untitled'}
                        </div>
                        {note.text.split('\n').slice(1, 4).map((line, index) => (
                          <div key={index} className="text-sm text-muted-foreground mt-0.5">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fixed bottom panel with add button */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center">
        <Button
          onClick={handleAddNote}
          className="w-12 h-12 rounded-full bg-black text-white hover:bg-gray-800 shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
