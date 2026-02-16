"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react"

interface PhotoCompareSliderProps {
  beforeImage: string
  afterImage: string
  beforeDate?: string
  afterDate?: string
}

export default function PhotoCompareSlider({
  beforeImage,
  afterImage,
  beforeDate,
  afterDate,
}: PhotoCompareSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    handleMove(e.clientX)
  }, [isDragging, handleMove])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return
    handleMove(e.touches[0].clientX)
  }, [isDragging, handleMove])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("touchend", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleMouseUp])

  return (
    <div className="space-y-4">
      {/* Comparison Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[3/4] rounded-xl overflow-hidden cursor-ew-resize select-none bg-muted"
        onMouseDown={(e) => {
          setIsDragging(true)
          handleMove(e.clientX)
        }}
        onTouchStart={(e) => {
          setIsDragging(true)
          handleMove(e.touches[0].clientX)
        }}
      >
        {/* After Image (background) */}
        <div className="absolute inset-0">
          <img
            src={afterImage}
            alt="After"
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* After label */}
          <div className="absolute top-4 right-4 px-3 py-1 bg-green-500/90 text-white text-sm font-semibold rounded-full shadow-lg">
            After
          </div>
        </div>

        {/* Before Image (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt="Before"
            className="w-full h-full object-cover"
            style={{
              width: containerRef.current
                ? `${containerRef.current.offsetWidth}px`
                : "100%",
            }}
            draggable={false}
          />
          {/* Before label */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-blue-500/90 text-white text-sm font-semibold rounded-full shadow-lg">
            Before
          </div>
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        >
          {/* Handle grip */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-primary">
            <GripVertical className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Edge indicators */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1 text-white/80 text-xs">
          <ChevronLeft className="h-4 w-4" />
          <span>Drag</span>
        </div>
        <div className="absolute bottom-4 right-4 flex items-center gap-1 text-white/80 text-xs">
          <span>Drag</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      {/* Date labels */}
      {(beforeDate || afterDate) && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>{beforeDate ? format(new Date(beforeDate), "MMM d, yyyy") : "Before"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{afterDate ? format(new Date(afterDate), "MMM d, yyyy") : "After"}</span>
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </div>
      )}
    </div>
  )
}
