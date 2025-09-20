import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useProgress } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

interface Avatar3DViewerProps {
  avatarId: string;
  modelPath?: string;
  style?: 'professional' | 'casual' | 'corporate';
  pose?: 'standing' | 'presenting' | 'sitting';
  expression?: 'neutral' | 'smiling' | 'serious';
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  autoRotate?: boolean;
  cameraPosition?: [number, number, number];
}

interface AvatarModelProps {
  modelPath: string;
  pose: string;
  expression: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Loading progress component
function LoadingProgress() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 bg-black/80 rounded-lg text-white">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <div className="text-sm">Carregando avatar... {Math.round(progress)}%</div>
      </div>
    </Html>
  );
}

// Avatar 3D Model Component
function AvatarModel({ modelPath, pose, expression, onLoad, onError }: AvatarModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);

  // Load GLTF model
  useEffect(() => {
    const loader = new GLTFLoader();
    
    loader.load(
      modelPath,
      (gltf) => {
        const loadedModel = gltf.scene;
        
        // Scale and position the model appropriately
        loadedModel.scale.set(1, 1, 1);
        loadedModel.position.set(0, -1, 0);
        
        // Ensure proper materials and lighting
        loadedModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Enhance material properties for better appearance
            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.metalness = 0.1;
              child.material.roughness = 0.8;
            }
          }
        });
        
        setModel(loadedModel);
        onLoad?.();
      },
      (progress) => {
        // Optional: handle loading progress
        console.log('Avatar loading progress:', (progress.loaded / progress.total) * 100 + '%');
      },
      (error) => {
        console.error('Error loading avatar model:', error);
        onError?.(error as Error);
      }
    );
  }, [modelPath, onLoad, onError]);

  // Animation frame for subtle movements
  useFrame((state) => {
    if (meshRef.current && model) {
      // Subtle breathing animation
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.01;
      meshRef.current.scale.setY(breathingScale);
      
      // Apply pose adjustments
      switch (pose) {
        case 'presenting':
          meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
          break;
        case 'sitting':
          meshRef.current.position.y = -1.2;
          break;
        default:
          meshRef.current.rotation.y = 0;
          meshRef.current.position.y = -1;
      }
    }
  });

  return (
    <group ref={meshRef}>
      {model && <primitive object={model} />}
    </group>
  );
}

// Fallback Avatar Component (when 3D model is not available)
function FallbackAvatar({ style, pose }: { style: string; pose: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Simple breathing animation
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.scale.setY(breathingScale);
    }
  });

  // Color based on avatar style
  const getAvatarColor = (style: string) => {
    switch (style) {
      case 'professional': return '#2563eb'; // Blue
      case 'corporate': return '#059669'; // Green  
      case 'casual': return '#dc2626'; // Red
      default: return '#6b7280'; // Gray
    }
  };

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} castShadow receiveShadow>
      <capsuleGeometry args={[0.5, 1.5, 8, 16]} />
      <meshStandardMaterial 
        color={getAvatarColor(style)} 
        metalness={0.1} 
        roughness={0.8} 
      />
      {/* Simple head */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color="#f3c5a4" 
          metalness={0.1} 
          roughness={0.9} 
        />
      </mesh>
    </mesh>
  );
}

// Main Avatar 3D Viewer Component
export const Avatar3DViewer: React.FC<Avatar3DViewerProps> = ({
  avatarId,
  modelPath,
  style = 'professional',
  pose = 'standing',
  expression = 'neutral',
  className = '',
  onLoad,
  onError,
  autoRotate = true,
  cameraPosition = [0, 0, 3]
}) => {
  const [hasError, setHasError] = useState(false);

  const handleError = (error: Error) => {
    setHasError(true);
    onError?.(error);
  };

  return (
    <div className={`w-full h-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg overflow-hidden ${className}`}>
      <Canvas
        shadows
        camera={{ 
          position: cameraPosition,
          fov: 50,
          near: 0.1,
          far: 100
        }}
        gl={{ 
          antialias: true,
          alpha: true,
          shadowMap: true
        }}
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* Environment and background */}
        <Environment preset="studio" />
        
        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#f8f9fa" opacity={0.5} transparent />
        </mesh>
        
        {/* Avatar Model */}
        <Suspense fallback={<LoadingProgress />}>
          {modelPath && !hasError ? (
            <AvatarModel
              modelPath={modelPath}
              pose={pose}
              expression={expression}
              onLoad={onLoad}
              onError={handleError}
            />
          ) : (
            <FallbackAvatar style={style} pose={pose} />
          )}
        </Suspense>
        
        {/* Camera controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          autoRotate={autoRotate}
          autoRotateSpeed={1}
          minDistance={2}
          maxDistance={8}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
        />
      </Canvas>
      
      {/* Avatar info overlay */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
        {style} • {pose} • {expression}
      </div>
    </div>
  );
};

export default Avatar3DViewer;