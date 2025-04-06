"use client"

interface WishItemProps {
  wish: {
    id: number
    imageUrl: string
    title: string
    description: string
  }
  onClick: () => void
}

export default function WishItem({ wish, onClick }: WishItemProps) {
  return (
    <div className="aspect-square relative cursor-pointer overflow-hidden" onClick={onClick}>
      <img src={wish.imageUrl || "/placeholder.svg"} alt={wish.title} className="w-full h-full object-cover" />
    </div>
  )
}

