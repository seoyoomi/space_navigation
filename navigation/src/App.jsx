import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
// ✅ 1. OrbitControls를 import 합니다.
import { OrbitControls } from '@react-three/drei';

/**
 * RC카 컴포넌트
 */
function RCCarModel() { // ✅ 이름 변경
  const meshRef = useRef(); 
  
  // useFrame은 현재 비활성화 (위치 고정 확인용)
  // 나중에 실시간 위치 업데이트 시 다시 사용할 예정
  
  return (
    <mesh 
      ref={meshRef} 
      // RC카 시작 위치 (오른쪽 맨 아래)
      // 구의 중심이 Y=0.5에 있어야 바닥에 딱 붙습니다.
      position={[5.5, 0.5, 8.5]} 
    >
      {/* ✅ <boxGeometry> 대신 <sphereGeometry> 사용 */}
      {/* args={[반지름]} -> 지름이 1 unit(10cm)인 구 */}
      <sphereGeometry args={[0.5]} /> 
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

      {/* RC카 컴포넌트 */}
      <RCCarModel />

      {/* 카메라 컨트롤 */}
      <OrbitControls />

    </Canvas>
  );
}