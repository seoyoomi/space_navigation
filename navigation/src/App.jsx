import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

/**
 * RC카 컴포넌트
 */
function RCCarModel() { // ✅ 이름 변경
  const meshRef = useRef(); 
  
  // useFrame은 현재 비활성화 (위치 고정 확인용)
  // 나중에 실시간 위치 업데이트 시 다시 사용할 예정

  useFrame((state, delta) => {
    if (meshRef.current) {
      // --- (임시) RC카 자동 이동 ---
      // 1초에 1.5 unit(15cm)씩 Z축 방향으로 전진
      // 나중에 WebSocket 데이터로 이 부분을 대체하세요.
      meshRef.current.position.z -= delta * 1.5;

      // --- 카메라 추적 로직 ---
      // 1. RC카의 현재 위치 가져오기
      const carPosition = meshRef.current.position;

      // 2. 카메라가 따라갈 목표 위치 계산
      // (RC카의 X값, RC카보다 5 unit 위, RC카보다 8 unit 뒤)
      const targetPosition = new Vector3(
        carPosition.x,
        carPosition.y + 5, // RC카보다 5 unit(50cm) 위
        carPosition.z + 8  // RC카보다 8 unit(80cm) 뒤
      );

      // 3. 카메라 위치를 목표 위치로 부드럽게 이동 (lerp)
      state.camera.position.lerp(targetPosition, 0.1);

      // 4. 카메라가 항상 RC카를 바라보도록 설정
      state.camera.lookAt(carPosition);
    }
  });
  
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

    </Canvas>
  );
}