import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
// ✅ 1. OrbitControls를 import 합니다.
import { OrbitControls } from '@react-three/drei';

/**
 * 3D 큐브 컴포넌트 (이전과 동일)
 */
function Cube() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* 1x1x1 큐브는 10x10x10cm */}
      <boxGeometry args={[1, 1, 1]} />
      <boxGeometry args={[1, 1, 1]} /> 
      <meshStandardMaterial color={0x007bff} />
    </mesh>
  );
}

/**
 * 메인 앱 컴포넌트
 */
export default function App() {
  return (
    <Canvas camera={{ position: [0, 2, 5], fov: 75 }}>
      {/* 조명 설정 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[1, 2, 3]} intensity={1} />

      {/* '아크릴 판'에 해당하는 바닥 평면 */}
      <mesh 
        position-y={-0.5} 
        rotation-x={-Math.PI / 2}
      >
        {/* ✅ 가로 12, 세로 18 (120cm x 180cm) 크기로 변경 */}
        <planeGeometry args={[12, 18]} /> 
        <meshStandardMaterial color={0xbbbbbb} />
      </mesh>

      {/* 큐브 컴포넌트 */}
      <Cube />

      {/* 카메라 컨트롤 */}
      <OrbitControls />

    </Canvas>
  );
}