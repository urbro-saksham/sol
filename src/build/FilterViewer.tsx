"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { FilterType, ConeSize } from "./types";
import { preloadTexture, getCachedTexture } from "@/src/utils/textureCache";

// Generate realistic wood texture
function generateWoodTexture(): THREE.DataTexture {
  const size = 512;
  const data = new Uint8Array(size * size * 4);
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const index = (i * size + j) * 4;
      const x = (i / size) * 20;
      const y = (j / size) * 20;
      
      // Wood grain pattern - horizontal lines with variation
      const grain = Math.sin(y * 0.5) * 0.3 + Math.sin(y * 2) * 0.1;
      const rings = Math.sin(x * 0.3) * 0.2;
      
      // Add noise for wood texture
      const noise1 = Math.sin(x * 3 + y * 0.5) * 0.1;
      const noise2 = Math.sin(x * 7 + y * 1.2) * 0.05;
      const noise3 = Math.sin(x * 15 + y * 2.5) * 0.03;
      
      // Base wood color (light brown/tan)
      let r = 200 + grain * 30 + rings * 20 + noise1 * 15 + noise2 * 10 + noise3 * 5;
      let g = 168 + grain * 25 + rings * 15 + noise1 * 12 + noise2 * 8 + noise3 * 4;
      let b = 118 + grain * 20 + rings * 12 + noise1 * 10 + noise2 * 6 + noise3 * 3;
      
      // Darker grain lines
      const darkGrain = Math.abs(Math.sin(y * 0.5)) < 0.1 ? 0.7 : 1.0;
      r *= darkGrain;
      g *= darkGrain;
      b *= darkGrain;
      
      data[index] = Math.max(0, Math.min(255, r));
      data[index + 1] = Math.max(0, Math.min(255, g));
      data[index + 2] = Math.max(0, Math.min(255, b));
      data[index + 3] = 255;
    }
  }
  
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 3); // Repeat vertically for wood grain
  texture.needsUpdate = true;
  return texture;
}

// Cache for wood texture
let woodTextureCache: THREE.DataTexture | null = null;
function getWoodTexture(): THREE.DataTexture {
  if (!woodTextureCache) {
    woodTextureCache = generateWoodTexture();
  }
  return woodTextureCache;
}

interface FilterViewerProps {
  filterType: FilterType | null;
  filterColorHex?: string | null;
  filterTextureUrl?: string | null;
  coneSize?: ConeSize | null;
  isTransitioning?: boolean; // When true, animate filter rolling up
  onTransitionComplete?: () => void;
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

    const cached = getCachedTexture(url);
    if (cached) {
      setTexture(cached);
      return;
    }

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

const sizeScaleMap: Record<ConeSize, number> = {
  "70mm": 0.8,
  "84mm": 0.95,
  "98mm": 1.1,
  "109mm": 1.25,
};

// Create annular sector shape using THREE.Shape
function createAnnularSectorShape(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const segments = 32;

  // Outer arc
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / segments);
    const x = outerRadius * Math.cos(angle);
    const y = outerRadius * Math.sin(angle);
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  // Inner arc (reverse)
  for (let i = segments; i >= 0; i--) {
    const angle = startAngle + (endAngle - startAngle) * (i / segments);
    const x = innerRadius * Math.cos(angle);
    const y = innerRadius * Math.sin(angle);
    shape.lineTo(x, y);
  }

  shape.lineTo(outerRadius * Math.cos(startAngle), outerRadius * Math.sin(startAngle));
  return shape;
}

