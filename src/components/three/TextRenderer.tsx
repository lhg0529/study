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
  position?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  onRotationChange?: (rotation: { x: number; y: number; z: number }) => void
}

const TextRenderer: React.FC<TextRendererProps> = ({
  textStream = '',
  fontSize = 0.5,
  color = '#ffffff',
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 },
  onRotationChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const textMeshRef = useRef<THREE.Mesh | null>(null)
  const fontRef = useRef<Font | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  // 현재 회전 상태를 ref로 저장하여 불필요한 업데이트 방지
  const currentRotationRef = useRef(rotation)

  // 초기 설정
  useEffect(() => {
    if (sceneRef.current) {
      return
    }

    // 씬 생성
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x121212)
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
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(
      containerRef.current?.clientWidth || window.innerWidth,
      containerRef.current?.clientHeight || window.innerHeight
    )
    containerRef.current?.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 조명 추가
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
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
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return

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
    controls.enableZoom = false // 확대/축소 비활성화 (텍스트 회전만)
    controls.enablePan = false // 이동 비활성화 (텍스트 회전만)

    // 마우스 상태 이벤트 리스너
    controls.addEventListener('start', () => setIsDragging(true))

    // 드래그가 끝났을 때만 회전 상태 업데이트
    controls.addEventListener('end', () => {
      setIsDragging(false)

      // 드래그가 끝났을 때만 부모 컴포넌트에 회전 상태 전달
      if (textMeshRef.current && onRotationChange) {
        const newRotation = {
          x: textMeshRef.current.rotation.x,
          y: textMeshRef.current.rotation.y,
          z: textMeshRef.current.rotation.z,
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

    // 애니메이션 루프
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update() // 컨트롤 업데이트
      rendererRef.current?.render(scene, camera)
    }
    animate()

    // 컴포넌트 언마운트 시 정리
    return () => {
      window.removeEventListener('resize', handleResize)
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
      controlsRef.current?.dispose()
      renderer.dispose()
      scene.clear()
    }
  }, [])

  // 텍스트가 변경될 때마다 업데이트
  useEffect(() => {
    if (isLoading || !fontRef.current) return

    const scene = sceneRef.current
    if (!scene) return

    // 이전 텍스트 메시 제거
    if (textMeshRef.current) {
      scene.remove(textMeshRef.current)
      textMeshRef.current.geometry.dispose()
      if (textMeshRef.current.material instanceof THREE.Material) {
        textMeshRef.current.material.dispose()
      } else if (Array.isArray(textMeshRef.current.material)) {
        textMeshRef.current.material.forEach(material => material.dispose())
      }
    }

    // 새 텍스트 생성
    const textGeometry = new TextGeometry(textStream, {
      font: fontRef.current,
      size: fontSize,
      depth: 0.1, // height 대신 depth 사용
      curveSegments: 12,
      bevelEnabled: false,
    })

    textGeometry.computeBoundingBox()

    // 텍스트 전체의 중앙이 화면 중앙에 오도록 계산
    let centerOffsetX = 0
    let centerOffsetY = 0

    if (textGeometry.boundingBox) {
      // X축 중앙 오프셋 (텍스트 너비의 중앙이 (0,0,0)에 오도록)
      centerOffsetX = -(textGeometry.boundingBox.min.x + textGeometry.boundingBox.max.x) / 2

      // Y축 중앙 오프셋 (텍스트 높이의 중앙이 (0,0,0)에 오도록)
      centerOffsetY = -(textGeometry.boundingBox.min.y + textGeometry.boundingBox.max.y) / 2
    }

    const material = new THREE.MeshStandardMaterial({ color })
    const textMesh = new THREE.Mesh(textGeometry, material)

    // 텍스트 중앙 정렬을 위한 위치 설정
    textMesh.position.x = centerOffsetX + position.x
    textMesh.position.y = centerOffsetY + position.y
    textMesh.position.z = position.z

    // 회전 설정
    textMesh.rotation.x = rotation.x
    textMesh.rotation.y = rotation.y
    textMesh.rotation.z = rotation.z

    // 현재 회전 상태 업데이트
    currentRotationRef.current = rotation

    // OrbitControls 타겟 설정 - 텍스트의 중심을 회전 중심으로 설정
    if (controlsRef.current) {
      controlsRef.current.target.set(position.x, position.y, position.z)
      controlsRef.current.update()
    }

    scene.add(textMesh)
    textMeshRef.current = textMesh
  }, [textStream, fontSize, color, position, rotation, isLoading])

  return (
    <div
      className={`three-text-renderer ${isDragging ? 'dragging' : ''}`}
      ref={containerRef}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {isLoading && <div className="three-text-renderer__loading">폰트 로딩 중...</div>}
      <div className="three-text-renderer__instructions">텍스트를 클릭하고 드래그하여 회전</div>
    </div>
  )
}

export default TextRenderer
