"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Link, Image as ImageIcon } from "lucide-react"
import { useUser } from "@/components/UserContext"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import type { UserGoal } from "@/types/supabase"

export default function AddWish() {
  const { dbUser } = useUser()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidUrl, setIsValidUrl] = useState(true)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Проверка валидности URL
  const validateUrl = (url: string) => {
    if (!url) {
      setIsValidUrl(true)
      return true
    }
    
    try {
      new URL(url)
      setIsValidUrl(true)
      return true
    } catch (e) {
      setIsValidUrl(false)
      return false
    }
  }

  // Обработка изменения URL изображения
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    validateUrl(url)
    
    // Очищаем предпросмотр, если URL пустой
    if (!url) {
      setPreviewUrl(null)
      return
    }
  }

  // Загрузка предпросмотра изображения
  const loadPreview = () => {
    if (!imageUrl || !validateUrl(imageUrl)) {
      toast({
        title: "Некорректный URL",
        description: "Пожалуйста, введите действительный URL изображения",
        variant: "destructive"
      })
      return
    }

    setPreviewUrl(imageUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast({
        title: "Введите название",
        description: "Название цели обязательно для заполнения",
        variant: "destructive",
        duration: 5000 // Увеличиваем длительность показа
      })
      return;
    }

    if (imageUrl && !validateUrl(imageUrl)) {
      toast({
        title: "Некорректный URL изображения",
        description: "Пожалуйста, проверьте ссылку на изображение",
        variant: "destructive",
        duration: 5000
      })
      return;
    }

    if (!dbUser || !dbUser.id) {
      toast({
        title: "Ошибка аутентификации",
        description: "Пожалуйста, войдите в систему",
        variant: "destructive",
        duration: 5000
      })
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClientSupabaseClient();
      
      // Создаем пользовательскую запись с правильной типизацией
      const newUserGoal: Omit<UserGoal, 'id' | 'created_at' | 'updated_at'> = {
        user_id: dbUser.id,
        goal_id: 0, // Используем 0 вместо null
        status: 'not_started',
        started_at: null,
        target_date: null,
        completed_at: null,
        progress_percentage: 0,
        current_step_index: null,
        progress_details: null,
        notes: title, // Сохраняем заголовок в notes
        difficulty_level: 1,
        image_url: imageUrl || null,
        description: description || null
      };
      
      const { data, error: insertError } = await supabase
        .from('user_goals')
        .insert(newUserGoal)
        .select();
      
      if (insertError) {
        toast({
          title: "Ошибка создания цели",
          description: `${insertError.message}${insertError.details ? ` - ${insertError.details}` : ''}`,
          variant: "destructive",
          duration: 10000 // Увеличиваем время для ошибок
        });
        return;
      }
      
      // Показываем успех
      toast({
        title: "✨ Цель успешно добавлена!",
        description: "Ваша цель появится в списке желаний",
        duration: 5000
      });

      // Обновляем кэш запросов React Query
      await queryClient.invalidateQueries({ queryKey: ['user-goals'] });

      // Сбрасываем форму
      setTitle("");
      setDescription("");
      setImageUrl("");
      setPreviewUrl(null);

    } catch (error: any) {
      toast({
        title: "Непредвиденная ошибка",
        description: error.message || "Не удалось создать цель",
        variant: "destructive",
        duration: 10000
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-4 pb-24 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Add New Wish</h1>
      <p className="text-gray-600 mb-6">Create a new goal to visualize and achieve</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="imageUrl" className="text-gray-700 font-medium">
            Image URL
          </label>
          <div className="flex space-x-2">
            <Input
              id="imageUrl"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={handleImageUrlChange}
              className={`flex-1 ${!isValidUrl ? 'border-red-500' : ''}`}
            />
            <Button 
              type="button" 
              onClick={loadPreview}
              variant="outline"
              disabled={!imageUrl || !isValidUrl}
            >
              Preview
            </Button>
          </div>
          {!isValidUrl && (
            <p className="text-red-500 text-sm">Пожалуйста, введите корректный URL</p>
          )}
        </div>

        {previewUrl && (
          <div className="border rounded-lg p-2 flex justify-center">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-h-40 object-contain"
              onError={() => {
                toast({
                  title: "Ошибка загрузки изображения",
                  description: "Не удалось загрузить изображение по указанной ссылке",
                  variant: "destructive"
                });
                setPreviewUrl(null);
              }}
            />
          </div>
        )}

        {!previewUrl && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500 text-center">Предпросмотр изображения</p>
            <p className="text-gray-400 text-sm text-center mt-1">Вставьте URL и нажмите кнопку Preview</p>
          </div>
        )}

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

