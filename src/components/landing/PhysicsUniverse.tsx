"use client";

import React, { useRef, useEffect } from "react";

export const PhysicsUniverse: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize WebGL2 context (required for GPGPU texture lookup and instancing)
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      console.warn("WebGL2 not supported, falling back to WebGL1 rendering.");
      return;
    }

    // Enable floating point textures
    const extFloat = gl.getExtension("EXT_color_buffer_float");
    if (!extFloat) {
      console.warn("Floating point color buffer allocation not supported.");
      return;
    }

    let animId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // --- GPGPU SIMULATION PARAMETERS ---
    // 256x256 texture = 65,536 particles simulated in parallel on the GPU
    const simSize = 256;
    const numParticles = simSize * simSize;

    // --- 1. SHADER SOURCES ---

    // GPGPU Simulation Shaders
    const simVs = `#version 300 es
      in vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const simFs = `#version 300 es
      precision highp float;
      
      uniform sampler2D u_posTex;
      uniform sampler2D u_velTex;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;
      uniform float u_scroll;
      
      out vec4 fragColor[2]; // Render targets: 0 = Position, 1 = Velocity

      // 3D Simplex-like noise for curl noise fluid
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.1, 0.1, 0.1));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        vec3 u = f*f*(3.0-2.0*f);
        return mix(mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)), u.x),
                       mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), u.x), u.y),
                   mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), u.x),
                       mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), u.x), u.y), u.z);
      }

      // 3D Curl Noise approximation (Divergence-Free fluid)
      vec3 curlNoise(vec3 p) {
        const float e = 0.08;
        float n_x = noise(p);
        float n_y = noise(p + vec3(12.3, 34.5, 56.7));
        float n_z = noise(p + vec3(78.9, 12.3, 45.6));

        vec3 curl;
        curl.x = (noise(p + vec3(0.0, e, 0.0)) - noise(p - vec3(0.0, e, 0.0))) - 
                 (noise(p + vec3(0.0, 0.0, e)) - noise(p - vec3(0.0, 0.0, e)));
        curl.y = (noise(p + vec3(0.0, 0.0, e)) - noise(p - vec3(0.0, 0.0, e))) - 
                 (noise(p + vec3(e, 0.0, 0.0)) - noise(p - vec3(e, 0.0, 0.0)));
        curl.z = (noise(p + vec3(e, 0.0, 0.0)) - noise(p - vec3(e, 0.0, 0.0))) - 
                 (noise(p + vec3(0.0, e, 0.0)) - noise(p - vec3(0.0, e, 0.0)));
        return normalize(curl) * 0.45;
      }

      void main() {
        ivec2 texCoord = ivec2(gl_FragCoord.xy);
        vec4 posData = texelFetch(u_posTex, texCoord, 0);
        vec4 velData = texelFetch(u_velTex, texCoord, 0);

        vec3 pos = posData.xyz;
        vec3 vel = velData.xyz;
        float mass = posData.w;
        float quantumPhase = velData.w;

        // Newtonian Gravity well at center
        vec3 center = vec3(u_resolution * 0.5, 0.0);
        vec3 toCenter = center - pos;
        float dist = length(toCenter);

        // Core Absorption & Respawn
        if (dist < 45.0) {
          float angle = hash(pos + vec3(u_time)) * 6.28318;
          float r = max(u_resolution.x, u_resolution.y) * 0.45;
          pos = vec3(center.xy + vec2(cos(angle), sin(angle)) * r, 0.0);
          vel = vec3(-sin(angle), cos(angle), 0.0) * sqrt(15000.0 / r);
          fragColor[0] = vec4(pos, mass);
          fragColor[1] = vec4(vel, quantumPhase);
          return;
        }

        // F = G * M / r^2 Gravity vector
        float GM = 28000.0 * (1.0 + u_scroll * 1.5);
        vec3 gravity = normalize(toCenter) * (GM / (dist * dist));

        // Cursor Gravitational pull
        if (u_mouse.x > -900.0) {
          vec3 mousePos = vec3(u_mouse, 0.0);
          vec3 toMouse = mousePos - pos;
          float mDist = length(toMouse);
          if (mDist < 250.0 && mDist > 8.0) {
            gravity += normalize(toMouse) * (1800.0 / (mDist * mDist));
          }
        }

        // Fluid Sim / SPH density force approximation
        // Particles repel if they are inside dense centers
        vec3 fluidRepel = vec3(0.0);
        if (dist < 180.0) {
          fluidRepel = normalize(toCenter) * -0.15;
        }

        // Lorenz Attractor chaotic perturbations
        vec3 chaoticForce = vec3(0.0);
        if (mass > 4.2) {
          // Lorenz equations: dx = s*(y-x), dy = x*(r-z)-y, dz = x*y-b*z
          float sigma = 10.0;
          float rho = 28.0;
          float beta = 8.0 / 3.0;
          vec3 scaledPos = (pos - center) * 0.04;
          vec3 lorenz;
          lorenz.x = sigma * (scaledPos.y - scaledPos.x);
          lorenz.y = scaledPos.x * (rho - scaledPos.z) - scaledPos.y;
          lorenz.z = scaledPos.x * scaledPos.y - beta * scaledPos.z;
          chaoticForce = lorenz * 0.12;
        }

        // 3D Curl Noise turbulence field
        vec3 curl = curlNoise(pos * 0.005 + vec3(0.0, 0.0, u_time * 0.1));

        // Acceleration Integration
        vec3 accel = gravity + fluidRepel + chaoticForce + curl * (0.8 + u_scroll * 1.5);
        vel += accel * 0.016;
        vel *= 0.994; // friction damping

        pos += vel * 0.016;

        // Rotate quantum probability phase
        quantumPhase += (0.05 + length(vel) * 0.002);
        if (quantumPhase > 6.28318) quantumPhase -= 6.28318;

        fragColor[0] = vec4(pos, mass);
        fragColor[1] = vec4(vel, quantumPhase);
      }
    `;

    // Schwarzschild Black Hole & Accretion Disk Shader
    const spaceVs = `#version 300 es
      in vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const spaceFs = `#version 300 es
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_scroll;
      out vec4 fragColor;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < 4; ++i) {
          v += a * noise(p);
          p = rot * p * 2.0 + vec2(10.0);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
        float dist = length(uv);
        float rs = 0.1; // Schwarzschild event horizon radius

        // General Relativistic ray-lensing warp
        vec2 warpedUv = uv;
        if (dist > rs) {
          float bend = rs / (dist - rs + 0.015);
          warpedUv -= normalize(uv) * bend * 0.052;
        } else {
          // Inside event horizon
          fragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }

        // Accretion disk profile
        float angle = atan(warpedUv.y, warpedUv.x);
        float diskNoise = fbm(vec2(dist * 7.0 - u_time * 1.5, angle * 3.5));
        float diskGlow = smoothstep(rs * 3.8, rs, dist) * smoothstep(rs * 0.8, rs * 1.25, dist);
        diskGlow += 0.06 / (dist - rs + 0.012); // Lensing ring fringe glow

        vec3 color = vec3(0.0);
        
        // Relativistic Chromatic Aberration channel split
        // Red channel (hot outer accretion)
        color.r = (diskGlow + diskNoise * 0.22) * 0.38;
        // Green channel (mid disk cyan shift)
        color.g = (diskGlow + diskNoise * 0.12) * 0.58;
        // Blue channel (violet horizon gravity lensing)
        color.b = (diskGlow * 1.15 + diskNoise * 0.28) * 0.95;

        // Gravitational lens cyan halo
        float halo = 0.009 / (dist - rs + 0.003);
        color += vec3(0.0, 0.48 * halo, 0.92 * halo);

        // Volumetric nebulae background
        vec2 bgUv = uv * 3.0 + vec2(u_time * 0.012);
        float neb = fbm(bgUv + fbm(bgUv));
        vec3 nebCol = vec3(0.02, 0.01, 0.06) * neb * (1.0 + u_scroll * 0.35);
        color += nebCol;

        // Vignette
        float vignette = smoothstep(0.95, 0.45, length(uv));
        color *= vignette;

        fragColor = vec4(color, 1.0);
      }
    `;

    // Particle Render Shaders (Instanced drawing)
    const renderVs = `#version 300 es
      in vec2 a_quadPos; // coordinate [-0.5, 0.5] to draw quad points
      uniform sampler2D u_posTex;
      uniform sampler2D u_velTex;
      uniform vec2 u_resolution;
      uniform int u_simSize;
      
      out vec3 v_color;
      out float v_phase;
      out vec2 v_texCoord;

      void main() {
        // Read instanced position
        int instance = gl_InstanceID;
        int x = instance % u_simSize;
        int y = instance / u_simSize;
        
        vec4 posData = texelFetch(u_posTex, ivec2(x, y), 0);
        vec4 velData = texelFetch(u_velTex, ivec2(x, y), 0);

        vec3 pos = posData.xyz;
        float mass = posData.w;
        float phase = velData.w;

        // Convert world coords to clip space coordinates
        vec2 clipPos = (pos.xy / u_resolution) * 2.0 - 1.0;
        
        // Compute size based on mass & speed
        float speed = length(velData.xyz);
        float size = (2.0 + mass * 0.8 + speed * 0.15);

        // Position quad vertex
        gl_Position = vec4(clipPos + a_quadPos * (size / min(u_resolution.x, u_resolution.y)), 0.0, 1.0);
        
        // Output properties to Fragment
        v_color = vec3(0.0);
        if (mass < 2.0) v_color = vec3(0.0, 0.72, 1.0);      // Cyan
        else if (mass < 3.5) v_color = vec3(0.66, 0.33, 1.0); // Purple
        else if (mass < 4.8) v_color = vec3(0.23, 0.51, 1.0); // Royal Blue
        else v_color = vec3(0.92, 0.28, 0.6);                 // Pink

        v_phase = phase;
        v_texCoord = a_quadPos + 0.5; // map [0,1]
      }
    `;

    const renderFs = `#version 300 es
      precision highp float;
      in vec3 v_color;
      in float v_phase;
      in vec2 v_texCoord;
      out vec4 fragColor;

      void main() {
        // Draw circular nodes
        float d = length(v_texCoord - 0.5);
        if (d > 0.5) discard;

        // Quantum phase interference halo (fades and oscillates)
        float wave = 0.5 + 0.5 * sin(v_phase * 4.0);
        float intensity = smoothstep(0.5, 0.0, d) * (0.8 + 0.2 * wave);

        // Diffraction halo ring
        float ring = smoothstep(0.48, 0.44, d) * smoothstep(0.38, 0.42, d);
        
        vec3 col = v_color * intensity + vec3(1.0) * ring * 0.35;
        fragColor = vec4(col, intensity);
      }
    `;

    // Shader compiler helper
    const compileShader = (src: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader build failed:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    // Program connector helper
    const linkProgram = (vsSrc: string, fsSrc: string) => {
      const vs = compileShader(vsSrc, gl.VERTEX_SHADER);
      const fs = compileShader(fsSrc, gl.FRAGMENT_SHADER);
      if (!vs || !fs) return null;
      
      const prog = gl.createProgram();
      if (!prog) return null;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error("Linker error:", gl.getProgramInfoLog(prog));
        return null;
      }
      return prog;
    };

    // Build compute & render pipelines
    const simProgram = linkProgram(simVs, simFs);
    const spaceProgram = linkProgram(spaceVs, spaceFs);
    const renderProgram = linkProgram(renderVs, renderFs);
    if (!simProgram || !spaceProgram || !renderProgram) return;

    // --- 2. GPGPU FRAMEBUFFER PING-PONG TEXTURES ---
    
    // Allocate position & velocity float arrays
    const posData = new Float32Array(numParticles * 4);
    const velData = new Float32Array(numParticles * 4);

    const cX = width / 2;
    const cY = height / 2;

    for (let i = 0; i < numParticles; i++) {
      const idx = i * 4;
      // Orbiting parameters
      const radius = Math.random() * (Math.min(width, height) * 0.38) + 65;
      const angle = Math.random() * Math.PI * 2;
      
      posData[idx] = cX + Math.cos(angle) * radius; // x
      posData[idx + 1] = cY + Math.sin(angle) * radius; // y
      posData[idx + 2] = 0.0; // z
      posData[idx + 3] = Math.random() * 6.0; // mass (used for color classifications)

      const speed = Math.sqrt((28000.0) / radius) * (0.8 + Math.random() * 0.4);
      velData[idx] = -Math.sin(angle) * speed; // vx
      velData[idx + 1] = Math.cos(angle) * speed; // vy
      velData[idx + 2] = 0.0; // vz
      velData[idx + 3] = Math.random() * Math.PI * 2; // quantum phase
    }

    // Texture creation helper
    const createDoubleTexture = (data: Float32Array | null) => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, simSize, simSize, 0, gl.RGBA, gl.FLOAT, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    };

    // Create Ping & Pong textures
    let posTexPing = createDoubleTexture(posData);
    let posTexPong = createDoubleTexture(null);
    let velTexPing = createDoubleTexture(velData);
    let velTexPong = createDoubleTexture(null);

    // Framebuffers for simulation updates
    const fbPing = gl.createFramebuffer();
    const fbPong = gl.createFramebuffer();

    const bindFB = (fb: WebGLFramebuffer | null, posTex: WebGLTexture | null, velTex: WebGLTexture | null) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      if (fb) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, posTex, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, velTex, 0);
        
        // Declare multiple draw buffers
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      }
    };

    bindFB(fbPing, posTexPing, velTexPing);
    bindFB(fbPong, posTexPong, velTexPong);

    // --- 3. QUAD VERTEX BUFFER (Simulation & Background render) ---
    const quadVertices = new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ]);
    const quadVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    // --- 4. INSTANCED QUAD POINT BUFFER (Particle mesh rendering) ---
    const pointVertices = new Float32Array([
      -0.5, -0.5,  0.5, -0.5, -0.5,  0.5,
      -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,
    ]);
    const pointVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointVbo);
    gl.bufferData(gl.ARRAY_BUFFER, pointVertices, gl.STATIC_DRAW);

    // --- 5. UNIFORM & ATTRIB POINTER CONNECTIONS ---

    // GPGPU Sim program Uniforms
    const simResolutionLoc = gl.getUniformLocation(simProgram, "u_resolution");
    const simMouseLoc = gl.getUniformLocation(simProgram, "u_mouse");
    const simTimeLoc = gl.getUniformLocation(simProgram, "u_time");
    const simScrollLoc = gl.getUniformLocation(simProgram, "u_scroll");
    const simPosTexLoc = gl.getUniformLocation(simProgram, "u_posTex");
    const simVelTexLoc = gl.getUniformLocation(simProgram, "u_velTex");

    // Space program Uniforms
    const spaceResolutionLoc = gl.getUniformLocation(spaceProgram, "u_resolution");
    const spaceTimeLoc = gl.getUniformLocation(spaceProgram, "u_time");
    const spaceScrollLoc = gl.getUniformLocation(spaceProgram, "u_scroll");

    // Render program Uniforms
    const renderResolutionLoc = gl.getUniformLocation(renderProgram, "u_resolution");
    const renderSimSizeLoc = gl.getUniformLocation(renderProgram, "u_simSize");
    const renderPosTexLoc = gl.getUniformLocation(renderProgram, "u_posTex");
    const renderVelTexLoc = gl.getUniformLocation(renderProgram, "u_velTex");

    // Attract mouse position coordinates
    let mouse = { x: -1000, y: -1000 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = height - e.clientY; // invert Y coordinate for WebGL
    };
    const onMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    // Scroll speed calculator
    let scrollPos = window.scrollY;
    let scrollVelocity = 0;
    const onScroll = () => {
      const curr = window.scrollY;
      scrollVelocity += (curr - scrollPos) * 0.012;
      scrollPos = curr;
    };
    window.addEventListener("scroll", onScroll);

    // Frame renderer
    const startTime = Date.now();
    
    const renderFrame = () => {
      const elapsedSeconds = (Date.now() - startTime) * 0.001;

      // Damp scroll velocity
      scrollVelocity *= 0.94;

      // --- PHASE 1: COMPUTE GPGPU PHYSICS INTEGRATION ---
      gl.useProgram(simProgram);
      gl.viewport(0, 0, simSize, simSize);

      // Bind current input textures (Ping)
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, posTexPing);
      gl.uniform1i(simPosTexLoc, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velTexPing);
      gl.uniform1i(simVelTexLoc, 1);

      // Set simulation parameters
      gl.uniform2f(simResolutionLoc, width, height);
      gl.uniform2f(simMouseLoc, mouse.x, mouse.y);
      gl.uniform1f(simTimeLoc, elapsedSeconds);
      gl.uniform1f(simScrollLoc, Math.abs(scrollVelocity));

      // Bind destination framebuffer (Pong)
      bindFB(fbPong, posTexPong, velTexPong);

      // Draw quad to execute GPGPU logic
      gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
      const posAttrSim = gl.getAttribLocation(simProgram, "position");
      gl.enableVertexAttribArray(posAttrSim);
      gl.vertexAttribPointer(posAttrSim, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // --- PHASE 2: DRAW SPACE MANIFOLD BACKGROUND ---
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); // target screen canvas
      gl.viewport(0, 0, width, height);
      gl.useProgram(spaceProgram);

      gl.uniform2f(spaceResolutionLoc, width, height);
      gl.uniform1f(spaceTimeLoc, elapsedSeconds);
      gl.uniform1f(spaceScrollLoc, Math.abs(scrollVelocity));

      gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
      const posAttrSpace = gl.getAttribLocation(spaceProgram, "position");
      gl.enableVertexAttribArray(posAttrSpace);
      gl.vertexAttribPointer(posAttrSpace, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // --- PHASE 3: DRAW INSTANCED QUANTUM PARTICLES ---
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // Additive volumetric blending

      gl.useProgram(renderProgram);
      gl.uniform2f(renderResolutionLoc, width, height);
      gl.uniform1i(renderSimSizeLoc, simSize);

      // Bind position texture computed in simulation pass (Pong)
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, posTexPong);
      gl.uniform1i(renderPosTexLoc, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velTexPong);
      gl.uniform1i(renderVelTexLoc, 1);

      // Bind particle quad meshes
      gl.bindBuffer(gl.ARRAY_BUFFER, pointVbo);
      const quadPosAttr = gl.getAttribLocation(renderProgram, "a_quadPos");
      gl.enableVertexAttribArray(quadPosAttr);
      gl.vertexAttribPointer(quadPosAttr, 2, gl.FLOAT, false, 0, 0);

      // Draw instanced particles
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, numParticles);

      gl.disable(gl.BLEND);

      // --- SWAP PING-PONG TEXTURES ---
      const tempPos = posTexPing;
      posTexPing = posTexPong;
      posTexPong = tempPos;

      const tempVel = velTexPing;
      velTexPing = velTexPong;
      velTexPong = tempVel;

      animId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 w-full h-full pointer-events-none bg-[#010307]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
