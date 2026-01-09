import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface ArrayModelProps {
  isAnimating?: boolean;
}

const ArrayModel = ({ isAnimating = true }: ArrayModelProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const arrayValues = [10, 25, 8, 42, 17];
  
  useFrame((state) => {
    if (groupRef.current && isAnimating) {
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Array cells */}
      {arrayValues.map((value, index) => (
        <group key={index} position={[-3 + index * 1.5, 0, 0]}>
          {/* Cell box */}
          <mesh>
            <boxGeometry args={[1.3, 1.3, 0.8]} />
            <meshStandardMaterial 
              color="#a855f7" 
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
          
          {/* Cell border */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(1.3, 1.3, 0.8)]} />
            <lineBasicMaterial color="#7c3aed" linewidth={2} />
          </lineSegments>

          {/* Value inside cell */}
          <Text
            position={[0, 0, 0.45]}
            fontSize={0.35}
            color="white"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {value.toString()}
          </Text>

          {/* Index below cell */}
          <Text
            position={[0, -1, 0]}
            fontSize={0.2}
            color="#9333ea"
            anchorX="center"
          >
            [{index}]
          </Text>
        </group>
      ))}

      {/* Array name */}
      <Text
        position={[-4.5, 0, 0]}
        fontSize={0.25}
        color="#7c3aed"
        anchorX="right"
        anchorY="middle"
      >
        arr =
      </Text>

      {/* Index pointer example */}
      <group position={[0, 1.5, 0]}>
        <mesh rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.15, 0.3, 8]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.18}
          color="#f97316"
          anchorX="center"
        >
          arr[2] = 8
        </Text>
      </group>

      {/* Description */}
      <Text
        position={[0, -2.2, 0]}
        fontSize={0.2}
        color="#9333ea"
        anchorX="center"
      >
        Contiguous Memory | O(1) Access | Fixed Size
      </Text>
    </group>
  );
};

export default ArrayModel;
