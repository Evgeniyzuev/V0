"use client"

import React, { useState, useEffect } from "react"
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

// Knowledge items palette (books, scrolls, maps with different colors, names, descriptions)
const knowledgePalette: InventoryItem[] = [
  { id: 1, name: "Ancient Tome", emoji: "📚", description: "A dusty book containing forgotten knowledge.", count: 1 },
  { id: 2, name: "Spell Scroll", emoji: "📜", description: "Magical writings that reveal arcane secrets.", count: 1 },
  { id: 3, name: "Treasure Map", emoji: "🗺️", description: "A map leading to hidden treasures.", count: 1 },
  { id: 4, name: "Herbal Guide", emoji: "🌿", description: "Knowledge of medicinal plants and herbs.", count: 1 },
  { id: 5, name: "Star Chart", emoji: "⭐", description: "Celestial navigation and astronomical knowledge.", count: 1 },
  { id: 6, name: "Alchemy Notes", emoji: "⚗️", description: "Recipes and formulas for potions.", count: 1 },
  { id: 7, name: "Battle Tactics", emoji: "⚔️", description: "Strategic combat knowledge.", count: 1 },
  { id: 8, name: "Language Primer", emoji: "📖", description: "Ancient languages and their translations.", count: 1 },
  { id: 9, name: "Rune Dictionary", emoji: "🔮", description: "Mystical symbols and their meanings.", count: 1 },
  { id: 10, name: "Weather Almanac", emoji: "🌤️", description: "Patterns and predictions of weather.", count: 1 },
  { id: 11, name: "Beast Compendium", emoji: "🦁", description: "Encyclopedia of creatures and monsters.", count: 1 },
  { id: 12, name: "Crafting Manual", emoji: "🔨", description: "Instructions for creating tools and weapons.", count: 1 },
  { id: 13, name: "History Scrolls", emoji: "📜", description: "Chronicles of past events and civilizations.", count: 1 },
  { id: 14, name: "Music Sheets", emoji: "🎵", description: "Melodies and compositions from different eras.", count: 1 },
  { id: 15, name: "Cooking Recipes", emoji: "👨‍🍳", description: "Culinary knowledge and meal preparations.", count: 1 },
  { id: 16, name: "Architecture Plans", emoji: "🏗️", description: "Blueprints and building techniques.", count: 1 },
]

// Knowledge: 10 rows × 6 columns = 60 slots. Fill first 16 slots with different knowledge items.
const sampleKnowledge: InventoryCell[] = Array.from({ length: 60 }).map((_, i) => ({
  id: i + 1,
  item: i < knowledgePalette.length ? { ...knowledgePalette[i] } : null,
}))

// Base tab backgrounds
const baseBackgrounds = [
  "https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreidae7sneuejwbie7mytgjcuxi775j6zcall6ywfjf6jxuuwtmjlw4",
  "https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreicoiinuapd7evdnahz7s5bm4255sjena3rccom53s47aztpmyunyu",
  "https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafybeidrqqjj73obl35ceqeg7qoqmc2aphlvpuau57o7b3sd5zoz6ecjtq"
]

// Character tab backgrounds
const characterBackgrounds = [
  "https://i.pinimg.com/736x/1e/fd/b6/1efdb63278aa6883bf73a4dab68eecd9.jpg",
  "https://i.pinimg.com/736x/db/ad/37/dbad378fbb3ec5661fdc564ea5858ca3.jpg",
  "https://i.pinimg.com/736x/5b/cc/68/5bcc688778eb1e83950d3d39c5b138ed.jpg"
]

export default function Results() {
  const [achievements] = useState<Achievement[]>(sampleAchievements)
  const [inventory, setInventory] = useState<InventoryCell[]>(sampleInventory)
  const [knowledge, setKnowledge] = useState<InventoryCell[]>(sampleKnowledge)
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
          {/* Achievements: vertical grid, 3 columns on mobile, smaller cards */}
          <div className="grid grid-cols-3 gap-3">
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

      {/* Knowledge */}
      {activeTab === "knowledge" && (
  <div className="py-0 px-0 overflow-y-auto">
        {/* Palette: draggable items to add into empty slots */}
          {/* top palette removed per UX request */}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-0 justify-items-stretch">
          {knowledge.map((cell, idx) => {
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
                      if (data.startsWith("knowledge-palette-")) {
                        const pid = Number(data.split("-")[2])
                        const p = knowledgePalette.find((x) => x.id === pid)
                        if (p) {
                          setKnowledge((prev) => {
                            const copy = prev.slice()
                            copy[idx] = { ...copy[idx], item: { ...p } }
                            return copy
                          })
                        }
                      } else {
                        const src = Number(data)
                        if (!Number.isNaN(src)) {
                          setKnowledge((prev) => {
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
                            setKnowledge((prev) => {
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
                      if (data.startsWith("knowledge-palette-")) {
                        const pid = Number(data.split("-")[2])
                        const p = knowledgePalette.find((x) => x.id === pid)
                        if (p) {
                          setKnowledge((prev) => {
                            const copy = prev.slice()
                            copy[idx] = { ...copy[idx], item: { ...p } }
                            return copy
                          })
                        }
                          if (p) {
                            setKnowledge((prev) => {
                              const copy = prev.slice()
                              copy[idx] = { ...copy[idx], item: { ...p } }
                              return copy
                            })
                          }
                      } else {
                        const src = Number(data)
                        if (!Number.isNaN(src)) {
                          setKnowledge((prev) => {
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
                      setModalTitle("Choose knowledge")
                      setModalContent(
                        <div className="grid grid-cols-6 gap-2 p-2">
                          {knowledgePalette.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setKnowledge((prev) => {
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

      {/* Base */}
      {activeTab === "base" && (
        <div className="relative h-full" style={{ backgroundImage: `url(${baseBackgrounds[baseIndex]})`, backgroundSize: 'cover' }}>
          <button
            className="absolute bottom-4 right-4 w-16 h-16 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg bg-black/50"
            onClick={() => {
              setBaseIndex(prev => (prev + 1) % baseBackgrounds.length)
            }}
          >
            {baseIndex + 1}
          </button>
        </div>
      )}

      {/* Character */}
      {activeTab === "character" && (
        <div className="relative h-full" style={{ backgroundImage: `url(${characterBackgrounds[characterIndex]})`, backgroundSize: 'cover' }}>
          <button
            className="absolute bottom-4 right-4 w-16 h-16 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg bg-black/50"
            onClick={() => {
              setCharacterIndex(prev => (prev + 1) % characterBackgrounds.length)
            }}
          >
            {characterIndex + 1}
          </button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        {modalContent}
      </Modal>
    </div>
  )
}
