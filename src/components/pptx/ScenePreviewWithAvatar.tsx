import React, { useState, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar3DViewer } from './Avatar3DViewer';
import { HeyGenScene } from '../../lib/pptx/heygen-scene-manager';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  RotateCcw,
  Maximize2,
  Settings,
  User,
  FileText,
  Timer,
  Eye
} from 'lucide-react';

interface ScenePreviewWithAvatarProps {
  scene: HeyGenScene;
  isPlaying?: boolean;
  currentTime?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  className?: string;
}

export const ScenePreviewWithAvatar: React.FC<ScenePreviewWithAvatarProps> = ({
  scene,
  isPlaying = false,
  currentTime = 0,
  onPlay,
  onPause,
  onTimeUpdate,
  onVolumeChange,
  className = ''
}) => {
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'avatar' | 'slide'>('split');
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    onVolumeChange?.(newVolume);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    onVolumeChange?.(isMuted ? volume : 0);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAvatarPosition = () => {
    if (!scene.videoSettings) return { left: '10px', top: '10px', width: '200px', height: '300px' };
    
    const position = scene.videoSettings.avatarPosition || 'right';
    switch (position) {
      case 'left':
        return { left: '20px', top: '20px', width: '200px', height: '300px' };
      case 'center':
        return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '250px', height: '350px' };
      case 'right':
      default:
        return { right: '20px', top: '20px', width: '200px', height: '300px' };
    }
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      {/* Preview Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-900">{scene.title}</h3>
            <Badge variant="outline">
              <Timer className="w-3 h-3 mr-1" />
              {formatTime(scene.duration)}
            </Badge>
            {scene.avatar && (
              <Badge variant="secondary">
                <User className="w-3 h-3 mr-1" />
                {scene.avatar.name}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Preview Mode Toggle */}
            <div className="flex border rounded">
              <Button
                size="sm"
                variant={previewMode === 'split' ? 'default' : 'ghost'}
                onClick={() => setPreviewMode('split')}
                className="rounded-r-none"
              >
                Split
              </Button>
              <Button
                size="sm"
                variant={previewMode === 'avatar' ? 'default' : 'ghost'}
                onClick={() => setPreviewMode('avatar')}
                className="rounded-none"
              >
                Avatar
              </Button>
              <Button
                size="sm"
                variant={previewMode === 'slide' ? 'default' : 'ghost'}
                onClick={() => setPreviewMode('slide')}
                className="rounded-l-none"
              >
                Slide
              </Button>
            </div>
            
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowFullscreen(true)}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <CardContent className="flex-1 p-0 relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
        {previewMode === 'split' && (
          <>
            {/* Slide Content Background */}
            <div className="absolute inset-0 flex items-center justify-center">
              {scene.thumbnail ? (
                <img 
                  src={scene.thumbnail}
                  alt={scene.title}
                  className="max-w-full max-h-full object-contain opacity-80"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-700 mb-2">{scene.title}</h4>
                  <p className="text-gray-600 max-w-md">{scene.content}</p>
                </div>
              )}
            </div>

            {/* Avatar Overlay */}
            {scene.avatar && (
              <div 
                className="absolute z-10 rounded-lg overflow-hidden shadow-lg bg-white/10 backdrop-blur-sm"
                style={getAvatarPosition()}
              >
                <Avatar3DViewer
                  avatarId={scene.avatar.id}
                  modelPath={scene.avatar.modelPath}
                  style={scene.avatar.style}
                  pose={scene.videoSettings?.cameraAngle === 'side' ? 'presenting' : 'standing'}
                  expression="neutral"
                  autoRotate={false}
                  cameraPosition={[0, 0, 2.5]}
                  className="w-full h-full"
                />
              </div>
            )}

            {/* Text Overlay */}
            {scene.videoSettings?.textOverlay && scene.content && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg">
                <p className="text-sm leading-relaxed">{scene.content}</p>
              </div>
            )}
          </>
        )}

        {previewMode === 'avatar' && scene.avatar && (
          <div className="absolute inset-0">
            <Avatar3DViewer
              avatarId={scene.avatar.id}
              modelPath={scene.avatar.modelPath}
              style={scene.avatar.style}
              pose="presenting"
              expression="neutral"
              autoRotate={true}
              cameraPosition={[0, 0, 3]}
              className="w-full h-full"
            />
          </div>
        )}

        {previewMode === 'slide' && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            {scene.thumbnail ? (
              <img 
                src={scene.thumbnail}
                alt={scene.title}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center">
                <FileText className="w-24 h-24 mx-auto text-gray-400 mb-6" />
                <h4 className="text-2xl font-medium text-gray-700 mb-4">{scene.title}</h4>
                <p className="text-gray-600 max-w-2xl leading-relaxed">{scene.content}</p>
              </div>
            )}
          </div>
        )}

        {/* Scene Info Overlay */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
          Cena {scene.position + 1} • {formatTime(currentTime)} / {formatTime(scene.duration)}
        </div>
      </CardContent>

      {/* Preview Controls */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center justify-between">
          {/* Playback Controls */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant={isPlaying ? 'default' : 'outline'}
              onClick={isPlaying ? onPause : onPlay}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button size="sm" variant="outline">
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* Time Display */}
            <span className="text-sm text-gray-600">
              {formatTime(currentTime)} / {formatTime(scene.duration)}
            </span>
          </div>

          {/* Volume Controls */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={toggleMute}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            
            <span className="text-xs text-gray-500 w-8">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="relative w-full h-2 bg-gray-200 rounded-full">
            <div 
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(currentTime / scene.duration) * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max={scene.duration}
              value={currentTime}
              onChange={(e) => onTimeUpdate?.(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ScenePreviewWithAvatar;