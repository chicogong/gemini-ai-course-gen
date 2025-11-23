import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CourseData, AppState, AudioState } from './types';
import { generateCourseContent, generateSpeechAudio, decodeAudioData } from './services/geminiService';
import AvatarTeacher from './components/AvatarTeacher';
import SlideView from './components/SlideView';
import { Loader2, Play, Pause, SkipForward, SkipBack, Sparkles, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [topicInput, setTopicInput] = useState('');
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // Audio handling
  const [audioState, setAudioState] = useState<AudioState>({ isPlaying: false, isLoading: false, isFinished: false });
  const [currentAudioBuffer, setCurrentAudioBuffer] = useState<AudioBuffer | null>(null);
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context on user interaction (required by browsers)
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handleGenerate = async (topicOverride?: string) => {
    const activeTopic = typeof topicOverride === 'string' ? topicOverride : topicInput;

    if (!activeTopic.trim()) return;
    
    // If triggered by quick chip, update input visually
    if (typeof topicOverride === 'string') {
      setTopicInput(topicOverride);
    }

    initAudioContext();
    
    setAppState(AppState.GENERATING_CONTENT);
    try {
      const data = await generateCourseContent(activeTopic);
      setCourseData(data);
      setCurrentSlideIndex(0);
      setAppState(AppState.READY);
      
      // Automatically fetch audio for the first slide
      if (data.slides.length > 0) {
        fetchAudioForSlide(data.slides[0].script);
      }

    } catch (e) {
      console.error(e);
      setAppState(AppState.ERROR);
    }
  };

  const fetchAudioForSlide = useCallback(async (script: string) => {
    setAudioState(prev => ({ ...prev, isLoading: true, isPlaying: false, isFinished: false }));
    setCurrentAudioBuffer(null);

    try {
      const rawBuffer = await generateSpeechAudio(script);
      if (audioContextRef.current) {
        const decodedBuffer = await decodeAudioData(new Uint8Array(rawBuffer), audioContextRef.current);
        setCurrentAudioBuffer(decodedBuffer);
        setAudioState(prev => ({ ...prev, isLoading: false, isPlaying: true })); // Auto play when ready
      }
    } catch (e) {
      console.error("Audio fetch failed", e);
      setAudioState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const handleNextSlide = () => {
    if (!courseData) return;
    if (currentSlideIndex < courseData.slides.length - 1) {
      const nextIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(nextIndex);
      fetchAudioForSlide(courseData.slides[nextIndex].script);
    }
  };

  const handlePrevSlide = () => {
    if (!courseData) return;
    if (currentSlideIndex > 0) {
      const prevIndex = currentSlideIndex - 1;
      setCurrentSlideIndex(prevIndex);
      fetchAudioForSlide(courseData.slides[prevIndex].script);
    }
  };

  const togglePlay = () => {
    initAudioContext();
    setAudioState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  // Quick start topics
  const quickTopics = [
    "🚀 量子力学入门",
    "🤖 2025 AI 趋势",
    "🥐 制作完美酸面包",
    "🏛️ 罗马帝国史"
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500/30">
      {/* Navbar */}
      <header className="px-8 py-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAppState(AppState.IDLE)}>
          <div className="bg-gradient-to-br from-brand-500 to-indigo-600 p-2 rounded-lg shadow-lg shadow-brand-500/20">
             <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AI 智课大师
          </h1>
        </div>
        {appState === AppState.READY && (
           <div className="text-sm text-slate-400 hidden md:block">
             当前课题: <span className="text-brand-400 font-medium">{courseData?.topic}</span>
           </div>
        )}
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 relative">
        
        {/* State: IDLE - Input Form */}
        {appState === AppState.IDLE && (
          <div className="w-full max-w-3xl text-center space-y-10 animate-fade-in pb-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                <span>AI 驱动 • 实时生成 • 沉浸式教学</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
                一键生成 <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-blue-500 to-indigo-500">大师级视频网课</span>
              </h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                输入任意知识点，瞬间生成包含精美 PPT 与 <span className="text-slate-200 font-medium">数字人老师实时讲解</span> 的互动课程。
              </p>
            </div>

            <div className="flex flex-col gap-6 items-center">
              <div className="w-full relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex flex-col sm:flex-row gap-2 p-2 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="输入你想学的课题..."
                    className="flex-grow bg-transparent px-6 py-4 text-lg outline-none text-white placeholder-slate-600 rounded-xl focus:bg-slate-800 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  />
                  <button
                    onClick={() => handleGenerate()}
                    disabled={!topicInput.trim()}
                    className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-brand-500/25 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Zap className="w-5 h-5 fill-current" />
                    立即生成
                  </button>
                </div>
              </div>

              {/* Quick Start Chips */}
              <div className="w-full animate-fade-in" style={{ animationDelay: '0.2s' }}>
                 <p className="text-slate-500 text-sm mb-4 font-medium uppercase tracking-widest">热门课题 (点击即生成)</p>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quickTopics.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => handleGenerate(topic)}
                        className="p-4 bg-slate-800/50 hover:bg-slate-800 hover:border-brand-500/50 border border-slate-700/50 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all text-left flex items-center gap-2 group hover:shadow-lg hover:-translate-y-0.5"
                      >
                        <span className="truncate w-full">{topic}</span>
                      </button>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* State: GENERATING */}
        {appState === AppState.GENERATING_CONTENT && (
          <div className="flex flex-col items-center gap-8 animate-pulse max-w-md text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 animate-pulse"></div>
              <Loader2 className="w-20 h-20 text-brand-500 animate-spin relative z-10" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">正在构建课程...</h3>
              <p className="text-slate-400 text-lg">
                AI 老师正在为您撰写大纲、设计幻灯片并准备演讲稿
              </p>
            </div>
          </div>
        )}

        {/* State: ERROR */}
        {appState === AppState.ERROR && (
          <div className="text-center space-y-6 max-w-md bg-slate-900 p-8 rounded-3xl border border-red-900/50 shadow-2xl">
            <div className="text-6xl mb-4">⚠️</div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">生成失败</h3>
              <p className="text-slate-400">抱歉，AI 老师遇到了一点小问题，请稍后重试。</p>
            </div>
            <button 
              onClick={() => setAppState(AppState.IDLE)}
              className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
            >
              返回重试
            </button>
          </div>
        )}

        {/* State: READY - Main View */}
        {appState === AppState.READY && courseData && (
          <div className="w-full max-w-6xl flex flex-col gap-6 h-full relative animate-fade-in">
            
            {/* Slide Area */}
            <div className="relative group">
               <SlideView 
                 slide={courseData.slides[currentSlideIndex]} 
                 slideIndex={currentSlideIndex} 
                 totalSlides={courseData.slides.length} 
               />
               
               {/* Digital Teacher Overlay - Positioned over slide on desktop for "Picture in Picture" feel or to side */}
               <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-20 transition-transform hover:scale-105 duration-300">
                  <AvatarTeacher 
                    script={courseData.slides[currentSlideIndex].script}
                    audioBuffer={currentAudioBuffer}
                    audioContext={audioContextRef.current}
                    onAudioFinish={() => setAudioState(prev => ({ ...prev, isPlaying: false, isFinished: true }))}
                    shouldPlay={audioState.isPlaying}
                  />
               </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl">
              
              {/* Playback Controls */}
              <div className="flex items-center gap-6 w-full md:w-auto justify-center md:justify-start">
                 <button 
                   onClick={handlePrevSlide} 
                   disabled={currentSlideIndex === 0}
                   className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
                 >
                   <SkipBack className="w-8 h-8" />
                 </button>
                 
                 <button 
                   onClick={togglePlay}
                   className="p-5 bg-gradient-to-br from-white to-slate-200 text-slate-950 rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                 >
                   {audioState.isLoading ? (
                     <Loader2 className="w-8 h-8 animate-spin" />
                   ) : audioState.isPlaying ? (
                     <Pause className="w-8 h-8 fill-current" />
                   ) : (
                     <Play className="w-8 h-8 fill-current ml-1" />
                   )}
                 </button>

                 <button 
                   onClick={handleNextSlide}
                   disabled={currentSlideIndex === courseData.slides.length - 1}
                   className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
                 >
                   <SkipForward className="w-8 h-8" />
                 </button>
              </div>

              {/* Progress & Script */}
              <div className="flex-grow w-full md:w-auto flex flex-col gap-3">
                 <div className="flex justify-between items-end">
                    <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">
                       {courseData.slides[currentSlideIndex].title}
                    </span>
                    <span className="text-brand-400 text-xs font-mono">
                      {currentSlideIndex + 1} / {courseData.slides.length}
                    </span>
                 </div>
                 
                 {/* Custom Progress Bar */}
                 <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                    {courseData.slides.map((_, idx) => (
                      <div 
                        key={idx}
                        className={`h-full flex-1 border-r border-slate-900 last:border-0 transition-all duration-500 ${
                          idx <= currentSlideIndex ? 'bg-brand-500' : 'bg-transparent'
                        } ${idx === currentSlideIndex && audioState.isPlaying ? 'animate-pulse' : ''}`}
                      />
                    ))}
                 </div>

                 <p className="text-sm text-slate-500 line-clamp-1 italic font-light">
                   "{courseData.slides[currentSlideIndex].script}"
                 </p>
              </div>

              {/* Restart Button */}
              <button 
                onClick={() => setAppState(AppState.IDLE)}
                className="hidden md:flex px-4 py-2 rounded-lg text-sm text-slate-500 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
              >
                新课程
              </button>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;