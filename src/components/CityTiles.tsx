import React, { Component, type ReactNode, Suspense } from "react";
import { CityTile } from "./CityTile";

class TileErrorBoundary extends Component<
  { vaknummer: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error(
      `[CityTile] Failed to load tile "${this.props.vaknummer}":`,
      error.message,
    );
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// Lambert 72 absolute coordinates of the center tile (104_193)
const ORIGIN_X = 104000;
const ORIGIN_Y = 193000;

export const CityTiles: React.FC = () => {
  const centerX = 104;
  const centerY = 193;

  const tiles = [];

  for (let x = centerX - 5; x <= centerX + 5; x++) {
    for (let y = centerY - 5; y <= centerY + 5; y++) {
      const vaknummer = `${x.toString().padStart(3, "0")}_${y}`;
      tiles.push(
        <TileErrorBoundary key={vaknummer} vaknummer={vaknummer}>
          <Suspense fallback={null}>
            {/* GLB vertices are in Lambert 72 absolute coords — the parent group handles the transform */}
            <CityTile vaknummer={vaknummer} position={[0, 0, 0]} />
          </Suspense>
        </TileErrorBoundary>,
      );
    }
  }

  // The GLB files store Lambert 72 absolute coordinates: X=Easting, Y=Northing, Z=Elevation.
  // In Three.js, Y is the up-axis but Lambert Y (Northing ~193 000m) is a horizontal axis.
  // Fix: rotate -90° around X to remap Lambert Y→Three.js Z and Lambert Z→Three.js Y,
  // then translate so the center tile sits at the scene origin.
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[-ORIGIN_X, 0, ORIGIN_Y]}>
      {tiles}
    </group>
  );
};
