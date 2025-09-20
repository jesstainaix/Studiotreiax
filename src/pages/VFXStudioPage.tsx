import React, { useRef, useEffect, useState } from 'react';
import { toast } from 'sonner';
import VFXStudioPro from '../components/VFXStudioPro';
import { VFXComposition, VFXLayer, VFXEffectFactory } from '../services/AdvancedVFXEngine';
import { Plus, Download, Upload, Save, FolderOpen } from 'lucide-react';

const VFXStudioPage: React.FC = () => {
  const [composition, setComposition] = useState<VFXComposition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with demo composition
  useEffect(() => {
    const demoComposition: VFXComposition = {
      id: 'demo-composition',
      name: 'Demo VFX Composition',
      width: 1920,
      height: 1080,
      frameRate: 30,
      duration: 10,
      backgroundColor: '#1a1a2e',
      layers: [
        {
          id: 'background-layer',
          name: 'Background',
          type: 'solid',
          startTime: 0,
          endTime: 10,
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            anchor: { x: 0.5, y: 0.5 },
            skew: { x: 0, y: 0 }
          },
          content: {
            color: '#16213e'
          },
          effects: []
        },
        {
          id: 'particle-layer',
          name: 'Particle System',
          type: 'particle',
          startTime: 0,
          endTime: 10,
          visible: true,
          locked: false,
          opacity: 0.8,
          blendMode: 'screen',
          transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            anchor: { x: 0.5, y: 0.5 },
            skew: { x: 0, y: 0 }
          },
          content: {
            particleCount: 200,
            emissionRate: 50,
            lifetime: 3,
            size: 2,
            color: '#00d4ff',
            velocity: { x: 0, y: 1, z: 0 },
            gravity: { x: 0, y: -0.5, z: 0 }
          },
          effects: [
            VFXEffectFactory.createGlowEffect('#00d4ff', 1.5)
          ]
        },
        {
          id: 'text-layer',
          name: 'Title Text',
          type: 'text',
          startTime: 1,
          endTime: 8,
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          transform: {
            position: { x: 0, y: -100, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            anchor: { x: 0.5, y: 0.5 },
            skew: { x: 0, y: 0 }
          },
          content: {
            text: 'VFX Studio Pro',
            fontSize: 72,
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            align: 'center',
            weight: 'bold'
          },
          effects: [
            VFXEffectFactory.createFadeTransition(2),
            VFXEffectFactory.createGlowEffect('#ffffff', 0.8)
          ]
        },
        {
          id: 'explosion-layer',
          name: 'Explosion Effect',
          type: 'effect',
          startTime: 5,
          endTime: 7,
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'screen',
          transform: {
            position: { x: 200, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            anchor: { x: 0.5, y: 0.5 },
            skew: { x: 0, y: 0 }
          },
          content: {},
          effects: [
            VFXEffectFactory.createParticleExplosion(2),
            VFXEffectFactory.createDistortionWave(1.5)
          ]
        }
      ],
      effects: [
        VFXEffectFactory.createColorGrading(0.1, 0.05, 1.2)
      ],
      settings: {
        quality: 'high',
        antialiasing: true,
        shadows: true,
        postProcessing: true
      }
    };

    setComposition(demoComposition);
    toast.success('Demo composition loaded successfully!');
  }, []);

  const handleNewComposition = () => {
    const newComposition: VFXComposition = {
      id: `composition-${Date.now()}`,
      name: 'New Composition',
      width: 1920,
      height: 1080,
      frameRate: 30,
      duration: 10,
      backgroundColor: '#000000',
      layers: [],
      effects: [],
      settings: {
        quality: 'high',
        antialiasing: true,
        shadows: true,
        postProcessing: true
      }
    };

    setComposition(newComposition);
    toast.success('New composition created!');
  };

  const handleSaveComposition = () => {
    if (!composition) {
      toast.error('No composition to save!');
      return;
    }

    try {
      const dataStr = JSON.stringify(composition, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${composition.name.replace(/\s+/g, '_')}.vfx.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      toast.success('Composition saved successfully!');
    } catch (error) {
      console.error('Error saving composition:', error);
      toast.error('Failed to save composition!');
    }
  };

  const handleLoadComposition = () => {
    fileInputRef.current?.click();
  };

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const loadedComposition = JSON.parse(content) as VFXComposition;
        
        // Validate composition structure
        if (!loadedComposition.id || !loadedComposition.name || !Array.isArray(loadedComposition.layers)) {
          throw new Error('Invalid composition format');
        }
        
        setComposition(loadedComposition);
        toast.success(`Composition "${loadedComposition.name}" loaded successfully!`);
      } catch (error) {
        console.error('Error loading composition:', error);
        toast.error('Failed to load composition! Please check the file format.');
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read file!');
      setIsLoading(false);
    };
    
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const handleExportVideo = () => {
    toast.info('Video export feature coming soon!');
  };

  const handleCompositionChange = (updatedComposition: VFXComposition) => {
    setComposition(updatedComposition);
  };

  return (
    <div className="vfx-studio-page h-screen flex flex-col bg-gray-900">
      {/* Top Menu Bar */}
      <div className="menu-bar flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-white">VFX Studio Pro</h1>
          <div className="text-sm text-gray-400">
            Professional Visual Effects Suite
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleNewComposition}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
          
          <button
            onClick={handleLoadComposition}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50"
          >
            <FolderOpen className="w-4 h-4" />
            <span>{isLoading ? 'Loading...' : 'Open'}</span>
          </button>
          
          <button
            onClick={handleSaveComposition}
            disabled={!composition}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          
          <div className="w-px h-6 bg-gray-600" />
          
          <button
            onClick={handleExportVideo}
            disabled={!composition}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {/* Main Studio Interface */}
      <div className="studio-content flex-1">
        {composition ? (
          <VFXStudioPro 
            composition={composition}
            onCompositionChange={handleCompositionChange}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-center">
              <div className="text-6xl text-gray-600 mb-4">🎬</div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to VFX Studio Pro</h2>
              <p className="text-gray-400 mb-6">Create stunning visual effects with our professional suite</p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={handleNewComposition}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>New Composition</span>
                </button>
                <button
                  onClick={handleLoadComposition}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>Load Project</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.vfx"
        onChange={handleFileLoad}
        className="hidden"
      />
    </div>
  );
};

export default VFXStudioPage;