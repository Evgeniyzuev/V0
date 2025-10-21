"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Calendar, Clock, CheckCircle, Trash2, Lightbulb, Archive, MoreHorizontal, X, Flag } from "lucide-react"
import { cn } from "@/lib/utils"

interface NoteList {
  id: string
  name: string
  icon: string
  color: string
  count: number
  type: 'default' | 'custom'
  deletable?: boolean
}

interface Note {
  id: string
  text: string
  listId: string
  completed: boolean
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
  const [lists, setLists] = useState<NoteList[]>([
    { id: 'today', name: 'Сегодня', icon: 'Calendar', color: '#3B82F6', count: 0, type: 'default' },
    { id: 'planned', name: 'В планах', icon: 'Clock', color: '#EF4444', count: 0, type: 'default' },
    { id: 'all', name: 'Все', icon: 'CheckCircle', color: '#1F2937', count: 0, type: 'default' },
    { id: 'flagged', name: 'С флажком', icon: 'Flag', color: '#F59E0B', count: 0, type: 'default' },
    { id: 'completed', name: 'Завершено', icon: 'CheckCircle', color: '#10B981', count: 0, type: 'default' },
  ])

  const [customLists, setCustomLists] = useState<NoteList[]>([
    { id: 'reminders', name: 'Напоминания', icon: 'Lightbulb', color: '#EF4444', count: 0, type: 'custom', deletable: true },
    { id: 'legacy', name: 'Legacy', icon: 'Archive', color: '#8B5CF6', count: 1, type: 'custom', deletable: true },
    { id: 'sort', name: 'Разобрать', icon: 'MoreHorizontal', color: '#3B82F6', count: 0, type: 'custom', deletable: true },
    { id: 'deleted', name: 'Недавно удаленные', icon: 'Trash2', color: '#6B7280', count: 11, type: 'custom', deletable: true },
  ])

  const [selectedList, setSelectedList] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string>("")
  const [showAddList, setShowAddList] = useState<boolean>(false)
  const [newListName, setNewListName] = useState<string>("")

