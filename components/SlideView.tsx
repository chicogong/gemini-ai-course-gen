import React from 'react';
import { Slide } from '../types';

interface SlideViewProps {
  slide: Slide;
  slideIndex: number;
  totalSlides: number;
}

const SlideView: React.FC<SlideViewProps> = ({ slide, slideIndex, totalSlides }) => {
  // Generate deterministic gradient based on slide index for variety
  const gradients = [
    'from-blue-600 to-indigo-950',
    'from-emerald-600 to-teal-950',
    'from-purple-600 to-fuchsia-950',
    'from-orange-600 to-red-950',
    'from-cyan-600 to-blue-950',
  ];
  
  const bgGradient = gradients[slideIndex % gradients.length];

  return (
    <div className={`w-full aspect-video bg-gradient-to-br ${bgGradient} rounded-2xl shadow-2xl flex flex-col justify-between text-white relative overflow-hidden transition-all duration-500`}>
      
      {/* Dynamic Background Patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
      </div>

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-[100px]"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-black opacity-30 rounded-full translate-y-1/3 -translate-x-1/3 blur-[120px]"></div>

      {/* Content Container */}
      <div className="z-10 h-full flex flex-col p-8 md:p-12">
        {/* Header */}
        <div className="border-b border-white/10 pb-6 mb-8 flex items-start justify-between">
          <div className="max-w-[80%]">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight drop-shadow-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80">
              {slide.title}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-1">
             <span className="text-xs font-bold tracking-widest uppercase opacity-60">Module</span>
             <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold border border-white/10 shadow-lg">
                {slideIndex + 1} <span className="opacity-50 mx-1">/</span> {totalSlides}
             </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-grow flex flex-col justify-center">
          <div className="space-y-6">
            {slide.bulletPoints.map((point, idx) => (
              <div 
                key={idx} 
                className="group flex items-center p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]" 
                style={{ animationDelay: `${idx * 0.2 + 0.3}s` }}
              >
                <div className="mr-6 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/20 group-hover:scale-110 transition-transform">
                    <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                </div>
                <span className="text-xl md:text-2xl font-light leading-relaxed drop-shadow-sm text-white/95">
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center opacity-50 text-xs uppercase tracking-widest">
          <span>CourseGenius AI • Educational Series</span>
          <span>Generated Content</span>
        </div>
      </div>
    </div>
  );
};

export default SlideView;