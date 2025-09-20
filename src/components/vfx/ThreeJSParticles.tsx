import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Play, Pause, RotateCcw, Download } from 'lucide-react';

interface ParticleEffect {
  id: string;
  name: string;
  description: string;
  category: 'fire' | 'water' | 'magic' | 'explosion' | 'ambient' | 'weather';
  particleCount: number;
  color: string;
  size: number;
  speed: number;
  lifespan: number;
}

const particleEffects: ParticleEffect[] = [
  {
    id: 'fire',
    name: 'Fire Particles',
    description: 'Efeito de fogo realista',
    category: 'fire',
    particleCount: 1000,
    color: '#ff4500',
    size: 0.02,
    speed: 2,
    lifespan: 3
  },
  {
    id: 'magic',
    name: 'Magic Sparkles',
    description: 'Partículas mágicas brilhantes',
    category: 'magic',
    particleCount: 500,
    color: '#9d4edd',
    size: 0.03,
    speed: 1,
    lifespan: 4
  },
  {
    id: 'explosion',
    name: 'Explosion Burst',
    description: 'Explosão com partículas',
    category: 'explosion',
    particleCount: 2000,
    color: '#ff6b35',
    size: 0.025,
    speed: 5,
    lifespan: 2
  },
  {
    id: 'snow',
    name: 'Snow Fall',
    description: 'Neve caindo suavemente',
    category: 'weather',
    particleCount: 800,
    color: '#ffffff',
    size: 0.015,
    speed: 0.5,
    lifespan: 10
  },
  {
    id: 'bubbles',
    name: 'Water Bubbles',
    description: 'Bolhas de água subindo',
    category: 'water',
    particleCount: 300,
    color: '#00bfff',
    size: 0.04,
    speed: 1.5,
    lifespan: 6
  },
  {
    id: 'stars',
    name: 'Starfield',
    description: 'Campo de estrelas ambiente',
    category: 'ambient',
    particleCount: 1500,
    color: '#ffff99',
    size: 0.01,
    speed: 0.2,
    lifespan: 15
  }
];

