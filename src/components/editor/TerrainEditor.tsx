import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Sky, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Mountain, Trees, Waves, Cloud, Sun, Moon,
  Brush, Eraser, Download, Upload, Save, Undo, Redo,
  Layers, Eye, EyeOff, Settings, Palette, Move3d,
  Sparkles, Wind, Droplets, Snowflake, Zap
} from 'lucide-react';
import Custom3DEnvironments from '@/services/Custom3DEnvironments';
import PhysicsSystem from '@/services/PhysicsSystem';

interface TerrainLayer {
  id: string;
  name: string;
  type: 'height' | 'texture' | 'vegetation' | 'water' | 'objects';
  visible: boolean;
  opacity: number;
  data: any;
}

interface BrushSettings {
  size: number;
  strength: number;
  falloff: 'linear' | 'smooth' | 'sharp';
  mode: 'raise' | 'lower' | 'smooth' | 'flatten' | 'noise';
}

interface TerrainPreset {
  id: string;
  name: string;
  icon: React.ReactNode;
  generate: () => Float32Array;
}

const TerrainMesh: React.FC<{
  heightMap: Float32Array;
  size: number;
  resolution: number;
  wireframe: boolean;
  textureType: string;
  onTerrainEdit: (x: number, z: number, brush: BrushSettings) => void;
}> = ({ heightMap, size, resolution, wireframe, textureType, onTerrainEdit }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.BufferGeometry;
      const positions = geometry.attributes.position;

      for (let i = 0; i < positions.count; i++) {
        positions.setY(i, heightMap[i]);
      }

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  }, [heightMap]);

  const handlePointerMove = useCallback((event: any) => {
    if (!isEditing || !meshRef.current) return;

    const mesh = meshRef.current;
    const point = event.point;
    
    // Converter ponto 3D para coordenadas do terreno
    const localPoint = mesh.worldToLocal(point.clone());
    const x = localPoint.x + size / 2;
    const z = localPoint.z + size / 2;

    onTerrainEdit(x, z, { size: 10, strength: 1, falloff: 'smooth', mode: 'raise' });
  }, [isEditing, onTerrainEdit, size]);

  const getTexture = () => {
    switch (textureType) {
      case 'grass':
        return '#3a7c3a';
      case 'sand':
        return '#c2b280';
      case 'rock':
        return '#8b7d6b';
      case 'snow':
        return '#ffffff';
      default:
        return '#808080';
    }
  };

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow
      onPointerDown={() => setIsEditing(true)}
      onPointerUp={() => setIsEditing(false)}
      onPointerMove={handlePointerMove}
    >
      <planeGeometry args={[size, size, resolution - 1, resolution - 1]} />
      <meshStandardMaterial
        color={getTexture()}
        wireframe={wireframe}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
};

