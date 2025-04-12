"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Camera } from "lucide-react"
import { useUser } from "@/components/UserContext"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

// Открываем IndexedDB для хранения изображений
const openImagesDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ImagesDatabase', 1)
    
    request.onupgradeneeded = (event) => {
      const db = request.result
      // Создаем хранилище объектов для изображений
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id' })
      }
    }
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Сохранение изображения в IndexedDB
const saveImageToIndexedDB = async (imageId: string, imageBlob: Blob): Promise<string> => {
  const db = await openImagesDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['images'], 'readwrite')
    const store = transaction.objectStore('images')
    
    const request = store.put({
      id: imageId,
      blob: imageBlob,
      timestamp: Date.now()
    })
    
    request.onsuccess = () => resolve(imageId)
    request.onerror = () => reject(request.error)
  })
}

// Получение изображения из IndexedDB
const getImageFromIndexedDB = async (imageId: string): Promise<Blob | null> => {
  const db = await openImagesDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['images'], 'readonly')
    const store = transaction.objectStore('images')
    
    const request = store.get(imageId)
    
    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.blob)
      } else {
        resolve(null)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

// Оптимизация изображения
const optimizeImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      
      img.onload = () => {
        // Вычисляем новые размеры, сохраняя пропорции
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
        
        // Создаем canvas для изменения размера и сжатия
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        // Конвертируем canvas в Blob с заданным качеством
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to convert canvas to blob'))
            }
          },
          file.type,
          quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
    }
    
    reader.onerror = () => {
      reject(reader.error)
    }
  })
}

export default function AddWish() {
  const { dbUser, authUser } = useUser()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [optimizedBlob, setOptimizedBlob] = useState<Blob | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверяем тип файла
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Неверный формат файла",
        description: "Пожалуйста, загрузите изображение",
        variant: "destructive"
      })
      return
    }

    // Проверяем размер файла (20MB - верхний предел до оптимизации)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Файл слишком большой",
        description: "Максимальный размер файла 20MB",
        variant: "destructive"
      })
      return
    }

    try {
      // Оптимизируем изображение
      const optimized = await optimizeImage(file)
      setOptimizedBlob(optimized)
      
      // Создаем URL для предпросмотра оптимизированного изображения
      const objectUrl = URL.createObjectURL(optimized)
      setImageUrl(objectUrl)
      setImageFile(file) // Сохраняем оригинальный файл для метаданных
      
      // Вывод для отладки
      console.log(`Original size: ${(file.size / 1024).toFixed(2)}KB, Optimized: ${(optimized.size / 1024).toFixed(2)}KB`)
      
      toast({
        title: "Изображение оптимизировано",
        description: `Размер уменьшен с ${(file.size / 1024).toFixed(2)}KB до ${(optimized.size / 1024).toFixed(2)}KB`,
      })
    } catch (error) {
      console.error("Image optimization error:", error)
      toast({
        title: "Ошибка оптимизации",
        description: "Не удалось обработать изображение",
        variant: "destructive"
      })
    }
  }

  // Очищаем URL объектов при размонтировании компонента
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title) {
      toast({
        title: "Введите название",
        description: "Название цели обязательно для заполнения",
        variant: "destructive"
      })
      return
    }

    if (!dbUser || !dbUser.id) {
      toast({
        title: "Ошибка аутентификации",
        description: "Пожалуйста, войдите в систему",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClientSupabaseClient()
      let imageId = null

      // 1. Сохраняем оптимизированное изображение в IndexedDB, если оно есть
      if (optimizedBlob) {
        imageId = `goal_img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        await saveImageToIndexedDB(imageId, optimizedBlob)
      }

      // 2. Создаем новый goal в таблице goals
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .insert({
          title,
          description,
          image_id: imageId, // сохраняем ID изображения вместо URL
          created_by: dbUser.id,
          // Добавляем метаданные изображения, если они есть
          image_metadata: imageFile ? {
            filename: imageFile.name,
            type: imageFile.type,
            original_size: imageFile.size
          } : null
        })
        .select()
        .single()

      if (goalError) {
        throw new Error(`Ошибка создания цели: ${goalError.message}`)
      }

      // 3. Добавляем запись в user_goals
      const { error: userGoalError } = await supabase
        .from('user_goals')
        .insert({
          user_id: dbUser.id,
          goal_id: goalData.id,
          status: 'not_started',
        })

      if (userGoalError) {
        throw new Error(`Ошибка связывания цели с пользователем: ${userGoalError.message}`)
      }

      // Успешное создание
      toast({
        title: "Цель создана",
        description: "Ваша цель успешно добавлена",
      })

      // Сбрасываем форму
      setTitle("")
      setDescription("")
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl)
      }
      setImageUrl(null)
      setImageFile(null)
      setOptimizedBlob(null)

    } catch (error: any) {
      console.error("Error creating goal:", error)
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать цель",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 bg-white">
      <h1 className="text-3xl font-bold mb-2">Add New Wish</h1>
      <p className="text-gray-600 mb-6">Create a new goal to visualize and achieve</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-gray-700 font-medium">Wish Image</label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer"
            onClick={openFilePicker}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Wish preview" className="max-h-40 object-contain mb-2" />
            ) : (
              <>
                <Camera className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500 text-center">Click to upload an image</p>
                <p className="text-gray-400 text-sm text-center mt-1">PNG, JPG up to 20MB</p>
              </>
            )}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
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
            required
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

        <Button 
          type="submit" 
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Wish"
          )}
        </Button>
      </form>
    </div>
  )
}

