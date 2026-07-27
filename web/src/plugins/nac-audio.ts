import { registerPlugin, Capacitor } from '@capacitor/core';

export interface AudioOptions {
  url: string;
  title?: string;
  artist?: string;
  coverUrl?: string;
}

export interface AudioStatus {
  isPlaying: boolean;
  duration: number;
  currentPosition: number;
}

export interface NacAudioPlugin {
  start(options: AudioOptions): Promise<{ status: string }>;
  play(): Promise<{ status: string }>;
  pause(): Promise<{ status: string }>;
  stop(): Promise<{ status: string }>;
  seekTo(options: { positionMs: number }): Promise<{ positionMs: number }>;
  getStatus(): Promise<AudioStatus>;
}

// Fallback web player instance
let webAudioPlayer: HTMLAudioElement | null = null;
let webAudioOptions: AudioOptions | null = null;

const NacAudioWeb: NacAudioPlugin = {
  async start(options: AudioOptions) {
    if (!webAudioPlayer) {
      webAudioPlayer = new Audio();
    }
    webAudioOptions = options;
    webAudioPlayer.src = options.url;
    try {
      await webAudioPlayer.play();
      return { status: 'started' };
    } catch (e) {
      console.warn('[NacAudio Web] Play error:', e);
      return { status: 'ready' };
    }
  },
  async play() {
    if (webAudioPlayer) {
      await webAudioPlayer.play();
      return { status: 'playing' };
    }
    return { status: 'no_audio' };
  },
  async pause() {
    if (webAudioPlayer) {
      webAudioPlayer.pause();
      return { status: 'paused' };
    }
    return { status: 'no_audio' };
  },
  async stop() {
    if (webAudioPlayer) {
      webAudioPlayer.pause();
      webAudioPlayer.currentTime = 0;
      return { status: 'stopped' };
    }
    return { status: 'no_audio' };
  },
  async seekTo(options: { positionMs: number }) {
    if (webAudioPlayer) {
      webAudioPlayer.currentTime = options.positionMs / 1000;
      return { positionMs: options.positionMs };
    }
    return { positionMs: 0 };
  },
  async getStatus() {
    if (webAudioPlayer) {
      return {
        isPlaying: !webAudioPlayer.paused && !webAudioPlayer.ended,
        duration: (webAudioPlayer.duration || 0) * 1000,
        currentPosition: (webAudioPlayer.currentTime || 0) * 1000,
      };
    }
    return {
      isPlaying: false,
      duration: 0,
      currentPosition: 0,
    };
  },
};

export const NacAudio = registerPlugin<NacAudioPlugin>('NacAudio', {
  web: () => NacAudioWeb,
});

// Helper export functions matching requirement
export async function startAudio(options: AudioOptions) {
  if (Capacitor.isNativePlatform()) {
    return NacAudio.start(options);
  } else {
    return NacAudioWeb.start(options);
  }
}

export async function playAudio() {
  if (Capacitor.isNativePlatform()) {
    return NacAudio.play();
  } else {
    return NacAudioWeb.play();
  }
}

export async function pauseAudio() {
  if (Capacitor.isNativePlatform()) {
    return NacAudio.pause();
  } else {
    return NacAudioWeb.pause();
  }
}

export async function stopAudio() {
  if (Capacitor.isNativePlatform()) {
    return NacAudio.stop();
  } else {
    return NacAudioWeb.stop();
  }
}

export async function seekToAudio(positionMs: number) {
  if (Capacitor.isNativePlatform()) {
    return NacAudio.seekTo({ positionMs });
  } else {
    return NacAudioWeb.seekTo({ positionMs });
  }
}

export async function getAudioStatus() {
  if (Capacitor.isNativePlatform()) {
    return NacAudio.getStatus();
  } else {
    return NacAudioWeb.getStatus();
  }
}

export default NacAudio;
