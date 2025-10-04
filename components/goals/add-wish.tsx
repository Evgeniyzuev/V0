"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Upload, Link } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useUser } from "@/components/UserContext"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Goal } from "@/types/supabase"

interface AddWishProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export default function AddWish({ onSuccess, isModal = false }: AddWishProps) {
  const { dbUser, refreshGoals } = useUser()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState("")
  const [difficultyLevel, setDifficultyLevel] = useState(1)
  const [imageMode, setImageMode] = useState<"url" | "upload">("url")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localImageUrl, setLocalImageUrl] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Функция для сжатия изображения
  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Вычисляем новые размеры с сохранением пропорций
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // Рисуем сжатое изображение
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Конвертируем в base64 с заданным качеством
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }
      
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  // Функция для конвертации файла в base64 и сохранения в localStorage
  const handleFileUpload = async (file: File) => {
    try {
      // Сжимаем изображение перед сохранением
      const compressedBase64 = await compressImage(file)
      const imageId = `wish_image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Проверяем размер после сжатия
      const sizeInMB = (compressedBase64.length * 0.75) / (1024 * 1024) // Примерный размер в MB
      console.log(`Compressed image size: ${sizeInMB.toFixed(2)}MB`)
      
      // Сохраняем в localStorage
      try {
        localStorage.setItem(imageId, compressedBase64)
        return imageId
      } catch (storageError) {
        console.error("localStorage error:", storageError)
        throw new Error("Image too large for storage. Please try a smaller image.")
      }
    } catch (error) {
      console.error("Error compressing image:", error)
      throw new Error("Failed to compress and save image")
    }
  }

  // Функция для получения изображения из localStorage
  const getImageFromStorage = (imageId: string): string | null => {
    return localStorage.getItem(imageId)
  }

  // Функция для очистки старых изображений из localStorage
  const cleanupOldImages = () => {
    try {
      const keys = Object.keys(localStorage)
      const imageKeys = keys.filter(key => key.startsWith('wish_image_'))
      
      // Если изображений больше 20, удаляем самые старые
      if (imageKeys.length > 20) {
        imageKeys.sort() // Сортируем по времени создания
        const keysToRemove = imageKeys.slice(0, imageKeys.length - 20)
        keysToRemove.forEach(key => localStorage.removeItem(key))
        console.log(`Cleaned up ${keysToRemove.length} old images from localStorage`)
      }
    } catch (error) {
      console.error("Error cleaning up old images:", error)
    }
  }

  // Обработчик выбора файла
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file")
      return
    }

    // Проверяем размер файла (максимум 10MB, так как будем сжимать)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size should be less than 10MB")
      return
    }

    setSelectedFile(file)
    setIsPreviewLoading(true)

    try {
      // Очищаем старые изображения перед загрузкой нового
      cleanupOldImages()
      
      const imageId = await handleFileUpload(file)
      setLocalImageUrl(imageId)
      setIsPreviewLoading(false)
      toast.success("Image uploaded successfully!")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload image")
      setIsPreviewLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dbUser?.id) {
      toast.error("Please log in to add a wish")
      return
    }

    if (!title.trim()) {
      toast.error("Please enter a wish title")
      return
    }

    // Проверяем наличие изображения в зависимости от режима
    if (imageMode === "url" && !imageUrl.trim()) {
      toast.error("Please enter an image URL")
      return
    }
    if (imageMode === "upload" && !localImageUrl) {
      toast.error("Please upload an image")
      return
    }

    try {
      const supabase = createClientSupabaseClient()

      // Определяем URL изображения в зависимости от режима
      const finalImageUrl = imageMode === "url" ? imageUrl : localImageUrl

      // Create a user_goal entry directly
      const { error: userGoalError } = await supabase
        .from("user_goals")
        .insert([
          {
            user_id: dbUser.id,
            title,
            description: description || null,
            image_url: finalImageUrl,
            estimated_cost: estimatedCost || null,
            difficulty_level: difficultyLevel,
            status: "not_started",
            progress_percentage: 0,
            steps: []
          }
        ])

      if (userGoalError) {
        throw new Error(userGoalError.message)
      }

      // Refresh goals in UserContext (this will update the personal goals list)
      await refreshGoals()
      
      // Also invalidate any related queries to ensure UI updates
      await queryClient.invalidateQueries({ queryKey: ["user-goals"] })
      await queryClient.invalidateQueries({ queryKey: ["goals"] })
      
      console.log('Goal added and context refreshed')

      toast.success("Wish added successfully!")

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }

      // Reset form
      setTitle("")
      setDescription("")
      setImageUrl("")
      setLocalImageUrl("")
      setSelectedFile(null)
      setEstimatedCost("")
      setDifficultyLevel(1)
      setImageMode("url")
    } catch (error) {
      console.error("Error adding wish:", error)
      toast.error(`Failed to add wish: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    setIsPreviewLoading(true)
  }

  // Функция для получения URL изображения для превью
  const getPreviewImageUrl = () => {
    if (imageMode === "url") {
      return imageUrl
    } else if (imageMode === "upload" && localImageUrl) {
      return getImageFromStorage(localImageUrl)
    }
    return ""
  }

  return (
    <div className={`${isModal ? 'p-6' : 'p-4'} bg-white`}>
      <h1 className="text-3xl font-bold mb-2">Add New Wish</h1>
      <p className="text-gray-600 mb-6">Create a new goal to visualize and achieve</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-gray-700 font-medium">Wish Image</label>
          
          {/* Переключатель режимов */}
          <div className="flex gap-2 mb-3">
            <Button
              type="button"
              variant={imageMode === "url" ? "default" : "outline"}
              onClick={() => setImageMode("url")}
              className="flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              URL
            </Button>
            <Button
              type="button"
              variant={imageMode === "upload" ? "default" : "outline"}
              onClick={() => setImageMode("upload")}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>

          {/* Поле для URL */}
          {imageMode === "url" && (
            <Input
              type="url"
              placeholder="Enter image URL"
              value={imageUrl}
              onChange={handleImageUrlChange}
              className="w-full"
            />
          )}

          {/* Поле для загрузки файла */}
          {imageMode === "upload" && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {selectedFile ? selectedFile.name : "Choose Image"}
              </Button>
              {selectedFile && (
                <p className="text-sm text-gray-500">
                  File: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}

          {/* Область превью */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center">
            {getPreviewImageUrl() ? (
              <img
                src={getPreviewImageUrl() || undefined}
                alt="Wish preview"
                className="max-h-40 object-contain mb-2"
                onLoad={() => setIsPreviewLoading(false)}
                onError={() => {
                  setIsPreviewLoading(false)
                  toast.error("Failed to load image preview")
                }}
              />
            ) : (
              <>
                <Camera className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500 text-center">
                  {imageMode === "url" ? "Enter an image URL above" : "Upload an image above"}
                </p>
                <p className="text-gray-400 text-sm text-center mt-1">The image will be previewed here</p>
              </>
            )}
            {isPreviewLoading && <p className="text-gray-500 mt-2">Loading preview...</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="title" className="text-gray-700 font-medium">
            Wish Title
          </label>
          <Input
            id="title"
            placeholder="What do you want to achieve?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-gray-700 font-medium">
            Description
          </label>
          <Textarea
            id="description"
            placeholder="Describe your wish in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="estimatedCost" className="text-gray-700 font-medium">
            Estimated Cost
          </label>
          <Input
            id="estimatedCost"
            placeholder="e.g., $100, Free, etc."
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="difficultyLevel" className="text-gray-700 font-medium">
            Difficulty Level (1-20)
          </label>
          <Input
            id="difficultyLevel"
            type="number"
            min={1}
            max={20}
            value={difficultyLevel}
            onChange={(e) => setDifficultyLevel(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3">
          Save Wish
        </Button>
      </form>
    </div>
  )
}

