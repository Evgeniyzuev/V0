"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Sparkles } from "lucide-react"
import { useState, useEffect } from "react"

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Slide {
  id: number
  image?: string | null
  video?: string | null
  title?: string | null
  subtitle?: string | null
  buttonText: string | null
  buttonColor: string
  bgGradient?: string
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [api, setApi] = useState<any>(null)

  const slides: Slide[] = [
    {
      id: 1,
      image: "https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreihwdcmrkfyusknxdmxtozwgjcqj3x53sroua5rhqrdjbjrj2gf7b4",
      title: "If someone has it,\nthen you can too",
      buttonText: null,
      buttonColor: "bg-white text-black hover:bg-gray-200"
    },
    {
      id: 2,
      image: "https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreibbnjxrj2wywupy2s2afwlwqwp6w3qslie5zgnjdo3oqpbfkgomsm",
      title: "When will you live your dream life?\nWhen can you be your true self?",
      subtitle: null,
      buttonText: null,
      buttonColor: "bg-white text-purple-600 hover:bg-gray-200"
    },
    {
      id: 3,
      video: "https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafybeifjxnntvcvxuodk3xeyp24vdijjwcnsgsu2entr5hha65msxa2e7m",
      title: "No results?\nThink you're lost.",
      subtitle: null,
      buttonText: null,
      buttonColor: "bg-white text-purple-600 hover:bg-gray-200"
    },
    {
      id: 4,
      video: "https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafybeifpoesowv7nqchaopcbbx2is5ddst7v2v2jkn4ajxxlog4uvpkzqa",
      title: "The navigator is in your hands.\nBuild the right route to your desires.",
      subtitle: null,
      buttonText: "Let's Get Started!",
      buttonColor: "bg-white text-purple-600 hover:bg-gray-200"
    }
  ]

  // Auto-advance slides every 4 seconds, but stop at the last slide
  useEffect(() => {
    if (!api || !isOpen || currentSlide >= slides.length - 1) return

    const interval = setInterval(() => {
      if (currentSlide < slides.length - 1) {
        api.scrollNext()
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [api, isOpen, currentSlide, slides.length])

 return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle className="sr-only">Welcome Modal</DialogTitle>
      <DialogContent className="max-w-full h-screen w-full p-0 border-0 bg-black overflow-hidden">
        <Carousel
          className="w-full h-screen relative"
          opts={{
            loop: true,
          }}
          setApi={(carouselApi) => {
            setApi(carouselApi)
            carouselApi?.on("select", () => {
              setCurrentSlide(carouselApi.selectedScrollSnap())
            })
          }}
        >
          <CarouselContent className="h-screen">
            {slides.map((slide) => (
              <CarouselItem key={slide.id} className="relative w-full h-screen">
                <div className="relative w-full h-screen">
                  {slide.video ? (
                    <div className="w-full h-screen bg-black sm:bg-white/50">
                      <video
                        src={slide.video}
                        autoPlay
                        muted
                        loop
                        className="w-full h-screen object-cover sm:w-full sm:h-screen sm:object-contain"
                      />
                    </div>
                  ) : slide.image ? (
                    <div className="w-full h-screen bg-white/50 sm:bg-white/50">
                      <img
                        src={slide.image}
                        alt={`Slide ${slide.id}`}
                        className="w-full h-screen object-cover sm:w-full sm:h-screen sm:object-contain"
                      />
                    </div>
                  ) : (
                    <div className={`w-full h-screen ${slide.bgGradient}`} />
                  )}



                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                    <div className="p-4 sm:p-6 lg:px-12 text-white w-full">
                      <div className="text-center max-w-4xl mx-auto">
                        <h1
                          className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 whitespace-pre-line"
                          style={{ whiteSpace: 'pre-line' }}
                        >
                          {slide.title}
                        </h1>
                        {slide.subtitle && (
                          <p className="text-base sm:text-lg mb-4 sm:mb-6 opacity-90">
                            {slide.subtitle}
                          </p>
                        )}
                        {slide.buttonText && (
                          <Button
                            className={`${slide.buttonColor} px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-base`}
                            onClick={onClose}
                          >
                            {slide.buttonText}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Dots */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-50">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <CarouselPrevious className="left-4 hidden sm:flex" />
          <CarouselNext className="right-4 hidden sm:flex" />
        </Carousel>
      </DialogContent>
    </Dialog>
  )
}
