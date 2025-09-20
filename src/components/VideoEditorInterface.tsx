import React from 'react';
import { VideoEditor } from './editor/VideoEditor';

interface VideoEditorInterfaceProps {
  systemIntegration?: any;
  projectId?: string;
}

// Interface wrapper para integração com o sistema principal
const VideoEditorInterface: React.FC<VideoEditorInterfaceProps> = ({ 
  systemIntegration, 
  projectId 
}) => {
  return (
    <div className="w-full h-full">
      <VideoEditor projectId={projectId} />
    </div>
  );
};

export default VideoEditorInterface;