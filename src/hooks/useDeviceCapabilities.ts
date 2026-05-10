import { useMemo } from 'react';

export interface DeviceCapabilities {
  isMobile: boolean;
  isLowEnd: boolean;
  pixelRatio: number;
  hardwareConcurrency: number;
  deviceMemoryGB: number;
  prefersReducedMotion: boolean;
  maxParallelImageRequests: number;
  fadeDurationMs: number;
  antialias: boolean;
  enableTerrain: boolean;
  enableShadows: boolean;
  webgl2: boolean;
}

function probeWebGL(): { maxTextureSize: number; renderer: string; webgl2: boolean } | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
    const gl = (gl2 ?? canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return null;
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo
      ? (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string)
      : '';
    return { maxTextureSize, renderer, webgl2: gl2 != null };
  } catch {
    return null;
  }
}

export function detectDeviceCapabilities(): DeviceCapabilities {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile =
    typeof window !== 'undefined' &&
    (/Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry/i.test(ua) ||
      window.matchMedia?.('(pointer: coarse)').matches === true);

  const hardwareConcurrency =
    typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const deviceMemoryGB =
    typeof navigator !== 'undefined'
      ? ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4)
      : 4;
  const pixelRatio =
    typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  const gl = probeWebGL();
  const lowMaxTexture = gl ? gl.maxTextureSize < 8192 : false;
  const softwareRenderer = gl ? /SwiftShader|Software/i.test(gl.renderer) : false;

  const isLowEnd =
    isMobile ||
    hardwareConcurrency <= 4 ||
    deviceMemoryGB <= 4 ||
    lowMaxTexture ||
    softwareRenderer;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  const webgl2 = gl?.webgl2 ?? false;

  return {
    isMobile,
    isLowEnd,
    pixelRatio,
    hardwareConcurrency,
    deviceMemoryGB,
    prefersReducedMotion,
    maxParallelImageRequests: isLowEnd ? 8 : 16,
    fadeDurationMs: prefersReducedMotion ? 0 : isLowEnd ? 200 : 500,
    antialias: !isLowEnd && webgl2,
    enableTerrain: !isLowEnd,
    enableShadows: !isLowEnd,
    webgl2,
  };
}

export function useDeviceCapabilities(): DeviceCapabilities {
  return useMemo(() => detectDeviceCapabilities(), []);
}
