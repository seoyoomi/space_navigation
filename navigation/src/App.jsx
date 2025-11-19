import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

// 목적지 좌표
//    (시작: z=8.5, 목적지: z=-5.0)
const targetDestination = new Vector3(5.5, 0.5, -7.0);

// 멈췄다고 판단할 근접 거리 (0.1 unit = 1cm)
const stopDistance = 0.1;

/**
 * RC카 컴포넌트
 */
function RCCarModel() { // ✅ 이름 변경
  const meshRef = useRef(); 
  // RC카가 현재 움직이는 중인지 상태로 관리
  const [isMoving, setIsMoving] = useState(true);
  
  // useFrame은 현재 비활성화 (위치 고정 확인용)
  // 나중에 실시간 위치 업데이트 시 다시 사용할 예정
  useFrame((state, delta) => {
    if (meshRef.current) {
      const carPosition = meshRef.current.position;
      // isMoving 상태가 true일 때만 위치 계산 및 이동
      if (isMoving) {

        // --- (임시) RC카 자동 이동 코드 ---
        // 목적지까지의 2D/3D 거리 계산
        const distanceToTarget = carPosition.distanceTo(targetDestination);

        if (distanceToTarget > stopDistance) {
          // 아직 목적지 전이면 계속 이동
          meshRef.current.position.z -= delta * 1.5; // Z축으로 전진
        } else {
          //목적지에 도달하면 isMoving 상태를 false로 변경
          console.log("목적지에 도착했습니다!");
          setIsMoving(false); 
          
          //위치를 목적지에 정확히 고정시킴
          meshRef.current.position.copy(targetDestination);
        }
      }

      // --- 카메라 추적 로직 ---
      // (카메라는 RC카가 멈춘 후에도 계속 추적해야 함)
      const targetPosition = new Vector3(
        carPosition.x,
        carPosition.y + 5, 
        carPosition.z + 8  
      );
      state.camera.position.lerp(targetPosition, 0.1);
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
 * 간단한 건물 컴포넌트 (이전과 동일)
 */
function Building({ position, size, color = 'gray' }) {
  // ... (이전과 동일) ...
  return (
    <mesh position={[position[0], position[1] + size[1] / 2, position[2]]}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
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

      {/* 건물들 */}
      <Building position={[-4, 0, 5]} size={[9, 9, 2]} color="red" />
      <Building position={[3, 0, -4]} size={[4, 2, 3]} color="green" />
      <Building position={[2, 0, 2]} size={[1, 5, 1]} color="blue" />

    </Canvas>
  );
}