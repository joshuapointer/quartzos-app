import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SharedValue } from 'react-native-reanimated';
import { getOrbStops } from './palette';
import { colors } from '../../../tokens';

const vertexShader = `
uniform float uTime;
uniform float uRoil;
uniform float uComplexity;
uniform float uBreathR;
uniform float uRadiusRatio; // ratio of target radius to base geometry radius
uniform float uIsOutline;
uniform float uOutlineScale;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vUv = uv;
  
  // Base animated radius scale (includes breathing)
  float scale = uRadiusRatio + (uBreathR / 100.0);
  if (uIsOutline > 0.5) {
    scale *= uOutlineScale;
  }
  
  // Ported exact blobPath math from the HTML prototype
  float amp = 0.16 * uRoil;
  
  vec3 pos = normalize(position);
  float a = atan(pos.y, pos.x); // Angle around the Z axis
  
  float n1 = sin(uTime * 0.7 + a * 2.0) * 0.55;
  float n2 = sin(uTime * 1.1 + a * 3.0 + 1.3) * 0.30 * uComplexity;
  float n3 = sin(uTime * 1.7 + a * 5.0 + 0.7) * 0.18 * uComplexity;
  float n4 = sin(uTime * 0.4 + a * 1.0) * 0.10;
  
  // Fade displacement at Z-poles to prevent pinch distortion on the 3D mesh
  float poleFade = cos(asin(pos.z)); 
  
  float displacement = 1.0 + (n1 + n2 + n3 + n4) * amp * poleFade;
  
  vec3 displacedPosition = position * displacement * scale;
  
  // Calculate normals (using original smooth sphere normals for soft iridescence)
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
uniform float uTime;
uniform float uChrom;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uIsOutline;
uniform vec3 uOutlineColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  if (uIsOutline > 0.5) {
    // Render flat color for the inverted hull outline
    gl_FragColor = vec4(uOutlineColor, uChrom * 0.85);
    return;
  }
  
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  
  // Fresnel effect for edge glow and iridescence
  float fresnel = dot(viewDir, normal);
  fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
  float fresnelPow = pow(fresnel, 2.5);
  
  // Gradient mapping based on view angle and UVs (fake radial gradient mapped to 3D)
  // Distance from center of screen roughly maps to radial gradient
  float dist = distance(vUv, vec2(0.42, 0.38));
  
  vec3 baseColor = mix(uColor0, uColor1, smoothstep(0.0, 0.38, dist));
  baseColor = mix(baseColor, uColor2, smoothstep(0.38, 0.80, dist));
  baseColor = mix(baseColor, uColor3, smoothstep(0.80, 1.0, dist));
  
  // Iridescence (chromatic dispersion on the edges)
  // Shift hues based on normal and time
  float irisPhase = dot(normal, vec3(1.0, 1.0, 0.0)) * 3.0 + uTime;
  vec3 irisColor = vec3(
    sin(irisPhase) * 0.5 + 0.5,
    sin(irisPhase + 2.094) * 0.5 + 0.5,
    sin(irisPhase + 4.188) * 0.5 + 0.5
  );
  
  // Mix in the iridescence based on uChrom and fresnel
  vec3 finalColor = mix(baseColor, irisColor, fresnelPow * uChrom * 0.8);
  
  // Specular highlight
  vec3 lightDir = normalize(vec3(0.5, 0.8, 1.0));
  float spec = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 30.0);
  finalColor += vec3(1.0, 0.95, 0.98) * spec * 0.4;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// Helper to convert hex to THREE.Color
function hexToRGB(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return new THREE.Vector3(r, g, b);
}

interface OrbMeshProps {
  orbR: SharedValue<number>;
  breathR: SharedValue<number>;
  roil: SharedValue<number>;
  complexity: SharedValue<number>;
  chrom: SharedValue<number>;
  tempK: SharedValue<number>;
  baseRadius: number;
  geometry: THREE.SphereGeometry;
  isOutline?: boolean;
  outlineColor?: string;
  outlineScale?: number;
  position?: [number, number, number];
}

const OrbMesh = ({
  orbR,
  breathR,
  roil,
  complexity,
  chrom,
  tempK,
  baseRadius,
  geometry,
  isOutline = false,
  outlineColor = colors.orbOutlineDefault,
  outlineScale = 1.02,
  position = [0, 0, 0]
}: OrbMeshProps) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRoil: { value: roil.value },
      uComplexity: { value: complexity.value },
      uBreathR: { value: breathR.value },
      uRadiusRatio: { value: orbR.value / baseRadius },
      uChrom: { value: chrom.value },
      uColor0: { value: new THREE.Vector3() },
      uColor1: { value: new THREE.Vector3() },
      uColor2: { value: new THREE.Vector3() },
      uColor3: { value: new THREE.Vector3() },
      uIsOutline: { value: isOutline ? 1.0 : 0.0 },
      uOutlineScale: { value: outlineScale },
      uOutlineColor: { value: hexToRGB(outlineColor) },
    }),
    [baseRadius, isOutline, outlineScale, outlineColor]
  );

  useFrame((state) => {
    if (materialRef.current) {
      const u = materialRef.current.uniforms;
      u.uTime.value = state.clock.elapsedTime;
      u.uRoil.value = roil.value;
      u.uComplexity.value = complexity.value;
      u.uBreathR.value = breathR.value;
      u.uRadiusRatio.value = orbR.value / baseRadius;
      u.uChrom.value = chrom.value;

      const stops = getOrbStops(tempK.value);
      u.uColor0.value.copy(hexToRGB(stops[0]));
      u.uColor1.value.copy(hexToRGB(stops[1]));
      u.uColor2.value.copy(hexToRGB(stops[2]));
      u.uColor3.value.copy(hexToRGB(stops[3]));
    }
  });

  return (
    <mesh position={position}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={isOutline ? THREE.BackSide : THREE.FrontSide}
        depthWrite={!isOutline}
      />
    </mesh>
  );
};

export interface MoltenOrb3DProps {
  orbR: SharedValue<number>;
  breathR: SharedValue<number>;
  roil: SharedValue<number>;
  complexity: SharedValue<number>;
  chrom: SharedValue<number>;
  tempK: SharedValue<number>;
  size: number;
}

export default function MoltenOrb3D(props: MoltenOrb3DProps) {
  const geometry = useMemo(
    () => new THREE.SphereGeometry(props.size / 2, 64, 64),
    [props.size]
  );

  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 500], zoom: 1, up: [0, 1, 0], near: 0.1, far: 1000 }}
      style={{ width: props.size, height: props.size, backgroundColor: 'transparent' }}
      gl={{ alpha: true, antialias: false }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={1} />

      {/* Chromatic Fringes (Inverted Hull Outlines) */}
      <OrbMesh {...props} baseRadius={props.size / 2} geometry={geometry} isOutline outlineColor={colors.fringePos} outlineScale={1.03} position={[-2, 0, -2]} />
      <OrbMesh {...props} baseRadius={props.size / 2} geometry={geometry} isOutline outlineColor={colors.fringeNeg} outlineScale={1.03} position={[2, 0, -2]} />

      {/* The sphere base radius is mapped 1:1 to size / 2. We use baseRadius to size the geometry
          and uRadiusRatio to scale it dynamically in the shader based on orbR / baseRadius. */}
      <OrbMesh {...props} baseRadius={props.size / 2} geometry={geometry} position={[0, 0, 0]} />
    </Canvas>
  );
}
