"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Plus, Info, Calendar, Clock, Tag } from "lucide-react"
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
  const [showMetadataModal, setShowMetadataModal] = useState<string | null>(null)

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
    if (editingId && !(e.target as Element).closest('.note-item') && !showMetadataModal) {
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
                  <div className="px-2 py-1 relative">
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full min-h-[80px] text-foreground bg-transparent border-none resize-none focus:ring-0 focus:outline-none focus:border-none focus:shadow-none p-0 mobile-textarea pr-12"
                      placeholder="Enter your note text..."
                      onBlur={handleSaveEdit}
                      autoFocus
                      style={{
                        WebkitAppearance: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        WebkitUserModify: 'read-write-plaintext-only',
                        boxShadow: 'none'
                      }}
                    />
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMetadataModal(note.id)
                      }}
                      className="absolute right-2 top-2 w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      size="sm"
                    >
                      <Info className="h-4 w-4 text-gray-600" />
                    </Button>
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

      {/* Metadata Modal */}
      {showMetadataModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowMetadataModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Подробно</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMetadataModal(null)}
                className="w-8 h-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Дата</label>
                  <Input
                    type="date"
                    className="mt-1"
                    defaultValue={new Date(notes.find(n => n.id === showMetadataModal)?.createdAt || Date.now()).toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Время</label>
                  <Input
                    type="time"
                    className="mt-1"
                    defaultValue={new Date(notes.find(n => n.id === showMetadataModal)?.createdAt || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="rounded" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Теги</label>
                  <Input
                    type="text"
                    className="mt-1"
                    placeholder="Добавить тег"
                  />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="rounded" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-blue-500 rounded"></div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Геопозиция</label>
                  <div className="flex items-center mt-1">
                    <input type="checkbox" className="rounded mr-2" />
                    <span className="text-sm text-gray-500">При отправке сообщения</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-orange-500 rounded"></div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Флажок</label>
                  <div className="flex items-center mt-1">
                    <input type="checkbox" className="rounded mr-2" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-red-500 rounded"></div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">По приоритету</label>
                  <div className="flex items-center justify-between mt-1">
                    <input type="checkbox" className="rounded mr-2" />
                    <span className="text-sm text-gray-500">Нет ↓</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-blue-400 rounded"></div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Список</label>
                  <div className="flex items-center justify-between mt-1">
                    <input type="checkbox" className="rounded mr-2" />
                    <span className="text-sm text-gray-500">Разобрать ›</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-600 rounded"></div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Подпункты</label>
                  <div className="flex items-center justify-between mt-1">
                    <input type="checkbox" className="rounded mr-2" />
                    <span className="text-sm text-gray-500">0 ›</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full text-blue-500"
                onClick={() => setShowMetadataModal(null)}
              >
                Добавить изображение
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom panel with add button */}
      <div className="fixed bottom-14 left-0 right-0 flex justify-center">
        <Button
          onClick={handleAddNote}
          className="w-10 h-10 rounded-full bg-gray-200 text-black"
        >
          <Plus className="h-8 w-8" />
        </Button>
      </div>
    </div>
  )
}
