import React, { useRef, useCallback, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import type * as THREE from 'three'
import type { VideoScene, SceneElement } from '../VideoEditorStudio'

interface SceneEditorProps {
  scene: VideoScene
  selectedElements: string[]
  onSelectElement: (elementId: string) => void
  onUpdateElement: (elementId: string, updates: Partial<SceneElement>) => void
  zoom: number
}

// Element component for rendering different types of scene elements
const SceneElementComponent: React.FC<{
  element: SceneElement
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<SceneElement>) => void
  zoom: number
}> = ({ element, isSelected, onSelect, onUpdate, zoom }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const threeRef = useRef<Promise<typeof import('three')> | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const { camera, gl } = useThree()

  // Handle mouse interactions
  const handlePointerDown = useCallback((event: any) => {
    event.stopPropagation()
    onSelect()
    setIsDragging(true)
    setDragStart({ x: event.clientX, y: event.clientY })
    gl.domElement.style.cursor = 'grabbing'
  }, [onSelect, gl])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    gl.domElement.style.cursor = 'default'
  }, [gl])

  const handlePointerMove = useCallback((event: any) => {
    if (!isDragging) return

    const deltaX = (event.clientX - dragStart.x) * 0.01
    const deltaY = -(event.clientY - dragStart.y) * 0.01

    onUpdate({
      position: {
        x: element.position.x + deltaX,
        y: element.position.y + deltaY,
        z: element.position.z
      }
    })

    setDragStart({ x: event.clientX, y: event.clientY })
  }, [isDragging, dragStart, element.position, onUpdate])

  // Convert screen coordinates to 3D coordinates
  const screenTo3D = useCallback(async (x: number, y: number, z: number = 0) => {
    if (!threeRef.current) {
      threeRef.current = import('three')
    }
    const THREE = await threeRef.current
    const vector = new THREE.Vector3()
    const normalizedX = (x / window.innerWidth) * 2 - 1
    const normalizedY = -(y / window.innerHeight) * 2 + 1
    
    vector.set(normalizedX, normalizedY, z)
    vector.unproject(camera)
    
    return vector
  }, [camera])

  // Render different element types
  const renderElement = () => {
    const scale = zoom * element.scale.x
    const position: [number, number, number] = [
      element.position.x * 0.01,
      element.position.y * 0.01,
      element.position.z * 0.01
    ]

    switch (element.type) {
      case 'text':
        const textData = element.data
        return (
          <Text
            ref={meshRef}
            position={position}
            scale={[scale, scale, scale]}
            color={textData.formatting?.color || '#333333'}
            fontSize={0.5}
            maxWidth={10}
            lineHeight={1.2}
            letterSpacing={0.02}
            textAlign="left"
            font="/fonts/inter-regular.woff"
          >
            {textData.content || 'Texto'}
          </Text>
        )

      case 'image':
        return (
          <mesh
            ref={meshRef}
            position={position}
            scale={[scale, scale, scale]}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
          >
            <planeGeometry args={[2, 1.5]} />
            <meshBasicMaterial transparent opacity={element.opacity}>
              <Html transform>
                <img
                  src={element.data.src}
                  alt={element.data.alt || 'Image'}
                  style={{
                    width: '200px',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: isSelected ? '2px solid #3b82f6' : 'none'
                  }}
                />
              </Html>
            </meshBasicMaterial>
          </mesh>
        )

      case 'shape':
        const shapeData = element.data
        let geometry: THREE.BufferGeometry

        switch (shapeData.shapeType) {
          case 'rectangle':
            geometry = new THREE.PlaneGeometry(2, 1)
            break
          case 'circle':
            geometry = new THREE.CircleGeometry(1, 32)
            break
          case 'triangle':
            geometry = new THREE.ConeGeometry(1, 2, 3)
            break
          default:
            geometry = new THREE.PlaneGeometry(2, 1)
        }

        return (
          <mesh
            ref={meshRef}
            position={position}
            scale={[scale, scale, scale]}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
          >
            <primitive object={geometry} />
            <meshBasicMaterial
              color={shapeData.fill?.color || '#cccccc'}
              transparent
              opacity={element.opacity}
            />
          </mesh>
        )

      default:
        return (
          <mesh
            ref={meshRef}
            position={position}
            scale={[scale, scale, scale]}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
          >
            <boxGeometry args={[1, 1, 0.1]} />
            <meshBasicMaterial color="#cccccc" transparent opacity={element.opacity} />
          </mesh>
        )
    }
  }

  // Add selection indicator
  const SelectionIndicator = () => {
    if (!isSelected || !meshRef.current) return null

    return (
      <lineSegments position={position}>
        <edgesGeometry args={[new THREE.BoxGeometry(2.2, 1.7, 0.1)]} />
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </lineSegments>
    )
  }

  return (
    <group>
      {renderElement()}
      <SelectionIndicator />
    </group>
  )
}

