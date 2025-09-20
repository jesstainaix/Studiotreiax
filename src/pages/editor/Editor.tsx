import React from 'react';
import IntegratedVideoEditor from '../../components/editor/IntegratedVideoEditor';
import { FeedbackProvider, FeedbackToastContainer } from '@/components/ui/FeedbackSystem';

// Editor Page Component
const Editor: React.FC = () => {
  return (
    <FeedbackProvider>
      <div className="h-screen bg-gray-50">
        <IntegratedVideoEditor />
        <FeedbackToastContainer />
      </div>
    </FeedbackProvider>
  );
};

export default Editor;