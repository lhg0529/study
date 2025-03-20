import { useEffect, useState } from 'react'
import TextRenderer from './TextRenderer'
import { mockTextStreamConnection } from './utils/realtimeConnection'

interface RealtimeTextDemoProps {
  fontSize?: number
  color?: string
  websocketUrl?: string
}

// 텍스트 스타일 인터페이스 정의
interface TextStyle {
  fontSize: number
  color: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
}

const RealtimeTextDemo: React.FC<RealtimeTextDemoProps> = ({
  fontSize = 0.4,
  color = '#ffffff',
  websocketUrl
}) => {
  const [text, setText] = useState<string>('')
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  
  // 텍스트 스타일 상태 추가
  const [textStyle, setTextStyle] = useState<TextStyle>({
    fontSize,
    color,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  })
  
  useEffect(() => {
    // 실시간 연결 설정
    let cleanup
    
    // 실제 WebSocket URL이 제공된 경우 WebSocket 연결 사용
    // 그렇지 않으면 모의 연결 사용
    if (websocketUrl) {
      // 실제 서비스에서는 connectToTextStream 사용
      // cleanup = connectToTextStream(
      //   websocketUrl,
      //   (newText) => {
      //     setText(newText)
      //     setConnectionStatus('connected')
      //     console.log('새 메시지 수신:', newText)
      //   },
      //   () => setConnectionStatus('error')
      // )
      
      // 예제에서는 모의 연결 사용
      cleanup = mockTextStreamConnection(
        (newText) => {
          setText(newText)
          setConnectionStatus('connected')
          console.log('새 메시지 수신:', newText)
        }
      )
    } else {
      // WebSocket URL이 없는 경우 모의 연결 사용
      cleanup = mockTextStreamConnection(
        (newText) => {
          setText(newText)
          setConnectionStatus('connected')
          console.log('새 메시지 수신:', newText)
        }
      )
    }
    
    return cleanup
  }, [websocketUrl])
  
  return (
    <div className="three-realtime-demo">
      <h3 className="three-realtime-demo__title">실시간 3D 텍스트</h3>
      
      <div className="three-realtime-demo__status">
        {connectionStatus === 'connecting' && (
          <span className="connecting">연결 중...</span>
        )}
        {connectionStatus === 'connected' && (
          <span className="connected">연결됨</span>
        )}
        {connectionStatus === 'error' && (
          <span className="error">연결 오류</span>
        )}
      </div>
      
      <TextRenderer 
        textStream={text}
        fontSize={textStyle.fontSize}
        color={textStyle.color}
        position={textStyle.position}
        rotation={textStyle.rotation}
        onRotationChange={(newRotation) => {
          setTextStyle(prev => ({
            ...prev,
            rotation: newRotation
          }))
        }}
      />
      
      <div className="three-realtime-demo__current-text">
        <p>현재 텍스트: <strong>{text || '대기 중...'}</strong></p>
      </div>
      
      {/* 텍스트 컨트롤러 UI */}
      <div className="text-controllers">
        <h4>텍스트 컨트롤러</h4>
        
        {/* 글자 크기 컨트롤러 */}
        <div className="controller-group">
          <label>
            글자 크기: {textStyle.fontSize.toFixed(1)}
            <input 
              type="range" 
              min="0.1" 
              max="2" 
              step="0.1" 
              value={textStyle.fontSize} 
              onChange={(e) => setTextStyle(prev => ({
                ...prev,
                fontSize: parseFloat(e.target.value)
              }))}
            />
          </label>
        </div>
        
        {/* 색상 컨트롤러 */}
        <div className="controller-group">
          <label>
            색상:
            <input 
              type="color" 
              value={textStyle.color} 
              onChange={(e) => setTextStyle(prev => ({
                ...prev,
                color: e.target.value
              }))}
            />
          </label>
        </div>
        
        {/* 위치 컨트롤러 */}
        <div className="controller-group">
          <h5>위치</h5>
          <div className="position-controls">
            <label>
              X: {textStyle.position.x.toFixed(1)}
              <input 
                type="range" 
                min="-5" 
                max="5" 
                step="0.1" 
                value={textStyle.position.x} 
                onChange={(e) => setTextStyle(prev => ({
                  ...prev,
                  position: {
                    ...prev.position,
                    x: parseFloat(e.target.value)
                  }
                }))}
              />
            </label>
            <label>
              Y: {textStyle.position.y.toFixed(1)}
              <input 
                type="range" 
                min="-5" 
                max="5" 
                step="0.1" 
                value={textStyle.position.y} 
                onChange={(e) => setTextStyle(prev => ({
                  ...prev,
                  position: {
                    ...prev.position,
                    y: parseFloat(e.target.value)
                  }
                }))}
              />
            </label>
            <label>
              Z: {textStyle.position.z.toFixed(1)}
              <input 
                type="range" 
                min="-5" 
                max="5" 
                step="0.1" 
                value={textStyle.position.z} 
                onChange={(e) => setTextStyle(prev => ({
                  ...prev,
                  position: {
                    ...prev.position,
                    z: parseFloat(e.target.value)
                  }
                }))}
              />
            </label>
          </div>
        </div>
        
        {/* 회전 컨트롤러 */}
        <div className="controller-group">
          <h5>회전 (라디안)</h5>
          <div className="rotation-controls">
            <label>
              X: {textStyle.rotation.x.toFixed(1)}
              <input 
                type="range" 
                min="-3.14" 
                max="3.14" 
                step="0.1" 
                value={textStyle.rotation.x} 
                onChange={(e) => setTextStyle(prev => ({
                  ...prev,
                  rotation: {
                    ...prev.rotation,
                    x: parseFloat(e.target.value)
                  }
                }))}
              />
            </label>
            <label>
              Y: {textStyle.rotation.y.toFixed(1)}
              <input 
                type="range" 
                min="-3.14" 
                max="3.14" 
                step="0.1" 
                value={textStyle.rotation.y} 
                onChange={(e) => setTextStyle(prev => ({
                  ...prev,
                  rotation: {
                    ...prev.rotation,
                    y: parseFloat(e.target.value)
                  }
                }))}
              />
            </label>
            <label>
              Z: {textStyle.rotation.z.toFixed(1)}
              <input 
                type="range" 
                min="-3.14" 
                max="3.14" 
                step="0.1" 
                value={textStyle.rotation.z} 
                onChange={(e) => setTextStyle(prev => ({
                  ...prev,
                  rotation: {
                    ...prev.rotation,
                    z: parseFloat(e.target.value)
                  }
                }))}
              />
            </label>
          </div>
        </div>
        
        {/* 초기화 버튼 */}
        <button 
          className="reset-button"
          onClick={() => setTextStyle({
            fontSize: 0.4,
            color: '#ffffff',
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
          })}
        >
          초기화
        </button>
      </div>
    </div>
  )
}