interface ParticleSystemProps {
  effect: ParticleEffect;
  isActive: boolean;
  intensity: number;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ effect, isActive, intensity }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { scene } = useThree();
  const [positions, setPositions] = useState<Float32Array | null>(null);
  const [velocities, setVelocities] = useState<Float32Array | null>(null);
  const [lifetimes, setLifetimes] = useState<Float32Array | null>(null);
  const [ages, setAges] = useState<Float32Array | null>(null);

  const initializeParticles = useCallback(() => {
    const count = Math.floor(effect.particleCount * intensity);
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const life = new Float32Array(count);
    const age = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Position initialization based on effect type
      switch (effect.category) {
        case 'fire':
          pos[i3] = (Math.random() - 0.5) * 0.5;
          pos[i3 + 1] = Math.random() * -1;
          pos[i3 + 2] = (Math.random() - 0.5) * 0.5;
          
          vel[i3] = (Math.random() - 0.5) * 0.1;
          vel[i3 + 1] = Math.random() * effect.speed * 0.1;
          vel[i3 + 2] = (Math.random() - 0.5) * 0.1;
          break;
          
        case 'explosion':
          const radius = Math.random() * 0.1;
          const angle = Math.random() * Math.PI * 2;
          const height = (Math.random() - 0.5) * 0.2;
          
          pos[i3] = Math.cos(angle) * radius;
          pos[i3 + 1] = height;
          pos[i3 + 2] = Math.sin(angle) * radius;
          
          vel[i3] = Math.cos(angle) * effect.speed * 0.1;
          vel[i3 + 1] = (Math.random() - 0.3) * effect.speed * 0.1;
          vel[i3 + 2] = Math.sin(angle) * effect.speed * 0.1;
          break;
          
        case 'weather':
          pos[i3] = (Math.random() - 0.5) * 4;
          pos[i3 + 1] = Math.random() * 3 + 1;
          pos[i3 + 2] = (Math.random() - 0.5) * 4;
          
          vel[i3] = (Math.random() - 0.5) * 0.02;
          vel[i3 + 1] = -effect.speed * 0.1;
          vel[i3 + 2] = (Math.random() - 0.5) * 0.02;
          break;
          
        case 'water':
          pos[i3] = (Math.random() - 0.5) * 1;
          pos[i3 + 1] = Math.random() * -1;
          pos[i3 + 2] = (Math.random() - 0.5) * 1;
          
          vel[i3] = (Math.random() - 0.5) * 0.05;
          vel[i3 + 1] = Math.random() * effect.speed * 0.05;
          vel[i3 + 2] = (Math.random() - 0.5) * 0.05;
          break;
          
        default:
          pos[i3] = (Math.random() - 0.5) * 2;
          pos[i3 + 1] = (Math.random() - 0.5) * 2;
          pos[i3 + 2] = (Math.random() - 0.5) * 2;
          
          vel[i3] = (Math.random() - 0.5) * effect.speed * 0.01;
          vel[i3 + 1] = (Math.random() - 0.5) * effect.speed * 0.01;
          vel[i3 + 2] = (Math.random() - 0.5) * effect.speed * 0.01;
      }
      
      life[i] = effect.lifespan;
      age[i] = Math.random() * effect.lifespan;
    }

    setPositions(pos);
    setVelocities(vel);
    setLifetimes(life);
    setAges(age);
  }, [effect, intensity]);

  useEffect(() => {
    if (isActive) {
      initializeParticles();
    }
  }, [isActive, initializeParticles]);

  useFrame((state, delta) => {
    if (!isActive || !positions || !velocities || !ages || !lifetimes || !pointsRef.current) return;

    const pos = positions;
    const vel = velocities;
    const age = ages;
    const life = lifetimes;
    const count = pos.length / 3;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Update age
      age[i] += delta;
      
      // Reset particle if it's too old
      if (age[i] > life[i]) {
        age[i] = 0;
        
        // Reset position based on effect type
        switch (effect.category) {
          case 'fire':
            pos[i3] = (Math.random() - 0.5) * 0.5;
            pos[i3 + 1] = -1;
            pos[i3 + 2] = (Math.random() - 0.5) * 0.5;
            break;
          case 'weather':
            pos[i3] = (Math.random() - 0.5) * 4;
            pos[i3 + 1] = 3;
            pos[i3 + 2] = (Math.random() - 0.5) * 4;
            break;
          case 'water':
            pos[i3] = (Math.random() - 0.5) * 1;
            pos[i3 + 1] = -1;
            pos[i3 + 2] = (Math.random() - 0.5) * 1;
            break;
          default:
            pos[i3] = (Math.random() - 0.5) * 2;
            pos[i3 + 1] = (Math.random() - 0.5) * 2;
            pos[i3 + 2] = (Math.random() - 0.5) * 2;
        }
      }
      
      // Update position
      pos[i3] += vel[i3] * delta;
      pos[i3 + 1] += vel[i3 + 1] * delta;
      pos[i3 + 2] += vel[i3 + 2] * delta;
      
      // Apply gravity for certain effects
      if (effect.category === 'fire' || effect.category === 'explosion') {
        vel[i3 + 1] += delta * 0.5; // gravity
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!isActive || !positions) return null;

  return (
    <Points ref={pointsRef} positions={positions}>
      <PointMaterial
        transparent
        color={effect.color}
        size={effect.size * intensity}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

interface ThreeJSParticlesProps {
  onEffectSelect?: (effect: ParticleEffect) => void;
  onExport?: (effectData: any) => void;
}

export const ThreeJSParticles: React.FC<ThreeJSParticlesProps> = ({
  onEffectSelect,
  onExport
}) => {
  const [selectedEffect, setSelectedEffect] = useState<ParticleEffect | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intensity, setIntensity] = useState([1]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'fire', 'water', 'magic', 'explosion', 'ambient', 'weather'];

  const filteredEffects = selectedCategory === 'all' 
    ? particleEffects 
    : particleEffects.filter(effect => effect.category === selectedCategory);

  const handleEffectSelect = (effect: ParticleEffect) => {
    setSelectedEffect(effect);
    onEffectSelect?.(effect);
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  const handleExport = () => {
    if (selectedEffect) {
      const exportData = {
        effect: selectedEffect,
        intensity: intensity[0],
        timestamp: new Date().toISOString()
      };
      onExport?.(exportData);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>✨</span>
            Three.js Particle Effects
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Categoria:</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'Todas' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Effects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEffects.map(effect => (
              <Card 
                key={effect.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedEffect?.id === effect.id ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => handleEffectSelect(effect)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{effect.name}</h3>
                    <p className="text-sm text-gray-600">{effect.description}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Categoria: {effect.category}</span>
                      <span>Partículas: {effect.particleCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: effect.color }}
                      />
                      <span>Velocidade: {effect.speed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {selectedEffect && (
        <Card>
          <CardHeader>
            <CardTitle>Preview: {selectedEffect.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Intensity Control */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Intensidade: {intensity[0].toFixed(1)}x</label>
              <Slider
                value={intensity}
                onValueChange={setIntensity}
                min={0.1}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* 3D Preview */}
            <div className="h-64 bg-black rounded-lg overflow-hidden">
              <Canvas camera={{ position: [0, 0, 3], fov: 75 }}>
                <ambientLight intensity={0.1} />
                <pointLight position={[10, 10, 10]} />
                <ParticleSystem 
                  effect={selectedEffect} 
                  isActive={isPlaying} 
                  intensity={intensity[0]}
                />
              </Canvas>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-2">
              <Button
                onClick={handlePlay}
                disabled={isPlaying}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {isPlaying ? 'Reproduzindo...' : 'Reproduzir'}
              </Button>
              <Button
                onClick={handleStop}
                disabled={!isPlaying}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Parar
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </div>

            {/* Effect Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Partículas:</span> {Math.floor(selectedEffect.particleCount * intensity[0])}
              </div>
              <div>
                <span className="font-medium">Duração:</span> {selectedEffect.lifespan}s
              </div>
              <div>
                <span className="font-medium">Velocidade:</span> {selectedEffect.speed}
              </div>
              <div>
                <span className="font-medium">Tamanho:</span> {(selectedEffect.size * intensity[0]).toFixed(3)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ThreeJSParticles;