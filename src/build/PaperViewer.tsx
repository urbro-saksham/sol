"use client";

import React, { Suspense, useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { PaperType } from "./types";
import { preloadTexture, getCachedTexture } from "@/src/utils/textureCache";

interface PaperViewerProps {
  paperType: PaperType | null;
  paperColorHex?: string | null;
  paperTextureUrl?: string | null;
  isTransitioning?: boolean; // When true, animate paper rolling up
  onTransitionComplete?: () => void;
}

const defaultPaperColors: Record<PaperType, string> = {
  unbleached: "#8B6F47",
  hemp: "#9FAF8A",
  bleached: "#F9FAFB",
  colored: "#690c0f",
  rice: "#F5F5F0",
  bamboo: "#D4C4A8",
};

// Improved noise function for more realistic textures
function fractalNoise(x: number, y: number, octaves: number, scale: number, intensity: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = scale;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += Math.sin(x * frequency) * Math.cos(y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return (value / maxValue) * intensity;
}

// Generate procedural texture for different paper types
function generatePaperTexture(paperType: PaperType | null): THREE.DataTexture {
  const size = 512;
  const data = new Uint8Array(size * size * 4);
  const effectiveType = paperType ?? "hemp";

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const index = (i * size + j) * 4;
      const x = (i / size) * 12;
      const y = (j / size) * 12;

      let r = 255, g = 255, b = 255, a = 255;
      let noiseValue = 0;
      let grainValue = 0;

      switch (effectiveType) {
        case "unbleached":
          // Coarse, fibrous texture with darker specks and visible fibers
          noiseValue = fractalNoise(x, y, 3, 6, 0.2);
          grainValue = fractalNoise(x * 3, y * 3, 2, 20, 0.15);
          r = 139 + noiseValue * 35 + grainValue * 15;
          g = 111 + noiseValue * 30 + grainValue * 12;
          b = 71 + noiseValue * 25 + grainValue * 10;
          break;
        case "hemp":
          // Natural, slightly rough with subtle fibers and organic pattern
          noiseValue = fractalNoise(x, y, 3, 5, 0.15);
          grainValue = fractalNoise(x * 2.5, y * 2.5, 2, 15, 0.1);
          r = 159 + noiseValue * 25 + grainValue * 10;
          g = 175 + noiseValue * 20 + grainValue * 8;
          b = 138 + noiseValue * 22 + grainValue * 12;
          break;
        case "bleached":
          // Smooth, refined with minimal texture - very subtle
          noiseValue = fractalNoise(x, y, 2, 4, 0.04);
          grainValue = fractalNoise(x * 6, y * 6, 1, 25, 0.02);
          r = 249 + noiseValue * 5 + grainValue * 2;
          g = 250 + noiseValue * 4 + grainValue * 2;
          b = 251 + noiseValue * 3 + grainValue * 2;
          break;
        case "colored":
          // Smooth like bleached but with color variation
          noiseValue = fractalNoise(x, y, 2, 4, 0.05);
          grainValue = fractalNoise(x * 5, y * 5, 1, 20, 0.03);
          r = 249 + noiseValue * 6 + grainValue * 3;
          g = 115 + noiseValue * 5 + grainValue * 2;
          b = 22 + noiseValue * 4 + grainValue * 2;
          break;
        case "rice":
          // Ultra-thin, very smooth with slight translucency and fine grain
          noiseValue = fractalNoise(x, y, 2, 3, 0.025);
          grainValue = fractalNoise(x * 8, y * 8, 1, 30, 0.015);
          r = 245 + noiseValue * 8 + grainValue * 3;
          g = 245 + noiseValue * 8 + grainValue * 3;
          b = 240 + noiseValue * 8 + grainValue * 3;
          a = 240; // Slightly transparent
          break;
        case "bamboo":
          // Natural, coarser than hemp with visible grain and fiber lines
          noiseValue = fractalNoise(x, y, 4, 7, 0.22);
          grainValue = fractalNoise(x * 2, y * 2, 3, 12, 0.12);
          // Add directional fiber pattern
          const fiberPattern = Math.abs(Math.sin(x * 2 + y * 0.5)) * 0.08;
          r = 212 + noiseValue * 30 + grainValue * 18 + fiberPattern * 15;
          g = 196 + noiseValue * 25 + grainValue * 15 + fiberPattern * 12;
          b = 168 + noiseValue * 27 + grainValue * 16 + fiberPattern * 10;
          break;
      }

      data[index] = Math.max(0, Math.min(255, r));
      data[index + 1] = Math.max(0, Math.min(255, g));
      data[index + 2] = Math.max(0, Math.min(255, b));
      data[index + 3] = Math.max(0, Math.min(255, a));
    }
  }

  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

// Cache for procedural textures
const proceduralTextureCache = new Map<PaperType, THREE.DataTexture>();

export function getProceduralTexture(paperType: PaperType | null): THREE.DataTexture | null {
  const effectiveType = paperType ?? "hemp";
  
  if (!proceduralTextureCache.has(effectiveType)) {
    const texture = generatePaperTexture(effectiveType);
    proceduralTextureCache.set(effectiveType, texture);
  }
  
  return proceduralTextureCache.get(effectiveType) ?? null;
}


function useOptionalTexture(url?: string | null) {
  const [texture, setTexture] = useState<THREE.Texture | null>(() => {
    if (url) {
      const cached = getCachedTexture(url);
      if (cached) return cached;
    }
    return null;
  });

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }

    // Check cache first
    const cached = getCachedTexture(url);
    if (cached) {
      setTexture(cached);
      return;
    }

    // Preload and cache
    preloadTexture(url)
      .then((tex) => {
        setTexture(tex);
      })
      .catch((error) => {
        console.error("Failed to load texture:", error);
        setTexture(null);
      });
  }, [url]);

  return texture;
}

