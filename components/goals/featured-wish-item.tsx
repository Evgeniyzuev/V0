"use client"

interface FeaturedWishItemProps {
  wish: {
    id: number
    imageUrl: string
    title: string
    description: string
  }
  onClick: () => void
}

export default function FeaturedWishItem({ wish, onClick }: FeaturedWishItemProps) {
  return (
    <div className="aspect-square relative cursor-pointer overflow-hidden rounded-lg" onClick={onClick}>
      <img
        src={wish.imageUrl || "/placeholder.svg"}
        alt={wish.title}
        className="w-full h-full object-cover brightness-75"
      />
      <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
        <h3 className="text-sm font-medium leading-tight">{wish.title}</h3>
      </div>
    </div>
  )
}

