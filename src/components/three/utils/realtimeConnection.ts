type MessageCallback = (text: string) => void
type ErrorCallback = (error: Event) => void

/**
 * 실시간 텍스트 메시지를 위한 WebSocket 연결을 설정합니다.
 * 
 * @param url WebSocket 서버 URL
 * @param onMessage 메시지 수신 시 호출할 콜백
 * @param onError 오류 발생 시 호출할 콜백 (선택사항)
 * @returns WebSocket 연결 정리 함수
 */
export const connectToTextStream = (
  url: string,
  onMessage: MessageCallback,
  onError?: ErrorCallback
): () => void => {
  // WebSocket 연결 생성
  const socket = new WebSocket(url)
  
  // 연결 설정 시 호출
  socket.onopen = () => {
    console.log('WebSocket 연결이 설정되었습니다.')
  }
  
  // 메시지 수신 시 호출
  socket.onmessage = (event) => {
    try {
      // 서버의 응답 형식에 따라 적절히 파싱
      const data = JSON.parse(event.data)
      if (data && typeof data.text === 'string') {
        onMessage(data.text)
      }
    } catch (err) {
      console.error('메시지 파싱 중 오류:', err)
      // 텍스트 메시지인 경우 직접 사용
      if (typeof event.data === 'string') {
        onMessage(event.data)
      }
    }
  }
  
  // 오류 발생 시 호출
  socket.onerror = (error) => {
    console.error('WebSocket 오류:', error)
    if (onError) {
      onError(error)
    }
  }
  
  // 연결 종료 시 호출
  socket.onclose = () => {
    console.log('WebSocket 연결이 종료되었습니다.')
  }
  
  // 정리 함수 반환
  return () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.close()
    }
  }
}

/**
 * 테스트용 모의 실시간 연결
 * 실제 WebSocket 서버 없이 테스트할 때 사용
 */
export const mockTextStreamConnection = (
  onMessage: MessageCallback,
  interval = 3000,
  messages = [
    '안녕하세요!',
    '실시간 텍스트 렌더링 예제입니다.',
    'Three.js를 사용하여 3D 텍스트를 표시합니다.',
    'Pretendard 폰트를 사용합니다.',
    '실시간으로 메시지가 갱신됩니다.'
  ]
): () => void => {
  let index = 0
  const intervalId = setInterval(() => {
    onMessage(messages[index])
    index = (index + 1) % messages.length
  }, interval)
  
  return () => clearInterval(intervalId)
} 