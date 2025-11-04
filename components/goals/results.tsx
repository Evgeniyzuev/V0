"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X, ChevronRight, ChevronLeft } from "lucide-react"

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

const sampleAchievements: Achievement[] = [
  { id: 1, title: "Core", subtitle: "LVL 8", image: "https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreibb77axafktdr7vjlurwizg6fh54so2pfwhlg2wqeluy5sweuk3ya", description: "Yor core at level 8" },
  { id: 2, title: "Explorer", subtitle: "Visited 10 places", image: "https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreibb77axafktdr7vjlurwizg6fh54so2pfwhlg2wqeluy5sweuk3ya", description: "You explored new areas and discovered secrets." },
  { id: 3, title: "Collector", subtitle: "Collected 50 items", image: "💎", description: "A seasoned collector of rare items." },
  { id: 4, title: "Champion", subtitle: "Top 10 in leaderboard", image: "🥇", description: "You ranked high in the weekly leaderboard." },
  { id: 5, title: "Marathoner", subtitle: "Complete 100 tasks", image: "🏃‍♂️", description: "You demonstrate persistence and consistency." },
  { id: 6, title: "Socializer", subtitle: "10 friends invited", image: "🤝", description: "You helped grow the community by inviting others." },
  { id: 7, title: "Strategist", subtitle: "5 goals planned", image: "🧠", description: "You planned and prioritized important goals effectively." },
  { id: 8, title: "Treasure Hunter", subtitle: "Found hidden item", image: "🗺️", description: "You found a rare treasure while exploring." },
  { id: 9, title: "Innovator", subtitle: "Created a feature", image: "💡", description: "You shipped something useful." },
  { id: 10, title: "Helper", subtitle: "Answered 10 questions", image: "🆘", description: "You helped the community." },
  { id: 11, title: "Speedster", subtitle: "Fast completion", image: "⚡", description: "Completed a task very quickly." },
  { id: 12, title: "Perfectionist", subtitle: "All subtasks done", image: "✅", description: "You finished every subtask." },
  { id: 13, title: "Collaborator", subtitle: "Worked with a friend", image: "🤝", description: "Teamwork makes the dream work." },
  { id: 14, title: "Architect", subtitle: "Planned 10 steps", image: "🏗️", description: "You created a solid plan." },
  { id: 15, title: "Gardener", subtitle: "Grew a garden", image: "🌱", description: "You nurtured something over time." },
  { id: 16, title: "Archivist", subtitle: "Saved 100 notes", image: "🗂️", description: "Your records are complete." },
]

// Palette of available item types (16 distinct items)
const samplePalette: InventoryItem[] = [
  { id: 1, name: "Ruby", emoji: "🔴", description: "A small red gem." },
  { id: 2, name: "Bread", emoji: "🍞", description: "Restores energy." },
  { id: 3, name: "Potion", emoji: "🧪", description: "Heals wounds." },
  { id: 4, name: "Coin", emoji: "🪙", description: "Currency." },
  { id: 5, name: "Key", emoji: "🗝️", description: "Opens locks." },
  { id: 6, name: "Map", emoji: "�️", description: "Shows locations." },
  { id: 7, name: "Book", emoji: "📘", description: "Knowledge." },
  { id: 8, name: "Feather", emoji: "🪶", description: "Light item." },
  { id: 9, name: "Gem", emoji: "💎", description: "Valuable gem." },
  { id: 10, name: "Apple", emoji: "�", description: "Healthy snack." },
  { id: 11, name: "Shield", emoji: "🛡️", description: "Protection." },
  { id: 12, name: "Sword", emoji: "🗡️", description: "Weapon." },
  { id: 13, name: "Lantern", emoji: "🏮", description: "Lights the way." },
  { id: 14, name: "Scroll", emoji: "📜", description: "Ancient knowledge." },
  { id: 15, name: "Ticket", emoji: "🎫", description: "Entry pass." },
  { id: 16, name: "Crown", emoji: "👑", description: "Rare trophy." },
]

// Inventory: 10 rows × 6 columns = 60 slots (no gaps). Fill first 16 slots with different items from palette.
const sampleInventory: InventoryCell[] = Array.from({ length: 60 }).map((_, i) => ({
  id: i + 1,
  item: i < samplePalette.length ? { ...samplePalette[i] } : null,
}))

