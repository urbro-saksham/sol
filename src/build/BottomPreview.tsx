"use client";

import React, { useState, Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { CustomizationState, PaperType, FilterType } from "./types";
import { getProceduralTexture } from "./PaperViewer";
import { getCachedTexture, preloadTexture } from "@/src/utils/textureCache";
import { X } from "lucide-react";

interface BottomPreviewProps {
  state: CustomizationState;
  type: "paper" | "filter";
  onPreviewToggle?: (isExpanded: boolean) => void;
}

const defaultPaperColors: Record<PaperType, string> = {
  unbleached: "#8B6F47",
  hemp: "#9FAF8A",
  bleached: "#F9FAFB",
  colored: "#690c0f",
  rice: "#F5F5F0",
  bamboo: "#D4C4A8",
};

const filterColors: Record<FilterType, string> = {
  folded: "#CBD5F5",
  spiral: "#FDD",
  ceramic: "#F9FAFB",
  glass: "#A5F3FC",
  wooden: "#D4A574",
  ball: "#FFB84D",
};

function useOptionalTexture(url?: string | null) {
  const [texture, setTexture] = React.useState<THREE.Texture | null>(() => {
    if (url) {
      const cached = getCachedTexture(url);
      if (cached) return cached;
    }
    return null;
  });

  React.useEffect(() => {
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

function getPaperRoughness(paperType: PaperType | null): number {
  if (!paperType) return 0.85;
  switch (paperType) {
    case "unbleached": return 0.9;
    case "hemp": return 0.85;
    case "bleached": return 0.7;
    case "colored": return 0.72;
    case "rice": return 0.6;
    case "bamboo": return 0.88;
    default: return 0.85;
  }
}

function getPaperMetalness(paperType: PaperType | null): number {
  if (!paperType) return 0.03;
  switch (paperType) {
    case "rice": return 0.08;
    case "bleached": return 0.05;
    case "colored": return 0.04;
    case "hemp": return 0.03;
    case "unbleached":
    case "bamboo": return 0.02;
    default: return 0.03;
  }
}

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

const PaperRoll: React.FC<{ state: CustomizationState; isExpanded: boolean }> = ({ state, isExpanded }) => {
  const groupRef = useRef<THREE.Group>(null);
  const customTexture = useOptionalTexture(state.paperTextureUrl || undefined);
  const proceduralTexture = React.useMemo(() => {
    if (!state.paperTextureUrl) {
      return getProceduralTexture(state.paperType);
    }
    return null;
  }, [state.paperType, state.paperTextureUrl]);

  const effectiveTexture = customTexture ?? proceduralTexture;
  const baseColor = state.paperColorHex || defaultPaperColors[state.paperType ?? "hemp"];

  useFrame((stateFrame) => {
    if (groupRef.current && !isExpanded) {
      const t = stateFrame.clock.getElapsedTime();
      groupRef.current.rotation.y = t * 0.5; // Slow rotation
    }
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.20, 0.35, 4, 32]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={getPaperRoughness(state.paperType)}
          metalness={getPaperMetalness(state.paperType)}
          map={effectiveTexture}
          transparent={state.paperType === "rice"}
          opacity={state.paperType === "rice" ? 0.85 : 1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

// Cache wood texture outside component to avoid hook issues
let cachedWoodTexture: THREE.DataTexture | null = null;
function getCachedWoodTexture(): THREE.DataTexture {
  if (!cachedWoodTexture) {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const index = (i * size + j) * 4;
        const x = (i / size) * 20;
        const y = (j / size) * 20;
        
        const grain = Math.sin(y * 0.5) * 0.3 + Math.sin(y * 2) * 0.1;
        const rings = Math.sin(x * 0.3) * 0.2;
        const noise1 = Math.sin(x * 3 + y * 0.5) * 0.1;
        const noise2 = Math.sin(x * 7 + y * 1.2) * 0.05;
        const noise3 = Math.sin(x * 15 + y * 2.5) * 0.03;
        
        let r = 200 + grain * 30 + rings * 20 + noise1 * 15 + noise2 * 10 + noise3 * 5;
        let g = 168 + grain * 25 + rings * 15 + noise1 * 12 + noise2 * 8 + noise3 * 4;
        let b = 118 + grain * 20 + rings * 12 + noise1 * 10 + noise2 * 6 + noise3 * 3;
        
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
    
    cachedWoodTexture = new THREE.DataTexture(data, size, size);
    cachedWoodTexture.wrapS = cachedWoodTexture.wrapT = THREE.RepeatWrapping;
    cachedWoodTexture.repeat.set(1, 3);
    cachedWoodTexture.needsUpdate = true;
  }
  return cachedWoodTexture;
}

const FilterRoll: React.FC<{ state: CustomizationState; isExpanded: boolean }> = ({ state, isExpanded }) => {
  const groupRef = useRef<THREE.Group>(null);
  // Always call hooks at the top level - never conditionally
  const texture = useOptionalTexture(
    state.filterType === "ceramic" ? null : state.filterTextureUrl || undefined
  );
  const baseColor = state.filterColorHex || filterColors[state.filterType ?? "folded"];

  useFrame((stateFrame) => {
    if (groupRef.current && !isExpanded) {
      const t = stateFrame.clock.getElapsedTime();
      groupRef.current.rotation.y = t * 0.5; // Slow rotation
    }
  });

  const roughness = texture ? 0.45 : 0.6;

  const commonMaterial = (
    <meshStandardMaterial
      color={baseColor}
      roughness={roughness}
      metalness={state.filterType === "glass" ? 0.6 : 0.18}
      transparent={state.filterType === "glass"}
      opacity={state.filterType === "glass" ? 0.7 : 1}
      envMapIntensity={state.filterType === "glass" ? 1.2 : 0.4}
      map={texture ?? null}
      side={THREE.DoubleSide}
    />
  );

  if (state.filterType === "ceramic") {
    return (
        <group rotation={[-Math.PI / 2.2, 0, 0]}>
          {/* Main ceramic cylinder */}
          <mesh>
            <cylinderGeometry
              args={[
                0.28 , // top radious
                0.28, // bottom radius
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

          {/* Holes on FLAT TOP FACE */}
          {Array.from({ length: 5 }).map((_, i) => {
            const angle = (i / 5) * Math.PI * 2;
            const ringRadius = 0.11;

            const x = Math.cos(angle) * ringRadius;
            const z = Math.sin(angle) * ringRadius;

            return (
              <mesh key={i} position={[x, 0.45, z]}>
                {/* vertical hole */}
                <cylinderGeometry args={[0.025, 0.025, 0.08, 24]} />
                <meshStandardMaterial color="#020617" />
              </mesh>
            );
          })}
        </group>
    );
  }

  if (state.filterType === "folded") {
    return (
      <group ref={groupRef}>
        {/* Thick multi-layer folded roll (original design) */}
        {Array.from({ length: 5 }).map((_, i) => {
          const layerRatio = i / 5;
          const radiusTop = 0.22 + layerRatio * 0.15;
          const radiusBottom = 0.45 + layerRatio * 0.2;
          const height = 1.80 + layerRatio * 0.12;
          return (
            <mesh key={i} position={[0, 0, 0]} rotation={[-Math.PI / 2.1, 0, 0]}>
              <cylinderGeometry args={[radiusTop, radiusBottom, height, 72, 1, true]} />
              {commonMaterial}
            </mesh>
          );
        })}
      </group>
    );
  }

  if (state.filterType === "spiral") {
    return (
      <group ref={groupRef}>
        {/* Spiral roll with zig-zag (original design) */}
        {Array.from({ length: 6 }).map((_, i) => {
          const layerRatio = i / 6;
          const radiusTop = 0.18 + layerRatio * 0.18;
          const radiusBottom = 0.45 + layerRatio * 0.22;
          const height = 1.8 + layerRatio * 0.12;
          const twist = layerRatio * Math.PI * 0.3;
          return (
            <mesh key={i} position={[0, 0, 0]} rotation={[-Math.PI / 2.1, twist, 0]}>
              <cylinderGeometry args={[radiusTop, radiusBottom, height, 100, 1, true]} />
              {commonMaterial}
            </mesh>
          );
        })}
        {/* Zig-zag strips */}
        {Array.from({ length: 3 }).map((_, i) => {
          const ratio = i / 5;
          const angle = ratio * Math.PI * 2;
          const innerR = 0.06;
          const x = Math.cos(angle) * innerR;
          const z = Math.sin(angle) * innerR;
          const tilt = (i % 2 === 0 ? 1 : -1) * 0.35;
          return (
            <mesh
              key={`zig-${i}`}
              position={[x, 0.06, z]}
              rotation={[-Math.PI / 2.1, angle + tilt * 0.2, 0]}
            >
              <planeGeometry args={[0.76, 0.26, 6, 8]} />
              {commonMaterial}
            </mesh>
          );
        })}
      </group>
    );
  }

  if (state.filterType === "glass") {
    return (
      <group ref={groupRef}>
        <mesh rotation={[-Math.PI / 2.2, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.14, 0.85, 64, 1, true]} />
          {commonMaterial}
        </mesh>
      </group>
    );
  }

  if (state.filterType === "wooden") {
    return (
      <group ref={groupRef}>
        {/* Main tapered cylindrical body with wood texture */}
        {/* Lower radius: 0.28, Upper radius: 0.28 * 0.3 = 0.084 */}
        <mesh rotation={[-Math.PI / 2.2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.28, 0.9, 64]} />
          <meshStandardMaterial
            color="#C9A876"
            roughness={0.9}
            metalness={0.02}
            map={getCachedWoodTexture()}
          />
        </mesh>
      </group>
    );
  }

  if (state.filterType === "ball") {
    const ballColor = state.filterColorHex || "#FF6B6B";
    const cylinderRadius = 0.28;
    const cylinderHeight = 0.9;
    const ballRadius = 0.12;
    // Position ball on middle-top curved surface (about 60% up the cylinder)
    const angle = Math.PI / 4; // 45 degrees
    const ballX = Math.cos(angle) * cylinderRadius;
    const ballY = cylinderHeight * 0.3 + ballRadius * 0.7; // Middle-top area (30% from top)
    const ballZ = Math.sin(angle) * cylinderRadius;
    
    return (
      <group ref={groupRef}>
        {/* Cylindrical filter - light orange */}
        <mesh rotation={[-Math.PI / 2.2, 0, 0]}>
          <cylinderGeometry args={[cylinderRadius, cylinderRadius, cylinderHeight, 64]} />
          <meshStandardMaterial
            color="#FFB84D"
            roughness={0.6}
            metalness={0.18}
          />
        </mesh>
        {/* Ball on middle-top curved surface - color changes with color picker */}
        <mesh rotation={[-Math.PI / 2.2, 0, 0]} position={[ballX, ballY, ballZ]}>
          <sphereGeometry args={[ballRadius, 32, 32]} />
          <meshStandardMaterial
            color={ballColor}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
      </group>
    );
  }

  return null;
};

const BottomPreview: React.FC<BottomPreviewProps> = ({ state, type, onPreviewToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = () => {
    const newExpanded = true;
    setIsExpanded(newExpanded);
    onPreviewToggle?.(newExpanded);
  };

  const hasSelection = type === "paper" ? !!state.paperType : !!state.filterType;
  if (!hasSelection) return null;

  return (
  <div className="relative w-15 h-15">
    <div
      className={`rounded-2xl border-2 border-blue-400/60
      bg-gradient-to-b from-slate-800/90 to-slate-900/90
      backdrop-blur-sm shadow-lg cursor-pointer overflow-hidden
      transition-[width,height,transform] duration-900 ease-[cubic-bezier(0.25,0.8,0.25,1)]
      ${
        isExpanded
          ? "absolute left-0 top-1/2 -translate-y-[90%] w-80 h-80 z-50"
          : "relative w-15 h-15"
      }`}
      onClick={handleExpand}
    >

    {isExpanded && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(false);
          onPreviewToggle?.(false);
        }}
        className="absolute right-2 top-2 z-50
        rounded-full bg-black/40 hover:bg-black/60
        text-white p-1.5 backdrop-blur
        transition-colors"
      >
        <X size={14} strokeWidth={2.2} />
      </button>
    )}



      <Canvas camera={{ position: [0, 0, isExpanded ? 1.5 : type === "filter" ? 4.0 : 4.4], fov: isExpanded ? 40 : type === "filter" ? 35 : 50 }} className="w-full h-full" >
        <color attach="background" args={["transparent"]} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 2, 2]} intensity={1} />
        <Suspense fallback={null}>
          {type === "paper" ? (
            <PaperRoll state={state} isExpanded={isExpanded} />
          ) : (
            <FilterRoll state={state} isExpanded={isExpanded} />
          )}
        </Suspense>
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
      {isExpanded && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 font-medium">
          {type === "paper" ? "Paper" : "Filter"}
        </div>
      )}
    </div>
  </div>
  );
};

export default BottomPreview;
