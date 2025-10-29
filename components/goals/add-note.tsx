"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Info,
  Calendar,
  Clock,
  Tag,
  ArrowLeft,
  Search,
  CheckCircle2,
  MoreHorizontal,
  ChevronRight,
  List,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Note {
  id: string
  text: string
  createdAt: number
  executionTime: number
  color: string
  listId?: string
  metadata?: {
    date?: string
    time?: string
    tags?: string
    location: boolean
    flag: boolean
    priority: string
    list: boolean
    subitems: number
  }
}

interface CustomList {
  id: string
  name: string
  color: string
  icon: string
}

type ListType = "today" | "plan" | "done" | "all" | `custom-${string}`

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string>("")
  const [showMetadataModal, setShowMetadataModal] = useState<string | null>(null)
  const [showAllNotesModal, setShowAllNotesModal] = useState<boolean>(false)
  const [showListModal, setShowListModal] = useState<boolean>(false)
  const [currentListType, setCurrentListType] = useState<ListType>("all")
  const [currentListTitle, setCurrentListTitle] = useState<string>("All")
  const [showCreateListModal, setShowCreateListModal] = useState<boolean>(false)
  const [newListName, setNewListName] = useState<string>("")
  const [newListColor, setNewListColor] = useState<string>("#007AFF")
  const [newListIcon, setNewListIcon] = useState<string>("menu")
  const [showListMenu, setShowListMenu] = useState<string | null>(null)
  const [editingList, setEditingList] = useState<string | null>(null)
  const [editingListName, setEditingListName] = useState<string>("")
  const [editingListIcon, setEditingListIcon] = useState<string>("")
  const [showEditListModal, setShowEditListModal] = useState<boolean>(false)
  const [editingListModal, setEditingListModal] = useState<CustomList | null>(null)
  const [customLists, setCustomLists] = useState<CustomList[]>([])
  const [showListSelectionModal, setShowListSelectionModal] = useState<boolean>(false)
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
    date: "",
    time: "",
    tags: "",
    location: false,
    flag: false,
    priority: "None",
    list: false,
    subitems: 0,
  })

  const [isSelectionActive, setIsSelectionActive] = useState<boolean>(false)
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggered = useRef<boolean>(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)



  // Computed properties for active and completed notes
  const activeNotes = useMemo(() => notes.filter((note) => note.metadata?.flag !== true), [notes])
  const completedNotes = useMemo(() => notes.filter((note) => note.metadata?.flag === true), [notes])

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

  useEffect(() => {
    const savedLists = localStorage.getItem("customLists")
    if (savedLists) {
      try {
        setCustomLists(JSON.parse(savedLists))
      } catch (error) {
        console.error("Failed to load custom lists:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (customLists.length > 0) {
      localStorage.setItem("customLists", JSON.stringify(customLists))
    } else {
      localStorage.removeItem("customLists")
    }
  }, [customLists])



  const handleStartEdit = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (note) {
      setEditingId(noteId)
      setEditingText(note.text)
    }
  }

  const handleSaveEdit = () => {
    if (editingId) {
      const currentText = textareaRef.current?.value || ''
      if (currentText.trim()) {
        setNotes(notes.map((note) => (note.id === editingId ? { ...note, text: currentText.trim() } : note)))
      } else {
        setNotes(notes.filter((n) => n.id !== editingId))
      }
    }
    setEditingId(null)
    setEditingText("")
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingText("")
  }

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (
      editingId &&
      !(e.target as Element).closest(".note-item") &&
      !showMetadataModal &&
      !(e.target as Element).closest(".info-button")
    ) {
      handleSaveEdit()
    }
  }

  // Close list menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showListMenu && !(e.target as Element).closest(".list-menu-container")) {
        setShowListMenu(null)
      }
    }

    if (showListMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
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
    setEditingId(newNote.id)
    setEditingText("")
    setCurrentListType("all")
    setCurrentListTitle("All")
    setShowListModal(true)
  }

  // Load metadata when modal opens
  useEffect(() => {
    if (showMetadataModal) {
      const note = notes.find((n) => n.id === showMetadataModal)
      if (note?.metadata) {
        setMetadataForm({
          date: note.metadata.date || "",
          time: note.metadata.time || "",
          tags: note.metadata.tags || "",
          location: note.metadata.location || false,
          flag: note.metadata.flag || false,
          priority: note.metadata.priority || "None",
          list: note.metadata.list || false,
          subitems: note.metadata.subitems || 0,
        })
      } else {
        // Set default values
        setMetadataForm({
          date: "",
          time: "",
          tags: "",
          location: false,
          flag: false,
          priority: "None",
          list: false,
          subitems: 0,
        })
      }
    }
  }, [showMetadataModal, notes])

  const handleSaveMetadata = () => {
    if (showMetadataModal) {
      setNotes(notes.map((note) => (note.id === showMetadataModal ? { ...note, metadata: metadataForm } : note)))
    }
    setShowMetadataModal(null)
  }

  const handleCreateList = () => {
    if (newListName.trim()) {
      const newList: CustomList = {
        id: Date.now().toString(),
        name: newListName.trim(),
        color: newListColor,
        icon: newListIcon,
      }
      setCustomLists([...customLists, newList])
      setNewListName("")
      setNewListColor("#007AFF")
      setNewListIcon("menu")
      setShowCreateListModal(false)
    }
  }

  const handleToggleComplete = (noteId: string) => {
    setNotes(
      notes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              metadata: {
                ...note.metadata,
                location: note.metadata?.location ?? false,
                flag: !note.metadata?.flag,
                priority: note.metadata?.priority ?? "None",
                list: note.metadata?.list ?? false,
                subitems: note.metadata?.subitems ?? 0,
              },
            }
          : note,
      ),
    )
  }

  const handleToggleSelection = (noteId: string) => {
    setSelectedNotes((prev) => {
      if (prev.includes(noteId)) {
        return prev.filter((id) => id !== noteId)
      } else {
        return [...prev, noteId]
      }
    })
  }

  const handleDeleteSelected = () => {
    setNotes((prev) => prev.filter((note) => !selectedNotes.includes(note.id)))
    setSelectedNotes([])
    setIsSelectionActive(false)
  }

  const handleCancelSelection = () => {
    setIsSelectionActive(false)
    setSelectedNotes([])
  }

  const handleMoveUp = () => {
    if (selectedNotes.length === 0) return
    setNotes((prevNotes) => {
      const newNotes = [...prevNotes]
      selectedNotes.forEach((id) => {
        const index = newNotes.findIndex(n => n.id === id)
        if (index > 0) {
          ;[newNotes[index], newNotes[index - 1]] = [newNotes[index - 1], newNotes[index]]
        }
      })
      return newNotes
    })
  }

  const handleMoveDown = () => {
    if (selectedNotes.length === 0) return
    setNotes((prevNotes) => {
      const newNotes = [...prevNotes]
      selectedNotes.forEach((id) => {
        const index = newNotes.findIndex(n => n.id === id)
        if (index < newNotes.length - 1) {
          ;[newNotes[index], newNotes[index + 1]] = [newNotes[index + 1], newNotes[index]]
        }
      })
      return newNotes
    })
  }

  const handleTouchStart = (noteId: string) => {
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      setIsSelectionActive(true)
      setSelectedNotes([noteId])
    }, 500) // Reduced from 1000ms to 500ms for better mobile UX
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleMouseDown = (noteId: string) => {
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      setIsSelectionActive(true)
      setSelectedNotes([noteId])
    }, 500)
  }

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleNoteClick = (noteId: string) => {
    if (isSelectionActive) {
      if (!longPressTriggered.current) {
        setIsSelectionActive(false)
        setSelectedNotes([])
      } else {
        handleToggleSelection(noteId)
      }
    } else {
      handleStartEdit(noteId)
    }
  }

  const handleEditList = (listId: string) => {
    const list = customLists.find((l) => l.id === listId)
    if (list) {
      setEditingListModal(list)
      setShowEditListModal(true)
      setShowListMenu(null)
    }
  }

  const handleSaveListEditModal = () => {
    if (editingListModal) {
      setCustomLists(customLists.map((list) => (list.id === editingListModal.id ? editingListModal : list)))
      if (currentListType === `custom-${editingListModal.id}`) {
        setCurrentListTitle(editingListModal.name)
      }
    }
    setShowEditListModal(false)
    setEditingListModal(null)
  }

  const handleSaveListEdit = () => {
    if (editingList && editingListName.trim()) {
      setCustomLists(
        customLists.map((list) =>
          list.id === editingList ? { ...list, name: editingListName.trim(), icon: editingListIcon } : list,
        ),
      )
      if (currentListType === `custom-${editingList}`) {
        setCurrentListTitle(editingListName.trim())
      }
    }
    setEditingList(null)
    setEditingListName("")
    setEditingListIcon("")
  }

  const handleDeleteList = (listId: string) => {
    setCustomLists(customLists.filter((list) => list.id !== listId))
    setShowListMenu(null)
    if (currentListType === `custom-${listId}`) {
      setShowListModal(false)
    }
    // Also remove listId from notes belonging to the deleted list
    setNotes(notes.map((note) => (note.listId === listId ? { ...note, listId: undefined } : note)))
  }

  const handleListMenuToggle = (listId: string) => {
    setShowListMenu(showListMenu === listId ? null : listId)
  }

  const sortedNotes = [...notes].sort((a, b) => a.executionTime - b.executionTime)

  // Utility function to filter notes by type
  const filterNotesByType = (listType: string, listId?: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTime = today.getTime()

    switch (listType) {
      case "today":
        return notes.filter((note) => {
          if (note.metadata?.flag === true) return false
          if (note.metadata?.date) {
            const noteDate = new Date(note.metadata.date)
            noteDate.setHours(0, 0, 0, 0)
            return noteDate.getTime() === todayTime
          }
          return false
        })
      case "plan":
        return notes.filter((note) => {
          return note.metadata?.date !== undefined && note.metadata?.flag !== true
        })
      case "done":
        return notes.filter((note) => note.metadata?.flag === true)
      case "all":
      default:
        return notes.filter((note) => note.metadata?.flag !== true)
    }
  }

  // Filter notes based on active list
  const getFilteredNotes = () => {
    if (currentListType.startsWith("custom-")) {
      const listId = currentListType.replace("custom-", "")
      return notes.filter((note) => note.listId === listId && note.metadata?.flag !== true)
    }
    return filterNotesByType(currentListType)
  }

  const filteredNotes = getFilteredNotes()

  // Get counts for each list
  const getListCount = (listType: string) => {
    if (listType.startsWith("custom-")) {
      const listId = listType.replace("custom-", "")
      return notes.filter((note) => note.listId === listId && note.metadata?.flag !== true).length
    }
    if (listType === "plan") {
      const listNotes = filterNotesByType("plan")
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTime = today.getTime()

      const currentNotes = listNotes.filter(note => {
        if (note.metadata?.date) {
          const noteDate = new Date(note.metadata.date)
          return noteDate.getTime() >= todayTime
        }
        return false
      })

      const overdueNotes = listNotes.filter(note => {
        if (note.metadata?.date) {
          const noteDate = new Date(note.metadata.date)
          return noteDate.getTime() < todayTime
        }
        return false
      })

      return currentNotes.length + overdueNotes.length
    }
    return filterNotesByType(listType).length
  }

  const getCustomListCount = (listId: string) => {
    return notes.filter((note) => note.listId === listId && note.metadata?.flag !== true).length
  }

  const getListIcon = (iconName: string) => {
    if (iconName && iconName.length <= 2 && /\p{Emoji}/u.test(iconName)) {
      return iconName
    }

    switch (iconName) {
      case "bell":
        return "🔔"
      case "flame":
        return "🔥"
      case "menu":
        return "☰"
      case "trash":
        return "🗑️"
      case "star":
        return "⭐"
      case "heart":
        return "❤️"
      case "check":
        return "✅"
      default:
        return iconName || "📝"
    }
  }

  // Extract NoteItem component to reduce duplication
  const NoteItem = ({ note, index, isLast }: { note: Note; index: number; isLast: boolean }) => (
    <div
      key={note.id}
      data-note-id={note.id}
      onMouseDown={editingId !== note.id ? () => handleMouseDown(note.id) : undefined}
      onMouseUp={editingId !== note.id ? handleMouseUp : undefined}
      onTouchStart={editingId !== note.id ? () => handleTouchStart(note.id) : undefined}
      onTouchEnd={editingId !== note.id ? handleTouchEnd : undefined}
      className={cn(
        "note-item overflow-hidden transition-all",
        !isLast ? "border-b border-gray-100" : "",
        selectedNotes.includes(note.id) && isSelectionActive && "bg-blue-50",
      )}
    >
      {editingId === note.id ? (
        <div className="px-2 py-1 relative">
            <Textarea
              ref={textareaRef}
              defaultValue={editingText}
              className="w-full min-h-[80px] text-foreground bg-transparent border-none resize-none focus:ring-0 focus:outline-none focus:border-none p-0 pr-12"
              placeholder="Enter your note text..."
              onBlur={(e) => {
                if (!(e.relatedTarget as Element)?.closest(".info-button")) {
                  handleSaveEdit()
                }
              }}
              autoFocus
              dir="ltr"
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
        <button
          onClick={() => handleNoteClick(note.id)}
          className="w-full px-4 py-1 flex items-center gap-3 text-left hover:bg-accent/50"
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isSelectionActive ? (
              <div
                className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer",
                  selectedNotes.includes(note.id) ? "border-blue-500 bg-blue-500" : "border-gray-300",
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleSelection(note.id)
                }}
              >
                {selectedNotes.includes(note.id) && <CheckCircle2 className="h-4 w-4 text-white" />}
              </div>
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleComplete(note.id)
                }}
                className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 transition-colors cursor-pointer"
              >
                {note.metadata?.flag && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-bold text-foreground truncate line-clamp-1">
                {note.text.split("\n")[0] || "Untitled"}
              </div>
            </div>
          </div>
        </button>
      )}
    </div>
  )



  return (
    <div className="min-h-screen bg-gray-50 mobile-container">
      {isSelectionActive && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white px-4 py-3 flex items-center justify-between z-[100] shadow-lg">
          <Button variant="ghost" size="sm" onClick={handleCancelSelection} className="text-white hover:bg-red-600">
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMoveUp}
              disabled={selectedNotes.length === 0}
              className="text-white hover:bg-red-600 disabled:opacity-50"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
            <span className="font-medium">{selectedNotes.length} selected</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMoveDown}
              disabled={selectedNotes.length === 0}
              className="text-white hover:bg-red-600 disabled:opacity-50"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={selectedNotes.length === 0}
            className="text-white hover:bg-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input placeholder="Search" className="pl-10 bg-gray-100 border-none rounded-lg" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
        {/* Standard Lists */}
        <div className="grid grid-cols-2 gap-3">
          {/* Today */}
          <button
            onClick={() => {
              setCurrentListType("today")
              setCurrentListTitle("Today")
              setShowListModal(true)
            }}
            className="bg-white rounded-xl p-4 text-left border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">{new Date().getDate()}</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{getListCount("today")}</span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Today</div>
          </button>

          {/* Planned */}
          <button
            onClick={() => {
              setCurrentListType("plan")
              setCurrentListTitle("Planned")
              setShowListModal(true)
            }}
            className="bg-white rounded-xl p-4 text-left border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📅</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{getListCount("plan")}</span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Planned</div>
          </button>

          {/* All */}
          <button
            onClick={() => {
              setCurrentListType("all")
              setCurrentListTitle("All")
              setShowListModal(true)
            }}
            className="bg-white rounded-xl p-4 text-left border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📋</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{getListCount("all")}</span>
            </div>
            <div className="text-sm text-gray-600 font-medium">All</div>
          </button>

          {/* Done */}
          <button
            onClick={() => {
              setCurrentListType("done")
              setCurrentListTitle("Completed")
              setShowListModal(true)
            }}
            className="bg-white rounded-xl p-4 text-left border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{getListCount("done")}</span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Completed</div>
          </button>
        </div>

        {/* My Lists */}
        <div>
          {/* <h2 className="text-lg font-semibold text-gray-900 mb-3">My Lists</h2> */}
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
                            const emoji = prompt("Enter emoji for list icon:")
                            if (emoji && emoji.trim()) {
                              setEditingListIcon(emoji.trim())
                            }
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          style={{ backgroundColor: list.color + "20" }}
                          title="Click to change emoji"
                        >
                          {editingListIcon || getListIcon(list.icon)}
                        </div>
                        <Input
                          type="text"
                          value={editingListName}
                          onChange={(e) => setEditingListName(e.target.value)}
                          onBlur={handleSaveListEdit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveListEdit()
                            } else if (e.key === "Escape") {
                              setEditingList(null)
                              setEditingListName("")
                              setEditingListIcon("")
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
                          style={{ backgroundColor: list.color + "20", color: list.color }}
                        >
                          {getListIcon(list.icon)}
                        </div>
                        <span className="font-medium text-gray-900">{list.name}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{getCustomListCount(list.id)}</span>
                  </div>
                </button>

                {/* List Menu */}
                {showListMenu === `custom-${list.id}` && (
                  <div className="absolute right-4 top-16 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[120px] list-menu-container">
                    <button
                      onClick={() => handleEditList(list.id)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Bottom Buttons */}
        <div className="fixed bottom-8 left-0 right-0 p-4 z-50">
          <div className="max-w-4xl mx-auto flex gap-3">
            <Button
              onClick={handleAddNote}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-blue-600 rounded-lg py-2.5 flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="h-5 w-5" />
              note
            </Button>
            <Button
              onClick={() => setShowCreateListModal(true)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2.5 flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="h-5 w-5" />
              list
            </Button>
          </div>
        </div>

      </div>

      {/* Metadata Modal */}
      {showMetadataModal && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Details</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (showMetadataModal) {
                  const currentNote = notes.find((n) => n.id === showMetadataModal)
                  if (currentNote) {
                    setNotes(
                      notes.map((note) => (note.id === showMetadataModal ? { ...note, metadata: metadataForm } : note)),
                    )
                  }
                }
                setShowMetadataModal(null)
              }}
              className="w-8 h-8 p-0"
            >
              Done
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
                  onChange={(e) => setMetadataForm({ ...metadataForm, date: e.target.value })}
                />
                <input
                  type="checkbox"
                  className="rounded"
                  checked={notes.find((n) => n.id === showMetadataModal)?.metadata?.date ? true : false}
                  onChange={(e) => {
                    const note = notes.find((n) => n.id === showMetadataModal)
                    if (note) {
                      setNotes(
                        notes.map((n) =>
                          n.id === showMetadataModal
                            ? {
                                ...n,
                                metadata: {
                                  ...n.metadata,
                                  date: e.target.checked ? metadataForm.date : undefined,
                                  location: n.metadata?.location ?? false,
                                  flag: n.metadata?.flag ?? false,
                                  priority: n.metadata?.priority ?? "None",
                                  list: n.metadata?.list ?? false,
                                  subitems: n.metadata?.subitems ?? 0,
                                },
                              }
                            : n,
                        ),
                      )
                      setMetadataForm({ ...metadataForm, date: e.target.checked ? metadataForm.date : "" })
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
                  onChange={(e) => setMetadataForm({ ...metadataForm, time: e.target.value })}
                />
                <input
                  type="checkbox"
                  className="rounded"
                  checked={!!notes.find((n) => n.id === showMetadataModal)?.metadata?.time}
                  onChange={(e) => {
                    const note = notes.find((n) => n.id === showMetadataModal)
                    if (note) {
                      if (e.target.checked) {
                        setNotes(
                          notes.map((n) =>
                            n.id === showMetadataModal
                              ? {
                                  ...n,
                                  metadata: {
                                    ...n.metadata,
                                    time: metadataForm.time,
                                    location: n.metadata?.location ?? false,
                                    flag: n.metadata?.flag ?? false,
                                    priority: n.metadata?.priority ?? "None",
                                    list: n.metadata?.list ?? false,
                                    subitems: n.metadata?.subitems ?? 0,
                                  },
                                }
                              : n,
                          ),
                        )
                      } else {
                        setNotes(
                          notes.map((n) =>
                            n.id === showMetadataModal
                              ? {
                                  ...n,
                                  metadata: {
                                    ...n.metadata,
                                    time: undefined,
                                    location: n.metadata?.location ?? false,
                                    flag: n.metadata?.flag ?? false,
                                    priority: n.metadata?.priority ?? "None",
                                    list: n.metadata?.list ?? false,
                                    subitems: n.metadata?.subitems ?? 0,
                                  },
                                }
                              : n,
                          ),
                        )
                        setMetadataForm({ ...metadataForm, time: "" })
                      }
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-gray-500" />
                <Input
                  type="text"
                  className="flex-1"
                  placeholder="Add tag"
                  value={metadataForm.tags}
                  onChange={(e) => setMetadataForm({ ...metadataForm, tags: e.target.value })}
                />
                <input
                  type="checkbox"
                  className="rounded"
                  checked={!!notes.find((n) => n.id === showMetadataModal)?.metadata?.tags}
                  onChange={(e) => {
                    const note = notes.find((n) => n.id === showMetadataModal)
                    if (note) {
                      if (e.target.checked) {
                        setNotes(
                          notes.map((n) =>
                            n.id === showMetadataModal
                              ? {
                                  ...n,
                                  metadata: {
                                    ...n.metadata,
                                    tags: metadataForm.tags,
                                    location: n.metadata?.location ?? false,
                                    flag: n.metadata?.flag ?? false,
                                    priority: n.metadata?.priority ?? "None",
                                    list: n.metadata?.list ?? false,
                                    subitems: n.metadata?.subitems ?? 0,
                                  },
                                }
                              : n,
                          ),
                        )
                      } else {
                        setNotes(
                          notes.map((n) =>
                            n.id === showMetadataModal
                              ? {
                                  ...n,
                                  metadata: {
                                    ...n.metadata,
                                    tags: undefined,
                                    location: n.metadata?.location ?? false,
                                    flag: n.metadata?.flag ?? false,
                                    priority: n.metadata?.priority ?? "None",
                                    list: n.metadata?.list ?? false,
                                    subitems: n.metadata?.subitems ?? 0,
                                  },
                                }
                              : n,
                          ),
                        )
                        setMetadataForm({ ...metadataForm, tags: "" })
                      }
                    }
                  }}
                />
              </div>

              <button
                onClick={() => setShowListSelectionModal(true)}
                className="w-full flex items-center gap-3 py-3 px-0 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <List className="h-5 w-5 text-gray-500" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700">List</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {(() => {
                        const note = notes.find((n) => n.id === showMetadataModal)
                        if (!note?.listId) return "All Notes"
                        const list = customLists.find((l) => l.id === note.listId)
                        return list?.name || "All Notes"
                      })()}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

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
              Back
            </Button>
            <h3 className="text-lg font-semibold">All Notes</h3>
            <div className="w-16"></div>
          </div>

          <div className="flex-1 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-0">
                {sortedNotes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No notes</div>
                ) : (
                  sortedNotes.map((note, index) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      index={index}
                      isLast={index === sortedNotes.length - 1}
                    />
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
              Back
            </Button>
            <h3 className="text-lg font-semibold">{currentListTitle}</h3>
            {currentListType.startsWith("custom-") ? (
              <div className="list-menu-container relative">
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowListMenu(showListMenu === currentListType ? null : currentListType)
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="h-5 w-5 text-gray-400" />
                </div>
                {showListMenu === currentListType && (
                  <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[120px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditList(currentListType.replace("custom-", ""))
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteList(currentListType.replace("custom-", ""))
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-8"></div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-0">
                {(() => {
                  let listNotes = []
                  if (currentListType.startsWith("custom-")) {
                    const listId = currentListType.replace("custom-", "")
                    listNotes = notes.filter((note) => note.listId === listId && note.metadata?.flag !== true)
                  } else {
                    listNotes = filterNotesByType(currentListType)
                  }

                  if (listNotes.length === 0) {
                    return <div className="text-center py-12 text-muted-foreground">No notes</div>
                  }

                  // For planned list, split into current and overdue
                  if (currentListType === "plan") {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const todayTime = today.getTime()

                    const currentNotes = listNotes.filter(note => {
                      if (note.metadata?.date) {
                        const noteDate = new Date(note.metadata.date)
                        return noteDate.getTime() >= todayTime
                      }
                      return false
                    }).sort((a, b) => {
                      if (a.metadata?.date && b.metadata?.date) {
                        return new Date(a.metadata.date).getTime() - new Date(b.metadata.date).getTime()
                      }
                      return 0
                    })

                    const overdueNotes = listNotes.filter(note => {
                      if (note.metadata?.date) {
                        const noteDate = new Date(note.metadata.date)
                        return noteDate.getTime() < todayTime
                      }
                      return false
                    }).sort((a, b) => {
                      if (a.metadata?.date && b.metadata?.date) {
                        return new Date(a.metadata.date).getTime() - new Date(b.metadata.date).getTime()
                      }
                      return 0
                    })

                    return (
                      <>
                        {currentNotes.map((note, index) => (
                          <NoteItem
                            key={note.id}
                            note={note}
                            index={index}
                            isLast={index === currentNotes.length - 1}
                          />
                        ))}
                        {overdueNotes.length > 0 && (
                          <>
                            <div className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium border-b border-gray-100">
                              Overdue
                            </div>
                            {overdueNotes.map((note, index) => (
                              <NoteItem
                                key={note.id}
                                note={note}
                                index={index}
                                isLast={index === overdueNotes.length - 1}
                              />
                            ))}
                          </>
                        )}
                      </>
                    )
                  }

                  return listNotes.map((note, index) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      index={index}
                      isLast={index === listNotes.length - 1}
                    />
                  ))
                })()}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const newNote: Note = {
                  id: Date.now().toString(),
                  text: "",
                  createdAt: Date.now(),
                  executionTime: Date.now() + 86400000,
                  color: "#6b7280",
                }

                if (currentListType === "done") {
                  newNote.metadata = {
                    location: false,
                    flag: true,
                    priority: "None",
                    list: false,
                    subitems: 0,
                  }
                } else if (currentListType === "today") {
                  newNote.metadata = {
                    date: today.toISOString().split("T")[0],
                    location: false,
                    flag: false,
                    priority: "None",
                    list: false,
                    subitems: 0,
                  }
                } else if (currentListType.startsWith("custom-")) {
                  newNote.listId = currentListType.replace("custom-", "")
                }

                setNotes([newNote, ...notes])
                setEditingId(newNote.id)
                setEditingText("")
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-3 flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="h-5 w-5" />
              Note
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
              Back
            </Button>
            <h3 className="text-lg font-semibold">New List</h3>
            <Button variant="ghost" size="sm" onClick={handleCreateList} className="text-blue-600 font-medium">
              Done
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <Input
                  type="text"
                  placeholder="List name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newListName.trim()) {
                      handleCreateList()
                    }
                  }}
                  className="w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Insert emoji"
                      value={newListIcon}
                      onChange={(e) => setNewListIcon(e.target.value)}
                      className="flex-1"
                      maxLength={2}
                    />
                    <div className="w-12 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center text-2xl">
                      {newListIcon || "📝"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-2">or choose from suggested:</div>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { name: "menu", emoji: "☰" },
                        { name: "bell", emoji: "🔔" },
                        { name: "flame", emoji: "🔥" },
                        { name: "star", emoji: "⭐" },
                        { name: "heart", emoji: "❤️" },
                        { name: "check", emoji: "✅" },
                      ].map((icon) => (
                        <button
                          key={icon.name}
                          onClick={() => setNewListIcon(icon.emoji)}
                          className={cn(
                            "w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl transition-all",
                            newListIcon === icon.emoji
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300",
                          )}
                          title={`Select ${icon.emoji}`}
                        >
                          {icon.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="grid grid-cols-6 gap-2">
                  {["#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#00D4AA", "#007AFF", "#5856D6", "#AF52DE"].map(
                    (color) => (
                      <button
                        key={color}
                        onClick={() => setNewListColor(color)}
                        className={cn(
                          "w-12 h-12 rounded-lg border-2 transition-all",
                          newListColor === color ? "border-gray-800" : "border-gray-200",
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditListModal && editingListModal && (
        <div className="fixed inset-0 bg-white z-[65] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowEditListModal(false)
                setEditingListModal(null)
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h3 className="text-lg font-semibold">Edit List</h3>
            <Button variant="ghost" size="sm" onClick={handleSaveListEditModal} className="text-blue-600 font-medium">
              Done
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <Input
                  type="text"
                  placeholder="List name"
                  value={editingListModal.name}
                  onChange={(e) => setEditingListModal({ ...editingListModal, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editingListModal.name.trim()) {
                      handleSaveListEditModal()
                    }
                  }}
                  className="w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Insert emoji"
                      value={editingListModal.icon}
                      onChange={(e) => setEditingListModal({ ...editingListModal, icon: e.target.value })}
                      className="flex-1"
                      maxLength={2}
                    />
                    <div className="w-12 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center text-2xl">
                      {getListIcon(editingListModal.icon)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-2">or choose from suggested:</div>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { name: "menu", emoji: "☰" },
                        { name: "bell", emoji: "🔔" },
                        { name: "flame", emoji: "🔥" },
                        { name: "star", emoji: "⭐" },
                        { name: "heart", emoji: "❤️" },
                        { name: "check", emoji: "✅" },
                      ].map((icon) => (
                        <button
                          key={icon.name}
                          onClick={() => setEditingListModal({ ...editingListModal, icon: icon.emoji })}
                          className={cn(
                            "w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl transition-all",
                            editingListModal.icon === icon.emoji
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300",
                          )}
                          title={`Select ${icon.emoji}`}
                        >
                          {icon.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="grid grid-cols-6 gap-2">
                  {["#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#00D4AA", "#007AFF", "#5856D6", "#AF52DE"].map(
                    (color) => (
                      <button
                        key={color}
                        onClick={() => setEditingListModal({ ...editingListModal, color })}
                        className={cn(
                          "w-12 h-12 rounded-lg border-2 transition-all",
                          editingListModal.color === color ? "border-gray-800" : "border-gray-200",
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showListSelectionModal && (
        <div className="fixed inset-0 bg-white z-[70] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowListSelectionModal(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h3 className="text-lg font-semibold">List</h3>
            <div className="w-16"></div>
          </div>

          <div className="flex-1 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1 p-4">
              <button
                onClick={() => {
                  if (showMetadataModal) {
                    setNotes(
                      notes.map((note) => (note.id === showMetadataModal ? { ...note, listId: undefined } : note)),
                    )
                  }
                  setShowListSelectionModal(false)
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors",
                  !notes.find((n) => n.id === showMetadataModal)?.listId && "bg-blue-50",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-lg">📋</div>
                  <span className="font-medium text-gray-900">All Notes</span>
                </div>
                {!notes.find((n) => n.id === showMetadataModal)?.listId && (
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                )}
              </button>

              {customLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => {
                    if (showMetadataModal) {
                      setNotes(
                        notes.map((note) => (note.id === showMetadataModal ? { ...note, listId: list.id } : note)),
                      )
                    }
                    setShowListSelectionModal(false)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors",
                    notes.find((n) => n.id === showMetadataModal)?.listId === list.id && "bg-blue-50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: list.color + "20", color: list.color }}
                    >
                      {getListIcon(list.icon)}
                    </div>
                    <span className="font-medium text-gray-900">{list.name}</span>
                  </div>
                  {notes.find((n) => n.id === showMetadataModal)?.listId === list.id && (
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