export default function Results() {
  const [achievements] = useState<Achievement[]>(sampleAchievements)
  const [inventory, setInventory] = useState<InventoryCell[]>(sampleInventory)
  // floating top-left control open state
  const [floaterOpen, setFloaterOpen] = useState(false)
  // responsive circle size (px) — 1/12 of min(viewport width, height)
  const [circleSize, setCircleSize] = useState<number>(() => {
    if (typeof window === "undefined") return 60
    return Math.floor(Math.min(window.innerWidth, window.innerHeight) / 12)
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

  // ref + state for horizontal achievements carousel
  const achRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [thumbLeft, setThumbLeft] = useState(0)
  const [thumbWidth, setThumbWidth] = useState(0)

  useEffect(() => {
    const el = achRef.current
    if (!el) return

    const update = () => {
      setCanScrollLeft(el.scrollLeft > 0)
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
      // update custom thumb
      if (el.scrollWidth > el.clientWidth) {
        const left = (el.scrollLeft / (el.scrollWidth - el.clientWidth)) * 100
        const width = (el.clientWidth / el.scrollWidth) * 100
        setThumbLeft(left)
        setThumbWidth(width)
      } else {
        setThumbLeft(0)
        setThumbWidth(0)
      }
    }

    update()
    // update on resize
    window.addEventListener("resize", update)
    // cleanup
    return () => window.removeEventListener("resize", update)
  }, [achRef])

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
        <div className="text-6xl">{item.emoji}</div>
        <p className="text-sm text-gray-600">Count: {item.count ?? 1}</p>
        <p className="text-gray-800">{item.description}</p>
      </div>
    )
    setModalOpen(true)
  }
  const scrollAchievements = (dir: "left" | "right") => {
    const el = achRef.current
    if (!el) return
    const step = Math.max(220, Math.floor(el.clientWidth * 0.6))
    el.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" })
    // optimistic update (the effect + scroll event will correct it)
    setTimeout(() => {
      setCanScrollLeft(el.scrollLeft > 0)
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
    }, 300)
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
                <ChevronRight className="absolute" style={{ width: Math.max(12, Math.floor(circleSize / 5)), height: Math.max(12, Math.floor(circleSize / 5)), color: '#4B5563' }} />
              </button>
            </div>

            {/* optional spacer or other controls can go here */}
          </div>
        </div>
      </div>


  {/* Top: Achievements (half) */}
  {activeTab === "achievements" && (
  <div>
  <div className="p-0 relative">
          {/* <h2 className="text-lg font-medium mb-2">Achievements (Reputation)</h2> */}
          {/* Achievements: 2 rows per column, square cards matching add-wish style */}
          <div
            ref={achRef}
            onScroll={() => {
              const el = achRef.current
              if (!el) return
              setCanScrollLeft(el.scrollLeft > 0)
              setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
              if (el.scrollWidth > el.clientWidth) {
                const left = (el.scrollLeft / (el.scrollWidth - el.clientWidth)) * 100
                const width = (el.clientWidth / el.scrollWidth) * 100
                setThumbLeft(left)
                setThumbWidth(width)
              } else {
                setThumbLeft(0)
                setThumbWidth(0)
              }
            }}
            className="overflow-x-auto ach-carousel overscroll-none"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="grid grid-rows-2 grid-flow-col auto-cols-[200px] gap-0 pb-0 items-start">
              {achievements.map((a) => (
                <button
                  key={a.id}
                  onClick={() => openAchievementModal(a)}
                  className="aspect-square w-[200px] flex-shrink-0 bg-white rounded-sm p-0 border hover:shadow-sm text-left relative overflow-hidden"
                >
                  {/* Background image or emoji */}
                  {typeof a.image === "string" && /^https?:\/\//.test(a.image) ? (
                    <img src={a.image} alt={a.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-95">{a.image}</div>
                  )}

                  {/* Foreground overlay with title on top of image */}
                  <div className="relative z-10 mt-auto p-2">
                    <div className="bg-black/60 rounded px-2 py-1 inline-block">
                      <div className="font-semibold text-sm text-white">{a.title}</div>
                      {a.subtitle && <div className="text-xs text-white mt-1 bg-black/40 rounded px-1 inline-block">{a.subtitle}</div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* custom overlay removed to avoid duplicate scrollbar visuals */}

          {/* arrows removed per request */}
        </div>
      </div>
      )}

      {/* Placeholder for other tabs */}
      {activeTab !== "achievements" && activeTab !== "inventory" && (
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
          {inventory.map((cell, idx) => {
            const it = cell.item
            return (
              <div key={cell.id} className="relative">
                {it ? (
                  <div
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", String(idx))}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const data = e.dataTransfer.getData("text/plain")
                      // if dropped from palette
                      if (data.startsWith("palette-")) {
                        const pid = Number(data.split("-")[1])
                        const p = samplePalette.find((x) => x.id === pid)
                        if (p) {
                          setInventory((prev) => {
                            const copy = prev.slice()
                            copy[idx] = { ...copy[idx], item: { ...p } }
                            return copy
                          })
                        }
                      } else {
                        const src = Number(data)
                        if (!Number.isNaN(src)) {
                          setInventory((prev) => {
                            const copy = prev.slice()
                            const moving = copy[src].item
                            copy[src] = { ...copy[src], item: null }
                            copy[idx] = { ...copy[idx], item: moving }
                            return copy
                          })
                        }
                      }
                    }}
                    className="aspect-square w-full bg-white border rounded-lg relative overflow-hidden flex items-center justify-center hover:shadow-sm"
                  >
                        <div
                          onClick={() => openInventoryItemModal(it)}
                          className="absolute inset-0 flex items-center justify-center text-5xl leading-none select-none"
                        >
                          {it.emoji}
                        </div>
                    <div className="absolute bottom-1 left-1 right-1 text-center text-xs bg-white/70 rounded px-1 py-0.5">{it.name}</div>
                    <button
                          onClick={(e) => {
                            // prevent opening item modal when clicking remove
                            e.stopPropagation()
                            setInventory((prev) => {
                              const copy = prev.slice()
                              copy[idx] = { ...copy[idx], item: null }
                              return copy
                            })
                          }}
                      className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5 text-xs"
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const data = e.dataTransfer.getData("text/plain")
                      if (data.startsWith("palette-")) {
                        const pid = Number(data.split("-")[1])
                        const p = samplePalette.find((x) => x.id === pid)
                        if (p) {
                          setInventory((prev) => {
                            const copy = prev.slice()
                            copy[idx] = { ...copy[idx], item: { ...p } }
                            return copy
                          })
                        }
                          if (p) {
                            setInventory((prev) => {
                              const copy = prev.slice()
                              copy[idx] = { ...copy[idx], item: { ...p } }
                              return copy
                            })
                          }
                      } else {
                        const src = Number(data)
                        if (!Number.isNaN(src)) {
                          setInventory((prev) => {
                            const copy = prev.slice()
                            const moving = copy[src].item
                            copy[src] = { ...copy[src], item: null }
                            copy[idx] = { ...copy[idx], item: moving }
                            return copy
                          })
                        }
                      }
                    }}
                    className="aspect-square w-full bg-gray-50 border rounded-lg flex items-center justify-center text-sm text-gray-400 cursor-pointer"
                    onClick={() => {
                      // open picker for this empty slot
                      setPickerSlot(idx)
                      setModalTitle("Choose an item")
                      setModalContent(
                        <div className="grid grid-cols-6 gap-2 p-2">
                          {samplePalette.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setInventory((prev) => {
                                  const copy = prev.slice()
                                  copy[idx] = { ...copy[idx], item: { ...p } }
                                  return copy
                                })
                                setPickerSlot(null)
                                setModalOpen(false)
                              }}
                              className="flex items-center justify-center h-10 w-10 bg-white border rounded"
                              title={p.name}
                            >
                              <span className="text-lg">{p.emoji}</span>
                            </button>
                          ))}
                        </div>
                      )
                      setModalOpen(true)
                    }}
                  >
                    {/* empty slot (click to choose) */}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        {modalContent}
      </Modal>
    </div>
  )
}
