import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei";
import StackModel from "./StackModel";
import QueueModel from "./QueueModel";
import ArrayModel from "./ArrayModel";

interface ARSceneProps {
  modelType: "stack" | "queue" | "array";
}

const LoadingFallback = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#8b5cf6" wireframe />
  </mesh>
);

const ARScene = ({ modelType }: ARSceneProps) => {
  const renderModel = () => {
    switch (modelType) {
      case "stack":
        return <StackModel />;
      case "queue":
        return <QueueModel />;
      case "array":
        return <ArrayModel />;
      default:
        return <StackModel />;
    }
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-background to-muted">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
          color="#3b82f6"
        />
        
        <Suspense fallback={<LoadingFallback />}>
          {renderModel()}
        </Suspense>
        
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={15}
          autoRotate={false}
        />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default ARScene;