const VegetationSystem: React.FC<{
  terrain: Float32Array;
  size: number;
  density: number;
  types: string[];
}> = ({ terrain, size, density, types }) => {
  const instancesRef = useRef<THREE.InstancedMesh[]>([]);

  useEffect(() => {
    // Limpar instâncias anteriores
    instancesRef.current.forEach(instance => {
      instance.geometry.dispose();
      (instance.material as THREE.Material).dispose();
    });
    instancesRef.current = [];

    // Criar novas instâncias de vegetação
    types.forEach(type => {
      const count = Math.floor(density * 100);
      const geometry = getVegetationGeometry(type);
      const material = new THREE.MeshStandardMaterial({
        color: type === 'tree' ? 0x2d5a2d : 0x4a7a4a,
        roughness: 0.8
      });

      const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
      const dummy = new THREE.Object3D();

      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * size;
        const z = (Math.random() - 0.5) * size;
        const terrainIndex = Math.floor((x + size/2) * (z + size/2));
        const y = terrain[Math.abs(terrainIndex) % terrain.length];

        dummy.position.set(x, y, z);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.scale.setScalar(0.5 + Math.random() * 0.5);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(i, dummy.matrix);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      instancesRef.current.push(instancedMesh);
    });
  }, [terrain, size, density, types]);

  const getVegetationGeometry = (type: string): THREE.BufferGeometry => {
    switch (type) {
      case 'tree':
        return new THREE.ConeGeometry(1, 5, 6);
      case 'bush':
        return new THREE.SphereGeometry(1, 6, 4);
      case 'grass':
        return new THREE.PlaneGeometry(0.5, 1);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  };

  return (
    <>
      {instancesRef.current.map((instance, index) => (
        <primitive key={index} object={instance} />
      ))}
    </>
  );
};

const WeatherEffects: React.FC<{
  type: string;
  intensity: number;
}> = ({ type, intensity }) => {
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      
      // Animar partículas baseado no tipo de clima
      switch (type) {
        case 'rain':
          positions.array[i3 + 1] -= 2 * intensity;
          if (positions.array[i3 + 1] < -10) {
            positions.array[i3 + 1] = 20;
          }
          break;
        case 'snow':
          positions.array[i3 + 1] -= 0.5 * intensity;
          positions.array[i3] += Math.sin(time + i) * 0.01;
          if (positions.array[i3 + 1] < -10) {
            positions.array[i3 + 1] = 20;
          }
          break;
        case 'wind':
          positions.array[i3] += 0.5 * intensity;
          if (positions.array[i3] > 50) {
            positions.array[i3] = -50;
          }
          break;
      }
    }

    positions.needsUpdate = true;
  });

  if (type === 'none' || intensity === 0) return null;

  const particleCount = 1000 * intensity;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 100;
    positions[i3 + 1] = Math.random() * 20;
    positions[i3 + 2] = (Math.random() - 0.5) * 100;
  }

  const color = type === 'snow' ? 0xffffff : 0x6090ff;
  const size = type === 'snow' ? 0.3 : 0.1;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const TerrainEditor: React.FC = () => {
  const [terrainSize] = useState(100);
  const [resolution, setResolution] = useState(64);
  const [heightMap, setHeightMap] = useState<Float32Array>(new Float32Array(resolution * resolution));
  const [layers, setLayers] = useState<TerrainLayer[]>([
    { id: 'height', name: 'Altura', type: 'height', visible: true, opacity: 1, data: null },
    { id: 'texture', name: 'Textura', type: 'texture', visible: true, opacity: 1, data: 'grass' },
    { id: 'vegetation', name: 'Vegetação', type: 'vegetation', visible: true, opacity: 1, data: [] }
  ]);

  const [selectedLayer, setSelectedLayer] = useState('height');
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  
  const [brush, setBrush] = useState<BrushSettings>({
    size: 10,
    strength: 1,
    falloff: 'smooth',
    mode: 'raise'
  });

  const [environment, setEnvironment] = useState({
    preset: 'sunset',
    sunPosition: [100, 20, 100],
    fogDensity: 0.02
  });

  const [weather, setWeather] = useState({
    type: 'none',
    intensity: 0.5,
    windSpeed: 1,
    windDirection: [1, 0, 0]
  });

  const [vegetation, setVegetation] = useState({
    density: 0.3,
    types: ['tree', 'bush'],
    randomSeed: 42
  });

  const environmentSystem = useRef(Custom3DEnvironments.getInstance());
  const physicsSystem = useRef(PhysicsSystem.getInstance());
  const [history, setHistory] = useState<Float32Array[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const terrainPresets: TerrainPreset[] = [
    {
      id: 'flat',
      name: 'Plano',
      icon: <Layers size={16} />,
      generate: () => new Float32Array(resolution * resolution)
    },
    {
      id: 'hills',
      name: 'Colinas',
      icon: <Mountain size={16} />,
      generate: () => {
        const map = new Float32Array(resolution * resolution);
        for (let i = 0; i < resolution; i++) {
          for (let j = 0; j < resolution; j++) {
            const x = (i / resolution) * Math.PI * 4;
            const z = (j / resolution) * Math.PI * 4;
            map[i * resolution + j] = Math.sin(x) * Math.cos(z) * 5;
          }
        }
        return map;
      }
    },
    {
      id: 'mountains',
      name: 'Montanhas',
      icon: <Mountain size={16} />,
      generate: () => {
        const map = new Float32Array(resolution * resolution);
        for (let i = 0; i < resolution; i++) {
          for (let j = 0; j < resolution; j++) {
            const x = (i / resolution) * Math.PI * 2;
            const z = (j / resolution) * Math.PI * 2;
            const height = Math.sin(x) * Math.cos(z) * 10;
            const noise = (Math.random() - 0.5) * 2;
            map[i * resolution + j] = height + noise;
          }
        }
        return map;
      }
    },
    {
      id: 'valley',
      name: 'Vale',
      icon: <Waves size={16} />,
      generate: () => {
        const map = new Float32Array(resolution * resolution);
        for (let i = 0; i < resolution; i++) {
          for (let j = 0; j < resolution; j++) {
            const x = (i - resolution / 2) / resolution;
            const z = (j - resolution / 2) / resolution;
            const distance = Math.sqrt(x * x + z * z);
            map[i * resolution + j] = distance * 10;
          }
        }
        return map;
      }
    }
  ];

  const applyPreset = (preset: TerrainPreset) => {
    const newHeightMap = preset.generate();
    addToHistory(newHeightMap);
    setHeightMap(newHeightMap);
    toast.success(`Preset "${preset.name}" aplicado`);
  };

  const addToHistory = (map: Float32Array) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(new Float32Array(map));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setHeightMap(new Float32Array(history[historyIndex - 1]));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setHeightMap(new Float32Array(history[historyIndex + 1]));
    }
  };

  const handleTerrainEdit = useCallback((x: number, z: number, brushSettings: BrushSettings) => {
    const newHeightMap = new Float32Array(heightMap);
    const gridX = Math.floor((x / terrainSize) * resolution);
    const gridZ = Math.floor((z / terrainSize) * resolution);
    const brushRadius = Math.floor(brushSettings.size / 2);

    for (let i = -brushRadius; i <= brushRadius; i++) {
      for (let j = -brushRadius; j <= brushRadius; j++) {
        const targetX = gridX + i;
        const targetZ = gridZ + j;

        if (targetX >= 0 && targetX < resolution && targetZ >= 0 && targetZ < resolution) {
          const index = targetX * resolution + targetZ;
          const distance = Math.sqrt(i * i + j * j);

          if (distance <= brushRadius) {
            let influence = 1;

            // Aplicar falloff
            switch (brushSettings.falloff) {
              case 'linear':
                influence = 1 - (distance / brushRadius);
                break;
              case 'smooth':
                influence = Math.cos((distance / brushRadius) * Math.PI / 2);
                break;
              case 'sharp':
                influence = Math.pow(1 - (distance / brushRadius), 2);
                break;
            }

            influence *= brushSettings.strength;

            // Aplicar modo de edição
            switch (brushSettings.mode) {
              case 'raise':
                newHeightMap[index] += influence;
                break;
              case 'lower':
                newHeightMap[index] -= influence;
                break;
              case 'smooth':
                // Média com vizinhos
                let sum = 0;
                let count = 0;
                for (let di = -1; di <= 1; di++) {
                  for (let dj = -1; dj <= 1; dj++) {
                    const ni = targetX + di;
                    const nj = targetZ + dj;
                    if (ni >= 0 && ni < resolution && nj >= 0 && nj < resolution) {
                      sum += newHeightMap[ni * resolution + nj];
                      count++;
                    }
                  }
                }
                newHeightMap[index] = newHeightMap[index] * (1 - influence) + (sum / count) * influence;
                break;
              case 'flatten':
                newHeightMap[index] *= 1 - influence;
                break;
              case 'noise':
                newHeightMap[index] += (Math.random() - 0.5) * influence * 2;
                break;
            }
          }
        }
      }
    }

    setHeightMap(newHeightMap);
  }, [heightMap, resolution, terrainSize]);

  const exportTerrain = () => {
    const terrainData = {
      heightMap: Array.from(heightMap),
      resolution,
      size: terrainSize,
      layers,
      environment,
      weather,
      vegetation
    };

    const dataStr = JSON.stringify(terrainData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `terrain_${Date.now()}.json`);
    linkElement.click();
    
    toast.success('Terreno exportado com sucesso');
  };

  const importTerrain = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setHeightMap(new Float32Array(data.heightMap));
        setResolution(data.resolution);
        setLayers(data.layers);
        setEnvironment(data.environment);
        setWeather(data.weather);
        setVegetation(data.vegetation);
        toast.success('Terreno importado com sucesso');
      } catch (error) {
        toast.error('Erro ao importar terreno');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Canvas 3D */}
      <div className="flex-1">
        <Canvas shadows camera={{ position: [50, 50, 50], fov: 60 }}>
          <PerspectiveCamera makeDefault position={[50, 50, 50]} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          
          {/* Iluminação */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={environment.sunPosition}
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />

          {/* Ambiente */}
          <Sky sunPosition={environment.sunPosition} />
          <Environment preset={environment.preset as any} />
          
          {/* Névoa */}
          <fog attach="fog" color="#ffffff" near={50} far={200} />

          {/* Grid */}
          {showGrid && (
            <Grid
              args={[terrainSize, terrainSize]}
              cellSize={5}
              cellThickness={1}
              cellColor="#6e6e6e"
              sectionSize={20}
              sectionThickness={2}
              sectionColor="#9d9d9d"
              fadeDistance={200}
              fadeStrength={1}
              followCamera={false}
              position={[0, 0, 0]}
            />
          )}

          {/* Terreno */}
          <TerrainMesh
            heightMap={heightMap}
            size={terrainSize}
            resolution={resolution}
            wireframe={wireframe}
            textureType={layers.find(l => l.type === 'texture')?.data || 'grass'}
            onTerrainEdit={handleTerrainEdit}
          />

          {/* Vegetação */}
          {layers.find(l => l.type === 'vegetation' && l.visible) && (
            <VegetationSystem
              terrain={heightMap}
              size={terrainSize}
              density={vegetation.density}
              types={vegetation.types}
            />
          )}

          {/* Efeitos de clima */}
          <WeatherEffects type={weather.type} intensity={weather.intensity} />
        </Canvas>
      </div>

      {/* Painel de Controles */}
      <div className="w-96 bg-white shadow-lg overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Editor de Terreno</h2>

          <Tabs defaultValue="terrain" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="terrain">Terreno</TabsTrigger>
              <TabsTrigger value="brush">Pincel</TabsTrigger>
              <TabsTrigger value="environment">Ambiente</TabsTrigger>
              <TabsTrigger value="layers">Camadas</TabsTrigger>
            </TabsList>

            <TabsContent value="terrain" className="space-y-4">
              {/* Presets */}
              <div>
                <Label>Presets de Terreno</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {terrainPresets.map(preset => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="flex items-center gap-2"
                    >
                      {preset.icon}
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Resolução */}
              <div>
                <Label>Resolução: {resolution}x{resolution}</Label>
                <Slider
                  value={[resolution]}
                  onValueChange={([value]) => {
                    setResolution(value);
                    setHeightMap(new Float32Array(value * value));
                  }}
                  min={32}
                  max={256}
                  step={32}
                  className="mt-2"
                />
              </div>

              {/* Textura */}
              <div>
                <Label>Textura Base</Label>
                <Select
                  value={layers.find(l => l.type === 'texture')?.data || 'grass'}
                  onValueChange={(value) => {
                    setLayers(layers.map(l =>
                      l.type === 'texture' ? { ...l, data: value } : l
                    ));
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grass">Grama</SelectItem>
                    <SelectItem value="sand">Areia</SelectItem>
                    <SelectItem value="rock">Rocha</SelectItem>
                    <SelectItem value="snow">Neve</SelectItem>
                    <SelectItem value="dirt">Terra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vegetação */}
              <div>
                <Label>Densidade da Vegetação</Label>
                <Slider
                  value={[vegetation.density]}
                  onValueChange={([value]) => {
                    setVegetation({ ...vegetation, density: value });
                  }}
                  min={0}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Tipos de Vegetação</Label>
                <div className="flex gap-2 mt-2">
                  {['tree', 'bush', 'grass'].map(type => (
                    <Badge
                      key={type}
                      variant={vegetation.types.includes(type) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setVegetation({
                          ...vegetation,
                          types: vegetation.types.includes(type)
                            ? vegetation.types.filter(t => t !== type)
                            : [...vegetation.types, type]
                        });
                      }}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="brush" className="space-y-4">
              {/* Modo do Pincel */}
              <div>
                <Label>Modo</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['raise', 'lower', 'smooth', 'flatten', 'noise'].map(mode => (
                    <Button
                      key={mode}
                      variant={brush.mode === mode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBrush({ ...brush, mode: mode as any })}
                    >
                      {mode === 'raise' && '⬆️ Elevar'}
                      {mode === 'lower' && '⬇️ Abaixar'}
                      {mode === 'smooth' && '〰️ Suavizar'}
                      {mode === 'flatten' && '➖ Achatar'}
                      {mode === 'noise' && '🎲 Ruído'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tamanho do Pincel */}
              <div>
                <Label>Tamanho: {brush.size}</Label>
                <Slider
                  value={[brush.size]}
                  onValueChange={([value]) => setBrush({ ...brush, size: value })}
                  min={1}
                  max={50}
                  className="mt-2"
                />
              </div>

              {/* Força do Pincel */}
              <div>
                <Label>Força: {brush.strength.toFixed(2)}</Label>
                <Slider
                  value={[brush.strength]}
                  onValueChange={([value]) => setBrush({ ...brush, strength: value })}
                  min={0.1}
                  max={2}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              {/* Falloff */}
              <div>
                <Label>Falloff</Label>
                <Select
                  value={brush.falloff}
                  onValueChange={(value: any) => setBrush({ ...brush, falloff: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="smooth">Suave</SelectItem>
                    <SelectItem value="sharp">Acentuado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Undo/Redo */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                >
                  <Undo size={16} className="mr-2" />
                  Desfazer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <Redo size={16} className="mr-2" />
                  Refazer
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="environment" className="space-y-4">
              {/* Preset de Ambiente */}
              <div>
                <Label>Preset de Iluminação</Label>
                <Select
                  value={environment.preset}
                  onValueChange={(value) => setEnvironment({ ...environment, preset: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunset">Pôr do Sol</SelectItem>
                    <SelectItem value="dawn">Amanhecer</SelectItem>
                    <SelectItem value="night">Noite</SelectItem>
                    <SelectItem value="warehouse">Armazém</SelectItem>
                    <SelectItem value="forest">Floresta</SelectItem>
                    <SelectItem value="apartment">Apartamento</SelectItem>
                    <SelectItem value="studio">Estúdio</SelectItem>
                    <SelectItem value="city">Cidade</SelectItem>
                    <SelectItem value="park">Parque</SelectItem>
                    <SelectItem value="lobby">Lobby</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Posição do Sol */}
              <div>
                <Label>Altura do Sol</Label>
                <Slider
                  value={[environment.sunPosition[1]]}
                  onValueChange={([value]) => {
                    setEnvironment({
                      ...environment,
                      sunPosition: [environment.sunPosition[0], value, environment.sunPosition[2]]
                    });
                  }}
                  min={-50}
                  max={200}
                  className="mt-2"
                />
              </div>

              {/* Clima */}
              <div>
                <Label>Tipo de Clima</Label>
                <Select
                  value={weather.type}
                  onValueChange={(value) => setWeather({ ...weather, type: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Limpo</SelectItem>
                    <SelectItem value="rain">Chuva</SelectItem>
                    <SelectItem value="snow">Neve</SelectItem>
                    <SelectItem value="wind">Vento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {weather.type !== 'none' && (
                <div>
                  <Label>Intensidade do Clima</Label>
                  <Slider
                    value={[weather.intensity]}
                    onValueChange={([value]) => setWeather({ ...weather, intensity: value })}
                    min={0}
                    max={1}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              )}

              {/* Névoa */}
              <div>
                <Label>Densidade da Névoa</Label>
                <Slider
                  value={[environment.fogDensity]}
                  onValueChange={([value]) => setEnvironment({ ...environment, fogDensity: value })}
                  min={0}
                  max={0.1}
                  step={0.01}
                  className="mt-2"
                />
              </div>
            </TabsContent>

            <TabsContent value="layers" className="space-y-4">
              {/* Lista de Camadas */}
              <div>
                <Label>Camadas do Terreno</Label>
                <div className="space-y-2 mt-2">
                  {layers.map(layer => (
                    <Card key={layer.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setLayers(layers.map(l =>
                                l.id === layer.id ? { ...l, visible: !l.visible } : l
                              ));
                            }}
                          >
                            {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                          </Button>
                          <span className={`${!layer.visible && 'opacity-50'}`}>
                            {layer.name}
                          </span>
                        </div>
                        <Badge variant={selectedLayer === layer.id ? 'default' : 'outline'}>
                          {layer.type}
                        </Badge>
                      </div>
                      {layer.visible && (
                        <div className="mt-2">
                          <Label className="text-xs">Opacidade</Label>
                          <Slider
                            value={[layer.opacity]}
                            onValueChange={([value]) => {
                              setLayers(layers.map(l =>
                                l.id === layer.id ? { ...l, opacity: value } : l
                              ));
                            }}
                            min={0}
                            max={1}
                            step={0.1}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-4" />

          {/* Opções de Visualização */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Wireframe</Label>
              <Switch checked={wireframe} onCheckedChange={setWireframe} />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Mostrar Grid</Label>
              <Switch checked={showGrid} onCheckedChange={setShowGrid} />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Auto-Save</Label>
              <Switch checked={autoSave} onCheckedChange={setAutoSave} />
            </div>
          </div>

          <Separator className="my-4" />

          {/* Ações */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={exportTerrain}
              >
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
              
              <label className="flex-1">
                <input
                  type="file"
                  accept=".json"
                  onChange={importTerrain}
                  className="hidden"
                />
                <Button variant="outline" size="sm" className="w-full" as="span">
                  <Upload size={16} className="mr-2" />
                  Importar
                </Button>
              </label>
            </div>
            
            <Button className="w-full" onClick={() => toast.success('Terreno salvo!')}>
              <Save size={16} className="mr-2" />
              Salvar Terreno
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerrainEditor;