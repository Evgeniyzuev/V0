"use client"

import { Image, Plus, Radio, LayoutList, MessageCircle, BookOpen } from "lucide-react"

interface SecondaryTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  isAuthenticated: boolean
}

export default function SecondaryTabs({ activeTab, setActiveTab, isAuthenticated }: SecondaryTabsProps) {
  const tabs = [
    { id: "wishboard", icon: Image, requiresAuth: false },
    { id: "addwish", icon: Plus, requiresAuth: false }, // Temporarily set to false for testing
    { id: "recommendations", icon: Radio, requiresAuth: false },
    { id: "tasks", icon: LayoutList, requiresAuth: true },
    { id: "roadmap", icon: MessageCircle, requiresAuth: true },
    { id: "notebook", icon: BookOpen, requiresAuth: true },
  ]

  return (
    <div className="flex justify-around p-0 border-b border-gray-100">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        const isDisabled = tab.requiresAuth && !isAuthenticated

        return (
          <button
            key={tab.id}
            className={`p-2 rounded-md ${
              isActive ? "text-purple-600" : 
              isDisabled ? "text-gray-300 cursor-not-allowed" : 
              "text-gray-400 hover:text-gray-600"
            }`}
            onClick={() => !isDisabled && setActiveTab(tab.id)}
            aria-label={tab.id}
            disabled={isDisabled}
          >
            <Icon className="h-5 w-5" />
          </button>
        )
      })}
    </div>
  )
}
