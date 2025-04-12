"use client"

import { useState, useEffect, useRef } from "react"
import { Bot, Send, Paperclip, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/components/UserContext"
import { AIService } from "@/lib/services/ai-service"
import { DEFAULT_MODELS, DEFAULT_INSTRUCTIONS, type AIModel, type CustomInstructions } from "@/types/ai-models"
import { fetchUserGoals } from "@/lib/api/goals"
import { createClientSupabaseClient } from "@/lib/supabase"

export default function AIAssistantTab() {
  const { dbUser } = useUser()
  const [message, setMessage] = useState("")
  const [selectedModel, setSelectedModel] = useState<AIModel>(
    DEFAULT_MODELS.find(m => m.id === 'gemini-pro') || DEFAULT_MODELS[0]
  )
  const [customInstructions, setCustomInstructions] = useState<CustomInstructions>(DEFAULT_INSTRUCTIONS)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [customApiKey, setCustomApiKey] = useState("")
  const aiServiceRef = useRef<AIService>(new AIService(selectedModel))
  const supabase = createClientSupabaseClient()

  const [chatHistory, setChatHistory] = useState([
    {
      sender: "assistant",
      text: DEFAULT_INSTRUCTIONS.greeting || "Hi there! I'm your AI assistant.",
      timestamp: new Date().toISOString(),
    },
  ])

  useEffect(() => {
    if (dbUser?.id) {
      loadUserContext();
    }
  }, [dbUser?.id]);

  const loadUserContext = async () => {
    try {
      // Load user goals
      const goals = await fetchUserGoals(dbUser?.id);
      
      // Load user tasks
      const { data: tasks } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", dbUser?.id);

      // Update AI service context
      aiServiceRef.current.updateContext({
        userGoals: goals,
        userTasks: tasks || [],
        customInstructions
      });

      // Send initial context-aware greeting
      if (goals?.length || tasks?.length) {
        const contextGreeting = `I see you have ${goals?.length || 0} goals and ${tasks?.length || 0} tasks. I'm here to help you achieve them and provide support along the way. How are you feeling about your progress?`;
        setChatHistory(prev => [...prev, {
          sender: "assistant",
          text: contextGreeting,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (error) {
      console.error("Error loading user context:", error);
    }
  };

  const handleModelChange = (modelId: string) => {
    const newModel = DEFAULT_MODELS.find(m => m.id === modelId) || DEFAULT_MODELS[0];
    setSelectedModel(newModel);
    aiServiceRef.current.setModel(newModel);
  };

  const handleInstructionsChange = (field: keyof CustomInstructions, value: string) => {
    const newInstructions = { ...customInstructions, [field]: value };
    setCustomInstructions(newInstructions);
    aiServiceRef.current.updateContext({ customInstructions: newInstructions });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) return
    
    // Check if we have either an environment API key or custom API key
    const hasApiKey = selectedModel.apiKey || customApiKey;
    if (!hasApiKey) {
      setChatHistory(prev => [...prev, {
        sender: "assistant",
        text: "Please provide an API key in the settings to continue our conversation.",
        timestamp: new Date().toISOString(),
      }]);
      return;
    }

    // Add user message to chat
    const userMessage = {
      sender: "user",
      text: message,
      timestamp: new Date().toISOString(),
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setMessage("")

    try {
      // Get AI response using custom API key if provided, otherwise use environment key
      const response = await aiServiceRef.current.sendMessage(message, customApiKey);
      
      // Add AI response to chat
      setChatHistory(prev => [...prev, {
        sender: "assistant",
        text: response,
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setChatHistory(prev => [...prev, {
        sender: "assistant",
        text: "I encountered an error. Please check your API key and try again.",
        timestamp: new Date().toISOString(),
      }]);
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute top-4 right-4">
            <Settings className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>AI Assistant Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label>Model</label>
              <Select value={selectedModel.id} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_MODELS.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">{selectedModel.description}</p>
            </div>
            <div className="grid gap-2">
              <label>Custom API Key (Optional)</label>
              <Input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder={selectedModel.apiKey ? "Using environment API key" : "Enter your API key"}
              />
              <p className="text-sm text-gray-500">
                {selectedModel.apiKey 
                  ? "Environment API key is available. Custom key will override it." 
                  : "No environment API key found. Please provide your own."}
              </p>
            </div>
            <div className="grid gap-2">
              <label>Custom Greeting</label>
              <Input
                value={customInstructions.greeting}
                onChange={(e) => handleInstructionsChange('greeting', e.target.value)}
                placeholder="Enter custom greeting"
              />
            </div>
            <div className="grid gap-2">
              <label>Assistant Personality</label>
              <Textarea
                value={customInstructions.personality}
                onChange={(e) => handleInstructionsChange('personality', e.target.value)}
                placeholder="Describe the assistant's personality"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message input */}
      <div className="p-3 bg-white border-t pb-16">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            placeholder={selectedModel.apiKey || customApiKey 
              ? "Share your thoughts, feelings, or ask for help..." 
              : "Please set up your API key in settings first..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-gray-100 border-0"
            disabled={!(selectedModel.apiKey || customApiKey)}
          />
          <Button type="button" variant="ghost" size="icon" className="text-gray-400">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button 
            type="submit" 
            variant="ghost" 
            size="icon" 
            className="text-purple-600"
            disabled={!(selectedModel.apiKey || customApiKey)}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}