const AnimatedPaper: React.FC<PaperViewerProps> = ({
  paperType,
  paperColorHex,
  paperTextureUrl,
  isTransitioning = false,
  onTransitionComplete,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const paperRef = useRef<THREE.Mesh>(null);
  const [scaleY, setScaleY] = useState(0.1);
  const [rollProgress, setRollProgress] = useState(0);
  const transitionCompleteRef = useRef(false);

  const customTexture = useOptionalTexture(paperTextureUrl || undefined);
  const proceduralTexture = useMemo(() => {
    if (!paperTextureUrl) {
      return getProceduralTexture(paperType);
    }
    return null;
  }, [paperType, paperTextureUrl]);

  const effectiveTexture = customTexture ?? proceduralTexture;

  const baseColor = useMemo(() => {
    const effectiveType = paperType ?? "hemp";
    return paperColorHex || defaultPaperColors[effectiveType];
  }, [paperType, paperColorHex]);

  const effectiveTextureOrNull = paperColorHex ? null : effectiveTexture;

  const materialProps = useMemo(() => {
    const effectiveType = paperType ?? "hemp";
    switch (effectiveType) {
      case "unbleached":
        return { roughness: 0.9, metalness: 0.02 };
      case "hemp":
        return { roughness: 0.85, metalness: 0.03 };
      case "bleached":
        return { roughness: 0.7, metalness: 0.05 };
      case "colored":
        return { roughness: 0.72, metalness: 0.04 };
      case "rice":
        return { roughness: 0.6, metalness: 0.08 };
      case "bamboo":
        return { roughness: 0.88, metalness: 0.02 };
      default:
        return { roughness: 0.85, metalness: 0.03 };
    }
  }, [paperType]);

  useEffect(() => {
    if (isTransitioning) {
      setRollProgress(0);
      transitionCompleteRef.current = false;
    } else {
      setScaleY(0.1);
      setRollProgress(0);
    }
  }, [paperType, paperColorHex, paperTextureUrl, isTransitioning]);

  useFrame((state, delta) => {
    if (isTransitioning) {
      // Roll animation - slower and smoother
      setRollProgress((prev) => {
        const next = prev + delta * 0.8; // Slower animation
        if (next >= 1 && !transitionCompleteRef.current) {
          transitionCompleteRef.current = true;
          onTransitionComplete?.();
          return 1;
        }
        return Math.min(1, next);
      });
    } else {
      // Normal animation
      if (groupRef.current) {
        const t = state.clock.getElapsedTime();
        groupRef.current.rotation.x = -0.4 + Math.sin(t * 0.4) * 0.05;
        groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.15;
        groupRef.current.position.y = Math.sin(t * 0.8) * 0.03;
      }

      setScaleY((prev) => {
        const target = 1;
        const next = prev + (target - prev) * Math.min(1, delta * 6);
        return next > 0.99 ? 1 : next;
      });
    }

    if (paperRef.current) {
      if (isTransitioning) {
        // Smooth transform to roll with easing - moving INTO bottom square
        const easeOut = 1 - Math.pow(1 - rollProgress, 3); // Cubic ease-out
        
        // Scale down and roll up
        const scaleFactor = 0.15 + (1 - easeOut) * 0.85; // Scale from 1 to 0.15
        paperRef.current.scale.set(scaleFactor, scaleFactor, easeOut);
        
        // Rotate to roll position
        paperRef.current.rotation.x = -Math.PI / 2.2 + easeOut * (Math.PI / 2);
        paperRef.current.rotation.z = easeOut * Math.PI * 2;
        
        // Move to bottom-left square position (inside canvas)
        // Position matches bottom-left preview square (left-1/6 = ~16.67% from left)
        const xPos = -1.8 * easeOut; // Bottom-left square position
        const yPos = -1.5 * easeOut; // Lower position
        paperRef.current.position.set(xPos, yPos, 0);
      } else {
        paperRef.current.scale.y = scaleY;
        paperRef.current.rotation.x = -Math.PI / 2.2;
        paperRef.current.rotation.z = 0;
        paperRef.current.position.set(0, 0, 0);
        paperRef.current.scale.set(1, scaleY, 1);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {isTransitioning && rollProgress > 0.1 ? (
        // Show as roll
        <mesh ref={paperRef} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.4, 32]} />
          <meshStandardMaterial
            key={`${paperType}-roll-${paperTextureUrl || "procedural"}-${baseColor}`}
            color={baseColor}
            roughness={materialProps.roughness}
            metalness={materialProps.metalness}
            // map={effectiveTexture}
            map={effectiveTextureOrNull} // use the new variable here
            transparent={paperType === "rice"}
            opacity={paperType === "rice" ? 0.85 : 1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : (
        // Show as flat paper
        <mesh ref={paperRef} rotation={[-Math.PI / 2.2, 0, 0]}>
          <planeGeometry args={[2.6, 2.6, 4, 6]} />
          <meshStandardMaterial
            key={`${paperType}-${paperTextureUrl || "procedural"}-${baseColor}`}
            color={baseColor}
            roughness={materialProps.roughness}
            metalness={materialProps.metalness}
            map={effectiveTexture}
            transparent={paperType === "rice"}
            opacity={paperType === "rice" ? 0.85 : 1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

const PaperViewer: React.FC<PaperViewerProps> = (props) => {
  return (
    <div className="relative w-full h-[320px] md:h-[380px] rounded-xl border border-blue-400/40 bg-gradient-to-b from-slate-950 via-black to-slate-950 shadow-[0_0_25px_rgba(15,23,42,0.9)] overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [0.8, 0.8, 3], fov: 45 }}
        className="w-full h-full"
      >
        {/* Pure black background */}
        <color attach="background" args={["#000000"]} />
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[3, 4, 2]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-3, 2, -4]} intensity={0.3} />

        <Suspense fallback={null}>
          <AnimatedPaper {...props} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.12}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI - 0.3}
        />
      </Canvas>
      <div className="absolute top-5 left-7 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-[1px] bg-white/40" />
          <span className="text-[10px] uppercase tracking-[0.5em] text-white/50 font-medium">Precision Crafted</span>
        </div>
        <h2 className="text-3xl font-serif italic text-white/95 leading-none">Select Paper</h2>
        <p className="text-[11px] text-white/30 tracking-wider max-w-[200px]">
          Hand-selected materials meet high-precision manufacturing.
        </p>
      </div>

      <div className="absolute top-5 right-8">
        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
          <div className="w-1 h-1 rounded-full bg-white animate-ping" />
        </div>
      </div>
    </div>
  );
};

export default PaperViewer;
