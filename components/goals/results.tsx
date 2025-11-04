"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X, ChevronRight, ChevronLeft } from "lucide-react"
import { Result } from "@/types/supabase"

type Achievement = {
  id: number
  title: string
  subtitle?: string
  image?: string // optional url or emoji
  description: string
}

type InventoryItem = {
  id: number
  name: string
  emoji?: string
  count?: number
  description?: string
}

type InventoryCell = {
  id: number
  item?: InventoryItem | null
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children?: any }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-lg w-full overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="p-1 rounded hover:bg-gray-100" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export default function Results() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [inventoryItems, setInventoryItems] = useState<Result[]>([])
  const [knowledgeItems, setKnowledgeItems] = useState<Result[]>([])
  const [baseBackgrounds, setBaseBackgrounds] = useState<Result[]>([])
  const [characterBackgrounds, setCharacterBackgrounds] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch achievements
        const achievementsRes = await fetch('/api/results?type=achievement')
        if (achievementsRes.ok) {
          const achievementsData: Result[] = await achievementsRes.json()
          const formattedAchievements: Achievement[] = achievementsData.map(result => ({
            id: result.id,
            title: result.title,
            subtitle: result.info?.subtitle || '',
            image: result.img || '',
            description: result.description || ''
          }))
          setAchievements(formattedAchievements)
        }

        // Fetch inventory items
        const itemsRes = await fetch('/api/results?type=item')
        if (itemsRes.ok) {
          const itemsData: Result[] = await itemsRes.json()
          setInventoryItems(itemsData)
        }

        // Fetch knowledge items (books)
        const booksRes = await fetch('/api/results?type=book')
        if (booksRes.ok) {
          const booksData: Result[] = await booksRes.json()
          setKnowledgeItems(booksData)
        }

        // Fetch base backgrounds
        const baseRes = await fetch('/api/results?type=base')
        if (baseRes.ok) {
          const baseData: Result[] = await baseRes.json()
          setBaseBackgrounds(baseData)
        }

        // Fetch character backgrounds
        const characterRes = await fetch('/api/results?type=character')
        if (characterRes.ok) {
          const characterData: Result[] = await characterRes.json()
          setCharacterBackgrounds(characterData)
        }

      } catch (error) {
        console.error('Error fetching results data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Create inventory grid from items
  const inventory: InventoryCell[] = Array.from({ length: 60 }).map((_, i) => ({
    id: i + 1,
    item: i < inventoryItems.length ? {
      id: inventoryItems[i].id,
      name: inventoryItems[i].title,
      emoji: inventoryItems[i].img || '',
      description: inventoryItems[i].description || '',
      count: inventoryItems[i].info?.count || 1
    } : null,
  }))

  // Create knowledge grid from books
  const knowledge: InventoryCell[] = Array.from({ length: 60 }).map((_, i) => ({
    id: i + 1,
    item: i < knowledgeItems.length ? {
      id: knowledgeItems[i].id,
      name: knowledgeItems[i].title,
      emoji: knowledgeItems[i].img || '',
      description: knowledgeItems[i].description || '',
      count: knowledgeItems[i].info?.count || 1
    } : null,
  }))
  // floating top-left control open state
  const [floaterOpen, setFloaterOpen] = useState(false)
  // responsive circle size (px) — 1/12 of min(viewport width, height)
  const [circleSize, setCircleSize] = useState<number>(() => {
    if (typeof window === "undefined") return 60
    return Math.floor(Math.min(window.innerWidth/ 12, window.innerHeight/24) )
  })
  useEffect(() => {
    const onResize = () => setCircleSize(Math.floor(Math.min(window.innerWidth, window.innerHeight) / 12))
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  // tabs for the floating buttons (emoji -> tab key/title)
  const tabs = [
    { key: "base", emoji: "🏡", title: "Base" },
    { key: "character", emoji: "😀", title: "Character" },
    { key: "reputation", emoji: "👍", title: "Reputation" },
    { key: "achievements", emoji: "🏆", title: "Achievements" },
    { key: "inventory", emoji: "🎒", title: "Inventory" },
    { key: "knowledge", emoji: "📚", title: "Knowledge" },
  ]
  const [activeTab, setActiveTab] = useState<string>("achievements")
  // index of empty slot being filled by picker (null = none)
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)
  // base tab state
  const [baseIndex, setBaseIndex] = useState(0)
  // character tab state
  const [characterIndex, setCharacterIndex] = useState(0)
  // inventory and knowledge state management
  const [inventorySlots, setInventorySlots] = useState<InventoryCell[]>([])
  const [knowledgeSlots, setKnowledgeSlots] = useState<InventoryCell[]>([])

  // Initialize inventory and knowledge slots when data is loaded
  useEffect(() => {
    if (inventoryItems.length > 0) {
      const slots = Array.from({ length: 60 }).map((_, i) => ({
        id: i + 1,
        item: i < inventoryItems.length ? {
          id: inventoryItems[i].id,
          name: inventoryItems[i].title,
          emoji: inventoryItems[i].img || '',
          description: inventoryItems[i].description || '',
          count: inventoryItems[i].info?.count || 1
        } : null,
      }))
      setInventorySlots(slots)
    }
  }, [inventoryItems])

  useEffect(() => {
    if (knowledgeItems.length > 0) {
      const slots = Array.from({ length: 60 }).map((_, i) => ({
        id: i + 1,
        item: i < knowledgeItems.length ? {
          id: knowledgeItems[i].id,
          name: knowledgeItems[i].title,
          emoji: knowledgeItems[i].img || '',
          description: knowledgeItems[i].description || '',
          count: knowledgeItems[i].info?.count || 1
        } : null,
      }))
      setKnowledgeSlots(slots)
    }
  }, [knowledgeItems])



  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [modalContent, setModalContent] = useState<any>("")

  const openAchievementModal = (a: Achievement) => {
    setModalTitle(a.title)
    setModalContent(
      <div className="space-y-3">
        {typeof a.image === "string" && /^https?:\/\//.test(a.image) ? (
          <img src={a.image} alt={a.title} className="w-full max-h-56 object-contain rounded" />
        ) : (
          <div className="text-6xl">{a.image}</div>
        )}
        {a.subtitle && <p className="text-sm text-gray-600">{a.subtitle}</p>}
        <p className="text-gray-800">{a.description}</p>
      </div>
    )
    setModalOpen(true)
  }

  const openInventoryItemModal = (item: InventoryItem) => {
    setModalTitle(item.name)
    setModalContent(
      <div className="space-y-3">
        {typeof item.emoji === "string" && /^https?:\/\//.test(item.emoji) ? (
          <img src={item.emoji} alt={item.name} className="w-full max-h-56 object-contain rounded" />
        ) : (
          <div className="text-6xl">{item.emoji}</div>
        )}
        <p className="text-sm text-gray-600">Count: {item.count ?? 1}</p>
        <p className="text-gray-800">{item.description}</p>
      </div>
    )
    setModalOpen(true)
  }

  // Functions for managing inventory and knowledge slots
  const openItemPicker = (slotIndex: number, type: 'inventory' | 'knowledge') => {
    const availableItems = type === 'inventory' ? inventoryItems : knowledgeItems
    setPickerSlot(slotIndex)
    setModalTitle(`Choose ${type === 'inventory' ? 'item' : 'knowledge'}`)
    setModalContent(
      <div className="grid grid-cols-6 gap-2 p-2 max-h-96 overflow-y-auto">
        {availableItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (type === 'inventory') {
                setInventorySlots(prev => {
                  const newSlots = [...prev]
                  newSlots[slotIndex] = {
                    ...newSlots[slotIndex],
                    item: {
                      id: item.id,
                      name: item.title,
                      emoji: item.img || '',
                      description: item.description || '',
                      count: item.info?.count || 1
                    }
                  }
                  return newSlots
                })
              } else {
                setKnowledgeSlots(prev => {
                  const newSlots = [...prev]
                  newSlots[slotIndex] = {
                    ...newSlots[slotIndex],
                    item: {
                      id: item.id,
                      name: item.title,
                      emoji: item.img || '',
                      description: item.description || '',
                      count: item.info?.count || 1
                    }
                  }
                  return newSlots
                })
              }
              setPickerSlot(null)
              setModalOpen(false)
            }}
            className="flex items-center justify-center h-10 w-10 bg-white border rounded hover:bg-gray-50"
            title={item.title}
          >
            {typeof item.img === "string" && /^https?:\/\//.test(item.img) ? (
              <img src={item.img} alt={item.title} className="w-6 h-6 object-cover rounded" />
            ) : (
              <span className="text-lg">{item.img}</span>
            )}
          </button>
        ))}
      </div>
    )
    setModalOpen(true)
  }

  const removeItem = (slotIndex: number, type: 'inventory' | 'knowledge') => {
    if (type === 'inventory') {
      setInventorySlots(prev => {
        const newSlots = [...prev]
        newSlots[slotIndex] = { ...newSlots[slotIndex], item: null }
        return newSlots
      })
    } else {
      setKnowledgeSlots(prev => {
        const newSlots = [...prev]
        newSlots[slotIndex] = { ...newSlots[slotIndex], item: null }
        return newSlots
      })
    }
  }


  const gap = 2
  const totalCircles = 7 // toggle + 6 empty circles
  const panelWidth = circleSize * totalCircles + gap * (totalCircles - 1)

  return (
  <div className="relative flex flex-col h-full bg-white overscroll-none">
      {/* Floating top-left control */}
  <div className="absolute top-0 left-0 z-50">
        {/* Frosted panel: width = min(100vw, 100vh) so it fits either screen orientation */}
        <div
          className="relative rounded-full shadow-lg overflow-hidden"
          style={{ width: floaterOpen ? panelWidth : circleSize, height: circleSize, transition: "width 260ms cubic-bezier(.2,.8,.2,1)" }}
        >
          {/* background layer (match achievements overlay bg) */}
          <div className="absolute inset-0 rounded-full bg-black/20 backdrop-blur-md" style={{ border: "1px solid rgba(255,255,255,0.06)" }} />

          {/* content row (no extra padding — circles fit exactly) */}
          <div className="relative z-10 h-full flex items-center">
            {/* left area for toggle + circles occupying full panel width */}
            <div className="relative" style={{ width: panelWidth, height: "100%" }}>
              {tabs.map((tab, i) => {
                const size = circleSize
                const offset = (i + 1) * (size + gap)
                const leftPos = floaterOpen ? offset : 0
                const style: React.CSSProperties = {
                  left: leftPos,
                  transition: "left 240ms cubic-bezier(.2,.8,.2,1), opacity 200ms",
                  opacity: floaterOpen ? 1 : 0,
                  pointerEvents: floaterOpen ? "auto" : "none",
                  position: "absolute",
                  width: size,
                  height: size,
                  borderRadius: "9999px",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                }
                return (
                  <button
                    key={tab.key}
                    style={style}
                    aria-label={tab.title}
                    title={tab.title}
                    className="flex items-center justify-center"
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <div style={{ width: '100%', height: '100%', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.max(12, Math.floor(circleSize / 2.8)), background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(220,220,220,0.15))', border: '1px solid rgba(0,0,0,0.3)' }}>
                      <span>{tab.emoji}</span>
                    </div>
                  </button>
                )
              })}

              {/* Toggle button (leftmost circle) */}
              <button onClick={() => setFloaterOpen((v) => !v)} aria-label="Toggle floating circles" className="relative flex items-center justify-center" style={{ left: 0, position: "absolute", width: circleSize, height: circleSize }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '9999px', background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(220,220,220,0.15))', border: '1px solid rgba(0,0,0,0.3)' }} />
                {floaterOpen ? (
                  <ChevronLeft className="absolute" style={{ width: Math.max(12, Math.floor(circleSize / 5)), height: Math.max(12, Math.floor(circleSize / 5)), color: 'white' }} />
                ) : (
                  <ChevronRight className="absolute" style={{ width: Math.max(12, Math.floor(circleSize / 5)), height: Math.max(12, Math.floor(circleSize / 5)), color: 'white' }} />
                )}
              </button>
            </div>

            {/* optional spacer or other controls can go here */}
          </div>
        </div>
      </div>


  {/* Top: Achievements (full height) */}
  {activeTab === "achievements" && (
  <div className="h-full flex flex-col">
  <div className="p-4 flex-1 overflow-y-auto">
          {/* <h2 className="text-lg font-medium mb-4">Achievements (Reputation)</h2> */}
          {/* Achievements: responsive grid, 3 columns on mobile, 6 columns on horizontal screens */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {achievements.map((a) => (
              <button
                key={a.id}
                onClick={() => openAchievementModal(a)}
                className="aspect-square bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200 text-left relative overflow-hidden flex flex-col items-center justify-center p-3"
              >
                {/* Background image or emoji */}
                {typeof a.image === "string" && /^https?:\/\//.test(a.image) ? (
                  <img src={a.image} alt={a.title} className="w-12 h-12 object-cover rounded mb-2" />
                ) : (
                  <div className="text-3xl mb-2">{a.image}</div>
                )}

                {/* Title and subtitle */}
                <div className="text-center">
                  <div className="font-semibold text-sm text-gray-800 leading-tight">{a.title}</div>
                  {a.subtitle && <div className="text-xs text-gray-600 mt-1">{a.subtitle}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Placeholder for other tabs */}
      {activeTab !== "achievements" && activeTab !== "inventory" && activeTab !== "knowledge" && activeTab !== "base" && activeTab !== "character" && (
        <div className="p-0">
          <h2 className="text-xl font-semibold">{tabs.find((t) => t.key === activeTab)?.title ?? ""}</h2>
        </div>
      )}

      {/* Bottom: Inventory */}
      {activeTab === "inventory" && (
  <div className="py-0 px-0 overflow-y-auto">
        {/* Palette: draggable items to add into empty slots */}
          {/* top palette removed per UX request */}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-0 justify-items-stretch">
          {inventorySlots.map((cell, idx) => {
            const it = cell.item
            return (
              <div key={cell.id} className="relative">
                {it ? (
                  <div
                    className="aspect-square w-full bg-white border rounded-lg relative overflow-hidden flex items-center justify-center hover:shadow-sm"
                  >
                        <div
                          onClick={() => openInventoryItemModal(it)}
                          className="absolute inset-0 flex items-center justify-center text-5xl leading-none select-none"
                        >
                          {typeof it.emoji === "string" && /^https?:\/\//.test(it.emoji) ? (
                            <img src={it.emoji} alt={it.name} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <div className="text-5xl">{it.emoji}</div>
                          )}
                        </div>
                    <div className="absolute bottom-1 left-1 right-1 text-center text-xs bg-white/70 rounded px-1 py-0.5">{it.name}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItem(idx, 'inventory')
                      }}
                      className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5 text-xs hover:bg-red-100"
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    className="aspect-square w-full bg-gray-50 border rounded-lg flex items-center justify-center text-sm text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => openItemPicker(idx, 'inventory')}
                  >
                    +
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      )}

      {/* Knowledge */}
      {activeTab === "knowledge" && (
  <div className="py-0 px-0 overflow-y-auto">
        {/* Palette: draggable items to add into empty slots */}
          {/* top palette removed per UX request */}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-0 justify-items-stretch">
          {knowledgeSlots.map((cell, idx) => {
            const it = cell.item
            return (
              <div key={cell.id} className="relative">
                {it ? (
                  <div
                    className="aspect-square w-full bg-white border rounded-lg relative overflow-hidden flex items-center justify-center hover:shadow-sm"
                  >
                        <div
                          onClick={() => openInventoryItemModal(it)}
                          className="absolute inset-0 flex items-center justify-center text-5xl leading-none select-none"
                        >
                          {typeof it.emoji === "string" && /^https?:\/\//.test(it.emoji) ? (
                            <img src={it.emoji} alt={it.name} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <div className="text-5xl">{it.emoji}</div>
                          )}
                        </div>
                    <div className="absolute bottom-1 left-1 right-1 text-center text-xs bg-white/70 rounded px-1 py-0.5">{it.name}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItem(idx, 'knowledge')
                      }}
                      className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5 text-xs hover:bg-red-100"
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    className="aspect-square w-full bg-gray-50 border rounded-lg flex items-center justify-center text-sm text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => openItemPicker(idx, 'knowledge')}
                  >
                    +
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      )}

      {/* Base */}
      {activeTab === "base" && (
        <div className="relative h-full flex">
          {/* Left gray stripe - only on horizontal screens */}
          {window.innerWidth > window.innerHeight && <div className="w-8 bg-gray-200 flex-shrink-0"></div>}
          {/* Center content with background image */}
          <div className="flex-1 relative bg-gray-200" style={{ backgroundImage: `url(${baseBackgrounds[baseIndex]?.img})`, backgroundSize: 'auto 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
            <button
              className="absolute bottom-4 right-4 w-16 h-16 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg bg-black/50"
              onClick={() => {
                setBaseIndex(prev => (prev + 1) % baseBackgrounds.length)
              }}
            >
              {baseIndex + 1}
            </button>
          </div>
          {/* Right gray stripe - only on horizontal screens */}
          {window.innerWidth > window.innerHeight && <div className="w-8 bg-gray-200 flex-shrink-0"></div>}
        </div>
      )}

      {/* Character */}
      {activeTab === "character" && (
        <div className="relative h-full flex">
          {/* Left gray stripe - only on horizontal screens */}
          {window.innerWidth > window.innerHeight && <div className="w-8 bg-gray-200 flex-shrink-0"></div>}
          {/* Center content with background image */}
          <div className="flex-1 relative bg-gray-200" style={{ backgroundImage: `url(${characterBackgrounds[characterIndex]?.img})`, backgroundSize: 'auto 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
            <button
              className="absolute bottom-4 right-4 w-16 h-16 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg bg-black/50"
              onClick={() => {
                setCharacterIndex(prev => (prev + 1) % characterBackgrounds.length)
              }}
            >
              {characterIndex + 1}
            </button>
          </div>
          {/* Right gray stripe - only on horizontal screens */}
          {window.innerWidth > window.innerHeight && <div className="w-8 bg-gray-200 flex-shrink-0"></div>}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        {modalContent}
      </Modal>
    </div>
  )
}
