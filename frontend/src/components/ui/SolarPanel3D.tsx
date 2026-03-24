"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, OrbitControls, Float, Center } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function Model() {
  // ATENCIÓN: Esto va a buscar el archivo en frontend/public/solar-panel.glb
  const { scene } = useGLTF("/solar-panel.glb");
  const modelRef = useRef<THREE.Group>(null);

  // Acá es donde pasa la magia matemática de la rotación
  useFrame((state, delta) => {
    if (modelRef.current) {
      // Modificá el 0.2 acá si querés que rote más rápido o más lento
      modelRef.current.rotation.y += delta * 0.2; 
    }
  });

  return (
    <primitive 
        ref={modelRef} 
        object={scene} 
        // Podés achicarlo o agrandarlo cambiando el scale
        scale={2.5} 
    />
  );
}

// Un cubo de neón giratorio mientras carga el archivo pesado
function Loader() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#0ea5e9" wireframe />
    </mesh>
  );
}

export function SolarPanel3D() {
  return (
    <div className="w-full h-[400px] md:h-[600px] cursor-grab active:cursor-grabbing">
      {/* El Canvas es literalmente tu "Ventana al 3D" en React */}
      <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
        <Suspense fallback={<Loader />}>
          {/* Environment es clave: ilumina el panel con un entorno realista HDRI invisible */}
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          <Center>
            {/* Float le da ese movimiento "flotante" hiper premium estilo Apple */}
            <Float 
                speed={2} 
                rotationIntensity={0.2} 
                floatIntensity={0.8} 
            >
              <Model />
            </Float>
          </Center>

          {/* Te dejé pre-configurados los controles orbitales restringidos para que 
              el usuario pueda moverlo con el mouse pero no desarmar la escena */}
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate={false} 
            maxPolarAngle={Math.PI / 1.5} 
            minPolarAngle={Math.PI / 6}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
