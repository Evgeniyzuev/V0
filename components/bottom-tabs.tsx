"use client"

import { CheckCircle, Sparkles, Wallet, Users, Target } from "lucide-react"

interface BottomTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function BottomTabs({ activeTab, setActiveTab }: BottomTabsProps) {
  const tabs = [
    { id: "goals", label: "Goals", icon: Target },
    { id: "tasks", label: "Tasks", icon: CheckCircle },
    { id: "ai", label: "Assistant", icon: Sparkles },
    { id: "finance", label: "Finance", icon: Wallet },
    { id: "community", label: "Social", icon: Users },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-12 px-2 z-10">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            className={`flex flex-col items-center justify-center w-full h-full ${
              isActive ? "text-purple-600" : "text-gray-400"
            }`}
            onClick={() => setActiveTab(tab.id)}
            aria-label={tab.label}
          >
            <Icon className={`h-8 w-8 ${isActive ? "text-purple-600" : "text-gray-400"}`} />
          </button>
        )
      })}
    </div>
  )
}