// Background component
const SceneBackground: React.FC<{
  background: VideoScene['background']
  zoom: number
}> = ({ background, zoom }) => {
  if (background.type === 'color') {
    return (
      <mesh position={[0, 0, -5]} scale={[20, 15, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={background.value} transparent opacity={background.opacity} />
      </mesh>
    )
  }

  if (background.type === 'image') {
    return (
      <mesh position={[0, 0, -5]} scale={[20, 15, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent opacity={background.opacity}>
          <Html transform>
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${background.value})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />
          </Html>
        </meshBasicMaterial>
      </mesh>
    )
  }

  // Default background
  return (
    <mesh position={[0, 0, -5]} scale={[20, 15, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#f0f0f0" transparent opacity={0.5} />
    </mesh>
  )
}

// Avatar component
const Avatar3DComponent: React.FC<{
  avatar: VideoScene['avatar']
  zoom: number
}> = ({ avatar, zoom }) => {
  if (!avatar) return null

  return (
    <group
      position={[avatar.position.x * 0.01, avatar.position.y * 0.01, avatar.position.z * 0.01]}
      rotation={[avatar.rotation.x, avatar.rotation.y, avatar.rotation.z]}
      scale={[avatar.scale.x * zoom, avatar.scale.y * zoom, avatar.scale.z * zoom]}
    >
      {/* Placeholder avatar - in production this would load actual 3D model */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 1.8]} />
        <meshPhongMaterial color="#8B4513" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.25]} />
        <meshPhongMaterial color="#FFDBAC" />
      </mesh>
      {/* Simple clothing based on style */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.8, 0.3]} />
        <meshPhongMaterial 
          color={
            avatar.clothing.style === 'safety' ? '#FF6600' :
            avatar.clothing.style === 'professional' ? '#1F4E79' :
            avatar.clothing.style === 'medical' ? '#FFFFFF' : '#4A5568'
          } 
        />
      </mesh>
    </group>
  )
}

// Main SceneEditor component
export const SceneEditor: React.FC<SceneEditorProps> = ({
  scene,
  selectedElements,
  onSelectElement,
  onUpdateElement,
  zoom
}) => {
  const groupRef = useRef<THREE.Group>(null)

  // Handle scene click (deselect all elements)
  const handleSceneClick = useCallback(() => {
    onSelectElement('')
  }, [onSelectElement])

  // Animate scene elements if needed
  useFrame((state, delta) => {
    if (!groupRef.current) return

    // Add any continuous animations here
    scene.elements.forEach((element) => {
      // Example: breathing animation for selected elements
      if (selectedElements.includes(element.id)) {
        const time = state.clock.getElapsedTime()
        const scale = 1 + Math.sin(time * 4) * 0.02
        // Apply subtle breathing effect
      }
    })
  })

  return (
    <group ref={groupRef} onClick={handleSceneClick}>
      {/* Scene Background */}
      <SceneBackground background={scene.background} zoom={zoom} />

      {/* 3D Avatar */}
      <Avatar3DComponent avatar={scene.avatar} zoom={zoom} />

      {/* Scene Elements */}
      {scene.elements
        .filter(element => element.visible)
        .sort((a, b) => a.position.z - b.position.z) // Sort by z-index
        .map((element) => (
          <SceneElementComponent
            key={element.id}
            element={element}
            isSelected={selectedElements.includes(element.id)}
            onSelect={() => onSelectElement(element.id)}
            onUpdate={(updates) => onUpdateElement(element.id, updates)}
            zoom={zoom}
          />
        ))}

      {/* Grid helper for alignment */}
      <gridHelper args={[20, 20, '#444444', '#222222']} position={[0, -5, 0]} />

      {/* Axis helper for orientation */}
      <axesHelper args={[2]} />
    </group>
  )
}