"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Sparkles, X } from "lucide-react"
import { useState } from "react"

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [api, setApi] = useState<any>(null)

  const slides = [
    {
      id: 1,
      image: "https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreihwdcmrkfyusknxdmxtozwgjcqj3x53sroua5rhqrdjbjrj2gf7b4",
      title: "If someone has it,\nthen you can too",
      buttonText: null,
      buttonColor: "bg-white text-black hover:bg-gray-200"
    },
    {
      id: 2,
      image: null,
      title: "Welcome to Your Journey!",
      subtitle: "Discover amazing opportunities and achieve your goals.",
      buttonText: "Let's Get Started!",
      buttonColor: "bg-white text-purple-600 hover:bg-gray-200",
      bgGradient: "bg-gradient-to-br from-purple-600 to-blue-600"
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle className="sr-only">Welcome Modal</DialogTitle>
      <DialogContent className="max-w-full h-full w-full p-0 border-0 bg-black overflow-hidden">
        <Carousel
          className="w-full h-full relative"
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
          <CarouselContent className="h-full">
            {slides.map((slide) => (
              <CarouselItem key={slide.id} className="relative w-full h-full">
                <div className="relative w-full h-full">
                  {slide.image ? (
                    <div className="w-full h-full flex items-center justify-center px-4 lg:px-16">
                      <img
                        src={slide.image}
                        alt={`Slide ${slide.id}`}
                        className="max-w-full max-h-full object-contain lg:object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${slide.bgGradient}`} />
                  )}

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>

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
