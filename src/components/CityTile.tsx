import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

useGLTF.setDecoderPath('/draco/');

interface CityTileProps {
  vaknummer: string;
  position: [number, number, number];
}

export const CityTile: React.FC<CityTileProps> = ({ vaknummer, position }) => {
  // Use environment variable or fallback to server API
  const baseUrl = import.meta.env.VITE_API_URL || 'https://api.sun-seeker.be'; 
  const url = `${baseUrl}/api/gent3d/${vaknummer}/glb`;
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
