import React, { useRef, useState, useMemo} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';

//맵 데이터 (0:벽, 1:길, 2:장애물, 3:시작, 4:도착)
const rawMapData = [
  [0,0,0,0,0,4],
  [1,1,1,1,1,1],
  [1,0,0,0,0,1],
  [1,1,1,1,1,1],
  [1,0,1,0,0,1],
  [1,0,1,0,0,1],
  [1,0,1,0,0,2],
  [1,1,1,1,1,1],
  [0,0,0,0,0,3]
];

//설정 및 데이터
const PASSABLE = new Set([1, 3, 4]);  // 이동 가능: 길, 시작, 도착

// 맵 확대 함수 (20cm -> 10cm)
function upscaleGrid(grid) {
  const newGrid = [];
  for (let r = 0; r < grid.length; r++) {
    const topRow = [];
    const bottomRow = [];
    for (let c = 0; c < grid[0].length; c++) {
      const val = grid[r][c];
      // 가로로 2배 복사
      topRow.push(val, val);
      bottomRow.push(val, val);
    }
    // 세로로 2줄 추가
    newGrid.push(topRow, bottomRow);
  }
  return newGrid;
}

// 시작점과 도착점 찾기
function findPoints(grid) {
  let start = null;
  let end = null;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === 3 && !start) start = [r, c];
      if (grid[r][c] === 4 && !end) end = [r, c];
    }
  }
  if (!start || !end) throw new Error("시작점(3) 또는 도착점(4)이 없습니다.");
  return { start, end };
}

// 휴리스틱 (맨해튼 거리)
function manhattan(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

// 좌표를 문자열 키로 변환 (Map 사용 위함)
const toKey = (pos) => `${pos[0]},${pos[1]}`;
const fromKey = (key) => key.split(",").map(Number);

// A* 알고리즘 핵심
function findPathAStar(grid) {
  const { start, end } = findPoints(grid);
  const rows = grid.length;
  const cols = grid[0].length;

  // 우선순위 큐 (간단하게 배열로 구현, fScore 기준 정렬)
  // 요소 구조: { f, g, pos: [r, c] }
  let openSet = [{ f: 0, g: 0, pos: start }];

  const cameFrom = new Map(); // 경로 추적용
  const gScore = new Map(); // 시작점부터의 거리 비용

  gScore.set(toKey(start), 0);

  while (openSet.length > 0) {
    // fScore가 가장 낮은 노드를 꺼냄 (오름차순 정렬 후 shift)
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    const [cr, cc] = current.pos;

    // 도착?
    if (cr === end[0] && cc === end[1]) {
      return reconstructPath(cameFrom, current.pos);
    }

    // 상하좌우 이웃 탐색
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
    ];

    for (let [dr, dc] of directions) {
      const nr = cr + dr;
      const nc = cc + dc;
      const nextPos = [nr, nc];
      const nextKey = toKey(nextPos);

      // 맵 범위 체크 및 통행 가능 여부 확인
      if (
        nr >= 0 && nr < rows &&
        nc >= 0 && nc < cols &&
        PASSABLE.has(grid[nr][nc])
      ) {
        const tentativeG = current.g + 1;
        const currentG = gScore.get(nextKey) ?? Infinity;

        if (tentativeG < currentG) {
          // 최적의 경로 발견
          cameFrom.set(nextKey, toKey(current.pos));
          gScore.set(nextKey, tentativeG);
          
          const f = tentativeG + manhattan(nextPos, end);
          
          // openSet에 없으면 추가 (이미 있으면 갱신해야 하지만, 간단히 중복 허용해도 됨)
          openSet.push({ f, g: tentativeG, pos: nextPos });
        }
      }
    }
  }
  return []; // 경로 못 찾음
}

