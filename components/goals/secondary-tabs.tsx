"use client"

import { Image, Plus, Radio, LayoutList, MessageCircle, BookOpen } from "lucide-react"

interface SecondaryTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function SecondaryTabs({ activeTab, setActiveTab }: SecondaryTabsProps) {
  const tabs = [
    { id: "wishboard", icon: Image },
    { id: "addwish", icon: Plus },
    { id: "recommendations", icon: Radio },
    { id: "tasks", icon: LayoutList },
    { id: "roadmap", icon: MessageCircle },
    { id: "notebook", icon: BookOpen },
  ]

  return (
    <div className="flex justify-around p-2 border-b border-gray-100">
      {tabs.map((tab) => {
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

