"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, OrbitControls, Float, Center } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function Model() {
  const { scene } = useGLTF("/solar-panel-optimized.glb");
  const modelRef = useRef<THREE.Group>(null);
  
  // Relojito interno para nuestra animación pre calculada (en segundos)
  const time = useRef(0);
  const duration = 4.5; // Animación de 4 segundos y medio para que sea súper majestuosa

  // useFrame corre a 60FPS. 
  useFrame((state, delta) => {
    if (modelRef.current && time.current < duration) {
      time.current += delta;
      
      // t va matemáticamente de 0 a 1 en el transcurso de los 2.5 segundos
      const t = Math.min(time.current / duration, 1);
      
      // Función matemática: "Ease In-Out Quart"
      // Arrastra despacio, explota rotando a máxima velocidad en el centro, y se estaciona como seda.
      const ease = t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
      
      // 1. Desplazamiento: Vuela desde X=-25 (de los re confines) hacia X=3.5 (clavado al lado derecho)
      modelRef.current.position.x = -25 + (3.5 - (-25)) * ease;
      
      // 2. Rotación: Rota salvajemente desde Y=15 (muchísimas vueltas) hacia Y=-0.6 (frente)
      modelRef.current.rotation.y = 15 + (-0.6 - 15) * ease;
    }
  });

  // Estado Inicial: Modificamos la Y y la pasamos de -1 a 0.2 para que el panel flote notablemente "más arriba"
  return (
    <group ref={modelRef} position={[-25, 0.2, 0]} rotation={[0, 15, 0]}>
      {/* Al poner el Center ADENTRO del grupo que rota, 
          calcula el centro geométrico de la malla sin importar si en 
          Blender estaba descentrado. Así gira sobre su propio eje. */}
      <Center>
        <primitive 
            object={scene} 
            scale={0.07} 
        />
      </Center>
    </group>
  );
}

export function SolarPanel3D() {
  return (
    // Transformamos el recuadro a pantalla completa (inset-0 w-full h-full)
    // Desactivamos los eventos de mouse (pointer-events-none) para que sea un fondo 100% pasivo
    <div 
        className="absolute inset-0 w-full h-[60vh] lg:h-full z-0 opacity-60 lg:opacity-100 pointer-events-none mix-blend-screen overflow-hidden"
        style={{ WebkitMaskImage: "radial-gradient(ellipse at center right, black 40%, transparent 100%)" }}
    >
      <Canvas 
        camera={{ position: [0, 1, 8], fov: 45 }}
        dpr={[1, 2]} // Optimización para pantallas retina
        gl={{ powerPreference: "high-performance" }} // Obliga al navegador a usar aceleración gráfica dura
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          {/* ELIMINADO EL CENTER GLOBAL PARA NO PELEAR CON LA MATEMÁTICA LOCAL */}
          <Float 
              speed={2} 
              rotationIntensity={0.2} 
              floatIntensity={0.5} 
          >
            <Model />
          </Float>
        </Suspense>
      </Canvas>
    </div>
  );
}