  // Load data from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem("notes")
    const savedLists = localStorage.getItem("noteLists")
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes))
      } catch (error) {
        console.error("Failed to load notes:", error)
      }
    }
    if (savedLists) {
      try {
        setCustomLists(JSON.parse(savedLists))
      } catch (error) {
        console.error("Failed to load lists:", error)
      }
    }
  }, [])

  // Save data to localStorage whenever they change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem("notes", JSON.stringify(notes))
    } else {
      localStorage.removeItem("notes")
    }
  }, [notes])

  useEffect(() => {
    if (customLists.length > 0) {
      localStorage.setItem("noteLists", JSON.stringify(customLists))
    } else {
      localStorage.removeItem("noteLists")
    }
  }, [customLists])

  // Update counts when notes change
  useEffect(() => {
    const updateCounts = () => {
      const allLists = [...lists, ...customLists]
      const updatedLists = allLists.map(list => ({
        ...list,
        count: notes.filter(note => {
          if (list.id === 'today') {
            const today = new Date().toDateString()
            return note.listId === list.id && new Date(note.createdAt).toDateString() === today
          }
          if (list.id === 'planned') {
            return note.listId === list.id && !note.completed
          }
          if (list.id === 'all') {
            return note.listId === list.id
          }
          if (list.id === 'flagged') {
            return note.listId === list.id && note.metadata?.flag
          }
          if (list.id === 'completed') {
            return note.listId === list.id && note.completed
          }
          return note.listId === list.id
        }).length
      }))

      if (JSON.stringify(updatedLists.slice(0, lists.length)) !== JSON.stringify(lists)) {
        setLists(updatedLists.slice(0, lists.length) as NoteList[])
      }
      if (JSON.stringify(updatedLists.slice(lists.length)) !== JSON.stringify(customLists)) {
        setCustomLists(updatedLists.slice(lists.length) as NoteList[])
      }
    }

    updateCounts()
  }, [notes, lists, customLists])

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calendar': return <Calendar className="h-5 w-5" />
      case 'Clock': return <Clock className="h-5 w-5" />
      case 'CheckCircle': return <CheckCircle className="h-5 w-5" />
      case 'Flag': return <Flag className="h-5 w-5" />
      case 'Lightbulb': return <Lightbulb className="h-5 w-5" />
      case 'Archive': return <Archive className="h-5 w-5" />
      case 'MoreHorizontal': return <MoreHorizontal className="h-5 w-5" />
      case 'Trash2': return <Trash2 className="h-5 w-5" />
      default: return <MoreHorizontal className="h-5 w-5" />
    }
  }

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
      setNotes(notes.filter((n) => n.id !== editingId))
    }
    setEditingId(null)
    setEditingText("")
  }

  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      text: "",
      listId: selectedList,
      completed: false,
      createdAt: Date.now(),
      executionTime: Date.now() + 86400000,
      color: "#6b7280",
    }
    setNotes([newNote, ...notes])
  }

  const handleAddList = () => {
    if (newListName.trim()) {
      const newList: NoteList = {
        id: Date.now().toString(),
        name: newListName.trim(),
        icon: 'MoreHorizontal',
        color: '#3B82F6',
        count: 0,
        type: 'custom',
        deletable: true
      }
      setCustomLists([...customLists, newList])
      setNewListName("")
      setShowAddList(false)
    }
  }

  const handleDeleteList = (listId: string) => {
    setCustomLists(customLists.filter(list => list.id !== listId))
    setNotes(notes.filter(note => note.listId !== listId))
  }

  const filteredNotes = notes.filter(note => note.listId === selectedList)
  const currentList = [...lists, ...customLists].find(list => list.id === selectedList)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold">Мои списки</h1>
        </div>

        {/* Default Lists */}
        <div className="p-4 space-y-2">
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedList(list.id)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border transition-colors",
                selectedList === list.id
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div style={{ color: list.color }}>
                  {getIcon(list.icon)}
                </div>
                <span className="font-medium">{list.name}</span>
              </div>
              <span className="text-sm text-gray-500">{list.count}</span>
            </button>
          ))}
        </div>

        {/* Custom Lists */}
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {customLists.map((list) => (
              <div
                key={list.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  selectedList === list.id
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200"
                )}
              >
                <button
                  onClick={() => setSelectedList(list.id)}
                  className="flex items-center gap-3 flex-1"
                >
                  <div style={{ color: list.color }}>
                    {getIcon(list.icon)}
                  </div>
                  <span className="font-medium">{list.name}</span>
                  <span className="text-sm text-gray-500 ml-auto">{list.count}</span>
                </button>
                {list.deletable && (
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add List Button */}
        {showAddList ? (
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Название списка"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddList()}
                autoFocus
              />
              <Button onClick={handleAddList} size="sm">Добавить</Button>
              <Button
                onClick={() => {
                  setShowAddList(false)
                  setNewListName("")
                }}
                variant="outline"
                size="sm"
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-4">
            <Button
              onClick={() => setShowAddList(true)}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Напоминание
            </Button>
          </div>
        )}

        {/* Notes List */}
        {currentList && (
          <div className="px-4 pb-20">
            <div className="space-y-2">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Нет заметок в списке "{currentList.name}"
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-white border border-gray-200 rounded-lg p-3"
                  >
                    {editingId === note.id ? (
                      <div className="relative">
                        <div
                          className="w-full min-h-[60px] text-foreground bg-transparent border-none resize-none focus:ring-0 focus:outline-none focus:border-none focus:shadow-none p-0 editable-content"
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            if (!(e.relatedTarget as Element)?.closest('.info-button')) {
                              handleSaveEdit()
                            }
                          }}
                          onInput={(e) => {
                            setEditingText(e.currentTarget.textContent || '')
                          }}
                          style={{
                            WebkitAppearance: 'none',
                            WebkitTapHighlightColor: 'transparent',
                            WebkitUserModify: 'read-write-plaintext-only',
                            boxShadow: 'none',
                            outline: 'none',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word'
                          }}
                        >
                          {editingText || ''}
                        </div>
                        <style dangerouslySetInnerHTML={{
                          __html: `
                            .editable-content:first-line {
                              font-weight: bold;
                            }
                          `
                        }} />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(note.id)}
                        className="w-full text-left"
                      >
                        <div className="font-bold text-foreground">
                          {note.text.split('\n')[0] || 'Untitled'}
                        </div>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Fixed bottom panel with add button */}
        {currentList && (
          <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
            <Button
              onClick={handleAddNote}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить задачу
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
