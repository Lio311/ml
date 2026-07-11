"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Image, Environment, Sparkles } from "@react-three/drei";
import * as THREE from "three";

// Dynamic background color that shifts based on mouse position
function DynamicBackground() {
  const { scene } = useThree();
  const color = useRef(new THREE.Color("#4a0022")); // Starts deep floral purple
  
  useFrame((state) => {
    // Left side is phase 2 (end), Right side is phase 0 (start) due to RTL.
    // Let's make right side floral, left side oil/amber.
    const normalizedX = (state.mouse.x + 1) / 2; // 0 to 1
    const targetColor = new THREE.Color().lerpColors(
      new THREE.Color("#2a1800"), // Left side: Deep amber/oil
      new THREE.Color("#2a0a25"), // Right side: Deep purple/floral
      normalizedX
    );
    color.current.lerp(targetColor, 0.05);
    scene.background = color.current;
  });

  return null;
}

// 2.5D Parallax Layers using High-Quality Images
function ParallaxImages() {
  const groupRef = useRef();

  useFrame((state) => {
    // Subtle floating animation for all images
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.y += Math.sin(t * 0.5 + i) * 0.002;
        child.rotation.z = Math.sin(t * 0.2 + i) * 0.02;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Background Layer (Fields) */}
      <Image
        url="/images/journey/field.jpg"
        transparent
        opacity={0.3}
        position={[4, 2, -10]}
        scale={[16, 10]}
      />
      
      {/* Midground Layer (Jasmine / Flowers) */}
      <Image
        url="/images/journey/jasmine1.jpg"
        transparent
        opacity={0.7}
        position={[5, -1, -5]}
        scale={[6, 8]}
      />
      <Image
        url="/images/journey/jasmine2.jpg"
        transparent
        opacity={0.8}
        position={[0, 3, -4]}
        scale={[5, 5]}
      />

      {/* Foreground Layer (Oils, Resins, Amber) */}
      <Image
        url="/images/journey/oil1.jpg"
        transparent
        opacity={0.9}
        position={[-4, 0, -2]}
        scale={[4, 6]}
      />
      <Image
        url="/images/journey/oil2.jpg"
        transparent
        opacity={0.9}
        position={[-7, -2, -1]}
        scale={[5, 4]}
      />
    </group>
  );
}

function CameraRig() {
  useFrame((state) => {
    // The camera moves opposite to the mouse to create parallax.
    // In RTL, moving left means exploring the later stages of the journey.
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.mouse.x * 3, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.mouse.y * 1.5, 0.05);
    state.camera.lookAt(0, 0, -5);
  });
  return null;
}

export default function JourneyScene() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-auto cursor-crosshair">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <DynamicBackground />
        
        {/* Soft lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* The 2.5D Image Layers */}
        <ParallaxImages />
        
        {/* Atmospheric particles */}
        <Sparkles count={150} scale={15} size={1} speed={0.2} opacity={0.3} color="#ffffff" />
        <Sparkles count={50} scale={10} size={2} speed={0.1} opacity={0.4} color="#d4af37" />

        <Environment preset="city" />
        <CameraRig />
      </Canvas>
    </div>
  );
}
