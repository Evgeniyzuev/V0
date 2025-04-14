"use client"

import type React from "react"
import { GoogleGenAI } from "@google/genai"
import { useState } from "react"
import { Bot, Send, Paperclip } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

// Initialize GoogleGenAI client
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" })

export default function AIAssistantTab() {
  const { toast } = useToast()
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "assistant",
      text: "Hi there! I'm your personal AI assistant. How can I help you with your goals today?",
      timestamp: new Date().toISOString(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || isLoading) return

    const userMessage = {
      sender: "user",
      text: message,
      timestamp: new Date().toISOString(),
    }

    // Add user message to chat
    setChatHistory((prev) => [...prev, userMessage])

    // Clear input
    setMessage("")
    setIsLoading(true)

    try {
      // Prepare contents for the API, including history and the new message
      const contents = [
        ...chatHistory.map((msg) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        })),
        {
          role: "user",
          parts: [{ text: userMessage.text }],
        },
      ]

      // Call the Gemini API using generateContent
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash", // Use gemini-2.0-flash as per example
        contents: contents,
        // Optional: Add generationConfig if needed
        // generationConfig: {
        //   maxOutputTokens: 100,
        // },
      })

      // Access the response text via candidates directly on the result object
      const assistantResponseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

      // Add assistant response to chat
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: assistantResponseText,
          timestamp: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error("Error calling Gemini API:", error)
      // Show error toast notification
      toast({
        variant: "destructive",
        title: "AI Assistant Error",
        description: "Sorry, I encountered an error connecting to the AI. Please try again.",
      })
      // Optionally keep the chat message as well, or remove it if the toast is sufficient
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
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
      <div className="p-3 bg-white border-t pb-14">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            placeholder="Ask about your goals..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-gray-100 border-0"
            disabled={isLoading}
          />
          <Button type="button" variant="ghost" size="icon" className="text-gray-400" disabled={isLoading}>
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button type="submit" variant="ghost" size="icon" className="text-purple-600" disabled={isLoading}>
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-purple-600"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

