import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import Custom3DEnvironments from '@/services/Custom3DEnvironments';
import PhysicsSystem from '@/services/PhysicsSystem';
import WeatherLightingSystem from '@/services/WeatherLightingSystem';

interface Scene3DContextValue {
  scene: THREE.Scene;
  clock: THREE.Clock;
  environmentSystem: Custom3DEnvironments;
  physicsSystem: PhysicsSystem;
  weatherSystem: WeatherLightingSystem;
  activeEnvironmentId: string | null;
  setActiveEnvironment: (id: string) => void;
  updatePhysics: (deltaTime: number) => void;
  updateWeather: (deltaTime: number) => void;
}

const Scene3DContext = createContext<Scene3DContextValue | null>(null);

export const useScene3D = () => {
  const context = useContext(Scene3DContext);
  if (!context) {
    throw new Error('useScene3D must be used within Scene3DProvider');
  }
  return context;
};

export const Scene3DProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sceneRef = useRef(new THREE.Scene());
  const clockRef = useRef(new THREE.Clock());
  const environmentSystemRef = useRef(Custom3DEnvironments.getInstance());
  const physicsSystemRef = useRef(PhysicsSystem.getInstance());
  const weatherSystemRef = useRef(WeatherLightingSystem.getInstance());
  
  const [activeEnvironmentId, setActiveEnvironmentId] = useState<string | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Configurar cena compartilhada
    const scene = sceneRef.current;
    scene.background = new THREE.Color(0x87ceeb);
    
    // Configurar sistemas
    const environmentScene = environmentSystemRef.current.getScene();
    const weatherScene = weatherSystemRef.current.getScene();
    
    // Copiar elementos dos sistemas para a cena principal
    environmentScene.children.forEach(child => {
      if (!scene.children.includes(child)) {
        scene.add(child.clone());
      }
    });
    
    weatherScene.children.forEach(child => {
      if (!scene.children.includes(child)) {
        scene.add(child.clone());
      }
    });

    // Loop de atualização
    const update = () => {
      const deltaTime = clockRef.current.getDelta();
      
      // Atualizar sistemas
      environmentSystemRef.current.update(deltaTime);
      physicsSystemRef.current.step(deltaTime);
      weatherSystemRef.current.update(deltaTime);
      
      animationFrameRef.current = requestAnimationFrame(update);
    };
    
    update();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Limpar sistemas
      physicsSystemRef.current.clear();
    };
  }, []);

  const setActiveEnvironment = (id: string) => {
    environmentSystemRef.current.loadEnvironment(id);
    setActiveEnvironmentId(id);
    
    // Sincronizar com cena principal
    const scene = sceneRef.current;
    const environmentScene = environmentSystemRef.current.getScene();
    
    // Limpar cena atual
    while(scene.children.length > 0) {
      const child = scene.children[0];
      scene.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    }
    
    // Adicionar novos elementos
    environmentScene.children.forEach(child => {
      scene.add(child.clone());
    });
  };

  const updatePhysics = (deltaTime: number) => {
    physicsSystemRef.current.step(deltaTime);
  };

  const updateWeather = (deltaTime: number) => {
    weatherSystemRef.current.update(deltaTime);
  };

  const value: Scene3DContextValue = {
    scene: sceneRef.current,
    clock: clockRef.current,
    environmentSystem: environmentSystemRef.current,
    physicsSystem: physicsSystemRef.current,
    weatherSystem: weatherSystemRef.current,
    activeEnvironmentId,
    setActiveEnvironment,
    updatePhysics,
    updateWeather
  };

  return <Scene3DContext.Provider value={value}>{children}</Scene3DContext.Provider>;
};