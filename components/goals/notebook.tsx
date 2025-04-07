"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Plus } from "lucide-react"

// Sample notes data
const initialNotes = [
  {
    id: 1,
    title: "Japan Trip Planning",
    excerpt: "Looking at flights in April for cherry blossom season...",
    content:
      "Looking at flights in April for cherry blossom season. Need to research accommodations in Tokyo and Kyoto. Consider getting a Japan Rail Pass for transportation between cities.",
    date: "12.06.2023",
  },
  {
    id: 2,
    title: "Piano Practice Schedule",
    excerpt: "Monday & Wednesday evenings, Saturday mornings...",
    content:
      "Monday & Wednesday evenings, 7-8pm. Saturday mornings, 10-11:30am. Focus on scales for the first 15 minutes, then work on the current piece for 30 minutes, and sight reading for the remaining time.",
    date: "08.06.2023",
  },
  {
    id: 3,
    title: "Business Ideas",
    excerpt: "Sustainable home products, online courses...",
    content:
      "Sustainable home products: bamboo toothbrushes, reusable food wraps, natural cleaning products. Online courses: photography basics, digital marketing for beginners, introduction to sustainable living.",
    date: "05.06.2023",
  },
]

export default function Notebook() {
  const [notes, setNotes] = useState(initialNotes)
  const [selectedNoteId, setSelectedNoteId] = useState(initialNotes[0].id)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState("")

  const selectedNote = notes.find((note) => note.id === selectedNoteId) || notes[0]

  const handleSelectNote = (noteId: number) => {
    setSelectedNoteId(noteId)
    setIsEditing(false)
  }

  const handleEditNote = () => {
    setEditContent(selectedNote.content)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    setNotes(notes.map((note) => (note.id === selectedNoteId ? { ...note, content: editContent } : note)))
    setIsEditing(false)
  }

  const handleDeleteNote = (noteId: number) => {
    setNotes(notes.filter((note) => note.id !== noteId))
    if (selectedNoteId === noteId && notes.length > 1) {
      setSelectedNoteId(notes[0].id === noteId ? notes[1].id : notes[0].id)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Goal Notebook</h1>
        <Button variant="ghost" size="icon" className="text-purple-600">
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Note list */}
        <div className="w-1/3 border-r overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`p-4 border-b cursor-pointer ${selectedNoteId === note.id ? "bg-purple-50" : ""}`}
              onClick={() => handleSelectNote(note.id)}
            >
              <h3 className="font-medium truncate">{note.title}</h3>
              <p className="text-sm text-gray-500 truncate">{note.excerpt}</p>
              <p className="text-xs text-gray-400 mt-1">{note.date}</p>
            </div>
          ))}
        </div>

        {/* Note content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">{selectedNote.title}</h2>
            <div className="flex space-x-2">
              {isEditing ? (
                <Button variant="outline" size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={handleEditNote}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500"
                onClick={() => handleDeleteNote(selectedNote.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            ) : (
              <p className="text-gray-700">{selectedNote.content}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

