import React, { useEffect, useRef, useState } from 'react';
import { AudioState } from '../types';

interface AvatarTeacherProps {
  script: string;
  audioBuffer: AudioBuffer | null;
  audioContext: AudioContext | null;
  onAudioFinish: () => void;
  shouldPlay: boolean;
}

const AvatarTeacher: React.FC<AvatarTeacherProps> = ({ 
  script, 
  audioBuffer, 
  audioContext, 
  onAudioFinish,
  shouldPlay
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Stop audio when unmounting or if source changes
  const stopAudio = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
      } catch (e) {
        // Ignore errors if already stopped
      }
      sourceRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsSpeaking(false);
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => stopAudio();
  }, []);

  // Handle Playback
  useEffect(() => {
    stopAudio();

    if (shouldPlay && audioBuffer && audioContext) {
      playAudio(audioBuffer, audioContext);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBuffer, shouldPlay, audioContext]);


  const playAudio = (buffer: AudioBuffer, ctx: AudioContext) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    
    // Connect: Source -> Analyser -> Destination
    source.connect(analyser);
    analyser.connect(ctx.destination);
    
    sourceRef.current = source;
    analyserRef.current = analyser;

    source.onended = () => {
      setIsSpeaking(false);
      onAudioFinish();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      // Clear canvas
      const cvs = canvasRef.current;
      const c = cvs?.getContext('2d');
      if (cvs && c) c.clearRect(0, 0, cvs.width, cvs.height);
    };

    source.start(0);
    setIsSpeaking(true);
    visualize();
  };

  const visualize = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw a circular glow behind the avatar based on volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Calculate radius/intensity based on audio average
      const intensity = Math.max(0, average - 10) / 255; // Normalize somewhat
      
      // Draw dynamic ring
      if (intensity > 0.05) {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radius = 64 + (intensity * 20); // Base radius (slightly larger than avatar) + dynamic

          // Outer Glow
          const gradient = ctx.createRadialGradient(centerX, centerY, 60, centerX, centerY, radius);
          gradient.addColorStop(0, 'rgba(14, 165, 233, 0.1)');
          gradient.addColorStop(0.5, `rgba(14, 165, 233, ${intensity * 0.6})`);
          gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');

          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Inner energy ring
          ctx.beginPath();
          ctx.arc(centerX, centerY, 60 + (intensity * 5), 0, 2 * Math.PI);
          ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.8})`;
          ctx.lineWidth = 2;
          ctx.stroke();
      }
    };

    draw();
  };

  return (
    <div className="relative w-48 h-48 flex items-center justify-center group">
      {/* Visualizer Canvas Layer */}
      <canvas 
        ref={canvasRef} 
        width={200} 
        height={200} 
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
      />
      
      {/* Avatar Image Layer */}
      <div className={`
        relative z-10 w-32 h-32 rounded-full overflow-hidden 
        border-4 border-slate-800 shadow-2xl 
        origin-bottom
        transition-all duration-300
        ${isSpeaking ? 'animate-talking' : 'animate-breathing'}
      `}>
         {/* Updated: Professional Asian Female Teacher */}
        <img 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop" 
            alt="AI Teacher" 
            className="w-full h-full object-cover"
        />
        
        {/* Status Indicator */}
        <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-slate-900 transition-colors duration-300 ${isSpeaking ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-slate-500'}`}></div>
      </div>

       {/* Speech Bubble */}
      {isSpeaking && (
        <div className="absolute -top-12 right-0 bg-white/95 backdrop-blur-sm text-slate-900 px-4 py-2 rounded-xl rounded-bl-none text-xs font-bold shadow-xl animate-fade-in z-20 min-w-[100px]">
             <span className="flex gap-1 items-center justify-center">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-200"></span>
                <span className="ml-1">讲解中...</span>
             </span>
        </div>
      )}
    </div>
  );
};

export default AvatarTeacher;