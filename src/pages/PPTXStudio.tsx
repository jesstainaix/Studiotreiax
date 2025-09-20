import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/layout/Navigation';
import HeyGenStudioInterface from '../components/pptx/HeyGenStudioInterface';
import { ArrowLeft } from 'lucide-react';

const PPTXStudio: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="pptx-studio" />
      
      {/* HeyGen-style Studio Interface */}
      <div className="h-[calc(100vh-4rem)]"> {/* Subtract navigation height */}
        <HeyGenStudioInterface />
      </div>
    </div>
  );
};

export default PPTXStudio;