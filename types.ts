export interface Slide {
  title: string;
  bulletPoints: string[];
  script: string; // What the teacher says
}

export interface CourseData {
  topic: string;
  slides: Slide[];
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING_CONTENT = 'GENERATING_CONTENT',
  READY = 'READY',
  ERROR = 'ERROR',
}

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  isFinished: boolean; // Current slide audio finished
}
