import { MapPin, Target, Trophy, Star, Check } from "lucide-react"
import { useUser } from "@/components/UserContext"
import React, { useRef, useEffect, useState } from 'react';


interface RoadmapPoint {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  current?: boolean
}

export default function Roadmap() {
  const { dbUser, goals } = useUser()
  const roadmapRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (roadmapRef.current) {
        setScrollPosition(roadmapRef.current.scrollTop);
      }
    };

    const currentRef = roadmapRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const completedGoals = (goals || []).filter(goal => goal.status === 'completed');

  const roadmapPoints: RoadmapPoint[] = [
    {
      id: "next-level",
      title: `Следующий уровень: ${dbUser && dbUser.level !== undefined ? dbUser.level + 1 : '?'}`,
      description: "Продолжайте свой путь к прогрессу",
      icon: <Trophy className="w-5 h-5" />,
      completed: false
    },
    ...completedGoals.map((goal, index) => ({
      id: `goal-${goal.id}`,
      title: goal.title || 'Без названия',
      description: `Завершено: ${new Date(goal.updated_at || goal.created_at || '').toLocaleDateString()}`,
      icon: <Check className="w-5 h-5" />, // Используем иконку Check для завершенных целей
      completed: true,
    }))
  ];

  return (
    <div
      ref={roadmapRef}
      className="relative h-full w-full overflow-y-auto"
      style={{
        backgroundImage: 'url("https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreihtrypmauxia4hxdmnyxtlyesfdzmiaoyp26frppiq26t3yj2upyy")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        animation: 'scrollBackground 60s linear infinite', // Добавим анимацию
      }}
    >
      {/* Затемненный оверлей для лучшей читаемости текста */}
      <div className="absolute inset-0 bg-black opacity-30"></div>

      {/* Контейнер маршрута */}
      <div className="relative z-10 flex flex-col items-center py-8">
        {/* Вертикальная линия маршрута */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 via-purple-300 to-purple-200 opacity-70" />

        {roadmapPoints.map((point, index) => (
          <React.Fragment key={point.id}>
            {/* Точка маршрута */}
            <div className={`relative flex flex-col items-center my-8 ${point.current ? 'z-20' : ''}`}>
              <div
                className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300
                  ${point.completed ? 'bg-green-500 scale-105' : 'bg-gray-300'}
                  ${point.current ? 'bg-purple-600 animate-pulse scale-125' : ''}`
                }
              >
                {point.icon}
                {point.current && (
                  <>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
                  </>
                )}
              </div>
              <div className={`mt-3 text-center px-4 ${point.current ? 'text-white' : 'text-gray-800'}`}>
                <h3 className="font-semibold text-lg">{point.title}</h3>
                <p className="text-sm text-gray-200">{point.description}</p>
              </div>
            </div>

            {/* Соединительная линия между точками (если это не последняя) */}
            {index < roadmapPoints.length - 1 && (
              <div className="w-1 h-32 bg-gray-400 opacity-50 relative -my-8" />
            )}
          </React.Fragment>
        ))}

        {/* Указатель местоположения внизу */}
        <div className="flex flex-col items-center mt-8 relative z-20">
          {/* Тень указателя */}
          <div className="absolute inset-0 bg-purple-400 rounded-full blur-xl opacity-30 scale-150" />

          {/* Основной указатель */}
          <div className="relative w-20 h-20 bg-gradient-to-b from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-4xl text-white animate-bounce">⬆️</span>
          </div>
          
          {/* Внутренний круг для эффекта */}
          <div className="absolute inset-2 bg-white rounded-full opacity-20" />

          <div className="mt-4 text-center text-white">
            <p className="text-sm font-semibold">Ваше местоположение</p>
            <p className="text-xs text-gray-200 mt-1">Двигайтесь вверх к цели</p>
          </div>

          {/* Индикатор прогресса */}
          <div className="mt-4 w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" />
          </div>
          <p className="text-xs text-gray-200 mt-1">75% завершено</p>
        </div>
      </div>
{/* // Добавим ключевые кадры для анимации фона через глобальные стили или styled-components */}
      <style jsx global>{`
        @keyframes scrollBackground {
          from {
            background-position-y: 0%;
          }
          to {
            background-position-y: 100%;
          }
        }
      `}</style>
    </div>
  )
}
