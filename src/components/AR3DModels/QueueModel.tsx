import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface QueueModelProps {
  isAnimating?: boolean;
}

const QueueModel = ({ isAnimating = true }: QueueModelProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const queueItems = ['Item 1 (FRONT)', 'Item 2', 'Item 3', 'Item 4 (REAR)'];
  
  useFrame((state) => {
    if (groupRef.current && isAnimating) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Queue container - horizontal tube outline */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.8, 0.8, 6, 32, 1, true]} />
        <meshStandardMaterial 
          color="#3b82f6" 
          transparent 
          opacity={0.2} 
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Queue items - horizontal layout */}
      {queueItems.map((item, index) => (
        <group key={index} position={[-2.2 + index * 1.5, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 1.2, 1.2]} />
            <meshStandardMaterial 
              color={index === 0 ? "#3b82f6" : index === 3 ? "#60a5fa" : "#93c5fd"} 
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
          <Text
            position={[0, 0, 0.7]}
            fontSize={0.12}
            color="#1e3a8a"
            anchorX="center"
            anchorY="middle"
          >
            {item}
          </Text>
        </group>
      ))}

      {/* Enqueue arrow (rear) */}
      <group position={[4, 0, 0]}>
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.2, 0.4, 8]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
        <Text
          position={[0, 0.6, 0]}
          fontSize={0.18}
          color="#22c55e"
          anchorX="center"
        >
          ENQUEUE
        </Text>
      </group>

      {/* Dequeue arrow (front) */}
      <group position={[-4, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.2, 0.4, 8]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <Text
          position={[0, 0.6, 0]}
          fontSize={0.18}
          color="#ef4444"
          anchorX="center"
        >
          DEQUEUE
        </Text>
      </group>

      {/* FIFO label */}
      <Text
        position={[0, -1.8, 0]}
        fontSize={0.25}
        color="#2563eb"
        anchorX="center"
      >
        FIFO: First In, First Out
      </Text>
    </group>
  );
};

export default QueueModel;
