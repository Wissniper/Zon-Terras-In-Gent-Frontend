import proj4 from "proj4";

// Lambert 72 definition (EPSG:31370)
const LAMBERT72 = "+proj=lcc +lat_1=51.16666723333333 +lat_2=49.8333339 +lat_0=90 +lon_0=4.367486666666667 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=-106.869,52.2978,-103.724,0.3366,-0.457,1.8422,-1.2747 +units=m +no_defs";
const WGS84 = "EPSG:4326";

/**
 * Convert Lambert 72 (x, y) to WGS84 (lat, lng)
 */
export function lambert72ToWgs84(x: number, y: number): [number, number] {
  const [lng, lat] = proj4(LAMBERT72, WGS84, [x, y]);
  return [lat, lng];
}

/**
 * Convert WGS84 (lat, lng) to Lambert 72 (x, y)
 */
export function wgs84ToLambert72(lat: number, lng: number): [number, number] {
  const [x, y] = proj4(WGS84, LAMBERT72, [lng, lat]);
  return [x, y];
}

/**
 * Calculate relative position of a coordinate compared to a tile's anchor
 * e.g. tile "099_193" starts at X=99000, Y=193000
 */
export function getRelativePosition(lat: number, lng: number, anchorVaknummer: string): [number, number] {
  const [targetX, targetY] = wgs84ToLambert72(lat, lng);
  const parts = anchorVaknummer.split("_");
  const baseX = parseInt(parts[0], 10) * 1000;
  const baseY = parseInt(parts[1], 10) * 1000;
  return [targetX - baseX, targetY - baseY];
}
