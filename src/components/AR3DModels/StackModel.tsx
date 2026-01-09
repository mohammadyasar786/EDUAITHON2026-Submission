import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface StackModelProps {
  isAnimating?: boolean;
}

const StackModel = ({ isAnimating = true }: StackModelProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const stackItems = ['Item 4 (TOP)', 'Item 3', 'Item 2', 'Item 1 (BOTTOM)'];
  
  useFrame((state) => {
    if (groupRef.current && isAnimating) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Stack container - vertical cylinder outline */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 4, 32, 1, true]} />
        <meshStandardMaterial 
          color="#4ade80" 
          transparent 
          opacity={0.2} 
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Stack items */}
      {stackItems.map((item, index) => (
        <group key={index} position={[0, 1.2 - index * 0.8, 0]}>
          <mesh>
            <boxGeometry args={[1.8, 0.6, 1.8]} />
            <meshStandardMaterial 
              color={index === 0 ? "#22c55e" : "#86efac"} 
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
          <Text
            position={[0, 0, 1]}
            fontSize={0.15}
            color="#166534"
            anchorX="center"
            anchorY="middle"
          >
            {item}
          </Text>
        </group>
      ))}

      {/* Push arrow */}
      <group position={[2.5, 1.5, 0]}>
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.2, 0.4, 8]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.2}
          color="#22c55e"
          anchorX="center"
        >
          PUSH
        </Text>
      </group>

      {/* Pop arrow */}
      <group position={[-2.5, 1.5, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.2, 0.4, 8]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.2}
          color="#ef4444"
          anchorX="center"
        >
          POP
        </Text>
      </group>

      {/* LIFO label */}
      <Text
        position={[0, -2.5, 0]}
        fontSize={0.25}
        color="#16a34a"
        anchorX="center"
      >
        LIFO: Last In, First Out
      </Text>
    </group>
  );
};

export default StackModel;
