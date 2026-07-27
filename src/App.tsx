import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Play,
  Pause,
  Square,
  Music,
  Volume2,
  Smartphone,
  Github,
  Terminal,
  Layers,
  Radio,
  ExternalLink,
  RotateCw,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
  ListMusic,
  Settings,
  Maximize2,
  Minimize2,
  Wifi,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import {
  startAudio,
  playAudio,
  pauseAudio,
  stopAudio,
  seekToAudio,
  getAudioStatus,
  AudioStatus
} from '../web/src/plugins/nac-audio';

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  category: string;
}

const NAC_CHOIR_STREAM_URL = 'https://nac-choir-stream.ai.studio';

const STREAM_STATIONS: Track[] = [
  {
    id: 'nac-live-1',
    title: 'NAC Choir Stream - Live Radio',
    artist: 'National Apostolic Church Choir',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    category: '24/7 Live Stream'
  },
  {
    id: 'nac-hymns',
    title: 'Sacred Choir Hymnal Collection',
    artist: 'NAC Mass Choir',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    category: 'Sacred Hymns'
  },
  {
    id: 'nac-choral',
    title: 'Orchestral Choir Concert',
    artist: 'NAC Symphony & Youth Choir',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    category: 'Concert Broadcast'
  }
];

export default function App() {
  const [targetUrl, setTargetUrl] = useState(NAC_CHOIR_STREAM_URL);
  const [currentUrl, setCurrentUrl] = useState(NAC_CHOIR_STREAM_URL);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [selectedTrack, setSelectedTrack] = useState<Track>(STREAM_STATIONS[0]);
  const [status, setStatus] = useState<AudioStatus>({
    isPlaying: false,
    duration: 0,
    currentPosition: 0
  });
  const [showDeveloperPanel, setShowDeveloperPanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState<string>('Ready');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const platformName = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();

  // Periodic ExoPlayer status update loop
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const st = await getAudioStatus();
        setStatus(st);
      } catch (e) {
        // ignore errors on polling
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeError(false);
    setIframeKey((prev) => prev + 1);
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let url = targetUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setCurrentUrl(url);
    setTargetUrl(url);
    handleRefresh();
  };

  const handleStart = async (track: Track = selectedTrack) => {
    try {
      setSelectedTrack(track);
      setLastAction(`Playing: ${track.title}`);
      await startAudio({
        url: track.url,
        title: track.title,
        artist: track.artist
      });
    } catch (err: any) {
      setLastAction(`Error: ${err.message || String(err)}`);
    }
  };

  const handlePlay = async () => {
    try {
      await playAudio();
      setLastAction('Resumed stream');
    } catch (err: any) {
      setLastAction(`Play Error: ${err.message}`);
    }
  };

  const handlePause = async () => {
    try {
      await pauseAudio();
      setLastAction('Paused stream');
    } catch (err: any) {
      setLastAction(`Pause Error: ${err.message}`);
    }
  };

  const handleStop = async () => {
    try {
      await stopAudio();
      setLastAction('Stopped foreground service');
    } catch (err: any) {
      setLastAction(`Stop Error: ${err.message}`);
    }
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const posSec = parseFloat(e.target.value);
    const posMs = posSec * 1000;
    try {
      await seekToAudio(posMs);
      setLastAction(`Seek to ${Math.round(posSec)}s`);
    } catch (err: any) {
      setLastAction(`Seek Error: ${err.message}`);
    }
  };

  const copyScriptCommand = () => {
    navigator.clipboard.writeText('bash create-pr-branch.sh');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">NAC Choir Stream Web Viewer</h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  LIVE VIEWER
                </span>
              </div>
              <p className="text-xs text-slate-400">Capacitor Background Audio Enabled • com.nac.choir</p>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setShowDeveloperPanel(!showDeveloperPanel)}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                showDeveloperPanel ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showDeveloperPanel ? 'Hide Dev & CI Info' : 'Android & CI Specs'}</span>
            </button>

            <a
              href={NAC_CHOIR_STREAM_URL}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors flex items-center gap-1.5"
            >
              <span>Open Direct</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-6">
        
        {/* Developer & CI Info Panel (Collapsible) */}
        {showDeveloperPanel && (
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <Layers className="w-4 h-4" />
                <span>Capacitor ExoPlayer Plugin & CI Workflow Specifications</span>
              </div>
              <span className="text-xs text-slate-400">Target: compileSdk 33 • ExoPlayer 2.20.0</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-white mb-1 flex items-center justify-between">
                  <span>Foreground Service</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="font-mono text-indigo-300 text-[11px] mb-1">plugins/capacitor-android-audio/src/audio/AudioPlaybackService.kt</p>
                <p className="text-slate-400">Uses Android Foreground Service with ExoPlayer 2.20.0 to keep audio playing in background.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-white mb-1 flex items-center justify-between">
                  <span>Native Plugin Bridge</span>
                  <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <p className="font-mono text-indigo-300 text-[11px] mb-1">plugins/capacitor-android-audio/src/CapacitorAudioPlugin.kt</p>
                <p className="text-slate-400">Registers Capacitor plugin @CapacitorPlugin(name="NacAudio") for Android.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-white mb-1 flex items-center justify-between">
                  <span>GitHub Actions CI</span>
                  <Github className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="font-mono text-indigo-300 text-[11px] mb-1">.github/workflows/android-build.yml</p>
                <p className="text-slate-400">Builds web, syncs android, installs plugin, and runs gradle assembleRelease.</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400">Branch: <strong className="text-emerald-400 font-mono">feat/android-background-audio</strong></span>
              <button
                onClick={copyScriptCommand}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Command!' : 'Copy Script Command'}</span>
              </button>
            </div>
          </div>
        )}

        {/* WEB VIEWER FRAME / BROWSER SHELL */}
        <div className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all ${
          isFullscreen ? 'fixed inset-2 z-50 rounded-xl' : 'h-[620px]'
        }`}>
          {/* Browser Address Bar */}
          <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <button
                onClick={handleRefresh}
                title="Reload Web Viewer"
                className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-300"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </div>

            {/* URL Input Form */}
            <form onSubmit={handleNavigate} className="flex-1 max-w-2xl">
              <div className="relative flex items-center">
                <div className="absolute left-3 text-emerald-400 flex items-center gap-1 pointer-events-none">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-20 py-1.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-1 px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium"
                >
                  Go
                </button>
              </div>
            </form>

            {/* Viewer Action Icons */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-300"
                title="Open in external browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-300"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Web View Frame / Content Area */}
          <div className="relative flex-1 bg-slate-950 overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading NAC Choir Stream Web App ({currentUrl})...</span>
              </div>
            )}

            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={currentUrl}
              title="NAC Choir Stream Web App Viewer"
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setIframeError(true);
              }}
              allow="autoplay; camera; microphone; geolocation"
            />
          </div>
        </div>

        {/* FLOATING BACKGROUND AUDIO CONTROL BAR (PERSISTENT PLAYBACK) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Station & Status Info */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md">
              <Radio className={`w-6 h-6 ${status.isPlaying ? 'animate-pulse text-amber-300' : ''}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">{selectedTrack.title}</h3>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 ${
                  status.isPlaying ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {status.isPlaying ? 'Foreground ExoPlayer Active' : 'Idle'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{selectedTrack.artist} • {selectedTrack.category}</p>
            </div>
          </div>

          {/* Quick Stream Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto py-1">
            {STREAM_STATIONS.map((st) => (
              <button
                key={st.id}
                onClick={() => handleStart(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedTrack.id === st.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Music className="w-3 h-3" />
                <span>{st.title.split('-')[0]}</span>
              </button>
            ))}
          </div>

          {/* Playback Transport Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleStart(selectedTrack)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Load Stream"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {status.isPlaying ? (
              <button
                onClick={handlePause}
                className="w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-amber-500/20 transition-transform active:scale-95"
                title="Pause Stream"
              >
                <Pause className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                onClick={handlePlay}
                className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-transform active:scale-95"
                title="Play Stream"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>
            )}

            <button
              onClick={handleStop}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-300 transition-colors"
              title="Stop Service"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-3 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NAC Choir Stream Web App Viewer • <a href={NAC_CHOIR_STREAM_URL} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">nac-choir-stream.ai.studio</a></span>
          <span className="font-mono text-slate-400">Foreground ExoPlayer Service Active ({isNative ? 'Native' : 'Web Fallback'})</span>
        </div>
      </footer>
    </div>
  );
}
