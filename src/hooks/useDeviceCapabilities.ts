import { useMemo } from 'react';

export interface DeviceCapabilities {
  isMobile: boolean;
  isSafari: boolean;
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
  // Use WebGL1 for the probe and a 1×1 canvas to minimise GPU footprint.
  // Detect WebGL2 via the global type check rather than creating a second
  // context — Safari's context budget is tight, and orphaned contexts
  // hijack the limits Mapbox reads later (`MAX_UNIFORM_BLOCK_SIZE = 0`,
  // blank-canvas failure mode).
  let gl: WebGLRenderingContext | null = null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    if (!gl) return null;
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo
      ? (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string)
      : '';
    const webgl2 =
      typeof window !== 'undefined' && 'WebGL2RenderingContext' in window;
    return { maxTextureSize, renderer, webgl2 };
  } catch {
    return null;
  } finally {
    // CRITICAL on Safari: explicitly drop the probe context so Mapbox can
    // claim a clean one. Without this, Safari recycles ours into a degraded
    // state and Mapbox gets `device limit 0` for UBO sizes.
    if (gl) {
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    }
  }
}

export function detectDeviceCapabilities(): DeviceCapabilities {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile =
    typeof window !== 'undefined' &&
    (/Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry/i.test(ua) ||
      window.matchMedia?.('(pointer: coarse)').matches === true);

  // Safari detection: matches desktop Safari + iOS WebKit (which is always Safari).
  // Excludes Chrome/Edge/Firefox on macOS, which all include "Safari" in UA but
  // also include their own engine identifier.
  const isSafari =
    /Safari/i.test(ua) && !/Chrome|Chromium|Edg|Edge|Firefox|FxiOS|CriOS/i.test(ua);

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
    isSafari,
    isLowEnd,
    pixelRatio,
    hardwareConcurrency,
    deviceMemoryGB,
    prefersReducedMotion,
    maxParallelImageRequests: isLowEnd ? 8 : 16,
    fadeDurationMs: prefersReducedMotion ? 0 : isLowEnd ? 200 : 500,
    // Safari's WebGL2 photorealistic-style support is uneven; even where the
    // probe reports webgl2=true, the Standard style frequently renders blank.
    // Skip antialiasing on Safari for safer context creation.
    antialias: !isLowEnd && webgl2 && !isSafari,
    enableTerrain: !isLowEnd,
    enableShadows: !isLowEnd && !isSafari,
    webgl2,
  };
}

export function useDeviceCapabilities(): DeviceCapabilities {
  return useMemo(() => detectDeviceCapabilities(), []);
}
