"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Plus, Info, Calendar, Clock, Tag, List, ArrowLeft, Search, CheckCircle2, Trash2, MoreHorizontal, Circle } from "lucide-react"
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

interface CustomList {
  id: string
  name: string
  color: string
  icon: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string>("")
  const [showMetadataModal, setShowMetadataModal] = useState<string | null>(null)
  const [showAllNotesModal, setShowAllNotesModal] = useState<boolean>(false)
  const [activeList, setActiveList] = useState<string>('all')
  const [showListModal, setShowListModal] = useState<boolean>(false)
  const [currentListType, setCurrentListType] = useState<string>('')
  const [currentListTitle, setCurrentListTitle] = useState<string>('')
  const [showCreateListModal, setShowCreateListModal] = useState<boolean>(false)
  const [newListName, setNewListName] = useState<string>('')
  const [newListColor, setNewListColor] = useState<string>('#007AFF')
  const [newListIcon, setNewListIcon] = useState<string>('menu')
  const [showListMenu, setShowListMenu] = useState<string | null>(null)
  const [editingList, setEditingList] = useState<string | null>(null)
  const [editingListName, setEditingListName] = useState<string>('')
  const [editingListIcon, setEditingListIcon] = useState<string>('')
  const [customLists, setCustomLists] = useState<CustomList[]>([
    { id: '1', name: 'Напоминания', color: '#FF3B30', icon: 'bell' },
    { id: '2', name: 'Legacy', color: '#34C759', icon: 'flame' },
    { id: '3', name: 'Разобрать', color: '#007AFF', icon: 'menu' },
    { id: '4', name: 'Недавно удаленные', color: '#8E8E93', icon: 'trash' }
  ])
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