const AnimatedFilterPaper: React.FC<FilterViewerProps> = ({
  filterType,
  filterColorHex,
  filterTextureUrl,
  coneSize,
  isTransitioning = false,
  onTransitionComplete,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [foldProgress, setFoldProgress] = useState(0.0);
  const [rollProgress, setRollProgress] = useState(0);
  const transitionCompleteRef = useRef(false);
  // Don't use custom texture for wooden filter
  const texture = useOptionalTexture(
    filterType === "wooden" ? null : filterTextureUrl || undefined
  );
  const woodTexture = useMemo(() => {
    return filterType === "wooden" ? getWoodTexture() : null;
  }, [filterType]);

  const baseColor = useMemo(() => {
    if (filterColorHex) return filterColorHex;

    switch (filterType) {
      case "spiral":
        return "#FDD";
      case "ceramic":
        return "#F9FAFB";
      case "glass":
        return "#A5F3FC";
      case "ball":
        return "#FFB84D"; // Light orange
      case "wooden":
        return "#D4A574"; // Wood color
      case "folded":
      default:
        return "#CBD5F5";
    }
  }, [filterType, filterColorHex]);

  const sizeScale = coneSize ? sizeScaleMap[coneSize] : 1;

  useEffect(() => {
    if (isTransitioning) {
      setRollProgress(0);
      transitionCompleteRef.current = false;
    } else {
      setFoldProgress(0);
      setRollProgress(0);
    }
  }, [filterType, filterColorHex, filterTextureUrl, coneSize, isTransitioning]);

  useFrame((stateFrame, delta) => {
    const t = stateFrame.clock.getElapsedTime();

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
      if (groupRef.current && filterType !== "ceramic") {
        groupRef.current.rotation.y = t * 0.6;
      }

      setFoldProgress((prev) => {
        const target = 1;
        const next = prev + (target - prev) * Math.min(1, delta * 2.5);
        return next > 0.99 ? 1 : next;
      });
    }
  });

  const roughness = filterTextureUrl ? 0.45 : 0.6;

  const commonMaterial = useMemo(
    () => (
      <meshStandardMaterial
        key={`filter-material-${filterTextureUrl || filterType || 'default'}-${filterColorHex || 'default'}`}
        color={baseColor}
        roughness={roughness}
        metalness={filterType === "glass" ? 0.6 : 0.18}
        transparent={filterType === "glass"}
        opacity={filterType === "glass" ? 0.70 : 1}
        envMapIntensity={filterType === "glass" ? 1.2 : 0.4}
        map={texture ?? null}
        side={THREE.DoubleSide}
      />
    ),
    [baseColor, roughness, filterType, texture, filterTextureUrl, filterColorHex]
  );

  // Memoize annular sector shape - 30% circle (0.3 * 2π ≈ 1.88 radians)
  const annularSectorShape = useMemo(
    () => createAnnularSectorShape(0.3, 1.2, 0, Math.PI * 0.6), // 30% of full circle
    []
  );

  // Show annular sector shape when not transitioning (except ceramic, wooden, ball)
  const showAnnularSector = !isTransitioning && filterType && filterType !== "ceramic" && filterType !== "wooden" && filterType !== "ball";
  const showRoll = isTransitioning && rollProgress > 0.1 && filterType && filterType !== "ceramic" && filterType !== "wooden" && filterType !== "ball";
  const showCeramic = filterType === "ceramic";
  const showWooden = filterType === "wooden";
  const showBall = filterType === "ball";

  return (
    <group ref={groupRef} scale={sizeScale}>
      {/* Annular Sector Shape (template) - shown before transition */}
      {showAnnularSector && (
        <mesh rotation={[-Math.PI / 2.2, 0, 0]} position={[0, 0, 0]}>
          <shapeGeometry args={[annularSectorShape]} />
          {commonMaterial}
        </mesh>
      )}

      {/* Roll animation when transitioning - moving INTO bottom square */}
      {showRoll && (
        <group>
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[0.15 + (1 - rollProgress) * 0.85, 0.15 + (1 - rollProgress) * 0.85, rollProgress]}
            position={[
              1.8 * rollProgress, // Move to bottom-right square position
              -1.5 * rollProgress, // Lower position
              0
            ]}
          >
            <cylinderGeometry args={[0.12, 0.12, 0.35, 32]} />
            {commonMaterial}
          </mesh>
        </group>
      )}

      {/* Ceramic filter - always show actual filter, animate INTO square when transitioning */}
      {showCeramic && (
        <group 
          rotation={[-Math.PI / 2.2, 0, 0]}
          scale={isTransitioning ? [0.15 + (1 - rollProgress) * 0.85, 0.15 + (1 - rollProgress) * 0.85, 1] : [1, 1, 1]}
          position={isTransitioning ? [1.8 * rollProgress, -1.5 * rollProgress, 0] : [0, 0, 0]}
        >
          <mesh>
            <cylinderGeometry
              args={[
                0.26 * (isTransitioning ? 1 - rollProgress : foldProgress),
                0.26 * (isTransitioning ? 1 - rollProgress : foldProgress),
                0.9,
                64,
                1,
                false,
              ]}
            />
            <meshPhysicalMaterial
              color="#f7f7f5"
              roughness={0.55}
              metalness={0}
              clearcoat={0.35}
              clearcoatRoughness={0.25}
            />
          </mesh>

          {/* 4 black dots on FLAT TOP FACE (original design) */}
          {Array.from({ length: 4 }).map((_, i) => {
            const angle = (i / 4) * Math.PI * 2;
            const ringRadius = 0.11;
            const x = Math.cos(angle) * ringRadius;
            const z = Math.sin(angle) * ringRadius;
            return (
              <mesh key={i} position={[x, 0.45, z]}>
                <cylinderGeometry args={[0.025, 0.025, 0.08, 24]} />
                <meshStandardMaterial color="#000000" />
              </mesh>
            );
          })}
        </group>
      )}

      {/* Wooden filter - tapered cylinder with realistic wood texture */}
      {showWooden && (
        // <group 
        //   rotation={[-Math.PI / 2.2, 0, 0]}
        //   scale={isTransitioning ? [0.15 + (1 - rollProgress) * 0.85, 0.15 + (1 - rollProgress) * 0.85, 1] : [1, 1, 1]}
        //   position={isTransitioning ? [1.8 * rollProgress, -1.5 * rollProgress, 0] : [0, 0, 0]}
        // >
        //   {/* Main tapered cylindrical body with wood texture */}
        //   {/* Lower radius: 0.26, Upper radius: 0.26 * 0.3 = 0.078 */}
        //   <mesh>
        //     <cylinderGeometry args={[0.16, 0.26, 0.9, 64]} />
        //     <meshStandardMaterial
        //       color="#C9A876"
        //       roughness={0.9}
        //       metalness={0.02}
        //       map={woodTexture}
        //     />
        //   </mesh>
        // </group>
      <group ref={groupRef}>
        {/* Main tapered cylindrical body with wood texture */}
        {/* Lower radius: 0.28, Upper radius: 0.28 * 0.3 = 0.084 */}
        <mesh rotation={[-Math.PI / 2.2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.28, 0.9, 64]} />
          <meshStandardMaterial
            color="#C9A876"
            roughness={0.9}
            metalness={0.02}
            map={woodTexture}
          />
        </mesh>
      </group>
      )}

      {/* Ball filter - light orange cylinder with colored ball on middle-top curved surface */}
      {showBall && (
        <group 
          rotation={[-Math.PI / 2.2, 0, 0]}
          scale={isTransitioning ? [0.15 + (1 - rollProgress) * 0.85, 0.15 + (1 - rollProgress) * 0.85, 1] : [1, 1, 1]}
          position={isTransitioning ? [1.8 * rollProgress, -1.5 * rollProgress, 0] : [0, 0, 0]}
        >
          {/* Cylindrical filter - light orange */}
          <mesh>
            <cylinderGeometry args={[0.26, 0.26, 0.9, 64]} />
            <meshStandardMaterial
              color="#FFB84D"
              roughness={0.6}
              metalness={0.18}
            />
          </mesh>
          {/* Ball on middle-top curved surface - color changes with color picker */}
          {/* Position on cylinder edge at middle-top (about 60% up the cylinder) */}
          <mesh position={[0.26 * Math.cos(Math.PI / 4), 0.08 + 0.12 * 0.7, 0.26 * Math.sin(Math.PI / 4)]}>
            <sphereGeometry args={[0.12, 32, 32]} />
            <meshStandardMaterial
              color={filterColorHex || "#FF6B6B"}
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
        </group>
      )}

      {/* Fallback */}
      {!filterType && (
        <mesh rotation={[-Math.PI / 2.3, 0, 0]}>
          <planeGeometry args={[2.2, 0.6, 1, 1]} />
          {commonMaterial}
        </mesh>
      )}
    </group>
  );
};

const FilterViewer: React.FC<FilterViewerProps> = (props) => {
  return (
    <div className="relative w-full h-[320px] md:h-[380px] rounded-xl border border-blue-400/40 bg-gradient-to-b from-slate-950 via-black to-slate-950 shadow-[0_0_25px_rgba(15,23,42,0.9)] overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [1.5, 1.3, 3.2], fov: 45 }}
        className="w-full h-full"
      >
        {/* Pure black background */}
        <color attach="background" args={["#000000"]} />

        <ambientLight intensity={0.65} />
        <directionalLight
          position={[4, 5, 3]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-4, 2, -3]} intensity={0.4} />

        <Suspense fallback={null}>
          <AnimatedFilterPaper {...props} />
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
        <h2 className="text-3xl font-serif italic text-white/95 leading-none">Select Filter</h2>
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

export default FilterViewer;