// 컨트롤러용 스타일 추가
const style = document.createElement('style')
style.textContent = `
  .text-controllers {
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 15px;
    border-radius: 8px;
    margin-top: 20px;
    max-width: 400px;
    margin: 20px auto;
  }
  
  .three-text-renderer {
    position: relative;
    width: 100%;
    height: 400px;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .three-text-renderer__instructions {
    position: absolute;
    bottom: 10px;
    left: 0;
    right: 0;
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    background-color: rgba(0, 0, 0, 0.5);
    padding: 5px;
    font-size: 14px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .three-text-renderer:hover .three-text-renderer__instructions {
    opacity: 1;
  }
  
  .controller-group {
    margin-bottom: 15px;
  }
  
  .controller-group h5 {
    margin: 5px 0;
  }
  
  .controller-group label {
    display: flex;
    flex-direction: column;
    margin-bottom: 5px;
  }
  
  .position-controls, .rotation-controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  
  input[type="range"] {
    width: 100%;
    margin-top: 5px;
  }
  
  input[type="color"] {
    width: 50px;
    height: 30px;
    margin-top: 5px;
  }
  
  .reset-button {
    background-color: #4a4a4a;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
  }
  
  .reset-button:hover {
    background-color: #5a5a5a;
  }
`
document.head.appendChild(style)

export default RealtimeTextDemo
