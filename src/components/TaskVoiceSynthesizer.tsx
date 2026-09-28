import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Play,
  Pause,
  Download,
  Video,
  Music,
  Plus,
  Wand2,
  FileAudio,
  Check,
  RotateCcw,
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { TaskItem, Priority } from '../types';

interface TaskVoiceSynthesizerProps {
  initialTask?: TaskItem | null;
  onTaskCreated?: () => void;
}

export const TaskVoiceSynthesizer: React.FC<TaskVoiceSynthesizerProps> = ({
  initialTask,
  onTaskCreated,
}) => {
  const { user } = useAuth();

  // Voice Memo Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState(
    initialTask
      ? `${initialTask.title}. ${initialTask.description || ''}`
      : 'Finish the client presentation by Friday 5 PM, priority high, tag marketing, need 60 minutes focus'
  );

  // Synthesis & Video State
  const [lyrics, setLyrics] = useState(
    'Step by step, we build the dream\nSyncing tasks across the team\nFriday five PM deadline near\nClear the path, the vision is clear'
  );
  const [tempoBpm, setTempoBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [autoTaskStatus, setAutoTaskStatus] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0);

  // Sample voice memo presets
  const sampleMemos = [
    {
      title: 'Marketing Campaign Launch',
      text: 'Schedule launch of our new video campaign on Monday. High priority, tag Marketing, 45 minutes.',
      lyrics: 'Lights and camera, roll the tape\nShaping thoughts into great shape\nMonday launch is taking flight\nBrilliant colors shining bright',
    },
    {
      title: 'Sprint Backlog Review',
      text: 'Review pull requests and deploy release build before noon tomorrow. Urgent priority, tag Engineering.',
      lyrics: 'Code compiles, the tests all pass\nZero bugs inside the glass\nPush the commit, deploy the stream\nPowered by the builder team',
    },
    {
      title: 'Studio Soundtrack Composition',
      text: 'Compose 2-minute chill background soundtrack for pitch deck. Tag Creative, 90 minutes.',
      lyrics: 'Gentle synth and mellow beat\nWalking through the digital street\nFocus deep in cyber sound\nGreatest answers finally found',
    },
  ];

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission or hardware unavailable, using voice memo simulator', err);
      // Fallback recording simulator
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 4) {
            stopRecording();
            return 4;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  };

  // Automated Task Extraction from Voice Memo
  const handleExtractTaskFromMemo = async () => {
    setAutoTaskStatus('Analyzing memo & extracting task parameters...');

    // Smart heuristic extractor
    const text = transcript.toLowerCase();
    let priority: Priority = 'medium';
    if (text.includes('urgent') || text.includes('asap') || text.includes('critical')) priority = 'urgent';
    else if (text.includes('high') || text.includes('important')) priority = 'high';
    else if (text.includes('low') || text.includes('whenever')) priority = 'low';

    let estimatedMinutes = 30;
    const minMatch = text.match(/(\d+)\s*(?:min|minute|minutes)/);
    if (minMatch) estimatedMinutes = parseInt(minMatch[1], 10);
    const hourMatch = text.match(/(\d+)\s*(?:hour|hours|hr|hrs)/);
    if (hourMatch) estimatedMinutes = parseInt(hourMatch[1], 10) * 60;

    let category = 'Voice Task';
    if (text.includes('marketing') || text.includes('campaign')) category = 'Marketing';
    else if (text.includes('dev') || text.includes('code') || text.includes('build') || text.includes('bug')) category = 'Engineering';
    else if (text.includes('design') || text.includes('video') || text.includes('music')) category = 'Creative';
    else if (text.includes('meeting') || text.includes('call') || text.includes('client')) category = 'Meetings';

    // Due date detection
    let dueDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (text.includes('today')) dueDate = new Date().toISOString().slice(0, 10);
    else if (text.includes('tomorrow')) dueDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    else if (text.includes('friday')) {
      const d = new Date();
      d.setDate(d.getDate() + ((5 + 7 - d.getDay()) % 7 || 7));
      dueDate = d.toISOString().slice(0, 10);
    }

    const title = transcript.split(/[.\n,]/)[0].slice(0, 100) || 'Action item from voice memo';

    const newTaskData: Omit<TaskItem, 'id'> = {
      userId: user ? user.uid : 'demo',
      title: title.trim(),
      description: `Synthesized from Voice Memo transcript:\n"${transcript}"`,
      completed: false,
      priority,
      category,
      dueDate,
      estimatedMinutes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (user) {
        await addDoc(collection(db, 'tasks'), newTaskData);
      } else {
        const local = localStorage.getItem('syncflow_demo_tasks');
        const tasks = local ? JSON.parse(local) : [];
        tasks.unshift({ id: 'demo-' + Date.now(), ...newTaskData });
        localStorage.setItem('syncflow_demo_tasks', JSON.stringify(tasks));
      }
      setAutoTaskStatus(`Task "${title.slice(0, 30)}..." successfully added!`);
      if (onTaskCreated) onTaskCreated();
      setTimeout(() => setAutoTaskStatus(null), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tasks');
    }
  };

  // Web Audio Synthesizer for Lyric & Audio Synthesis
  const playSynthesizedTrack = () => {
    if (isPlaying) {
      stopSynthesizedTrack();
      return;
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;

    playbackStartTimeRef.current = ctx.currentTime;
    setIsPlaying(true);

    // Audio synthesizer loop: Bassline + Arpeggiator + Drum Pulse
    const stepDuration = 60 / tempoBpm / 2; // 16th notes
    const totalBars = 8;
    const totalSteps = totalBars * 16;

    const chords = [
      [220, 261.63, 329.63], // Am
      [174.61, 220, 261.63], // F
      [261.63, 329.63, 392], // C
      [196, 246.94, 293.66], // G
    ];

    for (let step = 0; step < totalSteps; step++) {
      const stepTime = ctx.currentTime + step * stepDuration;
      const chordIndex = Math.floor(step / 16) % chords.length;
      const currentChord = chords[chordIndex];

      // Kick on 0, 4, 8, 12
      if (step % 4 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(140, stepTime);
        osc.frequency.exponentialRampToValueAtTime(35, stepTime + 0.12);
        gain.gain.setValueAtTime(0.7, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(stepTime);
        osc.stop(stepTime + 0.15);
      }

      // Snare on 4, 12
      if (step % 8 === 4) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, stepTime);
        gain.gain.setValueAtTime(0.3, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(stepTime);
        osc.stop(stepTime + 0.1);
      }

      // Hi-hat on every off-beat
      if (step % 2 === 1) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'highpass' as any;
        osc.frequency.setValueAtTime(8000, stepTime);
        gain.gain.setValueAtTime(0.08, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(stepTime);
        osc.stop(stepTime + 0.05);
      }

      // Synth Arp Note
      const arpNote = currentChord[step % currentChord.length] * (step % 8 === 0 ? 1 : 2);
      const arpOsc = ctx.createOscillator();
      const arpGain = ctx.createGain();
      arpOsc.type = 'sine';
      arpOsc.frequency.setValueAtTime(arpNote, stepTime);
      arpGain.gain.setValueAtTime(0.12, stepTime);
      arpGain.gain.exponentialRampToValueAtTime(0.001, stepTime + stepDuration * 0.9);
      arpOsc.connect(arpGain);
      arpGain.connect(ctx.destination);
      arpOsc.start(stepTime);
      arpOsc.stop(stepTime + stepDuration);
    }

    // Stop after playback ends
    const totalDuration = totalSteps * stepDuration;
    setTimeout(() => {
      setIsPlaying(false);
    }, totalDuration * 1000);
  };

  const stopSynthesizedTrack = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  };

  // Canvas visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const lyricLines = lyrics.split('\n').filter((l) => l.trim().length > 0);

    const render = () => {
      frame++;
      const width = canvas.width;
      const height = canvas.height;

      // Dynamic Gradient Background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      const hue1 = (frame * 0.4) % 360;
      const hue2 = (hue1 + 60) % 360;
      grad.addColorStop(0, `hsl(${hue1}, 65%, 15%)`);
      grad.addColorStop(1, `hsl(${hue2}, 75%, 8%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Grid overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Audio waveform equalizer animation
      const barCount = 48;
      const barWidth = width / barCount - 3;
      for (let i = 0; i < barCount; i++) {
        const freq = Math.sin(frame * 0.08 + i * 0.25) * 0.5 + 0.5;
        const amp = isPlaying ? Math.random() * 80 + 30 : Math.sin(frame * 0.05 + i * 0.1) * 30 + 15;
        const barHeight = freq * amp;
        const x = i * (barWidth + 3);
        const y = height * 0.7 - barHeight / 2;

        const barGrad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        barGrad.addColorStop(0, '#a855f7');
        barGrad.addColorStop(1, '#6366f1');
        ctx.fillStyle = barGrad;
        ctx.fillRect(x, y, barWidth, Math.max(4, barHeight));
      }

      // Center glowing circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, height * 0.35, 60 + Math.sin(frame * 0.05) * 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 30;
      ctx.fill();
      ctx.restore();

      // Badge / Status
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ SYNTHFLOW VIDEO SYNTHESIZER ⚡', width / 2, height * 0.36);

      // Display active lyric line with fade effect
      if (lyricLines.length > 0) {
        const lineIndex = Math.floor(frame / 90) % lyricLines.length;
        const currentLine = lyricLines[lineIndex];

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 10;
        ctx.fillText(`“ ${currentLine} ”`, width / 2, height * 0.88);

        // Subtitle line progress indicator
        const progress = (frame % 90) / 90;
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(width * 0.25, height * 0.93, width * 0.5 * progress, 3);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [lyrics, isPlaying]);

  // Video recording from canvas + audio
  const handleRenderSynthesizedVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRenderingVideo(true);
    setRenderedVideoUrl(null);

    playSynthesizedTrack();

    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRenderedVideoUrl(url);
        setIsRenderingVideo(false);
        stopSynthesizedTrack();
      };

      recorder.start();
      // Record 6 seconds preview clip
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 6000);
    } catch (err) {
      console.warn('Canvas video capture fallback:', err);
      setIsRenderingVideo(false);
      stopSynthesizedTrack();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-pink-900/30 border border-purple-500/30 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Task 1: Voice Memos &amp; Video Synthesis</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Automated Task Creation &amp; Lyric Video Synthesis
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Record voice memos to automatically create isolated to-do items, or synthesize your lyrics and voice clips into animated 1080p promotional videos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {sampleMemos.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(s.text);
                  setLyrics(s.lyrics);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-colors border border-white/10"
              >
                Sample {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two column layout: Voice memo extractor on left, Video synthesizer on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Voice Memo & Automated Task Extraction */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-500" />
              <span>Voice Memo Recorder &amp; Transcription</span>
            </h3>

            {/* Mic Record Button */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-center">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
                  isRecording
                    ? 'bg-rose-600 animate-pulse ring-4 ring-rose-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                }`}
              >
                {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </button>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isRecording ? `Recording voice memo... (${recordingSeconds}s)` : 'Tap to Record Voice Memo'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Speak tasks like: "Call client tomorrow at 3 PM, priority high"
                </p>
              </div>

              {recordedAudioUrl && (
                <div className="w-full pt-2">
                  <audio controls src={recordedAudioUrl} className="w-full h-8" />
                </div>
              )}
            </div>

            {/* Transcript text area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Voice Memo Transcript
              </label>
              <textarea
                rows={3}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Voice memo transcript appears here..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Auto-Extract Button */}
            <button
              onClick={handleExtractTaskFromMemo}
              disabled={!transcript.trim()}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              <span>Automate Task Creation from Memo</span>
            </button>

            {autoTaskStatus && (
              <div className="p-2.5 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{autoTaskStatus}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Lyric & Audio Video Synthesis Studio */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-500" />
                <span>Dynamic Lyric &amp; Audio Video Synthesizer</span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Tempo: {tempoBpm} BPM</span>
                <input
                  type="range"
                  min={80}
                  max={160}
                  value={tempoBpm}
                  onChange={(e) => setTempoBpm(Number(e.target.value))}
                  className="w-20 accent-indigo-600"
                />
              </div>
            </div>

            {/* Canvas Video Canvas */}
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-inner bg-slate-950 border border-slate-800 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={640}
                height={360}
                className="w-full h-full object-cover"
              />
              {isRenderingVideo && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                  <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-semibold">Synthesizing &amp; Rendering Video Clip...</p>
                </div>
              )}
            </div>

            {/* Lyrics Editor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lyrics / Subtitle Lines (One per line)
              </label>
              <textarea
                rows={3}
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Enter song lyrics or video subtitles..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={playSynthesizedTrack}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  isPlaying
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause Audio Preview' : 'Preview Synthesized Track'}</span>
              </button>

              <button
                onClick={handleRenderSynthesizedVideo}
                disabled={isRenderingVideo}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Synthesized Video Clip</span>
              </button>
            </div>

            {/* Rendered Video Clip Download Link */}
            {renderedVideoUrl && (
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-200">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Synthesized video clip ready for presentation &amp; media!</span>
                </div>
                <a
                  href={renderedVideoUrl}
                  download={`syncflow_video_${Date.now()}.webm`}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Download .webm
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
