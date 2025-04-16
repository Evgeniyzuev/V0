import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Get all available API keys
const API_KEYS = [
  process.env.GEMINI_API_KEY || "",
  process.env.GEMINI_API_KEY2 || "",
].filter(key => key !== "");

async function tryWithApiKey(apiKey: string, messages: any[]) {
  const ai = new GoogleGenAI({ apiKey });
  
  // Convert messages to Gemini API format
  const contents = messages.map((msg) => ({
    role: msg.sender === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));

  // Call Gemini API
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: contents,
  });

  return result.candidates?.[0]?.content?.parts?.[0]?.text;
}

export async function POST(req: Request) {
  if (API_KEYS.length === 0) {
    return NextResponse.json(
      { error: "No API keys configured" },
      { status: 500 }
    );
  }

  try {
    const { messages } = await req.json();
    let lastError = null;

    // Try each API key until one works
    for (const apiKey of API_KEYS) {
      try {
        const responseText = await tryWithApiKey(apiKey, messages);
        if (responseText) {
          return NextResponse.json({ response: responseText });
        }
      } catch (error) {
        console.error(`Error with API key: ${error}`);
        lastError = error;
        // Continue to next API key
        continue;
      }
    }

    // If we get here, all API keys failed
    console.error("All API keys failed:", lastError);
    return NextResponse.json(
      { error: "All available API keys failed" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 