import React, { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LazyVideoPreviewProps {
  title: string
  description: string
  duration: string
  views: string
  badge: string
  badgeColor: string
  gradientFrom: string
  gradientTo: string
  className?: string
  onClick?: () => void
}

const LazyVideoPreview: React.FC<LazyVideoPreviewProps> = ({
  title,
  description,
  duration,
  views,
  badge,
  badgeColor,
  gradientFrom,
  gradientTo,
  className,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  return (
    <Card 
      className={cn(
        "group hover:shadow-lg transition-all duration-300 cursor-pointer",
        className
      )}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative overflow-hidden rounded-t-lg">
        <div className={cn(
          "aspect-video flex items-center justify-center bg-gradient-to-br transition-all duration-300",
          `from-${gradientFrom} to-${gradientTo}`,
          isHovered && "scale-105"
        )}>
          <Play className={cn(
            "h-12 w-12 text-white transition-all duration-300",
            isHovered ? "opacity-100 scale-110" : "opacity-80"
          )} />
        </div>
        <Badge className={cn("absolute top-2 left-2", badgeColor)}>
          {badge}
        </Badge>
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {duration}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2 line-clamp-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-600 font-medium">Pronto para usar</span>
          <span className="text-gray-500">{views}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default LazyVideoPreview