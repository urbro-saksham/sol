"use client";

import React, { Suspense, useMemo, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { CustomizationState, PaperType, FilterType } from "./types";

// Color maps
const paperColorMap: Record<PaperType, string> = {
  unbleached: "#8B6F47",
  hemp: "#A8E6CF",
  bleached: "#F9FAFB",
  colored: "#F97316",
  rice: "#F5F5F0",
  bamboo: "#D4C4A8",
};

const filterColorMap: Record<FilterType, string> = {
  folded: "#CBD5F5",
  spiral: "#0EA5E9",
  ceramic: "#E5E7EB",
  glass: "#A5F3FC",
  wooden: "#D4A574",
  ball: "#FFB84D",
};

// Wood texture generator
function generateWoodTexture(): THREE.DataTexture {
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
      
      let r = 200 + grain * 30 + rings * 20 + noise1 * 15 + noise2 * 10;
      let g = 168 + grain * 25 + rings * 15 + noise1 * 12 + noise2 * 8;
      let b = 118 + grain * 20 + rings * 12 + noise1 * 10 + noise2 * 6;
      
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
  texture.repeat.set(1, 3);
  texture.needsUpdate = true;
  return texture;
}

let woodTextureCache: THREE.DataTexture | null = null;
function getWoodTexture(): THREE.DataTexture {
  if (!woodTextureCache) {
    woodTextureCache = generateWoodTexture();
  }
  return woodTextureCache;
}

// Easing functions
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const easeOutQuart = (t: number): number => {
  return 1 - Math.pow(1 - t, 4);
};

// Main animation scene
interface MergingSceneProps {
  state: CustomizationState;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
}

const MergingScene: React.FC<MergingSceneProps> = ({ 
  state, 
  isAnimating, 
  onAnimationComplete 
}) => {
  const paperRef = useRef<THREE.Mesh>(null);
  const filterRef = useRef<THREE.Mesh>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [animProgress, setAnimProgress] = React.useState(0);
  const animationCompleteRef = useRef(false);

  const paperColor = useMemo(() => {
    const baseColor = state.paperColorHex || paperColorMap[state.paperType ?? "hemp"];
    const color = new THREE.Color(baseColor);
    color.multiplyScalar(0.6);
    return '#' + color.getHexString();
  }, [state.paperType, state.paperColorHex]);

  const filterColor = useMemo(() => {
    const baseColor = state.filterColorHex || (state.filterType ? filterColorMap[state.filterType] : "#CBD5F5");
    const color = new THREE.Color(baseColor);
    color.multiplyScalar(0.6);
    return '#' + color.getHexString();
  }, [state.filterType, state.filterColorHex]);

  useEffect(() => {
    if (isAnimating) {
      setAnimProgress(0);
      animationCompleteRef.current = false;
    }
  }, [isAnimating]);

  useFrame((_, delta) => {
    if (isAnimating && animProgress < 1) {
      const newProgress = Math.min(1, animProgress + delta * 0.35);
      setAnimProgress(newProgress);

      if (newProgress >= 1 && !animationCompleteRef.current) {
        animationCompleteRef.current = true;
        setTimeout(() => {
          onAnimationComplete?.();
        }, 300);
      }
    }

    // Animation logic
    if (paperRef.current && filterRef.current && groupRef.current) {
      if (!isAnimating) {
        // Step 3: Show rolls horizontally
        const t = Date.now() * 0.001;
        const floatY = Math.sin(t) * 0.1;
        
        // Paper roll on RIGHT
        paperRef.current.position.set(1.8, floatY, 0);
        paperRef.current.rotation.set(-Math.PI / 2, 0, 0);
        paperRef.current.scale.set(1, 1, 1);

        // Filter roll on LEFT
        filterRef.current.position.set(-1.8, floatY, 0);
        filterRef.current.rotation.set(-Math.PI / 2, 0, 0);
        filterRef.current.scale.set(1, 1, 1);

        // Ball for ball filter (if applicable)
        if (ballRef.current && state.filterType === "ball") {
          const angle = Math.PI / 4;
          const ballX = -1.8 + Math.cos(angle) * 0.28;
          const ballY = floatY + 0.35;
          const ballZ = Math.sin(angle) * 0.28;
          ballRef.current.position.set(ballX, ballY, ballZ);
        }

        groupRef.current.rotation.set(0, 0, 0);

        // Reset geometries to initial roll state
        if (paperRef.current.geometry) {
          paperRef.current.geometry.dispose();
          (paperRef.current.geometry as THREE.CylinderGeometry) = new THREE.CylinderGeometry(
            0.20, 0.35, 4, 32
          );
        }
        if (filterRef.current.geometry) {
          filterRef.current.geometry.dispose();
          if (state.filterType === "wooden") {
            (filterRef.current.geometry as THREE.CylinderGeometry) = new THREE.CylinderGeometry(
              0.18, 0.28, 1.2, 64
            );
          } else {
            (filterRef.current.geometry as THREE.CylinderGeometry) = new THREE.CylinderGeometry(
              0.20, 0.20, 1.2, 32
            );
          }
        }
      } else {
        // Animation phases
        const phase1 = Math.min(1, animProgress * 2.5); // Move together (0-0.4)
        const phase2 = Math.max(0, Math.min(1, (animProgress - 0.4) * 2)); // Rotate vertical (0.4-0.9)
        const phase3 = Math.max(0, Math.min(1, (animProgress - 0.7) * 3.33)); // Form cone (0.7-1.0)

        // Phase 1: Move toward center
        const moveEase = easeInOutCubic(phase1);
        const paperX = 1.8 - moveEase * 1.8;
        const filterX = -1.8 + moveEase * 1.8;

        // Phase 2: Rotate to vertical
        const rotateEase = easeOutQuart(phase2);
        const rotationAngle = -Math.PI / 2 + rotateEase * (Math.PI / 2);

        // Phase 3: Transform into cone
        const coneEase = easeInOutCubic(phase3);
        
        // Paper transforms into cone body
        const paperTopRadius = 0.20 + coneEase * (0.18 - 0.20);
        const paperBottomRadius = 0.35 - coneEase * (0.35 - 0.12);
        const paperHeight = 4 - coneEase * (4 - 2.8);
        const paperY = coneEase * 1.5;

        // Filter transforms into cone tip
        const filterTopRadius = 0.20 - coneEase * (0.20 - 0.12);
        const filterBottomRadius = state.filterType === "wooden" 
          ? 0.28 - coneEase * (0.28 - 0.14)
          : 0.20 - coneEase * (0.20 - 0.14);
        const filterHeight = 1.2 - coneEase * (1.2 - 0.6);
        const filterY = paperY - (paperHeight / 2) - (filterHeight / 2) * coneEase;

        // Apply transformations
        paperRef.current.position.set(paperX * (1 - phase2), paperY, 0);
        paperRef.current.rotation.set(rotationAngle, 0, 0);
        paperRef.current.scale.set(1, 1, 1);

        filterRef.current.position.set(filterX * (1 - phase2), filterY, 0);
        filterRef.current.rotation.set(rotationAngle, 0, 0);
        filterRef.current.scale.set(1, 1, 1);

        // Ball position for ball filter
        if (ballRef.current && state.filterType === "ball") {
          const angle = Math.PI / 4;
          const ballRadius = 0.12 - coneEase * (0.12 - 0.08);
          const ballX = filterX * (1 - phase2) + Math.cos(angle) * filterTopRadius;
          const ballY = filterY + filterHeight * 0.3 + ballRadius * 0.7;
          const ballZ = Math.sin(angle) * filterTopRadius;
          ballRef.current.position.set(ballX, ballY, ballZ);
          ballRef.current.scale.set(1 - coneEase * 0.33, 1 - coneEase * 0.33, 1 - coneEase * 0.33);
        }

        // Update geometries
        if (phase3 > 0) {
          if (paperRef.current.geometry) {
            paperRef.current.geometry.dispose();
            (paperRef.current.geometry as THREE.CylinderGeometry) = new THREE.CylinderGeometry(
              paperTopRadius,
              paperBottomRadius,
              paperHeight,
              80,
              1,
              true
            );
          }

          if (filterRef.current.geometry) {
            filterRef.current.geometry.dispose();
            if (state.filterType === "wooden") {
              (filterRef.current.geometry as THREE.CylinderGeometry) = new THREE.CylinderGeometry(
                filterTopRadius * 0.64,
                filterBottomRadius,
                filterHeight,
                48
              );
            } else {
              (filterRef.current.geometry as THREE.CylinderGeometry) = new THREE.CylinderGeometry(
                filterTopRadius,
                filterBottomRadius,
                filterHeight,
                48
              );
            }
          }
        }

        // Rotate scene for better view
        groupRef.current.rotation.y = phase2 * Math.PI * 0.3;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Paper Roll */}
      <mesh ref={paperRef} castShadow>
        <cylinderGeometry args={[0.20, 0.35, 4, 32]} />
        <meshStandardMaterial
          color={paperColor}
          roughness={0.85}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Filter Roll */}
      <mesh ref={filterRef} castShadow>
        <cylinderGeometry args={[0.20, 0.20, 1.2, 32]} />
        {state.filterType === "wooden" ? (
          <meshStandardMaterial
            color="#C9A876"
            roughness={0.9}
            metalness={0.02}
            map={getWoodTexture()}
            side={THREE.DoubleSide}
          />
        ) : state.filterType === "ceramic" ? (
          <meshPhysicalMaterial
            color="#f7f7f5"
            roughness={0.55}
            metalness={0}
            clearcoat={0.35}
            clearcoatRoughness={0.25}
            side={THREE.DoubleSide}
          />
        ) : state.filterType === "glass" ? (
          <meshStandardMaterial
            color={filterColor}
            roughness={0.3}
            metalness={0.6}
            transparent
            opacity={0.7}
            envMapIntensity={1.2}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial
            color={filterColor}
            roughness={0.6}
            metalness={0.18}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>

      {/* Ball for ball filter */}
      {state.filterType === "ball" && (
        <mesh ref={ballRef} castShadow>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial
            color={state.filterColorHex || "#FF6B6B"}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
      )}
    </group>
  );
};

// Viewer component
interface MergeAnimationViewerProps {
  state: CustomizationState;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
}

export const MergeAnimationViewer: React.FC<MergeAnimationViewerProps> = ({
  state,
  isAnimating,
  onAnimationComplete,
}) => {
  return (
    <div className="relative w-full h-[320px] md:h-[390px] rounded-xl border border-blue-400/40 bg-gradient-to-b from-slate-900 via-slate-950 to-black shadow-[0_0_25px_rgba(15,23,42,0.9)] overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [0, 2, 6], fov: 45 }}
        className="w-full h-full"
      >
        {/* Pure black background */}
        <color attach="background" args={["#000000"]} />

        {/* Stars placed before scene lights and content so they appear "behind" */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 3, -5]} intensity={0.4} />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
          castShadow
        />

        <Suspense fallback={null}>
          <MergingScene
            state={state}
            isAnimating={isAnimating}
            onAnimationComplete={onAnimationComplete}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
};