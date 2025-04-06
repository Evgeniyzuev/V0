"use client"

import { MessageSquare, User } from "lucide-react"

interface SocialTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function SocialTabs({ activeTab, setActiveTab }: SocialTabsProps) {
  const tabs = [
    { id: "posts", icon: MessageSquare },
    { id: "profile", icon: User },
  ]

  return (
    <div className="flex justify-around p-3 border-b border-gray-100">
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

