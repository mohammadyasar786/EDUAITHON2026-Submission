import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";

interface AtomModelProps {
  scale?: number;
}

const AtomModel = ({ scale = 1 }: AtomModelProps) => {
  const groupRef = useRef<Group>(null);
  const electron1Ref = useRef<Group>(null);
  const electron2Ref = useRef<Group>(null);
  const electron3Ref = useRef<Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (electron1Ref.current) {
      electron1Ref.current.rotation.z = time * 2;
    }
    if (electron2Ref.current) {
      electron2Ref.current.rotation.x = time * 1.5;
    }
    if (electron3Ref.current) {
      electron3Ref.current.rotation.y = time * 1.8;
    }
  });

  const ElectronOrbit = ({ 
    ref, 
    radius, 
    rotationX = 0, 
    rotationY = 0, 
    color 
  }: { 
    ref: React.RefObject<Group>;
    radius: number;
    rotationX?: number;
    rotationY?: number;
    color: string;
  }) => (
    <group ref={ref} rotation={[rotationX, rotationY, 0]}>
      {/* Orbit ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.02, 16, 100]} />
        <meshStandardMaterial color="#666" transparent opacity={0.3} />
      </mesh>
      {/* Electron */}
      <mesh position={[radius, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );

  return (
    <group ref={groupRef} scale={scale}>
      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#ef4444" metalness={0.4} roughness={0.3} />
      </mesh>
      
      {/* Protons in nucleus */}
      <mesh position={[0.15, 0.1, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#f97316" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[-0.15, -0.1, 0.1]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#f97316" metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Electron orbits */}
      <group ref={electron1Ref}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.2, 0.02, 16, 100]} />
          <meshStandardMaterial color="#666" transparent opacity={0.3} />
        </mesh>
        <mesh position={[1.2, 0, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
        </mesh>
      </group>

      <group ref={electron2Ref} rotation={[Math.PI / 3, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.6, 0.02, 16, 100]} />
          <meshStandardMaterial color="#666" transparent opacity={0.3} />
        </mesh>
        <mesh position={[1.6, 0, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
        </mesh>
      </group>

      <group ref={electron3Ref} rotation={[0, Math.PI / 3, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2, 0.02, 16, 100]} />
          <meshStandardMaterial color="#666" transparent opacity={0.3} />
        </mesh>
        <mesh position={[2, 0, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  );
};

export default AtomModel;
