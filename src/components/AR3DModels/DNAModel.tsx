import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Group } from "three";

interface DNAModelProps {
  scale?: number;
}

const DNAModel = ({ scale = 1 }: DNAModelProps) => {
  const groupRef = useRef<Group>(null);
  const helixCount = 20;
  const radius = 1;
  const height = 4;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  const generateHelix = (offset: number, color: string) => {
    const spheres = [];
    for (let i = 0; i < helixCount; i++) {
      const angle = (i / helixCount) * Math.PI * 4 + offset;
      const y = (i / helixCount) * height - height / 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      spheres.push(
        <mesh key={`${offset}-${i}`} position={[x, y, z]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
        </mesh>
      );

      // Add connecting bars between helixes
      if (i % 2 === 0) {
        const oppositeAngle = angle + Math.PI;
        const ox = Math.cos(oppositeAngle) * radius;
        const oz = Math.sin(oppositeAngle) * radius;

        spheres.push(
          <mesh
            key={`bar-${i}`}
            position={[(x + ox) / 2, y, (z + oz) / 2]}
            rotation={[0, -angle, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.05, 0.05, radius * 2, 8]} />
            <meshStandardMaterial color="#4ade80" metalness={0.2} roughness={0.6} />
          </mesh>
        );
      }
    }
    return spheres;
  };

  return (
    <group ref={groupRef} scale={scale}>
      {generateHelix(0, "#8b5cf6")}
      {generateHelix(Math.PI, "#f97316")}
    </group>
  );
};

export default DNAModel;
