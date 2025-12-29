import { memo, useEffect, useRef } from 'react';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

function GestureController({
  onGesture,
  onMove,
  onStatus,
  debugMode
}: {
  onGesture: (s: 'CHAOS' | 'FORMED') => void;
  onMove: (speed: number) => void;
  onStatus: (msg: string) => void;
  debugMode: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let gestureRecognizer: GestureRecognizer;
    let requestRef: number;
    let lastHandX = 0.5;
    let smoothedSpeed = 0;
    let lastUpdateTime = Date.now();
    const SPEED_MULTIPLIER = 0.4;
    const DEAD_ZONE = 0.2;
    const MIN_SPEED = 0.008;
    const ROTATION_SMOOTH = 3.0;

    const setup = async () => {
      onStatus('LOADING AI...');
      try {
        const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/mediapipe/models/gesture_recognizer.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1
        });
        onStatus('REQUESTING CAMERA...');
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            onStatus('AI READY: SHOW HAND');
            predictWebcam();
          }
        } else {
          onStatus('ERROR: CAMERA PERMISSION DENIED');
        }
      } catch (err: any) {
        onStatus(`ERROR: ${err.message || 'MODEL FAILED'}`);
      }
    };

    const predictWebcam = () => {
      if (gestureRecognizer && videoRef.current && canvasRef.current) {
        if (videoRef.current.videoWidth > 0) {
          const results = gestureRecognizer.recognizeForVideo(videoRef.current, Date.now());
          const ctx = canvasRef.current.getContext('2d');
          const currentTime = Date.now();
          const deltaTime = Math.max(currentTime - lastUpdateTime, 1) / 1000;
          if (ctx && debugMode) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            if ((results as any).landmarks)
              for (const landmarks of (results as any).landmarks) {
                const drawingUtils = new DrawingUtils(ctx);
                drawingUtils.drawConnectors(landmarks, (GestureRecognizer as any).HAND_CONNECTIONS, { color: '#FFD700', lineWidth: 2 });
                drawingUtils.drawLandmarks(landmarks, { color: '#FF0000', lineWidth: 1 });
              }
          } else if (ctx && !debugMode) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          if ((results as any).gestures.length > 0) {
            const name = (results as any).gestures[0][0].categoryName;
            const score = (results as any).gestures[0][0].score;
            if (score > 0.4) {
              if (name === 'Open_Palm') onGesture('CHAOS');
              if (name === 'Closed_Fist') onGesture('FORMED');
              if (debugMode) onStatus(`DETECTED: ${name}`);
            }
            if ((results as any).landmarks.length > 0) {
              const currentHandX = (results as any).landmarks[0][0].x;
              const normalizedX = (currentHandX - 0.5) * 2;
              let targetSpeed = 0;
              if (Math.abs(normalizedX) > DEAD_ZONE) {
                const effectiveX = normalizedX > 0 ? (normalizedX - DEAD_ZONE) / (1 - DEAD_ZONE) : (normalizedX + DEAD_ZONE) / (1 - DEAD_ZONE);
                const curvedX = Math.sign(effectiveX) * Math.pow(Math.abs(effectiveX), 0.8);
                targetSpeed = -curvedX * SPEED_MULTIPLIER * Math.PI * 0.9;
              }
              smoothedSpeed += (targetSpeed - smoothedSpeed) * ROTATION_SMOOTH * deltaTime;
              const finalSpeed = Math.abs(smoothedSpeed) > MIN_SPEED ? smoothedSpeed : 0;
              onMove(finalSpeed);
              lastHandX = currentHandX;
              lastUpdateTime = currentTime;
              if (debugMode) onStatus(`SPEED: ${finalSpeed.toFixed(3)} | X: ${currentHandX.toFixed(2)}`);
            }
          } else {
            smoothedSpeed += (0 - smoothedSpeed) * ROTATION_SMOOTH * 0.016;
            const finalSpeed = Math.abs(smoothedSpeed) > MIN_SPEED ? smoothedSpeed : 0;
            onMove(finalSpeed);
            lastHandX = 0.5;
            if (debugMode) onStatus('AI READY: NO HAND');
          }
        }
        requestRef = requestAnimationFrame(predictWebcam);
      }
    };
    setup();
    return () => cancelAnimationFrame(requestRef);
  }, [onGesture, onMove, onStatus, debugMode]);

  return (
    <>
      <video
        ref={videoRef}
        style={{
          opacity: debugMode ? 0.6 : 0,
          position: 'fixed',
          top: 0,
          right: 0,
          width: debugMode ? '320px' : '1px',
          zIndex: debugMode ? 100 : -1,
          pointerEvents: 'none',
          transform: 'scaleX(-1)'
        }}
        playsInline
        muted
        autoPlay
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: debugMode ? '320px' : '1px',
          height: debugMode ? 'auto' : '1px',
          zIndex: debugMode ? 101 : -1,
          pointerEvents: 'none',
          transform: 'scaleX(-1)'
        }}
      />
    </>
  );
}

export default memo(GestureController);
