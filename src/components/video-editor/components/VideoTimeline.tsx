import React, { forwardRef, useCallback, useRef, useEffect, useState } from 'react'
import { Button } from '../../ui/button'
import { Slider } from '../../ui/slider'
import { Play, Pause, Volume2, Settings } from 'lucide-react'
import type { VideoScene } from '../VideoEditorStudio'

interface VideoTimelineProps {
  scenes: VideoScene[]
  currentSceneIndex: number
  currentTime: number
  totalDuration: number
  onSceneSelect: (index: number) => void
  onTimeChange: (time: number) => void
  onSceneUpdate: (sceneId: string, updates: Partial<VideoScene>) => void
  zoom: number
}

const VideoTimeline = forwardRef<HTMLDivElement, VideoTimelineProps>(({
  scenes,
  currentSceneIndex,
  currentTime,
  totalDuration,
  onSceneSelect,
  onTimeChange,
  onSceneUpdate,
  zoom
}, ref) => {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartTime, setDragStartTime] = useState(0)

  // Calculate timeline scale based on zoom
  const timelineScale = zoom / 100
  const pixelsPerSecond = 10 * timelineScale

  // Handle timeline scrubbing
  const handleTimelineClick = useCallback((event: React.MouseEvent) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const newTime = x / pixelsPerSecond

    // Find which scene this time corresponds to
    let accumulatedTime = 0
    let targetSceneIndex = 0

    for (let i = 0; i < scenes.length; i++) {
      if (accumulatedTime + scenes[i].duration > newTime) {
        targetSceneIndex = i
        break
      }
      accumulatedTime += scenes[i].duration
    }

    onSceneSelect(targetSceneIndex)
    onTimeChange(newTime - accumulatedTime)
  }, [scenes, pixelsPerSecond, onSceneSelect, onTimeChange])

  // Handle scene dragging for reordering
  const handleSceneDragStart = useCallback((event: React.MouseEvent, sceneIndex: number) => {
    event.stopPropagation()
    setIsDragging(true)
    setDragStartX(event.clientX)
    setDragStartTime(currentTime)
  }, [currentTime])

  const handleSceneDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Calculate cumulative time for scene positioning
  const getSceneStartTime = useCallback((sceneIndex: number) => {
    return scenes.slice(0, sceneIndex).reduce((total, scene) => total + scene.duration, 0)
  }, [scenes])

  // Render timeline ruler
  const renderTimelineRuler = () => {
    const ticks = []
    const tickInterval = 5 // 5 second intervals
    const totalTicks = Math.ceil(totalDuration / tickInterval)

    for (let i = 0; i <= totalTicks; i++) {
      const time = i * tickInterval
      const x = time * pixelsPerSecond

      ticks.push(
        <div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: x }}
        >
          <div className="w-px h-4 bg-gray-400"></div>
          <span className="text-xs text-gray-400 mt-1">
            {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
          </span>
        </div>
      )
    }

    return ticks
  }

  // Render playhead
  const renderPlayhead = () => {
    const currentAbsoluteTime = getSceneStartTime(currentSceneIndex) + currentTime
    const x = currentAbsoluteTime * pixelsPerSecond

    return (
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
        style={{ left: x }}
      >
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
      </div>
    )
  }

  return (
    <div ref={ref} className="video-timeline h-full bg-gray-800 flex flex-col">
      {/* Timeline Header */}
      <div className="timeline-header h-12 bg-gray-700 border-b border-gray-600 flex items-center px-4 space-x-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-600"
          >
            <Play className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-600"
          >
            <Pause className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <Slider
            min={0}
            max={100}
            value={[75]}
            className="w-20"
          />
        </div>

        <div className="flex-1 text-center text-sm text-gray-400">
          {Math.floor((getSceneStartTime(currentSceneIndex) + currentTime) / 60)}:
          {((getSceneStartTime(currentSceneIndex) + currentTime) % 60).toFixed(1).padStart(4, '0')} / 
          {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toFixed(0).padStart(2, '0')}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Zoom:</span>
          <span className="text-xs text-gray-400 w-12">{zoom}%</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-gray-600"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Timeline Content */}
      <div className="timeline-content flex-1 relative overflow-x-auto overflow-y-hidden">
        {/* Timeline Ruler */}
        <div className="timeline-ruler h-8 bg-gray-700 border-b border-gray-600 relative">
          {renderTimelineRuler()}
        </div>

        {/* Scene Track */}
        <div className="scene-track h-16 bg-gray-800 relative border-b border-gray-600">
          <div className="absolute left-0 top-0 h-full flex items-center pl-2">
            <span className="text-xs text-gray-400 font-medium">Cenas</span>
          </div>
          
          <div 
            ref={timelineRef}
            className="timeline-container ml-16 h-full relative cursor-pointer"
            onClick={handleTimelineClick}
            style={{ width: totalDuration * pixelsPerSecond }}
          >
            {scenes.map((scene, index) => {
              const startTime = getSceneStartTime(index)
              const width = scene.duration * pixelsPerSecond
              const isActive = index === currentSceneIndex

              return (
                <div
                  key={scene.id}
                  className={`absolute top-2 bottom-2 rounded border-2 transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'border-blue-400 bg-blue-500 bg-opacity-30' 
                      : 'border-gray-500 bg-gray-600 bg-opacity-50 hover:bg-opacity-70'
                  }`}
                  style={{
                    left: startTime * pixelsPerSecond,
                    width: Math.max(width, 20) // Minimum width for visibility
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSceneSelect(index)
                  }}
                  onMouseDown={(e) => handleSceneDragStart(e, index)}
                  onMouseUp={handleSceneDragEnd}
                >
                  {/* Scene Thumbnail */}
                  <div className="absolute left-1 top-1 bottom-1 w-8 rounded overflow-hidden">
                    <img
                      src={scene.thumbnail}
                      alt={scene.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Scene Title */}
                  <div className="absolute left-10 top-1 bottom-1 right-1 flex flex-col justify-center">
                    <div className="text-xs font-medium text-white truncate">
                      {scene.title}
                    </div>
                    <div className="text-xs text-gray-300">
                      {scene.duration}s
                    </div>
                  </div>

                  {/* Scene Number */}
                  <div className="absolute top-0 right-1 bg-gray-900 bg-opacity-75 rounded-full w-5 h-5 flex items-center justify-center">
                    <span className="text-xs text-white">{scene.slideNumber}</span>
                  </div>
                </div>
              )
            })}

            {/* Playhead */}
            {renderPlayhead()}
          </div>
        </div>

        {/* Audio Tracks */}
        <div className="audio-tracks space-y-1">
          {/* Narration Track */}
          <div className="audio-track h-12 bg-gray-800 border-b border-gray-600 relative">
            <div className="absolute left-0 top-0 h-full flex items-center pl-2">
              <span className="text-xs text-gray-400 font-medium">Narração</span>
            </div>
            <div className="ml-16 h-full relative">
              {scenes.map((scene, index) => {
                const startTime = getSceneStartTime(index)
                const width = scene.duration * pixelsPerSecond

                return (
                  <div
                    key={`narration-${scene.id}`}
                    className="absolute top-2 bottom-2 bg-green-600 bg-opacity-50 border border-green-500 rounded"
                    style={{
                      left: startTime * pixelsPerSecond,
                      width: Math.max(width, 10)
                    }}
                  >
                    <div className="h-full bg-gradient-to-r from-green-400 to-green-600 opacity-30 rounded"></div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Music Track */}
          <div className="audio-track h-12 bg-gray-800 border-b border-gray-600 relative">
            <div className="absolute left-0 top-0 h-full flex items-center pl-2">
              <span className="text-xs text-gray-400 font-medium">Música</span>
            </div>
            <div className="ml-16 h-full relative">
              <div
                className="absolute top-2 bottom-2 bg-purple-600 bg-opacity-30 border border-purple-500 rounded"
                style={{
                  left: 0,
                  width: totalDuration * pixelsPerSecond
                }}
              >
                <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 opacity-30 rounded"></div>
              </div>
            </div>
          </div>

          {/* Effects Track */}
          <div className="audio-track h-12 bg-gray-800 relative">
            <div className="absolute left-0 top-0 h-full flex items-center pl-2">
              <span className="text-xs text-gray-400 font-medium">Efeitos</span>
            </div>
            <div className="ml-16 h-full relative">
              {/* Sound effects would be rendered here */}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Footer */}
      <div className="timeline-footer h-8 bg-gray-700 border-t border-gray-600 flex items-center justify-between px-4">
        <div className="text-xs text-gray-400">
          {scenes.length} cenas • {Math.floor(totalDuration / 60)}m {Math.floor(totalDuration % 60)}s
        </div>
        <div className="text-xs text-gray-400">
          Resolução: 1920x1080 • 30fps
        </div>
      </div>
    </div>
  )
})

VideoTimeline.displayName = 'VideoTimeline'

export { VideoTimeline }