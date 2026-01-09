import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";

interface MathModelProps {
  scale?: number;
}

const MathModel = ({ scale = 1 }: MathModelProps) => {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  // Generate 3D function surface points (saddle surface: z = x² - y²)
  const surfacePoints = useMemo(() => {
    const points: JSX.Element[] = [];
    const resolution = 15;
    const range = 1.5;

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const x = (i / (resolution - 1) - 0.5) * range * 2;
        const y = (j / (resolution - 1) - 0.5) * range * 2;
        const z = (x * x - y * y) * 0.3;

        // Color based on height
        const hue = (z + 0.5) * 0.3 + 0.5;
        const color = `hsl(${hue * 360}, 70%, 50%)`;

        points.push(
          <mesh key={`point-${i}-${j}`} position={[x, z, y]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
          </mesh>
        );

        // Add connecting lines
        if (i < resolution - 1) {
          const nx = ((i + 1) / (resolution - 1) - 0.5) * range * 2;
          const nz = (nx * nx - y * y) * 0.3;
          
          points.push(
            <mesh
              key={`linex-${i}-${j}`}
              position={[(x + nx) / 2, (z + nz) / 2, y]}
              rotation={[0, 0, Math.atan2(nz - z, nx - x)]}
            >
              <cylinderGeometry args={[0.015, 0.015, 0.25, 4]} />
              <meshStandardMaterial color="#666" transparent opacity={0.4} />
            </mesh>
          );
        }

        if (j < resolution - 1) {
          const ny = ((j + 1) / (resolution - 1) - 0.5) * range * 2;
          const nz = (x * x - ny * ny) * 0.3;
          
          points.push(
            <mesh
              key={`liney-${i}-${j}`}
              position={[x, (z + nz) / 2, (y + ny) / 2]}
              rotation={[Math.atan2(nz - z, ny - y), 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.015, 0.015, 0.25, 4]} />
              <meshStandardMaterial color="#666" transparent opacity={0.4} />
            </mesh>
          );
        }
      }
    }
    return points;
  }, []);

  // Coordinate axes
  const axes = (
    <>
      {/* X axis - red */}
      <mesh position={[1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[2, 0, 0]}>
        <coneGeometry args={[0.06, 0.15, 8]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      {/* Y axis - green */}
      <mesh position={[0, 0, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <mesh position={[0, 0, 2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.06, 0.15, 8]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>

      {/* Z axis - blue */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <coneGeometry args={[0.06, 0.15, 8]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
    </>
  );

  return (
    <group ref={groupRef} scale={scale}>
      {axes}
      {surfacePoints}
    </group>
  );
};

export default MathModel;
