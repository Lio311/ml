"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

// Dynamic background color that shifts based on mouse position
function DynamicBackground() {
  const { scene } = useThree();
  const color = useRef(new THREE.Color("#4a0022")); // Starts deep floral purple
  
  useFrame((state) => {
    // Map mouse X (-1 to 1) to a blend between floral (magenta/purple) and ancient oil (gold/amber)
    const normalizedX = (state.mouse.x + 1) / 2; // 0 to 1
    const targetColor = new THREE.Color().lerpColors(
      new THREE.Color("#2a0a25"), // Deep purple/floral
      new THREE.Color("#2a1800"), // Deep amber/oil
      normalizedX
    );
    color.current.lerp(targetColor, 0.05);
    scene.background = color.current;
  });

  return null;
}

// Abstract flower petals
function Petals() {
  const meshRef = useRef();
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 50;
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -20 + Math.random() * 40;
      const yFactor = -20 + Math.random() * 40;
      const zFactor = -20 + Math.random() * 40;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      // Shift particles towards the left when mouse is on the left (floral phase)
      const mouseInfluenceX = (1 - ((state.mouse.x + 1) / 2)) * 10; // stronger on the left
      
      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10 - mouseInfluenceX,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <coneGeometry args={[0.2, 0.5, 3]} />
      <meshPhysicalMaterial 
        color="#ff7eb3" 
        transmission={0.9} 
        roughness={0.2} 
        thickness={1} 
      />
    </instancedMesh>
  );
}

// Abstract oil droplets
function OilDroplets() {
  const meshRef = useRef();
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 40;
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -20 + Math.random() * 40;
      const yFactor = -20 + Math.random() * 40;
      const zFactor = -20 + Math.random() * 40;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 3; // Oils move slower
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      // Shift particles towards the right when mouse is on the right (oil phase)
      const mouseInfluenceX = (((state.mouse.x + 1) / 2)) * 10; // stronger on the right
      
      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10 + mouseInfluenceX,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshPhysicalMaterial 
        color="#d4af37" 
        transmission={1} 
        roughness={0} 
        ior={1.5}
        thickness={2} 
      />
    </instancedMesh>
  );
}

function CameraRig() {
  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.mouse.x * 2, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.mouse.y * 2, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function JourneyScene() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-auto cursor-crosshair">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <DynamicBackground />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Petals />
        <OilDroplets />
        
        <Sparkles count={200} scale={12} size={1} speed={0.4} opacity={0.2} color="#ffffff" />
        <Sparkles count={100} scale={12} size={2} speed={0.2} opacity={0.5} color="#d4af37" />

        <Environment preset="city" />
        <CameraRig />
      </Canvas>
    </div>
  );
}
