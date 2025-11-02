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
      title: `Next Level: ${dbUser && dbUser.level !== undefined ? dbUser.level + 1 : '?'}`,
      description: "Keep moving",
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
      className="relative h-screen w-full overflow-y-auto"
      style={{
        backgroundImage: 'url("https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreihtrypmauxia4hxdmnyxtlyesfdzmiaoyp26frppiq26t3yj2upyy")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        animation: 'scrollBackground 60s linear infinite', // Добавим анимацию
      }}
    >
      {/* Затемненный оверлей для лучшей читаемости текста */}
      <div className="absolute inset-0 bg-black opacity-30"></div>

      {/* Вертикальная линия маршрута на всю высоту экрана */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-2 bg-yellow-400 opacity-50 z-5" />

      {/* Контейнер маршрута */}
      <div className="relative z-10 flex flex-col items-center py-8">

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
              <div className={`mt-3 text-center px-4 ${point.current || point.id === 'next-level' ? 'text-white' : 'text-gray-800'}`}>
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

        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-20">
          <img src="https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreigpvh2ob5eonznyxrfwqyktvphzygnv23r4m5y4uacxacw5otndaq" className="w-20 h-20" />
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
