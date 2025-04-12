"use client"

import { useState } from "react"
import BottomTabs from "@/components/bottom-tabs"
import GoalsTab from "@/components/goals-tab"
import TasksTab from "@/components/tasks-tab"
import AIAssistantTab from "@/components/ai-assistant-tab"
import FinanceTab from "@/components/finance-tab"
import CommunityTab from "@/components/community-tab"

export default function Home() {
  const [activeTab, setActiveTab] = useState("goals")

  const renderActiveTab = () => {
    switch (activeTab) {
      case "goals":
        return <GoalsTab />
      case "tasks":
        return <TasksTab />
      case "ai":
        return <AIAssistantTab />
      case "finance":
        return <FinanceTab />
      case "community":
        return <CommunityTab />
      default:
        return <GoalsTab />
    }
  }

  return (
    <main className="flex flex-col h-screen bg-white">
      <div className="flex-1 overflow-y-auto pb-0">{renderActiveTab()}</div>
      <BottomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  )
}