// 경로 역추적 함수
function reconstructPath(cameFrom, current) {
  const totalPath = [current];
  let currKey = toKey(current);

  while (cameFrom.has(currKey)) {
    const prevKey = cameFrom.get(currKey);
    const prevPos = fromKey(prevKey);
    totalPath.push(prevPos);
    currKey = prevKey;
  }
  return totalPath.reverse(); // 시작 -> 끝 순서로 뒤집기
}

/**
 * RC카 컴포넌트
 */
function RCCarModel({ path }) { 
  const meshRef = useRef();
  const [targetIndex, setTargetIndex] = useState(1); 
  const SPEED = 2.0; 

  useFrame((state, delta) => {
    if (!meshRef.current || !path || path.length === 0) return;
    if (targetIndex >= path.length) return; // 도착하면 멈춤

    const currentPos = meshRef.current.position;
    
    // path 데이터가 [x, y, z] 배열이라고 가정
    const targetCoord = path[targetIndex]; 
    const targetVec = new THREE.Vector3(targetCoord[0], targetCoord[1], targetCoord[2]);

    const distance = currentPos.distanceTo(targetVec);

    if (distance < 0.1) {
      setTargetIndex((prev) => prev + 1); // 다음 목표로
    } else {
      // 이동 방향 계산
      const direction = new THREE.Vector3()
        .subVectors(targetVec, currentPos)
        .normalize();
      
      // 이동 실행
      meshRef.current.position.add(direction.multiplyScalar(SPEED * delta));
      
      // 자동차가 진행 방향을 바라보게 하려면?
      meshRef.current.lookAt(targetVec); 
    }
  });
  
  // 경로 데이터가 없으면 아무것도 안 그림
  if (!path || path.length === 0) {
    return null; 
  }

  // 남은 경로만 계산하기
  // targetIndex는 "지금 가고 있는 목표"입니다.
  // 따라서 (targetIndex - 1)은 "방금 출발한 곳"입니다.
  // 거기서부터 끝까지만 잘라내면(slice), 내 뒤쪽 길은 배열에서 삭제되어 안 그려집니다.
  const remainingPath = path.slice(Math.max(0, targetIndex - 1));

  return (
    <>
      <mesh 
        ref={meshRef} 
        // 계산된 경로의 '첫 번째 좌표'에서 시작합니다. (맵 배열의 '3' 위치가 자동으로 여기 들어옵니다)
        position={path[0]} 
      >
        <sphereGeometry args={[0.5]} /> 
        <meshStandardMaterial color={0x007bff} />
      </mesh>

      <Line
        points={remainingPath}    // 전체 path가 아니라 '남은 길'만 넣음
        color="red"               // 선 색상
        lineWidth={4}             // 선 두께
        position={[0, -0.45, 0]}  // 바닥에 딱 붙게 높이 조절
      />
    </>
  );
}

/**
 * 호수 컴포넌트
 */
function Lake({ position }) {
  // 물 재질 공통 설정
  const waterMaterial = (
    <meshStandardMaterial 
      color="#a4c7e5"   // 하늘색
      roughness={0.1}   // 매끈하게
      metalness={0.1}   // 약간 반짝임
      transparent       // 투명 켜기
      opacity={0.8}     // 약간 투명하게 (바닥이 살짝 비침)
    />
  );

  return (
  <group position={position}>
    {/* 1. 메인 덩어리 */}
    <mesh 
      position={[0, 0.1, 0]}
      
      /* [가로비율, 높이비율, 세로비율] */
      scale={[1, 1, 1.7]} 
    >
      {/* 원래 도형 (반지름 1.5인 원) */}
      <cylinderGeometry args={[1.5, 1.5, 0.15, 12]} />
      {waterMaterial}
    </mesh>
  </group>
);
}

/**
 * 물체 컴포넌트
 */
