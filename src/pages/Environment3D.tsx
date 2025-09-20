import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { Scene3DProvider, useScene3D } from '@/contexts/Scene3DContext';
import TerrainEditor from '@/components/editor/TerrainEditor';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Mountain, Cloud, Sun, Moon, Droplets, Snowflake,
  Wind, Zap, Settings, Play, Pause, RotateCcw,
  Save, Download, Upload, Home
} from 'lucide-react';
import { WeatherType } from '@/services/WeatherLightingSystem';
import { useNavigate } from 'react-router-dom';

const Environment3DContent: React.FC = () => {
  const {
    environmentSystem,
    weatherSystem,
    physicsSystem,
    setActiveEnvironment
  } = useScene3D();
  
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('studio_default');
  const [currentWeather, setCurrentWeather] = useState<WeatherType>(WeatherType.CLEAR);
  const [timeOfDay, setTimeOfDay] = useState<number>(12);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTerrain, setShowTerrain] = useState(false);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  
  const environments = environmentSystem.getAllEnvironments();
  const weatherState = weatherSystem.getWeatherState();
  const lightingState = weatherSystem.getLightingState();

  useEffect(() => {
    // Carregar ambiente padrão
    setActiveEnvironment(selectedEnvironment);
  }, [selectedEnvironment, setActiveEnvironment]);

  useEffect(() => {
    // Atualizar clima
    weatherSystem.setWeather(currentWeather, true);
  }, [currentWeather, weatherSystem]);

  useEffect(() => {
    // Atualizar hora do dia
    weatherSystem.setTimeOfDay(timeOfDay);
  }, [timeOfDay, weatherSystem]);

  const handleEnvironmentChange = (envId: string) => {
    setSelectedEnvironment(envId);
    toast.success(`Ambiente alterado para: ${environments.find(e => e.id === envId)?.name}`);
  };

  const handleWeatherChange = (weather: WeatherType) => {
    setCurrentWeather(weather);
    toast.success(`Clima alterado para: ${weather}`);
  };

  const toggleDayNightCycle = () => {
    if (isPlaying) {
      weatherSystem.disableDayNightCycle();
    } else {
      weatherSystem.enableDayNightCycle(300); // 5 minutos para ciclo completo
    }
    setIsPlaying(!isPlaying);
  };

  const resetEnvironment = () => {
    setSelectedEnvironment('studio_default');
    setCurrentWeather(WeatherType.CLEAR);
    setTimeOfDay(12);
    physicsSystem.clear();
    toast.success('Ambiente resetado');
  };

  const exportEnvironment = () => {
    try {
      const data = environmentSystem.exportEnvironment();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `environment_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Ambiente exportado com sucesso');
    } catch (error) {
      toast.error('Erro ao exportar ambiente');
    }
  };

  if (showTerrain) {
    return <TerrainEditor />;
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Canvas 3D */}
      <div className="flex-1">
        <Canvas 
          shadows 
          camera={{ position: [10, 10, 10], fov: 60 }}
        >
          <OrbitControls enableDamping dampingFactor={0.05} />
          <Environment preset="sunset" />
          
          {/* Grid de referência */}
          <Grid
            args={[100, 100]}
            cellSize={5}
            cellThickness={1}
            cellColor="#6e6e6e"
            sectionSize={20}
            sectionThickness={2}
            sectionColor="#9d9d9d"
            fadeDistance={200}
            fadeStrength={1}
            followCamera={false}
          />
          
          {/* Exemplo de objetos físicos */}
          <mesh position={[0, 5, 0]}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="orange" />
          </mesh>
          
          <mesh position={[5, 1, 5]}>
            <sphereGeometry args={[1.5]} />
            <meshStandardMaterial color="blue" />
          </mesh>
        </Canvas>
      </div>

      {/* Painel de Controles */}
      <div className="w-96 bg-white shadow-lg overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Ambientes 3D</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTerrain(!showTerrain)}
          >
            <Mountain size={16} className="mr-2" />
            {showTerrain ? 'Voltar' : 'Editor de Terreno'}
          </Button>
        </div>

        <Tabs defaultValue="environment" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="environment">Ambiente</TabsTrigger>
            <TabsTrigger value="weather">Clima</TabsTrigger>
            <TabsTrigger value="physics">Física</TabsTrigger>
          </TabsList>

          <TabsContent value="environment" className="space-y-4">
            {/* Seletor de Ambiente */}
            <div>
              <Label>Ambiente Pré-configurado</Label>
              <Select value={selectedEnvironment} onValueChange={handleEnvironmentChange}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {environments.map(env => (
                    <SelectItem key={env.id} value={env.id}>
                      {env.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Informações do Ambiente */}
            <Card className="p-4">
              <h4 className="font-semibold mb-2">Informações</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <Badge variant="outline">
                    {environments.find(e => e.id === selectedEnvironment)?.type}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dimensões:</span>
                  <span>100x30x100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Física:</span>
                  <span>{physicsEnabled ? 'Ativada' : 'Desativada'}</span>
                </div>
              </div>
            </Card>

            {/* Hora do Dia */}
            <div>
              <Label>Hora do Dia: {timeOfDay.toFixed(1)}h</Label>
              <div className="flex items-center gap-2 mt-2">
                <Moon size={16} />
                <Slider
                  value={[timeOfDay]}
                  onValueChange={([value]) => setTimeOfDay(value)}
                  min={0}
                  max={24}
                  step={0.5}
                  className="flex-1"
                />
                <Sun size={16} />
              </div>
            </div>

            {/* Ciclo Dia/Noite */}
            <div className="flex items-center justify-between">
              <Label>Ciclo Dia/Noite</Label>
              <Button
                size="sm"
                variant={isPlaying ? 'default' : 'outline'}
                onClick={toggleDayNightCycle}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="weather" className="space-y-4">
            {/* Tipo de Clima */}
            <div>
              <Label>Condição Climática</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  size="sm"
                  variant={currentWeather === WeatherType.CLEAR ? 'default' : 'outline'}
                  onClick={() => handleWeatherChange(WeatherType.CLEAR)}
                >
                  <Sun size={16} className="mr-2" />
                  Limpo
                </Button>
                <Button
                  size="sm"
                  variant={currentWeather === WeatherType.CLOUDY ? 'default' : 'outline'}
                  onClick={() => handleWeatherChange(WeatherType.CLOUDY)}
                >
                  <Cloud size={16} className="mr-2" />
                  Nublado
                </Button>
                <Button
                  size="sm"
                  variant={currentWeather === WeatherType.RAIN ? 'default' : 'outline'}
                  onClick={() => handleWeatherChange(WeatherType.RAIN)}
                >
                  <Droplets size={16} className="mr-2" />
                  Chuva
                </Button>
                <Button
                  size="sm"
                  variant={currentWeather === WeatherType.STORM ? 'default' : 'outline'}
                  onClick={() => handleWeatherChange(WeatherType.STORM)}
                >
                  <Zap size={16} className="mr-2" />
                  Tempestade
                </Button>
                <Button
                  size="sm"
                  variant={currentWeather === WeatherType.SNOW ? 'default' : 'outline'}
                  onClick={() => handleWeatherChange(WeatherType.SNOW)}
                >
                  <Snowflake size={16} className="mr-2" />
                  Neve
                </Button>
                <Button
                  size="sm"
                  variant={currentWeather === WeatherType.FOG ? 'default' : 'outline'}
                  onClick={() => handleWeatherChange(WeatherType.FOG)}
                >
                  <Cloud size={16} className="mr-2" />
                  Neblina
                </Button>
              </div>
            </div>

            {/* Intensidade do Clima */}
            <div>
              <Label>Intensidade: {weatherState.intensity.toFixed(1)}</Label>
              <Slider
                value={[weatherState.intensity]}
                onValueChange={([value]) => {
                  // Atualizar intensidade
                  weatherSystem.setWeather(currentWeather, true);
                }}
                min={0}
                max={1}
                step={0.1}
                className="mt-2"
              />
            </div>

            {/* Vento */}
            <div>
              <Label>Velocidade do Vento: {weatherState.windSpeed} m/s</Label>
              <Slider
                value={[weatherState.windSpeed]}
                onValueChange={([value]) => {
                  // Atualizar vento
                }}
                min={0}
                max={30}
                step={1}
                className="mt-2"
              />
            </div>

            {/* Informações Atmosféricas */}
            <Card className="p-4">
              <h4 className="font-semibold mb-2">Atmosfera</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Temperatura:</span>
                  <span>{weatherState.temperature}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Umidade:</span>
                  <span>{weatherState.humidity}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Visibilidade:</span>
                  <span>{weatherState.visibility}m</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="physics" className="space-y-4">
            {/* Ativar/Desativar Física */}
            <div className="flex items-center justify-between">
              <Label>Sistema de Física</Label>
              <Button
                size="sm"
                variant={physicsEnabled ? 'default' : 'outline'}
                onClick={() => setPhysicsEnabled(!physicsEnabled)}
              >
                {physicsEnabled ? 'Ativado' : 'Desativado'}
              </Button>
            </div>

            {/* Gravidade */}
            <div>
              <Label>Gravidade: -9.81 m/s²</Label>
              <Slider
                value={[9.81]}
                onValueChange={([value]) => {
                  physicsSystem.setGravity(new THREE.Vector3(0, -value, 0));
                }}
                min={0}
                max={20}
                step={0.1}
                className="mt-2"
              />
            </div>

            {/* Informações de Física */}
            <Card className="p-4">
              <h4 className="font-semibold mb-2">Objetos Físicos</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span>{physicsSystem.getAllBodies().length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ativos:</span>
                  <span>{physicsSystem.getAllBodies().filter(b => b.type === 'dynamic').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estáticos:</span>
                  <span>{physicsSystem.getAllBodies().filter(b => b.type === 'static').length}</span>
                </div>
              </div>
            </Card>

            {/* Adicionar Objetos Físicos */}
            <div>
              <Label>Adicionar Objeto</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const body = physicsSystem.createBody({
                      type: 'dynamic',
                      shape: physicsSystem.createBoxShape(1, 1, 1),
                      mass: 1,
                      mesh: new THREE.Mesh(
                        new THREE.BoxGeometry(1, 1, 1),
                        new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
                      )
                    });
                    body.mesh.position.set(
                      Math.random() * 10 - 5,
                      10,
                      Math.random() * 10 - 5
                    );
                    toast.success('Cubo adicionado');
                  }}
                >
                  Cubo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const body = physicsSystem.createBody({
                      type: 'dynamic',
                      shape: physicsSystem.createSphereShape(0.5),
                      mass: 1,
                      mesh: new THREE.Mesh(
                        new THREE.SphereGeometry(0.5),
                        new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
                      )
                    });
                    body.mesh.position.set(
                      Math.random() * 10 - 5,
                      10,
                      Math.random() * 10 - 5
                    );
                    toast.success('Esfera adicionada');
                  }}
                >
                  Esfera
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        {/* Ações */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={resetEnvironment}
          >
            <RotateCcw size={16} className="mr-2" />
            Resetar Ambiente
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={exportEnvironment}
          >
            <Download size={16} className="mr-2" />
            Exportar Configuração
          </Button>
          
          <label className="block">
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = event.target?.result as string;
                      environmentSystem.importEnvironment(data);
                      toast.success('Ambiente importado com sucesso');
                    } catch (error) {
                      toast.error('Erro ao importar ambiente');
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
            <Button variant="outline" className="w-full" as="span">
              <Upload size={16} className="mr-2" />
              Importar Configuração
            </Button>
          </label>
          
          <Button className="w-full">
            <Save size={16} className="mr-2" />
            Salvar Cena
          </Button>
        </div>
      </div>
    </div>
  );
};

const Environment3DPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Scene3DProvider>
      <div className="relative h-screen">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/dashboard')}
              >
                <Home size={16} className="mr-2" />
                Voltar
              </Button>
              <h1 className="text-xl font-bold">Ambientes 3D Personalizáveis</h1>
            </div>
            <Badge variant="outline">
              Sistema de Física e Clima Dinâmico
            </Badge>
          </div>
        </div>
        
        {/* Content */}
        <div className="pt-16 h-full">
          <Environment3DContent />
        </div>
      </div>
    </Scene3DProvider>
  );
};

export default Environment3DPage;