  // Close list menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showListMenu && !(e.target as Element).closest('.list-menu-container')) {
        setShowListMenu(null)
      }
    }

    if (showListMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showListMenu])

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

  const handleCreateList = () => {
    if (newListName.trim()) {
      const newList: CustomList = {
        id: Date.now().toString(),
        name: newListName.trim(),
        color: newListColor,
        icon: newListIcon
      }
      setCustomLists([...customLists, newList])
      setNewListName('')
      setNewListColor('#007AFF')
      setNewListIcon('menu')
      setShowCreateListModal(false)
    }
  }

  const handleToggleComplete = (noteId: string) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? {
            ...note,
            metadata: {
              ...note.metadata,
              flag: !note.metadata?.flag
            }
          }
        : note
    ))
  }

  const handleEditList = (listId: string) => {
    const list = customLists.find(l => l.id === listId)
    if (list) {
      setEditingList(listId)
      setEditingListName(list.name)
      setEditingListIcon(list.icon)
      setShowListMenu(null)
    }
  }

  const handleSaveListEdit = () => {
    if (editingList && editingListName.trim()) {
      setCustomLists(customLists.map(list =>
        list.id === editingList
          ? { ...list, name: editingListName.trim(), icon: editingListIcon }
          : list
      ))
    }
    setEditingList(null)
    setEditingListName('')
    setEditingListIcon('')
  }

  const handleDeleteList = (listId: string) => {
    setCustomLists(customLists.filter(list => list.id !== listId))
    setShowListMenu(null)
  }

  const handleListMenuToggle = (listId: string) => {
    setShowListMenu(showListMenu === listId ? null : listId)
  }

  const sortedNotes = [...notes].sort((a, b) => a.executionTime - b.executionTime)

  // Filter notes based on active list
  const getFilteredNotes = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    switch (activeList) {
      case 'today':
        return notes.filter(note => {
          // Today list: notes with active date metadata set to today, or notes without active date that are due today
          if (note.metadata?.date) {
            const noteDate = new Date(note.metadata.date)
            noteDate.setHours(0, 0, 0, 0)
            return noteDate.getTime() === today.getTime()
          }
          // Otherwise use execution time
          const noteDate = new Date(note.executionTime)
          noteDate.setHours(0, 0, 0, 0)
          return noteDate.getTime() === today.getTime()
        })
      case 'plan':
        return notes.filter(note => {
          // Plan list: ALL notes WITH active date (regardless of date)
          return note.metadata?.date !== undefined
        })
      case 'done':
        return notes.filter(note => note.metadata?.flag === true)
      case 'all':
      default:
        return notes
    }
  }

  const filteredNotes = getFilteredNotes()

  // Get counts for each list
  const getListCount = (listType: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    switch (listType) {
      case 'today':
        return notes.filter(note => {
          // If note has active date metadata, use that date
          if (note.metadata?.date) {
            const noteDate = new Date(note.metadata.date)
            noteDate.setHours(0, 0, 0, 0)
            return noteDate.getTime() === today.getTime()
          }
          // Otherwise use execution time
          const noteDate = new Date(note.executionTime)
          noteDate.setHours(0, 0, 0, 0)
          return noteDate.getTime() === today.getTime()
        }).length
      case 'plan':
        return notes.filter(note => {
          // Plan list: ALL notes WITH active date (regardless of date)
          return note.metadata?.date !== undefined
        }).length
      case 'done':
        return notes.filter(note => note.metadata?.flag === true).length
      case 'all':
      default:
        return notes.length
    }
  }

  const getCustomListCount = (listId: string) => {
    // For now, return mock data. In real app, this would filter by list ID
    const mockCounts: { [key: string]: number } = {
      '1': 3, '2': 10, '3': 8, '4': 8
    }
    return mockCounts[listId] || 0
  }

  const getListIcon = (iconName: string) => {
    // If it's a single emoji character, return it as is
    if (iconName && iconName.length <= 2 && /\p{Emoji}/u.test(iconName)) {
      return iconName
    }

    // Otherwise, map predefined icon names to emojis
    switch (iconName) {
      case 'bell': return '🔔'
      case 'flame': return '🔥'
      case 'menu': return '☰'
      case 'trash': return '🗑️'
      case 'star': return '⭐'
      case 'heart': return '❤️'
      case 'check': return '✅'
      default: return iconName || '📝'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 mobile-container">
      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Поиск"
            className="pl-10 bg-gray-100 border-none rounded-lg"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Standard Lists */}
        <div className="grid grid-cols-2 gap-3">
          {/* Today */}
          <button
            onClick={() => {
              setCurrentListType('today')
              setCurrentListTitle('Сегодня')
              setShowListModal(true)
            }}
            className="bg-white rounded-xl p-4 text-left border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">{new Date().getDate()}</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{getListCount('today')}</span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Сегодня</div>
          </button>

          {/* Planned */}
          <button
            onClick={() => {
              setCurrentListType('plan')
              setCurrentListTitle('В планах')
              setShowListModal(true)
            }}
            className="bg-white rounded-xl p-4 text-left border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📅</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{getListCount('plan')}</span>
            </div>
            <div className="text-sm text-gray-600 font-medium">В планах</div>
          </button>

          {/* All */}
          <button
            onClick={() => {
              setCurrentListType('all')
              setCurrentListTitle('Все')
              setShowListModal(true)
            }}
            className="bg-white rounded-xl p-4 text-left border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📋</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{getListCount('all')}</span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Все</div>
          </button>

          {/* Done */}
          <button
            onClick={() => {
              setCurrentListType('done')
              setCurrentListTitle('Завершено')
              setShowListModal(true)
            }}
            className="bg-white rounded-xl p-4 text-left border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{getListCount('done')}</span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Завершено</div>
          </button>
        </div>

        {/* My Lists */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Мои списки</h2>
          <div className="space-y-1">
            {customLists.map((list) => (
              <div key={list.id} className="relative">
                <button
                  onClick={() => {
                    setCurrentListType(`custom-${list.id}`)
                    setCurrentListTitle(list.name)
                    setShowListModal(true)
                  }}
                  className="w-full bg-white rounded-lg p-3 flex items-center justify-between border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {editingList === list.id ? (
                      <>
                        <div
                          onClick={() => {
                            const emoji = prompt('Введите эмоджи для иконки списка:')
                            if (emoji && emoji.trim()) {
                              setEditingListIcon(emoji.trim())
                            }
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          style={{ backgroundColor: list.color + '20' }}
                          title="Нажмите чтобы изменить эмоджи"
                        >
                          {editingListIcon || getListIcon(list.icon)}
                        </div>
                        <Input
                          type="text"
                          value={editingListName}
                          onChange={(e) => setEditingListName(e.target.value)}
                          onBlur={handleSaveListEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveListEdit()
                            } else if (e.key === 'Escape') {
                              setEditingList(null)
                              setEditingListName('')
                              setEditingListIcon('')
                            }
                          }}
                          className="font-medium text-gray-900 border-none bg-transparent p-0 h-auto focus:ring-0"
                          autoFocus
                        />
                      </>
                    ) : (
                      <>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: list.color + '20', color: list.color }}
                        >
                          {getListIcon(list.icon)}
                        </div>
                        <span className="font-medium text-gray-900">{list.name}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{getCustomListCount(list.id)}</span>
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        handleListMenuToggle(list.id)
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </button>

                {/* List Menu */}
                {showListMenu === list.id && (
                  <div className="list-menu-container absolute right-2 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[120px]">
                    <button
                      onClick={() => handleEditList(list.id)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>


      </div>

      {/* Metadata Modal */}
      {showMetadataModal && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col">
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

      {/* Fixed bottom panel with buttons */}
      <div className="fixed bottom-20 left-4 right-4">
        <div className="flex gap-3">
          <Button
            onClick={handleAddNote}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-blue-600 rounded-lg py-3 flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="h-5 w-5" />
            note
          </Button>
          <Button
            onClick={() => setShowCreateListModal(true)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-3 flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="h-5 w-5" />
            list
          </Button>
        </div>
      </div>

      {/* All Notes Modal */}
      {showAllNotesModal && (
        <div className="fixed inset-0 bg-white z-[55] flex flex-col" onClick={() => setShowAllNotesModal(false)}>
          <div className="flex items-center justify-between p-4 border-b" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllNotesModal(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
            <h3 className="text-lg font-semibold">Все заметки</h3>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>

          <div className="flex-1 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-0">
                {sortedNotes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">Нет заметок</div>
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
                          <div
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setShowMetadataModal(note.id)
                            }}
                            className="info-button absolute right-2 top-2 w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center cursor-pointer"
                          >
                            <Info className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                      ) : (
                        // Display mode
                        <button
                          onClick={() => handleStartEdit(note.id)}
                          className="w-full px-4 py-1 flex items-center gap-3 text-left hover:bg-accent/50"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleComplete(note.id)
                              }}
                              className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 transition-colors cursor-pointer"
                            >
                              {note.metadata?.flag && (
                                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                            <div className="font-bold text-foreground">
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
          </div>


        </div>
      )}

      {/* List Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col" onClick={() => setShowListModal(false)}>
          <div className="flex items-center justify-between p-4 border-b" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowListModal(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
            <h3 className="text-lg font-semibold">{currentListTitle}</h3>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>

          <div className="flex-1 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-0">
                {(() => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const tomorrow = new Date(today)
                  tomorrow.setDate(tomorrow.getDate() + 1)

                  let listNotes = []
                  switch (currentListType) {
                    case 'today':
                      listNotes = notes.filter(note => {
                        // Today list: notes with active date metadata set to today, or notes without active date that are due today
                        if (note.metadata?.date) {
                          const noteDate = new Date(note.metadata.date)
                          noteDate.setHours(0, 0, 0, 0)
                          return noteDate.getTime() === today.getTime()
                        }

                        // Check if note was created today
                        const createdToday = new Date(note.createdAt)
                        createdToday.setHours(0, 0, 0, 0)
                        const isCreatedToday = createdToday.getTime() === today.getTime()

                        // Check if note is due today
                        const noteDate = new Date(note.executionTime)
                        noteDate.setHours(0, 0, 0, 0)
                        const isDueToday = noteDate.getTime() === today.getTime()

                        return isCreatedToday || isDueToday
                      })
                      break
                    case 'plan':
                      listNotes = notes.filter(note => {
                        // Plan list: ALL notes WITH active date (regardless of date)
                        return note.metadata?.date !== undefined
                      })
                      break
                    case 'done':
                      listNotes = notes.filter(note => note.metadata?.flag === true)
                      break
                    case 'all':
                    default:
                      listNotes = notes
                      break
                  }

                  // Handle custom lists
                  if (currentListType.startsWith('custom-')) {
                    const listId = currentListType.replace('custom-', '')
                    // For now, return all notes for custom lists (mock data)
                    // In real app, this would filter by list ID from note metadata
                    listNotes = notes
                  }

                  if (listNotes.length === 0) {
                    return <div className="text-center py-12 text-muted-foreground">Нет заметок</div>
                  }

                  return listNotes.map((note, index) => (
                    <div
                      key={note.id}
                      className={cn(
                        "note-item overflow-hidden transition-all",
                        index < listNotes.length - 1 ? "border-b border-gray-100" : ""
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
                          <div
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setShowMetadataModal(note.id)
                            }}
                            className="info-button absolute right-2 top-2 w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center cursor-pointer"
                          >
                            <Info className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                      ) : (
                        // Display mode
                        <button
                          onClick={() => handleStartEdit(note.id)}
                          className="w-full px-4 py-1 flex items-center gap-3 text-left hover:bg-accent/50"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleComplete(note.id)
                              }}
                              className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 transition-colors cursor-pointer"
                            >
                              {note.metadata?.flag && (
                                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                            <div className="font-bold text-foreground">
                              {note.text.split('\n')[0] || 'Untitled'}
                            </div>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>

          {/* Add note button in list modal */}
          <div className="p-4 border-t border-gray-200">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                const newNote: Note = {
                  id: Date.now().toString(),
                  text: "",
                  createdAt: Date.now(),
                  executionTime: Date.now() + 86400000, // +1 day
                  color: "#6b7280",
                }
                setNotes([newNote, ...notes])
                setEditingId(newNote.id)
                setEditingText("")
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-3 flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="h-5 w-5" />
              Добавить напоминание
            </Button>
          </div>
        </div>
      )}

      {/* Create List Modal */}
      {showCreateListModal && (
        <div className="fixed inset-0 bg-white z-[65] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateListModal(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
            <h3 className="text-lg font-semibold">Новый список</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateList}
              className="text-blue-600 font-medium"
            >
              Готово
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-4">
              {/* List Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название
                </label>
                <Input
                  type="text"
                  placeholder="Название списка"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* List Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Иконка
                </label>
                <div className="space-y-3">
                  {/* Custom emoji input */}
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Вставьте эмоджи"
                      value={newListIcon}
                      onChange={(e) => setNewListIcon(e.target.value)}
                      className="flex-1"
                      maxLength={2}
                    />
                    <div className="w-12 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center text-2xl">
                      {newListIcon || '📝'}
                    </div>
                  </div>

                  {/* Predefined icons */}
                  <div>
                    <div className="text-xs text-gray-500 mb-2">или выберите из предложенных:</div>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { name: 'menu', emoji: '☰' },
                        { name: 'bell', emoji: '🔔' },
                        { name: 'flame', emoji: '🔥' },
                        { name: 'star', emoji: '⭐' },
                        { name: 'heart', emoji: '❤️' },
                        { name: 'check', emoji: '✅' }
                      ].map((icon) => (
                        <button
                          key={icon.name}
                          onClick={() => setNewListIcon(icon.emoji)}
                          className={cn(
                            "w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl transition-all",
                            newListIcon === icon.emoji
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          title={`Выбрать ${icon.emoji}`}
                        >
                          {icon.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* List Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Цвет
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
                    '#00D4AA', '#007AFF', '#5856D6', '#AF52DE'
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewListColor(color)}
                      className={cn(
                        "w-12 h-12 rounded-lg border-2 transition-all",
                        newListColor === color
                          ? "border-gray-800"
                          : "border-gray-200"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
