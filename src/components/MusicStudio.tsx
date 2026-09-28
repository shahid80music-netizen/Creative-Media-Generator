import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Play,
  Pause,
  RotateCcw,
  Download,
  Sparkles,
  Volume2,
  VolumeX,
  Sliders,
  Layers,
  Wand2,
  Headphones,
} from 'lucide-react';

interface TrackDef {
  id: string;
  name: string;
  color: string;
  steps: boolean[];
  volume: number;
}

export const MusicStudio: React.FC = () => {
  const [bpm, setBpm] = useState(124);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState('Cyberpunk Pulse');
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [exportedWavUrl, setExportedWavUrl] = useState<string | null>(null);

  // 16-step sequencer tracks
  const [tracks, setTracks] = useState<TrackDef[]>([
    {
      id: 'kick',
      name: '808 Kick Drum',
      color: 'bg-rose-500',
      steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      volume: 0.8,
    },
    {
      id: 'snare',
      name: 'Punchy Snare',
      color: 'bg-amber-500',
      steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      volume: 0.6,
    },
    {
      id: 'hihat',
      name: 'Crisp Hi-Hat',
      color: 'bg-emerald-500',
      steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      volume: 0.4,
    },
    {
      id: 'bass',
      name: 'Sub Synth Bass',
      color: 'bg-indigo-500',
      steps: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, true, false],
      volume: 0.7,
    },
    {
      id: 'arp',
      name: 'Chime / Lead Arp',
      color: 'bg-purple-500',
      steps: [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true],
      volume: 0.5,
    },
  ]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const stepRef = useRef<number>(0);

  // Initialize or resume audio context
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Synthesize single drum/instrument sound
  const playSound = (ctx: AudioContext, trackId: string, time: number, volume: number) => {
    if (trackId === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.15);
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.18);
    } else if (trackId === 'snare') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, time);
      gain.gain.setValueAtTime(volume * 0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.12);
    } else if (trackId === 'hihat') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(9000, time);
      gain.gain.setValueAtTime(volume * 0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.05);
    } else if (trackId === 'bass') {
      const notes = [65.41, 73.42, 82.41, 98.0]; // C2, D2, E2, G2
      const note = notes[stepRef.current % notes.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note, time);
      gain.gain.setValueAtTime(volume * 0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.2);
    } else if (trackId === 'arp') {
      const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const freq = chord[stepRef.current % chord.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(volume * 0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.15);
    }
  };

  // Toggle step in sequence
  const toggleStep = (trackIndex: number, stepIndex: number) => {
    setTracks((prev) =>
      prev.map((track, i) => {
        if (i !== trackIndex) return track;
        const newSteps = [...track.steps];
        newSteps[stepIndex] = !newSteps[stepIndex];
        return { ...track, steps: newSteps };
      })
    );
  };

  // Play / Pause Sequencer
  const togglePlay = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      const ctx = getAudioContext();
      setIsPlaying(true);
      stepRef.current = 0;
      setCurrentStep(0);

      const stepIntervalMs = (60 / bpm / 4) * 1000;
      intervalRef.current = window.setInterval(() => {
        const step = stepRef.current;
        setCurrentStep(step);

        tracks.forEach((track) => {
          if (track.steps[step]) {
            playSound(ctx, track.id, ctx.currentTime, track.volume);
          }
        });

        stepRef.current = (step + 1) % 16;
      }, stepIntervalMs);
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // Update tempo live
  useEffect(() => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const ctx = getAudioContext();
      const stepIntervalMs = (60 / bpm / 4) * 1000;
      intervalRef.current = window.setInterval(() => {
        const step = stepRef.current;
        setCurrentStep(step);
        tracks.forEach((track) => {
          if (track.steps[step]) {
            playSound(ctx, track.id, ctx.currentTime, track.volume);
          }
        });
        stepRef.current = (step + 1) % 16;
      }, stepIntervalMs);
    }
  }, [bpm, tracks]);

  // Apply Presets
  const applyPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    if (presetName === 'Cyberpunk Pulse') {
      setBpm(128);
      setTracks([
        { id: 'kick', name: '808 Kick Drum', color: 'bg-rose-500', steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], volume: 0.8 },
        { id: 'snare', name: 'Punchy Snare', color: 'bg-amber-500', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], volume: 0.6 },
        { id: 'hihat', name: 'Crisp Hi-Hat', color: 'bg-emerald-500', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false], volume: 0.4 },
        { id: 'bass', name: 'Sub Synth Bass', color: 'bg-indigo-500', steps: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, true, false], volume: 0.7 },
        { id: 'arp', name: 'Chime / Lead Arp', color: 'bg-purple-500', steps: [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true], volume: 0.5 },
      ]);
    } else if (presetName === 'Lo-Fi Chill') {
      setBpm(84);
      setTracks([
        { id: 'kick', name: '808 Kick Drum', color: 'bg-rose-500', steps: [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false], volume: 0.7 },
        { id: 'snare', name: 'Punchy Snare', color: 'bg-amber-500', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, true], volume: 0.5 },
        { id: 'hihat', name: 'Crisp Hi-Hat', color: 'bg-emerald-500', steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, true, false, false], volume: 0.3 },
        { id: 'bass', name: 'Sub Synth Bass', color: 'bg-indigo-500', steps: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false], volume: 0.6 },
        { id: 'arp', name: 'Chime / Lead Arp', color: 'bg-purple-500', steps: [true, false, false, true, false, false, true, false, false, false, false, true, false, false, true, false], volume: 0.4 },
      ]);
    } else if (presetName === 'Cinematic Epic') {
      setBpm(105);
      setTracks([
        { id: 'kick', name: '808 Kick Drum', color: 'bg-rose-500', steps: [true, false, false, false, true, false, false, true, true, false, false, false, true, false, true, false], volume: 0.9 },
        { id: 'snare', name: 'Punchy Snare', color: 'bg-amber-500', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], volume: 0.7 },
        { id: 'hihat', name: 'Crisp Hi-Hat', color: 'bg-emerald-500', steps: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true], volume: 0.4 },
        { id: 'bass', name: 'Sub Synth Bass', color: 'bg-indigo-500', steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], volume: 0.8 },
        { id: 'arp', name: 'Chime / Lead Arp', color: 'bg-purple-500', steps: [true, false, true, false, true, false, true, false, true, true, false, true, false, true, true, false], volume: 0.6 },
      ]);
    }
  };

  // Export to WAV File format (Generates valid WAV binary using offline rendering buffer)
  const handleExportWav = async () => {
    setIsExportingWav(true);
    setExportedWavUrl(null);

    const sampleRate = 44100;
    const durationSeconds = (60 / bpm) * 4 * 4; // 4 bars
    const totalSamples = Math.floor(sampleRate * durationSeconds);

    const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);
    const stepDuration = 60 / bpm / 4;

    for (let step = 0; step < 64; step++) {
      const stepIn16 = step % 16;
      const time = step * stepDuration;
      tracks.forEach((track) => {
        if (track.steps[stepIn16]) {
          playSound(offlineCtx as any, track.id, time, track.volume);
        }
      });
    }

    const renderedBuffer = await offlineCtx.startRendering();

    // Encode AudioBuffer to WAV
    const wavBlob = audioBufferToWavBlob(renderedBuffer);
    const url = URL.createObjectURL(wavBlob);
    setExportedWavUrl(url);
    setIsExportingWav(false);
  };

  // Pure in-memory WAV encoder (zero external dependencies, low memory footprint)
  function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const numSamples = buffer.length;
    const dataSize = numSamples * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    function writeString(offset: number, str: string) {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    }

    /* RIFF identifier */
    writeString(0, 'RIFF');
    /* file length */
    view.setUint32(4, 36 + dataSize, true);
    /* RIFF type */
    writeString(8, 'WAVE');
    /* format chunk identifier */
    writeString(12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, format, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate */
    view.setUint32(28, sampleRate * blockAlign, true);
    /* block align */
    view.setUint16(32, blockAlign, true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(36, 'data');
    /* data chunk length */
    view.setUint32(40, dataSize, true);

    // Write channel interleaved 16-bit PCM
    const channels = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        const sample = Math.max(-1, Math.min(1, channels[c][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-900/40 via-purple-900/30 to-indigo-900/30 border border-pink-500/30 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/40 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Task 4: AI Music Studio &amp; Soundtracks</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              AI-Driven Multi-Track Composition Studio
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Compose custom royalty-free soundtracks for your presentations, videos, and focus sessions with a high-performance in-memory synthesizer.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {['Cyberpunk Pulse', 'Lo-Fi Chill', 'Cinematic Epic'].map((preset) => (
              <button
                key={preset}
                onClick={() => applyPreset(preset)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                  selectedPreset === preset
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-600/25 font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/10'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sequencer Board */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause Sequencer' : 'Play Sequencer'}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : 'Play Beat'}</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Tempo:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{bpm} BPM</span>
              <input
                type="range"
                min={60}
                max={180}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-24 accent-indigo-600"
                aria-label="Tempo BPM Slider"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportWav}
              disabled={isExportingWav}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingWav ? 'Exporting WAV...' : 'Export Soundtrack (WAV)'}</span>
            </button>
          </div>
        </div>

        {/* Exported WAV Notification */}
        {exportedWavUrl && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-emerald-600" />
              <span>Soundtrack synthesized into high-quality WAV audio!</span>
            </div>
            <a
              href={exportedWavUrl}
              download={`syncflow_soundtrack_${Date.now()}.wav`}
              className="px-3 py-1 font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Download .wav
            </a>
          </div>
        )}

        {/* 16-Step Grid */}
        <div className="space-y-3 overflow-x-auto pb-2">
          {/* Step Indicator Header */}
          <div className="grid grid-cols-16 gap-1 min-w-[640px] pl-36">
            {Array.from({ length: 16 }).map((_, stepIdx) => (
              <div
                key={stepIdx}
                className={`text-center py-1 text-[10px] font-mono font-bold rounded-sm ${
                  currentStep === stepIdx
                    ? 'text-pink-600 dark:text-pink-400 bg-pink-500/10'
                    : 'text-slate-400'
                }`}
              >
                {stepIdx + 1}
              </div>
            ))}
          </div>

          {/* Track Rows */}
          {tracks.map((track, trackIdx) => (
            <div key={track.id} className="flex items-center gap-2 min-w-[640px]">
              {/* Track Name & Volume */}
              <div className="w-36 flex items-center justify-between pr-3 shrink-0">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {track.name}
                </span>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
              </div>

              {/* 16 Step Buttons */}
              <div className="grid grid-cols-16 gap-1 flex-1">
                {track.steps.map((isActive, stepIdx) => {
                  const isCurrent = currentStep === stepIdx;
                  return (
                    <button
                      key={stepIdx}
                      onClick={() => toggleStep(trackIdx, stepIdx)}
                      aria-label={`${track.name} step ${stepIdx + 1} ${isActive ? 'active' : 'inactive'}`}
                      className={`h-9 rounded-lg transition-all border ${
                        isActive
                          ? `${track.color} text-white border-transparent shadow-xs scale-95`
                          : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      } ${
                        isCurrent
                          ? 'ring-2 ring-pink-500 ring-offset-1 dark:ring-offset-slate-900'
                          : ''
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
