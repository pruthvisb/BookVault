"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Html, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { 
  Sparkles,
  Activity,
  Calendar,
  Award,
  Layers,
  ArrowRight,
  Lock,
  User,
  Briefcase,
  AlertCircle,
  Mail,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Heart,
  CheckCircle,
  Clock,
  X,
  Shield,
  Zap,
  Plus,
  Compass,
  ArrowUpRight,
  Database,
  Volume2,
  VolumeX
} from "lucide-react";
import { setSandboxMode } from "@/utils/db";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createClient();

// --- 3D Book Mesh Component with Trails ---
interface Book3DProps {
  position: [number, number, number];
  color: string;
  speed: number;
  radius: number;
  offset: number;
}

const Book3D: React.FC<Book3DProps> = ({ position, color, speed, radius, offset }) => {
  const meshRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Points>(null);
  
  const trailCount = 12;
  const [trailPositions] = React.useMemo(() => {
    return [new Float32Array(trailCount * 3)];
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * speed + offset;
    
    // Keplerian orbit
    const x = Math.cos(time) * radius;
    const z = Math.sin(time) * radius;
    const y = position[1] + Math.sin(time * 2.5) * 0.8;

    meshRef.current.position.x = x;
    meshRef.current.position.z = z;
    meshRef.current.position.y = y;

    // Rotations (Y-axis spin only, no X-axis tumbling)
    meshRef.current.rotation.y = time * 0.6;
    meshRef.current.rotation.x = 0;

    if (tailRef.current) {
      const geo = tailRef.current.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      
      for (let i = trailCount - 1; i > 0; i--) {
        posAttr.setXYZ(i, posAttr.getX(i - 1), posAttr.getY(i - 1), posAttr.getZ(i - 1));
      }
      posAttr.setXYZ(0, x, y, z);
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group>
      <group ref={meshRef} position={position}>
        <mesh castShadow>
          <boxGeometry args={[1.0, 1.4, 0.14]} />
          <meshStandardMaterial color={color} roughness={0.15} metalness={0.7} />
        </mesh>
        <mesh position={[0.03, 0, 0]}>
          <boxGeometry args={[0.92, 1.32, 0.1]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} />
        </mesh>
      </group>

      <points ref={tailRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[trailPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.15}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

// --- SpaceTimeGrid component (warped gravity manifold lines) ---
const SpaceTimeGrid: React.FC = () => {
  const gridWidth = 60;
  const gridDivisions = 20;

  const vertices = React.useMemo(() => {
    const verts: number[] = [];
    const halfWidth = gridWidth / 2;
    const step = gridWidth / gridDivisions;

    // Warp function: pull Y down towards the singularity core
    const warpY = (px: number, pz: number) => {
      const dist = Math.sqrt(px * px + pz * pz);
      return -15.0 - 18.0 / (dist * 0.2 + 1.0);
    };

    for (let i = 0; i <= gridDivisions; i++) {
      const x = -halfWidth + i * step;
      for (let j = 0; j < gridDivisions; j++) {
        const z1 = -halfWidth + j * step;
        const z2 = z1 + step;
        verts.push(x, warpY(x, z1), z1);
        verts.push(x, warpY(x, z2), z2);
      }
    }

    for (let j = 0; j <= gridDivisions; j++) {
      const z = -halfWidth + j * step;
      for (let i = 0; i < gridDivisions; i++) {
        const x1 = -halfWidth + i * step;
        const x2 = x1 + step;
        verts.push(x1, warpY(x1, z), z);
        verts.push(x2, warpY(x2, z), z);
      }
    }

    return new Float32Array(verts);
  }, []);

  return (
    <lineSegments position={[0, 15, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[vertices, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#06b6d4" transparent opacity={0.12} />
    </lineSegments>
  );
};

// --- Swirling Keplerian Accretion Disk ---
const AccretionDisk: React.FC = () => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1500; // 1500 parent particles * 8 sub-particles = 12000 points total

  const [positions, colors, speeds, angles, radii] = React.useMemo(() => {
    const totalPoints = count * 8;
    const pos = new Float32Array(totalPoints * 3);
    const cols = new Float32Array(totalPoints * 3);
    const sp = new Float32Array(count);
    const ang = new Float32Array(count);
    const rad = new Float32Array(count);

    const baseColor = new THREE.Color("#00f3ff");
    const tailColor = new THREE.Color("#010408");

    for (let i = 0; i < count; i++) {
      const r = 5.5 + Math.random() * 9.5; // Horizontal particle debris
      const theta = Math.random() * Math.PI * 2;
      rad[i] = r;
      ang[i] = theta;
      sp[i] = 4.0 / Math.sqrt(r); // Relativistic particle speeds

      for (let j = 0; j < 8; j++) {
        const idx = i * 8 + j;
        const subTheta = theta - j * sp[i] * 0.16;
        
        pos[idx * 3] = Math.cos(subTheta) * r;
        pos[idx * 3 + 1] = (Math.random() - 0.5) * 0.6;
        pos[idx * 3 + 2] = Math.sin(subTheta) * r;

        const factor = j / 7;
        const c = baseColor.clone().lerp(tailColor, factor);
        cols[idx * 3] = c.r;
        cols[idx * 3 + 1] = c.g;
        cols[idx * 3 + 2] = c.b;
      }
    }
    return [pos, cols, sp, ang, rad];
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // 1. Update solid vertical ring shader uniforms
    if (shaderRef.current) {
      shaderRef.current.uniforms.u_time.value = time;
    }

    // 2. Update horizontal particle positions
    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;

      for (let i = 0; i < count; i++) {
        angles[i] += speeds[i] * 0.55;
        const r = radii[i];

        for (let j = 0; j < 8; j++) {
          const idx = i * 8 + j;
          const theta = angles[i] - j * speeds[i] * 0.16;

          posAttr.setX(idx, Math.cos(theta) * r);
          posAttr.setY(idx, Math.sin(time + r * 0.4) * 0.15 + (Math.sin(time * 2 + idx) * 0.015));
          posAttr.setZ(idx, Math.sin(theta) * r);
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float u_time;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv - vec2(0.5);
      float d = length(uv);
      
      if (d < 0.12 || d > 0.5) {
        discard;
      }
      
      float angle = atan(uv.y, uv.x);
      
      // Rapid lensing turbulence around the event horizon
      float wave = sin(angle * 3.0 - u_time * 16.0) * 0.5 + 0.5;
      float ringMask = smoothstep(0.12, 0.16, d) * smoothstep(0.5, 0.35, d);
      float brightness = ringMask * (0.6 + 0.4 * wave);
      
      vec3 cyan = vec3(0.0, 0.95, 1.0);
      vec3 purple = vec3(0.68, 0.28, 1.0);
      vec3 orange = vec3(1.0, 0.5, 0.0);
      
      vec3 baseColor = mix(cyan, purple, 0.5 + 0.5 * sin(angle - u_time * 3.0));
      float innerRim = smoothstep(0.24, 0.12, d);
      vec3 finalCol = mix(baseColor, orange, innerRim * 0.8);
      
      gl_FragColor = vec4(finalCol * brightness * 6.5, brightness * 0.95);
    }
  `;

  return (
    <group>
      {/* 1. Vertical Gravitational Lensing Halo (Einstein Ring) */}
      <Billboard>
        <mesh>
          <ringGeometry args={[4.1, 6.0, 64]} />
          <shaderMaterial
            ref={shaderRef}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={{
              u_time: { value: 0 },
            }}
          />
        </mesh>
      </Billboard>

      {/* 2. Swirling Particles with Relativistic Trails (Horizontal) */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.14}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

// --- Glowing Singularity Sphere with Custom Shaders ---
const Singularity3D: React.FC = () => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.u_time.value = state.clock.getElapsedTime();
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float u_time;
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      float intensity = pow(0.85 - dot(vNormal, vec3(0, 0, 1.0)), 1.5);
      vec3 cyan = vec3(0.0, 0.85, 1.0);
      vec3 purple = vec3(0.68, 0.28, 1.0);
      vec3 glowColor = mix(cyan, purple, 0.5 + 0.5 * sin(u_time * 1.2));
      gl_FragColor = vec4(glowColor * intensity * 5.5, intensity);
    }
  `;

  return (
    <group>
      {/* Event Horizon Core */}
      <mesh>
        <sphereGeometry args={[4.0, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Lensing Glow Envelope */}
      <mesh>
        <sphereGeometry args={[6.0, 64, 64]} />
        <shaderMaterial
          ref={shaderRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          blending={THREE.AdditiveBlending}
          uniforms={{
            u_time: { value: 0 },
          }}
        />
      </mesh>
    </group>
  );
};

// --- Orbiting 3D System Container ---
const OrbitingSystem: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      <Singularity3D />
      <SpaceTimeGrid />
      <AccretionDisk />
      
      {/* Orbiting Books */}
      {[
        { pos: [0, 4, 0], col: "#06b6d4", speed: 0.4, rad: 9, off: 0 },
        { pos: [0, 0, 0], col: "#a855f7", speed: 0.3, rad: 12, off: 2 },
        { pos: [0, -4, 0], col: "#ec4899", speed: 0.5, rad: 10, off: 4 },
      ].map((b, i) => (
        <Book3D 
          key={i} 
          position={b.pos as [number, number, number]} 
          color={b.col} 
          speed={b.speed} 
          radius={b.rad} 
          offset={b.off} 
        />
      ))}
    </group>
  );
};

// --- Donor Companion Star mesh ---
const DonorStar3D: React.FC = () => {
  const meshRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const coronaMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const scale = 1.0 + Math.sin(time * 2.0) * 0.05;
    meshRef.current.scale.setScalar(scale);

    // Orbit around Y-axis on the X-Z plane at Y = 0
    const rOrbit = 27.0;
    const speed = 0.08;
    const theta = time * speed;
    meshRef.current.position.set(Math.cos(theta) * rOrbit, 0.0, Math.sin(theta) * rOrbit);

    const sp = (state as any).scrollPercent || 0;
    const opacity = sp < 0.15 ? 1.0 : Math.max(0, 1.0 - (sp - 0.15) * 5.0);

    if (matRef.current) matRef.current.opacity = opacity;
    if (coronaMatRef.current) coronaMatRef.current.opacity = opacity * 0.25;
  });

  return (
    <group ref={meshRef}>
      {/* Sun Body */}
      <mesh>
        <sphereGeometry args={[2.8, 32, 32]} />
        <meshBasicMaterial ref={matRef} color="#eab308" transparent />
      </mesh>
      {/* Outer Corona Shield */}
      <mesh>
        <sphereGeometry args={[3.4, 16, 16]} />
        <meshBasicMaterial ref={coronaMatRef} color="#facc15" wireframe transparent />
      </mesh>
    </group>
  );
};

// --- Solar Storm particles released by Donor Star and expanding ---
const SolarStorm: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1200;

  const [positions, jitters, arcAngles, offsets] = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    const jit = new Float32Array(count);
    const ang = new Float32Array(count);
    const off = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      jit[i] = Math.random() * 0.03 - 0.015; // thin, sharp wave crest lines
      ang[i] = (Math.random() - 0.5) * 2.4; // extremely wide arc sweep (covering entire screen)
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2.0 - 1.0);
      off[i * 3] = Math.sin(phi) * Math.cos(theta);
      off[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      off[i * 3 + 2] = Math.cos(phi);
    }
    return [pos, jit, ang, off];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const spVal = (state as any).scrollPercent || 0;
    const time = state.clock.getElapsedTime();

    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = spVal < 0.15 ? 0.8 : Math.max(0, 0.8 - (spVal - 0.15) * 5.0);

    const rOrbit = 27.0;
    const speed = 0.08;
    const theta = time * speed;
    const sunPos = new THREE.Vector3(Math.cos(theta) * rOrbit, 0.0, Math.sin(theta) * rOrbit);
    const bhPos = new THREE.Vector3(0, 0, 0);
    const dir = new THREE.Vector3().subVectors(bhPos, sunPos); // vector from sun to black hole
    const dirNorm = dir.clone().normalize();

    // Orthonormal basis perpendicular to direction of travel
    const up = new THREE.Vector3(0, 1, 0);
    const u = new THREE.Vector3().crossVectors(dirNorm, up).normalize();
    const v = new THREE.Vector3().crossVectors(dirNorm, u).normalize();

    for (let i = 0; i < count; i++) {
      const shell = i % 5;
      // Slower propagation for majestic wave rolling
      const p = (time * 0.12 + shell * 0.2 + jitters[i]) % 1.0;

      // Base point on the line from sun to black hole
      const basePos = new THREE.Vector3().copy(sunPos).addScaledVector(dir, p);

      // Arc shape in the perpendicular plane
      const angle = arcAngles[i];
      
      // Massive dispersion to span the entire webpage viewport
      const dispersion = Math.sin(p * Math.PI) * 20.0;

      const offsetU = Math.cos(angle) * dispersion + offsets[i * 3] * (dispersion * 0.05);
      const offsetV = Math.sin(angle) * dispersion + offsets[i * 3 + 1] * (dispersion * 0.05);

      const pos = new THREE.Vector3()
        .copy(basePos)
        .addScaledVector(u, offsetU)
        .addScaledVector(v, offsetV);

      posAttr.setXYZ(i, pos.x, pos.y, pos.z);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#f87171"
        size={0.16}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// --- Comet falling stars system with trailing tails ---
const CometSystem: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 840; // 12 comets * 70 points each (35 white tail + 35 blue tail)

  const [positions, sizes, colors, data] = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const col = new Float32Array(count * 3);
    const cometsData = [];

    for (let c = 0; c < 12; c++) {
      // Start completely off-screen at the top right
      const startX = 10.0 + Math.random() * 25.0;
      const startY = 35.0 + Math.random() * 10.0;
      const startZ = -15.0 - Math.random() * 10.0;

      // Fall diagonally down and left
      const dx = -35.0 - Math.random() * 15.0;
      const dy = -30.0 - Math.random() * 10.0;
      const dz = Math.random() * 8.0 - 4.0;

      const start = new THREE.Vector3(startX, startY, startZ);
      const dir = new THREE.Vector3(dx, dy, dz);
      const dirNorm = dir.clone().normalize();
      
      const up = new THREE.Vector3(0, 1, 0);
      const perp = new THREE.Vector3().crossVectors(dirNorm, up).normalize();
      
      const speed = 0.18 + Math.random() * 0.10;

      cometsData.push({ start, dir, dirNorm, perp, speed });
    }

    // Initialize sizes and base colors
    for (let c = 0; c < 12; c++) {
      // Tail 1: White (first 35 points)
      for (let j = 0; j < 35; j++) {
        const idx = c * 70 + j;
        const factor = 1.0 - j / 35;
        sz[idx] = 0.28 * factor;

        col[idx * 3] = THREE.MathUtils.lerp(0.3, 0.95, factor); // R
        col[idx * 3 + 1] = THREE.MathUtils.lerp(0.3, 0.95, factor); // G
        col[idx * 3 + 2] = THREE.MathUtils.lerp(0.35, 1.0, factor); // B
      }
      // Tail 2: Blue (next 35 points)
      for (let j = 35; j < 70; j++) {
        const idx = c * 70 + j;
        const lagIndex = j - 35;
        const factor = 1.0 - lagIndex / 35;
        sz[idx] = 0.28 * factor;

        col[idx * 3] = THREE.MathUtils.lerp(0.0, 0.1, factor); // R
        col[idx * 3 + 1] = THREE.MathUtils.lerp(0.2, 0.7, factor); // G
        col[idx * 3 + 2] = THREE.MathUtils.lerp(0.5, 1.0, factor); // B
      }
    }

    return [pos, sz, col, cometsData];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const colAttr = geo.attributes.color as THREE.BufferAttribute;
    const time = state.clock.getElapsedTime();
    const sp = (state as any).scrollPercent || 0;

    // Fades out as you scroll past Slide 1
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = sp < 0.15 ? 0.9 : Math.max(0, 0.9 - (sp - 0.15) * 6.0);

    for (let c = 0; c < 12; c++) {
      const { start, dir, dirNorm, perp, speed } = data[c];
      
      // Progress of comet head spread uniformly
      const p = (time * speed + c * 0.15) % 1.0;
      
      // Dynamic fade envelope
      const fade = Math.sin(p * Math.PI);
      
      const headPos = new THREE.Vector3().copy(start).addScaledVector(dir, p);

      // Render Tail 1 (White) - offset slightly right (+perp * 0.08)
      for (let j = 0; j < 35; j++) {
        const idx = c * 70 + j;
        const lag = j * 0.14;
        const pos = new THREE.Vector3()
          .copy(headPos)
          .addScaledVector(dirNorm, -lag)
          .addScaledVector(perp, 0.08);

        const noise = 0.04 * Math.sin(time * 12.0 + j);
        pos.x += noise;
        pos.y += noise;

        posAttr.setXYZ(idx, pos.x, pos.y, pos.z);

        const factor = 1.0 - j / 35;
        const baseR = THREE.MathUtils.lerp(0.3, 0.95, factor);
        const baseG = THREE.MathUtils.lerp(0.3, 0.95, factor);
        const baseB = THREE.MathUtils.lerp(0.35, 1.0, factor);

        colAttr.setXYZ(idx, baseR * fade, baseG * fade, baseB * fade);
      }

      // Render Tail 2 (Blue) - offset slightly left (-perp * 0.08)
      for (let j = 35; j < 70; j++) {
        const idx = c * 70 + j;
        const lagIndex = j - 35;
        const lag = lagIndex * 0.14;
        const pos = new THREE.Vector3()
          .copy(headPos)
          .addScaledVector(dirNorm, -lag)
          .addScaledVector(perp, -0.08);

        const noise = 0.04 * Math.sin(time * 12.0 + j);
        pos.x += noise;
        pos.y += noise;

        posAttr.setXYZ(idx, pos.x, pos.y, pos.z);

        const factor = 1.0 - lagIndex / 35;
        const baseR = THREE.MathUtils.lerp(0.0, 0.1, factor);
        const baseG = THREE.MathUtils.lerp(0.2, 0.7, factor);
        const baseB = THREE.MathUtils.lerp(0.5, 1.0, factor);

        colAttr.setXYZ(idx, baseR * fade, baseG * fade, baseB * fade);
      }
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.24}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

// --- Camera Helix Path Scroll Integrator ---
const CameraScrollRig: React.FC = () => {
  useFrame((state) => {
    if (typeof window === "undefined") return;
    const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
    
    if ((state as any).scrollPercent === undefined) {
      (state as any).scrollPercent = 0;
    }
    (state as any).scrollPercent = THREE.MathUtils.lerp((state as any).scrollPercent, scrollPercent, 0.04);
    const sp = (state as any).scrollPercent;

    if (sp < 0.15) {
      // Look straight in space (Slide 1 Hero backdrop) shifted left
      state.camera.position.x = -3.0;
      state.camera.position.y = 3.0;
      state.camera.position.z = 24.0;
      state.camera.lookAt(1.0, 1.5, 0);
    } else {
      // Circular Camera Orbit around Singularity (15% to 85% scroll)
      const orbitProgress = Math.max(0, Math.min(1.0, (sp - 0.15) / 0.70));
      const angle = orbitProgress * Math.PI * 2 + Math.PI / 2;
      const radius = 19.0;

      const ox = Math.cos(angle) * radius;
      const oy = 0;
      const oz = Math.sin(angle) * radius;

      // Smooth camera interpolation transition from Hero view to Orbiting view
      const transition = Math.min(1.0, orbitProgress / 0.10);
      const basePosX = THREE.MathUtils.lerp(-3.0, ox, transition);
      const basePosY = THREE.MathUtils.lerp(3.0, oy, transition);
      const basePosZ = THREE.MathUtils.lerp(24.0, oz, transition);

      // CTA Singularity Plunge at the very bottom (last 15% scroll)
      const plungeProgress = Math.max(0, (sp - 0.85) / 0.15);
      state.camera.position.x = basePosX * (1.0 - plungeProgress);
      state.camera.position.y = THREE.MathUtils.lerp(basePosY, -7.0, plungeProgress);
      state.camera.position.z = THREE.MathUtils.lerp(basePosZ, 11.0, plungeProgress);

      const targetX = THREE.MathUtils.lerp(1.0, 0.0, transition);
      const targetY = THREE.MathUtils.lerp(1.5, 0.0, transition);
      const target = new THREE.Vector3(targetX * (1.0 - plungeProgress), targetY - plungeProgress * 7.0, 0);
      state.camera.lookAt(target);
    }
  });

  return null;
};



// --- 3D Event Horizon Plunge CTA Section ---
const CtaSingularitySection: React.FC<{
  setIsSignUp: (b: boolean) => void;
  setShowAuth: (b: boolean) => void;
  handleSandboxMode: () => void;
}> = ({ setIsSignUp, setShowAuth, handleSandboxMode }) => {
  const { camera } = useThree();
  const [opacity, setOpacity] = useState(0);

  useFrame((state) => {
    const sp = (state as any).scrollPercent || 0;
    let targetOpacity = 0;

    // Only fade in at the final plunge (last 15% scroll)
    if (sp >= 0.85) {
      const plungeProgress = (sp - 0.85) / 0.15;
      targetOpacity = Math.min(1.0, plungeProgress * 1.5);
    }

    if (Math.abs(opacity - targetOpacity) > 0.01) {
      setOpacity(THREE.MathUtils.lerp(opacity, targetOpacity, 0.15));
    }
  });

  return (
    <Html
      position={[0, -7.0, 0]}
      transform
      sprite
      distanceFactor={8.5}
      center
      style={{
        opacity: opacity,
        pointerEvents: opacity > 0.15 ? "auto" : "none",
        transition: "opacity 0.15s ease-out",
        display: opacity > 0.01 ? "block" : "none",
      }}
    >
      <div className="w-[350px] p-8 glass-card-premium text-center space-y-5 font-mono border-pink-500/30 shadow-[0_0_40px_rgba(236,72,153,0.35)]">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-pink-500/20 bg-pink-500/5 text-pink-400 text-[8px] tracking-widest font-semibold uppercase">
          <Shield className="h-3 w-3" />
          <span>Security verified</span>
        </span>
        <h3 className="text-lg font-black text-white uppercase tracking-wider leading-none">
          Establish Singularity
        </h3>
        <p className="text-slate-400 text-[10px] uppercase leading-relaxed max-w-xs mx-auto">
          Join the quantum library space today. Connect via Supabase cloud backup or run in sandbox.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button 
            onClick={() => { setIsSignUp(true); setShowAuth(true); }}
            className="px-4.5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-mono text-[9px] rounded-xl font-bold uppercase tracking-widest cursor-pointer shadow-lg"
          >
            Sign Up
          </button>
          <button 
            onClick={handleSandboxMode}
            className="px-4.5 py-2.5 border border-white/10 bg-white/5 text-white font-mono text-[9px] rounded-xl font-bold uppercase tracking-widest cursor-pointer hover:bg-white/10"
          >
            Sandbox
          </button>
        </div>
      </div>
    </Html>
  );
};

// --- Supernova Loading Intro Component ---
const SupernovaIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  // Starts directly in collapsing phase (automatic playback)
  const [phase, setPhase] = useState<"collapsing" | "exploding" | "fading">("collapsing");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: { 
      x: number; 
      y: number; 
      vx: number; 
      vy: number; 
      size: number; 
      color: string; 
      alpha: number;
      type: "Hydrogen" | "Helium" | "Heavy Elements";
    }[] = [];
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const centerX = width / 2;
    const centerY = height / 2;
    let starRadius = 75;
    let explosionRadius = 0;
    let flashAlpha = 0;
    let elapsed = 0;

    // Distribute stellar envelope matter: Hydrogen (lightest/fastest) and Helium (heavier/slower)
    const hColors = ["#ff003c", "#ff0066", "#ff0088", "#ff3366"]; // Crimson Pink (H-alpha wavelength emissions)
    const heColors = ["#ffa200", "#ffea00", "#ffd700", "#ffbf00"]; // Golden/Amber Yellow (Helium shell signatures)
    const heavyColors = ["#00ffff", "#00b3ff", "#a352ff", "#ffffff"]; // High-ionization core elements

    for (let i = 0; i < 600; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rand = Math.random();
      
      let type: "Hydrogen" | "Helium" | "Heavy Elements" = "Hydrogen";
      let color = "";
      let speed = 0;
      let size = 0;

      if (rand < 0.60) {
        // 60% Hydrogen envelope (rapid, far-flung expansion)
        type = "Hydrogen";
        color = hColors[Math.floor(Math.random() * hColors.length)];
        speed = 7 + Math.random() * 20;
        size = 1.5 + Math.random() * 3.5;
      } else if (rand < 0.88) {
        // 28% Helium shell (moderate expansion velocity)
        type = "Helium";
        color = heColors[Math.floor(Math.random() * heColors.length)];
        speed = 4.5 + Math.random() * 12;
        size = 2.5 + Math.random() * 4.5;
      } else {
        // 12% Synthesized Heavier Core Elements (slow, dense core explosion)
        type = "Heavy Elements";
        color = heavyColors[Math.floor(Math.random() * heavyColors.length)];
        speed = 2.0 + Math.random() * 6.5;
        size = 3.5 + Math.random() * 5.0;
      }

      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        alpha: 1.0,
        type,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      elapsed += 16;

      if (phase === "collapsing") {
        starRadius = Math.max(0, starRadius - 4.5);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, starRadius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, starRadius);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.2, "#00f3ff");
        grad.addColorStop(0.7, "#a855f7");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fill();

        // Relativistic collapse warping lines grid
        ctx.strokeStyle = `rgba(104, 117, 245, ${Math.max(0, (75 - starRadius) / 75) * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let r = starRadius * 2.2; r < Math.min(width, height) / 1.8; r += 25) {
          ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        }
        ctx.stroke();

        // Futuristic telemetry warning text during collapse
        ctx.fillStyle = `rgba(0, 243, 255, ${Math.max(0.2, (75 - starRadius) / 75)})`;
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("WARNING: GRAVITATIONAL COLLAPSE IN PROGRESS", centerX, centerY - 110);
        ctx.fillText("STELLAR DENSITY CRITICAL // CORE MASS EXCEEDS CHANDRASEKHAR LIMIT", centerX, centerY + 120);

        if (starRadius <= 1) {
          setPhase("exploding");
          flashAlpha = 1.0;
        }
      } else if (phase === "exploding") {
        if (flashAlpha > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.fillRect(0, 0, width, height);
          flashAlpha -= 0.04;
        }

        ctx.globalCompositeOperation = "lighter";

        // Relativistic shockwave expansion
        explosionRadius += 20;
        
        // 1. Hydrogen Envelope Blastfront (Crimson / Pink)
        ctx.beginPath();
        ctx.arc(centerX, centerY, explosionRadius * 1.15, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 0, 70, ${Math.max(0, 0.9 - (explosionRadius * 1.15) / (width / 1.3))})`;
        ctx.lineWidth = 30 * Math.max(0, 1 - (explosionRadius * 1.15) / (width / 1.3));
        ctx.stroke();

        // 2. Intermediate Helium Blastwave (Amber Gold)
        if (explosionRadius > 70) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, explosionRadius - 70, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 170, 0, ${Math.max(0, 1.1 - (explosionRadius - 70) / (width / 1.4))})`;
          ctx.lineWidth = 18 * Math.max(0, 1 - (explosionRadius - 70) / (width / 1.4));
          ctx.stroke();
        }

        // 3. Ultra-Dense Heavy Elements Core Shockwave (Pure Cyan/White)
        if (explosionRadius > 140) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, (explosionRadius - 140) * 0.9, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 255, 255, ${Math.max(0, 1.4 - (explosionRadius - 140) / (width / 1.5))})`;
          ctx.lineWidth = 10 * Math.max(0, 1 - (explosionRadius - 140) / (width / 1.5));
          ctx.stroke();
        }

        // Render explosion gas cloud particles
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.98;
          p.vy *= 0.98;
          p.alpha = Math.max(0, p.alpha - 0.007);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.5);
          grad.addColorStop(0, p.color);
          grad.addColorStop(1, "transparent");
          
          ctx.fillStyle = grad;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
        });
        
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = "source-over";

        // Render telemetry text overlay
        ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        ctx.fillText("NUCLEOSYNTHESIS DISPERSAL IN PROGRESS...", 40, height - 90);
        
        ctx.fillStyle = "rgba(255, 0, 92, 0.8)";
        ctx.fillText("HYDROGEN (H-α) SHELL DISPERSAL: 74% [EXPANDING relativistic velocity]", 40, height - 70);
        
        ctx.fillStyle = "rgba(255, 187, 0, 0.8)";
        ctx.fillText("HELIUM (He) CORE EJECTION: 24% [EXPANDING thermal velocity]", 40, height - 55);

        ctx.fillStyle = "rgba(0, 240, 255, 0.8)";
        ctx.fillText("HEAVIER ELEMENTS SYNTHESIS: 2% [COLLAPSING to singularity core]", 40, height - 40);

        if (elapsed > 2300) {
          setPhase("fading");
        }
      } else if (phase === "fading") {
        onComplete();
        return;
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [phase]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#02050c] overflow-hidden transition-opacity duration-1200 ${
      phase === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
    }`}>
      <canvas ref={canvasRef} className="absolute inset-0 z-10 w-full h-full" />
    </div>
  );
};

// --- MAIN 3D presentation webpage container ---
interface ThreeDUniverseProps {
  onAuthSuccess: () => void;
}

export const ThreeDUniverse: React.FC<ThreeDUniverseProps> = ({ onAuthSuccess }) => {
  const [showSupernovaIntro, setShowSupernovaIntro] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Auth states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Reader");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Habits Demo States
  const [streakCount, setStreakCount] = useState(4);
  const [velocity, setVelocity] = useState(25);
  const [isLoggedToday, setIsLoggedToday] = useState(false);

  // Music States
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Initialize ambient space synth loop
    audioRef.current = new Audio("/audio/vibeschill-lo-fi-deep-sad-245363.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.22; // subtle ambient background sound level
    audioRef.current.muted = true; // Start muted to bypass browser autoplay blocks

    // 1. Autoplay muted audio immediately
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Successfully playing in background (silent/muted)
        })
        .catch((err) => {
          console.warn("Muted autoplay blocked by browser sandbox:", err);
        });
    }

    // 2. Fallback: unmute and play on the very first valid user activation
    const handleFirstInteraction = () => {
      if (audioRef.current) {
        audioRef.current.muted = false; // Unmute
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            removeInteractionListeners();
          })
          .catch((err) => {
            console.warn("Unmuting on user activation failed:", err);
          });
      }
    };

    const removeInteractionListeners = () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("mousedown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("mousedown", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });

    return () => {
      removeInteractionListeners();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.muted = true;
      setIsPlaying(false);
    } else {
      audioRef.current.muted = false;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Audio playback error:", err);
      });
    }
  };

  const handleSandboxMode = () => {
    setSandboxMode(true);
    onAuthSuccess();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: fullName, role: role, dob: dob }
          },
        });
        if (error) throw error;
        
        localStorage.setItem("bookvault_profile_name", fullName);
        localStorage.setItem("bookvault_profile_role", role);
        localStorage.setItem("bookvault_profile_dob", dob);

        if (data.user && data.session === null) {
          setInfoMsg("Verification link sent! Check your email to confirm registration.");
          setIsSignUp(false);
        } else {
          localStorage.setItem("bookvault_session_active", "true");
          setSandboxMode(false);
          onAuthSuccess();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        localStorage.setItem("bookvault_session_active", "true");
        setSandboxMode(false);
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error("Supabase Auth Error:", err);
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Supabase Google Auth Error:", err);
      setErrorMsg(err.message || "Google Authentication failed.");
      setLoading(false);
    }
  };

  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const pct = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      setScrollPercent(pct);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const slideOpacities = React.useMemo(() => {
    const sp = scrollPercent;
    const opacities = [0, 0, 0, 0, 0];

    // Slide 1 (Hero): sp = 0.0 to 0.15
    if (sp < 0.10) {
      opacities[0] = 1.0;
    } else if (sp >= 0.10 && sp < 0.15) {
      opacities[0] = (0.15 - sp) / 0.05;
    } else {
      opacities[0] = 0.0;
    }

    // Slide 2 (Capabilities): sp = 0.15 to 0.325
    if (sp >= 0.15 && sp < 0.20) {
      opacities[1] = (sp - 0.15) / 0.05;
    } else if (sp >= 0.20 && sp < 0.275) {
      opacities[1] = 1.0;
    } else if (sp >= 0.275 && sp < 0.325) {
      opacities[1] = (0.325 - sp) / 0.05;
    } else {
      opacities[1] = 0.0;
    }

    // Slide 3 (Showcase): sp = 0.325 to 0.50
    if (sp >= 0.325 && sp < 0.375) {
      opacities[2] = (sp - 0.325) / 0.05;
    } else if (sp >= 0.375 && sp < 0.45) {
      opacities[2] = 1.0;
    } else if (sp >= 0.45 && sp < 0.50) {
      opacities[2] = (0.50 - sp) / 0.05;
    } else {
      opacities[2] = 0.0;
    }

    // Slide 4 (Comparison): sp = 0.50 to 0.675
    if (sp >= 0.50 && sp < 0.55) {
      opacities[3] = (sp - 0.50) / 0.05;
    } else if (sp >= 0.55 && sp < 0.625) {
      opacities[3] = 1.0;
    } else if (sp >= 0.625 && sp < 0.675) {
      opacities[3] = (0.675 - sp) / 0.05;
    } else {
      opacities[3] = 0.0;
    }

    // Slide 5 (Logger): sp = 0.675 to 0.85
    if (sp >= 0.675 && sp < 0.725) {
      opacities[4] = (sp - 0.675) / 0.05;
    } else if (sp >= 0.725 && sp < 0.80) {
      opacities[4] = 1.0;
    } else if (sp >= 0.80 && sp < 0.85) {
      opacities[4] = (0.85 - sp) / 0.05;
    } else {
      opacities[4] = 0.0;
    }

    return opacities;
  }, [scrollPercent]);

  const simulateProgressLog = () => {
    if (isLoggedToday) return;
    setIsLoggedToday(true);
    setStreakCount(prev => prev + 1);
    setVelocity(prev => prev + 20);
  };

  return (
    <div className="w-full relative min-h-screen bg-[#02050c] text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden">
      
      {showSupernovaIntro && (
        <SupernovaIntro onComplete={() => setShowSupernovaIntro(false)} />
      )}
      
      {/* Ambient Viewport Side Glow borders */}
      <div className="fixed top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-cyan-500/35 via-indigo-500/25 to-transparent blur-sm pointer-events-none z-20" />
      <div className="fixed top-0 bottom-0 right-0 w-1 bg-gradient-to-b from-pink-500/35 via-purple-500/25 to-transparent blur-sm pointer-events-none z-20" />
      
      {/* Large soft side aura light ambient glows */}
      <div className="fixed left-0 top-1/4 -translate-x-1/2 w-80 h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none z-10" />
      <div className="fixed right-0 top-1/3 translate-x-1/2 w-80 h-[500px] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none z-10" />
 
      {/* 3D WebGL Background Simulation */}
      <div className="fixed inset-0 z-0 pointer-events-auto w-full h-full">
        <Canvas shadows gl={{ antialias: true }} className="w-full h-full">
          <ambientLight intensity={0.25} />
          <pointLight position={[0, 0, 0]} intensity={15.0} distance={60} decay={1.2} color="#00f0ff" castShadow />
          <pointLight position={[15, 10, 15]} intensity={2.0} color="#a855f7" />
          <directionalLight position={[-15, 20, -15]} intensity={1.2} />
 
          <Stars radius={120} depth={60} count={6000} factor={4.5} saturation={0.5} fade speed={1.2} />
 
          <CameraScrollRig />
          <OrbitingSystem />
          <SolarStorm />
          <DonorStar3D />
          <CometSystem />
          <CtaSingularitySection 
            setIsSignUp={setIsSignUp} 
            setShowAuth={setShowAuth} 
            handleSandboxMode={handleSandboxMode} 
          />
 
        </Canvas>
      </div>
 
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/10 via-[#02050c]/90 to-[#02050c]" />
 
      <style>{`
        .glass-card-premium {
          background: rgba(4, 7, 20, 0.7);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-card-premium:hover {
          border-color: rgba(6, 182, 212, 0.25);
          box-shadow: 0 10px 40px rgba(6, 182, 212, 0.05);
        }
        .glow-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .glow-button::after {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: all 0.6s ease;
        }
        .glow-button:hover::after {
          left: 100%;
        }
        .neon-glow-indigo {
          text-shadow: 0 0 10px rgba(99, 102, 241, 0.65), 0 0 20px rgba(99, 102, 241, 0.3);
        }
        .neon-glow-pink {
          text-shadow: 0 0 10px rgba(236, 72, 153, 0.65), 0 0 20px rgba(236, 72, 153, 0.3);
        }
        .neon-glow-purple {
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.65), 0 0 20px rgba(168, 85, 247, 0.3);
        }
        .neon-glow-cyan {
          text-shadow: 0 0 10px rgba(6, 182, 212, 0.65), 0 0 20px rgba(6, 182, 212, 0.3);
        }
        @keyframes soundBars {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .animate-bar-1 { animation: soundBars 0.6s ease-in-out infinite alternate; }
        .animate-bar-2 { animation: soundBars 0.8s ease-in-out infinite alternate 0.15s; }
        .animate-bar-3 { animation: soundBars 0.7s ease-in-out infinite alternate 0.3s; }
        .animate-bar-4 { animation: soundBars 0.9s ease-in-out infinite alternate 0.45s; }
      `}</style>
 
      {/* FIXED VIEWPORT CONTENT OVERLAY */}
      <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between">
        
        {/* Navigation Header */}
        <header className="pointer-events-auto flex items-center justify-between py-6 max-w-6xl w-full mx-auto px-6 sm:px-10 border-b border-white/5 bg-gradient-to-b from-[#02050c] to-transparent">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <BookOpen className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight block">BookVault</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Manifold presentation</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setIsSignUp(false); setShowAuth(true); }}
              className="text-slate-450 hover:text-white text-xs font-mono tracking-widest uppercase cursor-pointer transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => { setIsSignUp(true); setShowAuth(true); }}
              className="glow-button px-4 py-2 bg-white text-black font-mono text-[10px] rounded-xl font-bold uppercase tracking-widest cursor-pointer shadow-lg hover:bg-slate-100"
            >
              Establish Vault
            </button>
          </div>
        </header>

        {/* Dynamic Typographic Overlay Slides */}
        <div className="flex-1 w-full relative">
          
          {/* Slide 1: Hero */}
          <div 
            style={{ 
              opacity: slideOpacities[0],
              pointerEvents: slideOpacities[0] > 0.5 ? "auto" : "none",
              display: slideOpacities[0] > 0.01 ? "flex" : "none",
              transition: "opacity 0.2s ease-out"
            }}
            className="absolute inset-0 items-center justify-start max-w-6xl mx-auto px-6 sm:px-10 font-mono"
          >
            <div className="w-full md:w-7/12 space-y-6 text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-[10px] tracking-widest font-semibold uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>3D SPACETIME VAULT ACTIVATED</span>
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none neon-glow-indigo">
                Your Knowledge <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 font-serif italic capitalize">Bends Space-Time</span>
              </h1>

              <p className="text-slate-455 text-xs sm:text-sm uppercase leading-relaxed tracking-wider max-w-lg">
                Knowledge is matter. Books are particles. Reading creates gravity. Watch your library orbit around an intellectual singularity core in a 3D gravity manifold.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <button 
                  onClick={() => { setIsSignUp(true); setShowAuth(true); }}
                  className="glow-button px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-mono text-[11px] font-bold rounded-xl uppercase tracking-widest cursor-pointer shadow-[0_0_30px_rgba(99,102,241,0.25)] border-0"
                >
                  Launch Vault
                </button>
                <button 
                  onClick={handleSandboxMode}
                  className="px-6 py-3.5 border border-white/10 bg-white/5 text-white font-mono text-[11px] font-bold rounded-xl uppercase tracking-widest cursor-pointer hover:bg-white/10 transition-all"
                >
                  Sandbox Mode
                </button>
              </div>
            </div>
          </div>

          {/* Slide 2: Capabilities */}
          <div 
            style={{ 
              opacity: slideOpacities[1],
              pointerEvents: slideOpacities[1] > 0.5 ? "auto" : "none",
              display: slideOpacities[1] > 0.01 ? "flex" : "none",
              transition: "opacity 0.2s ease-out"
            }}
            className="absolute inset-0 items-center justify-start max-w-6xl mx-auto px-6 sm:px-10 font-mono"
          >
            <div className="max-w-xl space-y-8 text-left">
              <span className="text-indigo-400 text-xs tracking-widest uppercase font-bold">[ 01 / MODULES ]</span>
              <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none neon-glow-indigo">
                System <br />Capabilities
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm uppercase leading-relaxed tracking-wider">
                A modern offline-first sync engine designed for active readers.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                {[
                  { title: "Progress Tracker", desc: "Monitor page velocities in real-time.", color: "text-cyan-400" },
                  { title: "Streak Heatmaps", desc: "Map your daily reading habits.", color: "text-pink-400" },
                  { title: "Goal Milestones", desc: "Unlock achievement badges.", color: "text-amber-400" },
                  { title: "Wishlist Scheduler", desc: "Track ordered books automatically.", color: "text-purple-400" }
                ].map((f, i) => (
                  <div key={i} className="space-y-1.5">
                    <h4 className={`text-base font-bold uppercase ${f.color}`}>{f.title}</h4>
                    <p className="text-xs text-slate-500 uppercase leading-snug tracking-wide">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Slide 3: Showcase */}
          <div 
            style={{ 
              opacity: slideOpacities[2],
              pointerEvents: slideOpacities[2] > 0.5 ? "auto" : "none",
              display: slideOpacities[2] > 0.01 ? "flex" : "none",
              transition: "opacity 0.2s ease-out"
            }}
            className="absolute inset-0 items-center justify-end max-w-6xl mx-auto px-6 sm:px-10 font-mono"
          >
            <div className="max-w-xl space-y-8 text-left w-full sm:w-[450px]">
              <span className="text-pink-500 text-xs tracking-widest uppercase font-bold">[ 02 / PREVIEW ]</span>
              <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none neon-glow-pink">
                The Vault <br />Dashboard
              </h2>
              
              <div className="space-y-6 pt-4">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/10 shrink-0">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-white uppercase leading-none">Atomic Habits</h4>
                    <span className="text-xs text-slate-400 uppercase tracking-widest">By James Clear</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>PROGRESS</span>
                    <span>160 / 320 pages (50%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-white/5">
                    <div className="w-1/2 h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs border-t border-white/10 pt-4">
                  <div>
                    <span className="block text-slate-500 uppercase tracking-wider">VELOCITY:</span>
                    <span className="text-cyan-400 font-extrabold text-sm uppercase">25 PPM</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 uppercase tracking-wider">MANIFOLD STATE:</span>
                    <span className="text-purple-400 font-extrabold text-sm uppercase">COHERENT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 4: Sync Comparison */}
          <div 
            style={{ 
              opacity: slideOpacities[3],
              pointerEvents: slideOpacities[3] > 0.5 ? "auto" : "none",
              display: slideOpacities[3] > 0.01 ? "flex" : "none",
              transition: "opacity 0.2s ease-out"
            }}
            className="absolute inset-0 items-center justify-start max-w-6xl mx-auto px-6 sm:px-10 font-mono"
          >
            <div className="max-w-xl space-y-8 text-left w-full">
              <span className="text-purple-400 text-xs tracking-widest uppercase font-bold">[ 03 / COMPARISON ]</span>
              <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none neon-glow-purple">
                Sync <br />Comparison
              </h2>
              
              <table className="w-full text-left border-collapse text-xs pt-4">
                <thead>
                  <tr className="border-b border-white/20 text-slate-400 uppercase tracking-widest font-bold">
                    <th className="pb-3 pr-4">ENGINE STATE</th>
                    <th className="pb-3 text-cyan-400 font-bold">BOOKVAULT</th>
                    <th className="pb-3">NOTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-slate-355 uppercase tracking-wider">
                  <tr>
                    <td className="py-4 pr-4">Offline-First Sandbox</td>
                    <td className="py-4 text-cyan-400 font-bold">YES (Native)</td>
                    <td className="py-4 text-slate-600">NO</td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-4">Page Velocity Logs</td>
                    <td className="py-4 text-cyan-400 font-bold">YES</td>
                    <td className="py-4 text-slate-600">NO</td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-4">Wishlist Scheduler</td>
                    <td className="py-4 text-cyan-400 font-bold">YES</td>
                    <td className="py-4">YES (Manual)</td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-4">Interactive 3D Space</td>
                    <td className="py-4 text-cyan-400 font-bold">YES (WebGL)</td>
                    <td className="py-4 text-slate-600">NO</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Slide 5: Habits Logger */}
          <div 
            style={{ 
              opacity: slideOpacities[4],
              pointerEvents: slideOpacities[4] > 0.5 ? "auto" : "none",
              display: slideOpacities[4] > 0.01 ? "flex" : "none",
              transition: "opacity 0.2s ease-out"
            }}
            className="absolute inset-0 items-center justify-end max-w-6xl mx-auto px-6 sm:px-10 font-mono"
          >
            <div className="max-w-xl space-y-8 text-left w-full sm:w-[450px]">
              <span className="text-cyan-400 text-xs tracking-widest uppercase font-bold">[ 04 / INTERACTIVE DEMO ]</span>
              <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none neon-glow-cyan">
                Habit <br />Logger
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm uppercase leading-relaxed tracking-wider">
                Simulate a 20-page reading progress log and watch your stats update in real-time:
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between pt-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Streak tracker</span>
                  <span className="text-5xl font-black text-white tracking-tighter">{streakCount} Days</span>
                </div>
                <button
                  onClick={simulateProgressLog}
                  disabled={isLoggedToday}
                  className={`glow-button px-6 py-4 text-xs uppercase tracking-widest rounded-xl font-bold transition-all cursor-pointer ${
                    isLoggedToday 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-indigo-650 hover:bg-indigo-550 text-white"
                  }`}
                >
                  {isLoggedToday ? "✓ Logged Today" : "Log 20 Pages"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* PHYSICAL SCROLL SPACER (Runway) */}
      <div className="relative z-0 h-[650vh] pointer-events-none" />

      {/* Slide 7: Presentation Footer Page (scrolls into view at bottom) */}
      <footer className="relative z-10 py-12 flex flex-col justify-end font-mono max-w-6xl mx-auto px-6">
        <div className="w-full border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] text-slate-500 uppercase tracking-widest pointer-events-auto">
          <span>© {new Date().getFullYear()} BOOKVAULT CO.</span>
          <div className="flex gap-6 pointer-events-auto">
            <a href="https://github.com/pruthvisb/BookVault" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GITHUB SOURCE</a>
            <a href="#" className="hover:text-white transition-colors">MIT LICENSE</a>
            <a href="#" className="hover:text-white transition-colors">SECURITY REPORT</a>
          </div>
        </div>
      </footer>

      {/* F. AUTH MODAL OVERLAY CARD */}
      <AnimatePresence>
        {showAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-8 border border-white/10 bg-[#040714]/95 backdrop-blur-xl shadow-2xl relative overflow-hidden font-mono"
            >
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setInfoMsg(null);
                  setShowAuth(false);
                }}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                CLOSE [X]
              </button>

              <div className="flex flex-col items-center text-center mt-4 mb-8">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-lg mb-3">
                  <BookOpen className="h-5 w-5 text-black" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-widest uppercase">
                  {isSignUp ? "CREATE VAULT" : "WELCOME BACK"}
                </h2>
                <p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1.5">
                  {isSignUp ? "Enter parameters to establish database." : "Enter credentials to fetch session."}
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-350 text-[9px] uppercase tracking-wider">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-455 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {infoMsg && (
                <div className="mb-4 flex items-start gap-2.5 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[9px] uppercase tracking-wider">
                  <AlertCircle className="h-4 w-4 shrink-0 text-blue-455 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-4 mb-2">
                    <div>
                      <label className="text-slate-500 text-[9px] uppercase tracking-widest block mb-1.5 pl-1">Full Name</label>
                      <div className="relative">
                        <User className="h-4 w-4 text-slate-655 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required={isSignUp}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="JOHN DOE"
                          className="w-full pl-11 pr-4 py-2.5 border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-400 text-xs tracking-widest"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-500 text-[9px] uppercase tracking-widest block mb-1.5 pl-1">Current Role</label>
                      <div className="relative">
                        <Briefcase className="h-4 w-4 text-slate-655 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-400 text-xs tracking-widest appearance-none"
                        >
                          <option value="Reader" className="bg-black text-white">READER</option>
                          <option value="Student" className="bg-black text-white">STUDENT</option>
                          <option value="Developer" className="bg-black text-white">DEVELOPER</option>
                          <option value="Researcher" className="bg-black text-white">RESEARCHER</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-500 text-[9px] uppercase tracking-widest block mb-1.5 pl-1">Date of Birth</label>
                      <div className="relative">
                        <Calendar className="h-4 w-4 text-slate-655 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="date"
                          required={isSignUp}
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-400 text-xs tracking-widest"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-slate-500 text-[9px] uppercase tracking-widest block mb-1.5 pl-1">Email Address</label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-655 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="READER@BOOKVAULT.APP"
                      className="w-full pl-11 pr-4 py-2.5 border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-400 text-xs tracking-widest"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 text-[9px] uppercase tracking-widest block mb-1.5 pl-1">Password</label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-655 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-2.5 border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-400 text-xs tracking-widest"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-black font-semibold text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? "AUTHENTICATING..." : isSignUp ? "CREATE VAULT" : "SIGN IN"}
                </button>
              </form>

              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="px-3 text-slate-600 text-[8px] uppercase tracking-widest">Or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-white/10 bg-black text-white text-[9px] uppercase tracking-widest hover:bg-white/5 transition-all cursor-pointer mb-2"
              >
                <span>Continue with Google</span>
              </button>

              <button
                onClick={handleSandboxMode}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-white/10 bg-white/5 text-slate-350 text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
              >
                <span>Use Local Sandbox</span>
              </button>

              <div className="text-center mt-5">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[9px] uppercase tracking-widest text-slate-500 hover:text-white transition-all cursor-pointer"
                >
                  {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Audio Controller */}
      <div className="fixed bottom-6 right-6 z-30 pointer-events-auto">
        <button
          onClick={toggleMusic}
          className="p-3.5 bg-black/60 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-white rounded-full flex items-center justify-center cursor-pointer shadow-2xl transition-all group"
          title={isPlaying ? "Mute Background Space Wave" : "Play Ambient Space Wave"}
        >
          {isPlaying ? (
            <div className="flex gap-0.5 items-end justify-center h-4 w-4">
              <span className="w-[2px] bg-cyan-400 rounded-full animate-bar-1" style={{ height: '6px' }} />
              <span className="w-[2px] bg-indigo-400 rounded-full animate-bar-2" style={{ height: '12px' }} />
              <span className="w-[2px] bg-purple-400 rounded-full animate-bar-3" style={{ height: '8px' }} />
              <span className="w-[2px] bg-cyan-400 rounded-full animate-bar-4" style={{ height: '14px' }} />
            </div>
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};
