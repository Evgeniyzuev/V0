"use client"

import type React from "react"

import { useState } from "react"
import { Bot, Send, Paperclip } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AIAssistantTab() {
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "assistant",
      text: "Hi there! I'm your personal AI assistant. How can I help you with your goals today?",
      timestamp: new Date().toISOString(),
    },
  ])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) return

    // Add user message to chat
    setChatHistory([
      ...chatHistory,
      {
        sender: "user",
        text: message,
        timestamp: new Date().toISOString(),
      },
    ])

    // Clear input
    setMessage("")

    // Simulate assistant response after a short delay
    setTimeout(() => {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "I'm here to help you achieve your goals. Would you like me to suggest some tasks based on your current goals?",
          timestamp: new Date().toISOString(),
        },
      ])
    }, 1000)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.sender === "user" ? "bg-purple-100 text-gray-800" : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              {msg.sender === "assistant" && (
                <div className="flex items-center mb-1 text-xs text-purple-600">
                  <Bot className="h-3 w-3 mr-1" />
                  <span>Assistant • {formatTime(msg.timestamp)}</span>
                </div>
              )}
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message input */}
      <div className="p-3 bg-white border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            placeholder="Ask about your goals..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-gray-100 border-0"
          />
          <Button type="button" variant="ghost" size="icon" className="text-gray-400">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button type="submit" variant="ghost" size="icon" className="text-purple-600">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}

