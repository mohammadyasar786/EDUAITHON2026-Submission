import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";

interface CellModelProps {
  scale?: number;
}

const CellModel = ({ scale = 1 }: CellModelProps) => {
  const groupRef = useRef<Group>(null);
  const nucleusRef = useRef<Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
    if (nucleusRef.current) {
      nucleusRef.current.rotation.y -= 0.005;
    }
  });

  // Generate organelles (mitochondria, ribosomes, etc.)
  const organelles = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const radius = 0.8 + Math.random() * 0.4;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (Math.random() - 0.5) * 0.6;

    organelles.push(
      <mesh key={`mito-${i}`} position={[x, y, z]} rotation={[Math.random(), Math.random(), 0]}>
        <capsuleGeometry args={[0.08, 0.2, 8, 16]} />
        <meshStandardMaterial 
          color="#f97316" 
          metalness={0.2} 
          roughness={0.6}
          transparent
          opacity={0.8}
        />
      </mesh>
    );
  }

  // Generate ribosomes
  for (let i = 0; i < 15; i++) {
    const x = (Math.random() - 0.5) * 2;
    const y = (Math.random() - 0.5) * 1;
    const z = (Math.random() - 0.5) * 2;
    const distFromCenter = Math.sqrt(x * x + y * y + z * z);
    
    if (distFromCenter > 0.5 && distFromCenter < 1.3) {
      organelles.push(
        <mesh key={`ribo-${i}`} position={[x, y, z]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#a855f7" />
        </mesh>
      );
    }
  }

  return (
    <group ref={groupRef} scale={scale}>
      {/* Cell membrane (outer) */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial 
          color="#22c55e" 
          transparent 
          opacity={0.2}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Cytoplasm */}
      <mesh>
        <sphereGeometry args={[1.45, 32, 32]} />
        <meshStandardMaterial 
          color="#86efac" 
          transparent 
          opacity={0.1}
        />
      </mesh>

      {/* Nucleus */}
      <group ref={nucleusRef}>
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial 
            color="#3b82f6" 
            transparent 
            opacity={0.6}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
        
        {/* Nucleolus */}
        <mesh position={[0.1, 0.1, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial 
            color="#1d4ed8" 
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* Endoplasmic reticulum (simplified) */}
      <mesh position={[0.3, 0, 0.5]} rotation={[0, 0.5, 0]}>
        <torusGeometry args={[0.3, 0.05, 8, 32]} />
        <meshStandardMaterial color="#fbbf24" transparent opacity={0.6} />
      </mesh>
      <mesh position={[-0.4, 0.1, 0.4]} rotation={[0.3, 0.2, 0]}>
        <torusGeometry args={[0.25, 0.04, 8, 32]} />
        <meshStandardMaterial color="#fbbf24" transparent opacity={0.6} />
      </mesh>

      {/* Organelles */}
      {organelles}
    </group>
  );
};

export default CellModel;
