import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import VideoEditor from '../components/VideoEditor';

const Editor: React.FC = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId');

  return (
    <div className="min-h-screen bg-gray-50">
      <VideoEditor projectId={projectId} templateId={templateId} />
    </div>
  );
};

export default Editor;