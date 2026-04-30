import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface CityTileProps {
  vaknummer: string;
  position: [number, number, number];
}

export const CityTile: React.FC<CityTileProps> = ({ vaknummer, position }) => {
  // Fetch from our new backend endpoint
  const url = `http://localhost:3000/api/gent3d/${vaknummer}/glb`;
  const { scene } = useGLTF(url);

  // Configure shadows for all meshes in the tile
  useMemo(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} position={position} />;
};
