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
  metadata?: {
    date?: string
    time?: string
    tags?: string
    location?: boolean
    flag?: boolean
    priority?: string
    list?: boolean
    subitems?: number
  }
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string>("")
  const [showMetadataModal, setShowMetadataModal] = useState<string | null>(null)
  const [metadataForm, setMetadataForm] = useState<{
    date: string
    time: string
    tags: string
    location: boolean
    flag: boolean
    priority: string
    list: boolean
    subitems: number
  }>({
    date: '',
    time: '',
    tags: '',
    location: false,
    flag: false,
    priority: 'Нет',
    list: false,
    subitems: 0
  })

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
    if (editingId && !(e.target as Element).closest('.note-item') && !showMetadataModal && !(e.target as Element).closest('.info-button')) {
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

  // Load metadata when modal opens
  useEffect(() => {
    if (showMetadataModal) {
      const note = notes.find(n => n.id === showMetadataModal)
      if (note?.metadata) {
        setMetadataForm({
          date: note.metadata.date || new Date(note.createdAt).toISOString().split('T')[0],
          time: note.metadata.time || new Date(note.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          tags: note.metadata.tags || '',
          location: note.metadata.location || false,
          flag: note.metadata.flag || false,
          priority: note.metadata.priority || 'Нет',
          list: note.metadata.list || false,
          subitems: note.metadata.subitems || 0
        })
      } else {
        // Set default values
        setMetadataForm({
          date: new Date(note?.createdAt || Date.now()).toISOString().split('T')[0],
          time: new Date(note?.createdAt || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          tags: '',
          location: false,
          flag: false,
          priority: 'Нет',
          list: false,
          subitems: 0
        })
      }
    }
  }, [showMetadataModal, notes])

  const handleSaveMetadata = () => {
    if (showMetadataModal) {
      setNotes(notes.map(note =>
        note.id === showMetadataModal
          ? { ...note, metadata: metadataForm }
          : note
      ))
    }
    setShowMetadataModal(null)
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
                      onBlur={(e) => {
                        // Don't save if clicking on the info button
                        if (!(e.relatedTarget as Element)?.closest('.info-button')) {
                          handleSaveEdit()
                        }
                      }}
                      autoFocus
                      style={{
                        WebkitAppearance: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        WebkitUserModify: 'read-write-plaintext-only',
                        boxShadow: 'none'
                      }}
                    />
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowMetadataModal(note.id)
                      }}
                      className="info-button absolute right-2 top-2 w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      <Info className="h-5 w-5 text-gray-600" />
                    </button>
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
        <div className="fixed inset-0 bg-white z-50 flex flex-col" onClick={() => setShowMetadataModal(null)}>
          <div className="flex items-center justify-between p-4 border-b" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Подробно</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Save metadata before closing
                if (showMetadataModal) {
                  const currentNote = notes.find(n => n.id === showMetadataModal)
                  if (currentNote) {
                    setNotes(notes.map(note =>
                      note.id === showMetadataModal
                        ? { ...note, metadata: metadataForm }
                        : note
                    ))
                  }
                }
                setShowMetadataModal(null)
              }}
              className="w-8 h-8 p-0"
            >
              Готово
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto" onClick={(e) => e.stopPropagation()}>

            <div className="space-y-2 p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <Input
                  type="date"
                  className="flex-1"
                  value={metadataForm.date}
                  onChange={(e) => setMetadataForm({...metadataForm, date: e.target.value})}
                />
                <input
                  type="checkbox"
                  className="rounded"
                  checked={notes.find(n => n.id === showMetadataModal)?.metadata?.date ? true : false}
                  onChange={(e) => {
                    const note = notes.find(n => n.id === showMetadataModal)
                    if (note) {
                      setNotes(notes.map(n =>
                        n.id === showMetadataModal
                          ? { ...n, metadata: { ...n.metadata, date: e.target.checked ? metadataForm.date : undefined } }
                          : n
                      ))
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <Input
                  type="time"
                  className="flex-1"
                  value={metadataForm.time}
                  onChange={(e) => setMetadataForm({...metadataForm, time: e.target.value})}
                />
                <input
                  type="checkbox"
                  className="rounded"
                  checked={notes.find(n => n.id === showMetadataModal)?.metadata?.time ? true : false}
                  onChange={(e) => {
                    const note = notes.find(n => n.id === showMetadataModal)
                    if (note) {
                      setNotes(notes.map(n =>
                        n.id === showMetadataModal
                          ? { ...n, metadata: { ...n.metadata, time: e.target.checked ? metadataForm.time : undefined } }
                          : n
                      ))
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-gray-500" />
                <Input
                  type="text"
                  className="flex-1"
                  placeholder="Добавить тег"
                  value={metadataForm.tags}
                  onChange={(e) => setMetadataForm({...metadataForm, tags: e.target.value})}
                />
                <input
                  type="checkbox"
                  className="rounded"
                  checked={notes.find(n => n.id === showMetadataModal)?.metadata?.tags ? true : false}
                  onChange={(e) => {
                    const note = notes.find(n => n.id === showMetadataModal)
                    if (note) {
                      setNotes(notes.map(n =>
                        n.id === showMetadataModal
                          ? { ...n, metadata: { ...n.metadata, tags: e.target.checked ? metadataForm.tags : undefined } }
                          : n
                      ))
                    }
                  }}
                />
              </div>
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
