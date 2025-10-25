"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Sparkles } from "lucide-react"

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle className="sr-only">Welcome Modal</DialogTitle>
      <DialogContent className="max-w-full h-full w-full p-0 border-0 bg-black">
        <Carousel className="w-full h-full">
          <CarouselContent>
            {/* First Slide */}
            <CarouselItem className="relative w-full h-full">
              <div className="relative w-full h-full">
                <img
                  src="https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreihwdcmrkfyusknxdmxtozwgjcqj3x53sroua5rhqrdjbjrj2gf7b4"
                  alt="Welcome Image"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                  <div className="p-6 text-white w-full">
                    <div className="text-center">
                      <h1 className="text-3xl font-bold mb-4">If someone has it, then you can too</h1>
                      <Button
                        className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-full font-semibold"
                        onClick={onClose}
                      >
                        Let's Get Started!
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Second Slide - Example */}
            <CarouselItem className="relative w-full h-full">
              <div className="relative w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <div className="text-center text-white p-6">
                  <Sparkles className="h-16 w-16 mx-auto mb-4 text-yellow-300" />
                  <h1 className="text-3xl font-bold mb-4">Welcome to Your Journey!</h1>
                  <p className="text-lg mb-6">Discover amazing opportunities and achieve your goals.</p>
                  <Button
                    className="bg-white text-purple-600 hover:bg-gray-200 px-8 py-3 rounded-full font-semibold"
                    onClick={onClose}
                  >
                    Start Now
                  </Button>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
      </DialogContent>
    </Dialog>
  )
}
