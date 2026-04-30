import React, { Component, type ReactNode, Suspense } from 'react';
import { CityTile } from './CityTile';

class TileErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export const CityTiles: React.FC = () => {
  const centerX = 104;
  const centerY = 193;

  const tiles = [];

  for (let x = centerX - 1; x <= centerX + 1; x++) {
    for (let y = centerY - 1; y <= centerY + 1; y++) {
      const vaknummer = `${x.toString().padStart(3, '0')}_${y}`;
      const pos: [number, number, number] = [
        (x - centerX) * 1000,
        0,
        (centerY - y) * 1000,
      ];
      tiles.push(
        <TileErrorBoundary key={vaknummer}>
          <Suspense fallback={null}>
            <CityTile vaknummer={vaknummer} position={pos} />
          </Suspense>
        </TileErrorBoundary>
      );
    }
  }

  return <group>{tiles}</group>;
};
