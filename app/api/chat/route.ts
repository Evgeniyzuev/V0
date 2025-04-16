import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { generateAssistantInstructions } from "@/lib/assistant-instructions";
import type { AIAssistantContext } from "@/types/user-context";

// Get all available API keys
const API_KEYS = [
  process.env.GEMINI_API_KEY || "",
  process.env.GEMINI_API_KEY2 || "",
].filter(key => key !== "");

async function tryWithApiKey(apiKey: string, messages: any[], userContext: AIAssistantContext | null) {
  const ai = new GoogleGenAI({ apiKey });
  
  // Generate instructions based on user context
  const instructions = userContext 
    ? generateAssistantInstructions(userContext)
    : "You are a helpful AI assistant. Be concise and provide specific, actionable advice.";

  // Convert messages to Gemini API format and add system instructions
  const contents = [
    {
      role: "model",
      parts: [{ text: instructions }]
    },
    ...messages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }))
  ];

  try {
    // Call Gemini API
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contents,
    });

    return result.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error: any) {
    // Add more detailed error information
    console.error("Gemini API Error Details:", {
      message: error.message,
      status: error.status,
      response: error.response,
    });
    throw error;
  }
}

export async function POST(req: Request) {
  if (API_KEYS.length === 0) {
    return NextResponse.json(
      { error: "No API keys configured" },
      { status: 500 }
    );
  }

  try {
    const { messages, userContext } = await req.json();
    let lastError = null;

    // Try each API key until one works
    for (const apiKey of API_KEYS) {
      try {
        const responseText = await tryWithApiKey(apiKey, messages, userContext);
        if (responseText) {
          return NextResponse.json({ response: responseText });
        }
      } catch (error: any) {
        console.error(`Error with API key:`, {
          message: error.message,
          status: error.status,
          details: error.details || 'No additional details'
        });
        lastError = error;
        // Continue to next API key
        continue;
      }
    }

    // If we get here, all API keys failed
    console.error("All API keys failed:", lastError);
    return NextResponse.json(
      { 
        error: "All available API keys failed",
        details: lastError?.message || "Unknown error"
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { 
        error: "Failed to process request",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
} 