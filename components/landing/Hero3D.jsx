"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  ContactShadows,
  Float,
} from "@react-three/drei";
import * as THREE from "three";

// The procedural perfume bottle
function PerfumeBottle(props) {
  const group = useRef();
  const liquidRef = useRef();
  
  // Parallax effect
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Subtle floating and rotating based on mouse
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      (state.mouse.x * Math.PI) / 4,
      0.05
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      (state.mouse.y * Math.PI) / 6,
      0.05
    );
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        {/* Bottle Body (Glass) */}
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[1.5, 1.2, 4, 32]} />
          <MeshTransmissionMaterial
            backside
            samples={4}
            thickness={2}
            chromaticAberration={0.025}
            anisotropy={0.1}
            distortion={0.1}
            distortionScale={0.1}
            temporalDistortion={0.0}
            iridescence={0.5}
            iridescenceIOR={1}
            iridescenceThicknessRange={[0, 1400]}
            clearcoat={1}
            attenuationDistance={0.5}
            attenuationColor="#ffffff"
            color="#ffffff"
            transparent
            opacity={1}
          />
        </mesh>

        {/* Inner Liquid (Gold) */}
        <mesh ref={liquidRef} position={[0, -0.8, 0]}>
          <cylinderGeometry args={[1.3, 1.0, 3.2, 32]} />
          <meshPhysicalMaterial
            color="#D4AF37"
            transmission={0.5}
            opacity={0.9}
            transparent
            roughness={0.1}
            metalness={0.1}
          />
        </mesh>

        {/* Cap (Solid Gold/Black) */}
        <mesh position={[0, 2.0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
          <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Neck (Gold) */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.3, 0.6, 0.2, 32]} />
          <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
        </mesh>
        
        {/* Label (Glassmorphic or solid) */}
        <mesh position={[0, -0.5, 1.51]}>
          <planeGeometry args={[1.5, 1]} />
          <meshStandardMaterial color="#050505" metalness={0.5} roughness={0.2} />
        </mesh>
      </Float>
    </group>
  );
}

// Lighting environment to make the glass look good
function SceneEnvironment() {
  return (
    <Environment resolution={256} background={false}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <Lightformer
          intensity={4}
          rotation-x={Math.PI / 2}
          position={[0, 5, -9]}
          scale={[10, 10, 1]}
        />
        <Lightformer
          intensity={2}
          rotation-x={Math.PI / 2}
          position={[-5, 1, -1]}
          scale={[10, 2, 1]}
        />
        <Lightformer
          intensity={2}
          rotation-x={Math.PI / 2}
          position={[5, 1, -1]}
          scale={[10, 2, 1]}
        />
        <Lightformer
          intensity={2}
          rotation-x={Math.PI / 2}
          position={[0, -5, 0]}
          scale={[10, 10, 1]}
        />
      </group>
    </Environment>
  );
}

export default function Hero3D() {
  return (
    <div className="w-full h-full relative bg-[#050505]">
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1)_0%,rgba(5,5,5,1)_60%)] pointer-events-none" />
      
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
        />
        <PerfumeBottle />
        <ContactShadows
          position={[0, -3.5, 0]}
          opacity={0.4}
          scale={10}
          blur={2}
          far={4}
        />
        <SceneEnvironment />
      </Canvas>
    </div>
  );
}
