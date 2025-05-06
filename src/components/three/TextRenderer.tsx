import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js'

interface TextRendererProps {
  textStream?: string
  fontSize?: number
  color?: string
  backgroundColor?: string
  position?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  onRotationChange?: (rotation: { x: number; y: number; z: number }) => void
  waveAnimation?: boolean
}

const TextRenderer: React.FC<TextRendererProps> = ({
  textStream = 'Hello world! This is Text Renderer example.',
  fontSize = 0.3,
  color = '#000000', // 검정색 텍스트
  backgroundColor = '#FFFF00', // 노란색 배경
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 },
  onRotationChange,
  waveAnimation = true, // 기본적으로 물결 애니메이션 활성화
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const textMeshesRef = useRef<THREE.Mesh[]>([]) // 개별 글자 메시 배열
  const fontRef = useRef<Font | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const animationFrameRef = useRef<number | null>(null)

  // 현재 회전 상태를 ref로 저장하여 불필요한 업데이트 방지
  const currentRotationRef = useRef(rotation)

  // 초기 설정
  useEffect(() => {
    if (sceneRef.current) {
      return
    }

    // 씬 생성
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(backgroundColor) // 배경색 설정
    sceneRef.current = scene

    // 카메라 생성
    const camera = new THREE.PerspectiveCamera(
      75, // 시야각
      window.innerWidth / window.innerHeight, // 종횡비
      0.1, // 가까운 제한
      1000 // 멀리 제한
    )
    camera.position.z = 5
    cameraRef.current = camera

    // 렌더러 생성
    const renderer = new THREE.WebGLRenderer({ antialias: true }) // 안티앨리어싱
    renderer.setSize(
      containerRef.current?.clientWidth ?? window.innerWidth,
      containerRef.current?.clientHeight ?? window.innerHeight
    )
    containerRef.current?.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 조명 추가
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)

    // 폰트 로드
    const fontLoader = new FontLoader()
    fontLoader.load('/font/Pretendard Variable_Regular.json', font => {
      fontRef.current = font
      setIsLoading(false)
    })

    // 창 크기 변경 처리
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) {
        return
      }

      cameraRef.current.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight
      cameraRef.current.updateProjectionMatrix()

      rendererRef.current.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      )
    }

    window.addEventListener('resize', handleResize)

    // OrbitControls 설정
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true // 부드러운 회전을 위해 댐핑 활성화
    controls.dampingFactor = 0.05
    controls.rotateSpeed = 0.5
    controls.enableZoom = true // 확대/축소 활성화
    controls.enablePan = false // 이동 비활성화 (텍스트 회전만)

    // 마우스 상태 이벤트 리스너
    controls.addEventListener('start', () => setIsDragging(true))

    // 드래그가 끝났을 때만 회전 상태 업데이트
    controls.addEventListener('end', () => {
      setIsDragging(false)

      // 드래그가 끝났을 때만 부모 컴포넌트에 회전 상태 전달
      if (textMeshesRef.current.length > 0 && onRotationChange) {
        // 첫 번째 메시의 회전을 기준으로 사용
        const firstMesh = textMeshesRef.current[0]
        const newRotation = {
          x: firstMesh.rotation.x,
          y: firstMesh.rotation.y,
          z: firstMesh.rotation.z,
        }

        // 회전 상태가 실제로 변경되었을 때만 업데이트
        const currentRotation = currentRotationRef.current
        if (
          newRotation.x !== currentRotation.x ||
          newRotation.y !== currentRotation.y ||
          newRotation.z !== currentRotation.z
        ) {
          currentRotationRef.current = newRotation
          onRotationChange(newRotation)
        }
      }
    })

    controlsRef.current = controls

    return () => {
      window.removeEventListener('resize', handleResize)
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
      controlsRef.current?.dispose()
      renderer.dispose()
      scene.clear()

      // 애니메이션 프레임 정리
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [backgroundColor])

  // 애니메이션 업데이트 함수
  const updateAnimation = useCallback(() => {
    const time = Date.now() * 0.001 // 시간을 초 단위로 변환
    const totalDuration = textMeshesRef.current.length * 0.1 // 전체 애니메이션 사이클 시간 (글자 수에 비례)
    const cycleTime = time % totalDuration // 현재 사이클 내의 시간
    
    // 각 글자에 파도 애니메이션 적용
    textMeshesRef.current.forEach((mesh, index) => {
      if (waveAnimation) {
        // 각 글자별 애니메이션 타이밍 계산
        const startTime = index * 0.1 // 글자 시작 딜레이 (100ms 간격)
        const endTime = startTime + 0.2 // 해당 글자 애니메이션 종료 시간 (200ms 동안 진행)
        
        // 현재 글자의 애니메이션 진행 상황 계산 (0~1)
        let progress = 0
        
        if (cycleTime >= startTime && cycleTime < endTime) {
          // 애니메이션 활성화 구간
          progress = (cycleTime - startTime) / 0.2 // 0~1 사이 값
          
          // 0->1->0 곡선 (위로 올라갔다 내려오는 형태)
          if (progress <= 0.5) {
            // 올라가는 구간 (0~0.5 -> 0~1)
            progress = progress * 2
          } else {
            // 내려오는 구간 (0.5~1 -> 1~0)
            progress = 2 - (progress * 2)
          }
          
          // 위치 변경 - 최대 이동 거리는 fontSize의 2배
          const moveAmount = fontSize * 2 * progress
          mesh.position.y = mesh.userData.originalY + moveAmount
        } else {
          // 애니메이션 비활성화 구간 - 원래 위치로
          mesh.position.y = mesh.userData.originalY
        }
      }
    })

    // 렌더링
    if (sceneRef.current && cameraRef.current && rendererRef.current) {
      controlsRef.current?.update()
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }

    // 애니메이션 프레임 요청
    animationFrameRef.current = requestAnimationFrame(updateAnimation)
  }, [waveAnimation, fontSize])

  // 텍스트가 변경될 때마다 업데이트
  useEffect(() => {
    if (isLoading || !fontRef.current) {
      return
    }

    const scene = sceneRef.current
    if (!scene) {
      return
    }

    // 이전 텍스트 메시 제거
    textMeshesRef.current.forEach(mesh => {
      scene.remove(mesh)
      mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      } else if (Array.isArray(mesh.material)) {
        mesh.material.forEach(material => material.dispose())
      }
    })
    textMeshesRef.current = []

    // 텍스트의 전체 너비를 계산하기 위한 임시 geometry
    let totalWidth = 0
    let maxHeight = 0
    const tempGeometries: { geometry: THREE.BufferGeometry; width: number }[] = []

    // 각 글자별로 geometry 생성 및 너비 계산
    const charArray = Array.from(textStream)

    charArray.forEach(char => {
      // 공백 문자 처리
      if (char === ' ') {
        totalWidth += fontSize * 0.5 // 공백의 너비 추정
        tempGeometries.push({ geometry: new THREE.BufferGeometry(), width: fontSize * 0.5 })
        return
      }

      const geometry = new TextGeometry(char, {
        font: fontRef.current!,
        size: fontSize,
        depth: fontSize * 0.2, // 깊이는 크기의 20%
        curveSegments: 12,
        bevelEnabled: false,
      })

      geometry.computeBoundingBox()

      if (geometry.boundingBox) {
        const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x
        const height = geometry.boundingBox.max.y - geometry.boundingBox.min.y

        totalWidth += width + fontSize * 0.05 // 글자 간격 추가
        maxHeight = Math.max(maxHeight, height)

        tempGeometries.push({ geometry, width })
      }
    })

    // 글자 위치 계산 및 메시 생성
    let currentX = -totalWidth / 2 // 중앙 정렬을 위해 시작 위치 조정

    tempGeometries.forEach((item, index) => {
      if (charArray[index] === ' ') {
        currentX += item.width
        return
      }

      const material = new THREE.MeshStandardMaterial({ color })
      const mesh = new THREE.Mesh(item.geometry, material)

      // 위치 설정
      mesh.position.x = currentX + position.x
      mesh.position.y = position.y
      mesh.position.z = position.z

      // 원래 Y 위치 저장 (애니메이션용)
      mesh.userData.originalY = position.y
      mesh.userData.index = index

      // 회전 설정
      mesh.rotation.x = rotation.x
      mesh.rotation.y = rotation.y
      mesh.rotation.z = rotation.z

      currentX += item.width + fontSize * 0.05 // 다음 글자 위치로 이동

      scene.add(mesh)
      textMeshesRef.current.push(mesh)
    })

    // OrbitControls 타겟 설정
    if (controlsRef.current) {
      controlsRef.current.target.set(position.x, position.y, position.z)
      controlsRef.current.update()
    }

    // 기존 애니메이션 프레임 취소 후 새 애니메이션 시작
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(updateAnimation)
  }, [textStream, fontSize, color, position, rotation, isLoading, updateAnimation])

  return (
    <div
      className={`three-text-renderer ${isDragging ? 'dragging' : ''}`}
      ref={containerRef}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        width: '100%',
        height: '400px', // 높이 설정
        position: 'relative',
      }}
    >
      {isLoading && (
        <div
          className="three-text-renderer__loading"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#000',
            fontSize: '16px',
          }}
        >
          폰트 로딩 중...
        </div>
      )}
      <div
        className="three-text-renderer__instructions"
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#000',
          fontSize: '14px',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          padding: '5px 10px',
          borderRadius: '5px',
        }}
      >
        텍스트를 클릭하고 드래그하여 회전
      </div>
    </div>
  )
}

export default TextRenderer