function Object({ position, size, color = "#d2d3d1" }) {
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
  // 사용될 색상 정의
  const BUILDING_COLOR = '#E0E0E0'; // 건물 색
  const GRASS_COLOR = '#E1F0C4'; // 연한 연두색 잔디 
  const GRASS_THICKNESS = 0.1; // 잔디 블록의 높이

  const finalPath = useMemo(() => {
    console.log("A* 알고리즘 경로 계산 중...");

    // 1. 맵 확대 (20cm -> 10cm)
    const bigGrid = upscaleGrid(rawMapData);

    // 2. 알고리즘으로 길 찾기
    const gridPath = findPathAStar(bigGrid);

    // 3. 그리드 좌표(row, col)를 3D 좌표(x, y, z)로 변환
    const xOffset = -5.45;  // 좌우 위치 조절 
    const zOffset = -8;  // 위아래 위치 조절

    return gridPath.map(([row, col]) => {
      return [
        col + xOffset, // x축 (가로)
        0.5,           // y축 (높이: 공 반지름)
        row + zOffset  // z축 (세로)
      ];
    });
  }, []); // 한 번만 계산

  return (
    <Canvas camera={{ position: [0, 30, 0], fov: 45}}>
      {/* 조명 설정 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[1, 2, 3]} intensity={1} />
      
      {/* 마우스로 지도를 둘러볼 수 있게 해줌 */}
      <OrbitControls />

      {/* ⬜ 바닥 (회색 아크릴 판) */}
      <mesh position-y={0} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[12, 18]} />
        <meshStandardMaterial color="#bbbbbb" />
      </mesh>

      {/* 🚗 RC카 */}
      <RCCarModel path={finalPath} />

      {/* 🌳 지형지물 (잔디밭 구현) */}
      
      {/* 위쪽 구역 잔디 */}
      <Object position={[-1, 0, -8]} size={[10, GRASS_THICKNESS, 2]} color={GRASS_COLOR} />

      {/* 중앙 구역 잔디 */}
      <Object position={[0, 0, -4]} size={[8, GRASS_THICKNESS, 2]} color={GRASS_COLOR} />
      <Object position={[-3, 0, 2]} size={[2, GRASS_THICKNESS, 6]} color={GRASS_COLOR} />
      <Object position={[2, 0, 2]} size={[4, GRASS_THICKNESS, 6]} color={GRASS_COLOR} />
      
      {/* 아래쪽 구역 잔디 (RC카 경로 옆) */}
      <Object position={[-1, 0, 8]} size={[10, GRASS_THICKNESS, 2]} color={GRASS_COLOR} />



      {/* 건물 구현 */}
      <Object position={[3, 0, -4]} size={[1, 1.3, 0.7]} color = {BUILDING_COLOR} />
      <Object position={[-0.5, 0, -4]} size={[0.7, 1, 0.5]} color = {BUILDING_COLOR} />
      <Object position={[-3, 0, -4]} size={[0.7, 1, 0.5]} color = {BUILDING_COLOR} />

      <Object position={[-3, 0, 0]} size={[0.5, 1, 0.7]} color = {BUILDING_COLOR} />
      <Object position={[-3, 0, 2]} size={[1, 1.7, 1]} color = {BUILDING_COLOR} />
      <Object position={[-3, 0, 3.8]} size={[1, 1.7, 1]} color = {BUILDING_COLOR} />

      <Object position={[-5, 0, 8]} size={[0.8, 2, 1.4]} color = {BUILDING_COLOR} />
      <Object position={[-4, 0, 8.4]} size={[1.2, 2, 0.6]} color = {BUILDING_COLOR} />

      <Object position={[-2, 0, 8.4]} size={[1.2, 2, 0.6]} color = {BUILDING_COLOR} />
      <Object position={[-1, 0, 8]} size={[0.8, 2, 1.4]} color = {BUILDING_COLOR} />

      <Object position={[2, 0, 8]} size={[1.5, 1.3, 1]} color = {BUILDING_COLOR} />


      {/* 호수 구현 */}
      <Lake position={[2, 0, 2]} />

    </Canvas>
  );
}