import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { CityTiles } from '../components/CityTiles';

export default function MapPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#e0e0e0' }}>
      <Canvas shadows camera={{ position: [0, 500, 500], fov: 50 }}>
        <color attach="background" args={['#f0f0f0']} />
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[100, 200, 100]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-2000}
          shadow-camera-right={2000}
          shadow-camera-top={2000}
          shadow-camera-bottom={-2000}
        />
        <Suspense fallback={null}>
          <CityTiles />
        </Suspense>
      </Canvas>
    </div>
  );
}
