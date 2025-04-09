"use client"

import { Image, Plus, Radio, LayoutList, MessageCircle, BookOpen } from "lucide-react"

interface SecondaryTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  isAuthenticated: boolean
}

export default function SecondaryTabs({ activeTab, setActiveTab, isAuthenticated }: SecondaryTabsProps) {
  const tabs = [
    { id: "wishboard", icon: Image, requiresAuth: true },
    { id: "addwish", icon: Plus, requiresAuth: true },
    { id: "recommendations", icon: Radio, requiresAuth: false },
    { id: "tasks", icon: LayoutList, requiresAuth: true },
    { id: "roadmap", icon: MessageCircle, requiresAuth: true },
    { id: "notebook", icon: BookOpen, requiresAuth: true },
  ]

  const visibleTabs = tabs.filter(tab => !tab.requiresAuth || isAuthenticated)

  return (
    <div className="flex justify-around p-2 border-b border-gray-100">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            className={`p-2 rounded-md ${isActive ? "text-purple-600" : "text-gray-400"}`}
            onClick={() => setActiveTab(tab.id)}
            aria-label={tab.id}
          >
            <Icon className="h-5 w-5" />
          </button>
        )
      })}
    </div>
  )
}

