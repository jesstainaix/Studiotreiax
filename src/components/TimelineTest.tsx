import React, { useEffect } from 'react';
import { Timeline, useTimeline } from './editor/Timeline';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, Film, Music } from 'lucide-react';

const TimelineTest: React.FC = () => {
  const { tracks, clips, addTrack, addClip } = useTimeline();

  useEffect(() => {
    // Adicionar tracks de teste
    if (tracks.length === 0) {
      addTrack({
        id: 'video-1',
        name: 'Vídeo Principal',
        type: 'video',
        height: 80,
        color: '#3b82f6',
        muted: false,
        solo: false,
        locked: false,
        volume: 1,
        pan: 0
      });

      addTrack({
        id: 'audio-1',
        name: 'Áudio Narração',
        type: 'audio',
        height: 60,
        color: '#10b981',
        muted: false,
        solo: false,
        locked: false,
        volume: 0.8,
        pan: 0
      });

      // Adicionar clips de teste
      setTimeout(() => {
        addClip({
          id: 'clip-1',
          trackId: 'video-1',
          startTime: 0,
          duration: 30,
          name: 'Intro.mp4',
          type: 'video',
          color: '#3b82f6'
        });

        addClip({
          id: 'clip-2',
          trackId: 'video-1',
          startTime: 35,
          duration: 45,
          name: 'Conteudo.mp4',
          type: 'video',
          color: '#3b82f6'
        });

        addClip({
          id: 'clip-3',
          trackId: 'audio-1',
          startTime: 0,
          duration: 75,
          name: 'Narracao.mp3',
          type: 'audio',
          color: '#10b981'
        });
      }, 100);
    }
  }, [tracks.length, addTrack, addClip]);

  const handleClipEdit = (clipId: string) => {
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="w-5 h-5" />
            Teste da Timeline Responsiva
            <Badge variant="secondary">Beta</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Tracks: {tracks.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-green-500" />
              <span className="text-sm">Clips: {clips.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm">Duração: {Math.max(...clips.map(c => c.startTime + c.duration), 0)}s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 min-h-0">
        <Timeline
          onClipEdit={handleClipEdit}
          className="h-full border rounded-lg"
        />
      </div>
    </div>
  );
};

export default TimelineTest;