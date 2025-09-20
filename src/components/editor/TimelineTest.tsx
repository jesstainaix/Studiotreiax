import React from 'react';
import { Timeline } from './Timeline';
import { useTimeline } from './Timeline';

// Componente de teste para verificar a responsividade da timeline
export const TimelineTest: React.FC = () => {
  const { addClip, tracks } = useTimeline();

  // Adicionar alguns clips de teste
  React.useEffect(() => {
    if (tracks[0] && tracks[0].clips.length === 0) {
      addClip(tracks[0].id, {
        type: 'video',
        name: 'Test Video 1',
        startTime: 10,
        duration: 30,
        url: 'test-video-1.mp4',
        position: { x: 0, y: 0 },
        color: '#3b82f6'
      });
      
      addClip(tracks[0].id, {
        type: 'video',
        name: 'Test Video 2',
        startTime: 50,
        duration: 25,
        url: 'test-video-2.mp4',
        position: { x: 0, y: 0 },
        color: '#6366f1'
      });
    }
    
    if (tracks[2] && tracks[2].clips.length === 0) {
      addClip(tracks[2].id, {
        type: 'audio',
        name: 'Test Audio 1',
        startTime: 5,
        duration: 60,
        url: 'test-audio-1.mp3',
        position: { x: 0, y: 0 },
        color: '#10b981'
      });
    }
  }, [addClip, tracks]);

  const handleClipEdit = (clipId: string, updates: any) => {
  };

  return (
    <div className="w-full h-screen bg-gray-900 p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white mb-2">Timeline Test</h1>
        <p className="text-gray-300">Testing timeline responsiveness and functionality</p>
      </div>
      
      <div className="h-96 border border-gray-700 rounded-lg overflow-hidden">
        <Timeline onClipEdit={handleClipEdit} />
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-2">Tracks</h3>
          <p className="text-gray-300 text-sm">{tracks.length} tracks loaded</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-2">Clips</h3>
          <p className="text-gray-300 text-sm">
            {tracks.reduce((total, track) => total + track.clips.length, 0)} clips total
          </p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-2">Video Tracks</h3>
          <p className="text-gray-300 text-sm">
            {tracks.filter(t => t.type === 'video').length} video tracks
          </p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-2">Audio Tracks</h3>
          <p className="text-gray-300 text-sm">
            {tracks.filter(t => t.type === 'audio').length} audio tracks
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimelineTest;