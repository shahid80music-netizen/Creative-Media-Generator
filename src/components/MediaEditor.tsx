import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Type,
  Image as ImageIcon,
  Music,
  Download,
  Play,
  Pause,
  Palette,
  Sparkles,
  Sliders,
  Layers,
  Square,
  Plus,
  Trash2,
  Maximize2,
} from 'lucide-react';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface BadgeElement {
  id: string;
  label: string;
  x: number;
  y: number;
  bg: string;
}

export const MediaEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [isPlaying, setIsPlaying] = useState(false);
  const [filter, setFilter] = useState<'none' | 'cyberpunk' | 'sepia' | 'noir' | 'warmth'>('cyberpunk');
  const [bgGradient, setBgGradient] = useState<'dark' | 'neon' | 'sunset' | 'ocean'>('dark');

  // Interactive Canva Elements
  const [textElements, setTextElements] = useState<TextElement[]>([
    {
      id: 't-1',
      text: 'SyncFlow AI Launch Demo',
      x: 320,
      y: 100,
      fontSize: 26,
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
    },
    {
      id: 't-2',
      text: 'Collaborative To-Dos & Smart Media Studio',
      x: 320,
      y: 150,
      fontSize: 16,
      color: '#a5b4fc',
      fontFamily: 'system-ui, sans-serif',
    },
  ]);

  const [badges, setBadges] = useState<BadgeElement[]>([
    { id: 'b-1', label: '🔥 VERIFIED FIREBASE', x: 200, y: 40, bg: '#ec4899' },
    { id: 'b-2', label: '⚡ REAL-TIME SYNC', x: 420, y: 40, bg: '#6366f1' },
  ]);

  const [musicVolume, setMusicVolume] = useState(70);
  const [voiceVolume, setVoiceVolume] = useState(100);
  const [activeTab, setActiveTab] = useState<'text' | 'stickers' | 'filter' | 'audio'>('text');
  const [newText, setNewText] = useState('');
  const [newTextColor, setNewTextColor] = useState('#ffffff');
  const [newBadgeLabel, setNewBadgeLabel] = useState('URGENT PRIORITY');

  const animationFrameRef = useRef<number | null>(null);

  // Canvas dimensions based on aspect ratio
  const dimensions = {
    '16:9': { width: 640, height: 360 },
    '9:16': { width: 360, height: 640 },
    '1:1': { width: 480, height: 480 },
  }[aspectRatio];

  // Draw Canvas Frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;

    const render = () => {
      frame++;
      const { width, height } = dimensions;

      // Draw Background
      if (bgGradient === 'dark') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else if (bgGradient === 'neon') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#2e0249');
        grad.addColorStop(0.5, '#570a57');
        grad.addColorStop(1, '#a91079');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else if (bgGradient === 'sunset') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#4c0519');
        grad.addColorStop(0.5, '#881337');
        grad.addColorStop(1, '#ea580c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else if (bgGradient === 'ocean') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#082f49');
        grad.addColorStop(0.5, '#0e7490');
        grad.addColorStop(1, '#06b6d4');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Animated Motion Elements (if playing)
      if (isPlaying) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        const waveY = height * 0.75;
        ctx.beginPath();
        for (let x = 0; x < width; x += 10) {
          const y = waveY + Math.sin(x * 0.05 + frame * 0.08) * 15;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Render Badges
      badges.forEach((b) => {
        ctx.save();
        ctx.font = 'bold 11px system-ui, sans-serif';
        const textWidth = ctx.measureText(b.label).width;
        const padX = 12;
        const padY = 6;
        ctx.fillStyle = b.bg;
        ctx.beginPath();
        ctx.roundRect(b.x - textWidth / 2 - padX, b.y - 12 - padY, textWidth + padX * 2, 24 + padY, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.label, b.x, b.y);
        ctx.restore();
      });

      // Render Text Elements
      textElements.forEach((t) => {
        ctx.save();
        ctx.font = `bold ${t.fontSize}px ${t.fontFamily}`;
        ctx.fillStyle = t.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      });

      // Render Filters
      if (filter === 'cyberpunk') {
        ctx.fillStyle = 'rgba(236, 72, 153, 0.08)';
        ctx.fillRect(0, 0, width, height);
      } else if (filter === 'sepia') {
        ctx.fillStyle = 'rgba(180, 130, 70, 0.2)';
        ctx.fillRect(0, 0, width, height);
      } else if (filter === 'noir') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, width, height);
      } else if (filter === 'warmth') {
        ctx.fillStyle = 'rgba(251, 146, 60, 0.12)';
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [dimensions, bgGradient, filter, isPlaying, textElements, badges]);

  // Add custom text
  const handleAddText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const newEl: TextElement = {
      id: 't-' + Date.now(),
      text: newText.trim(),
      x: dimensions.width / 2,
      y: dimensions.height / 2 + (textElements.length * 30),
      fontSize: 20,
      color: newTextColor,
      fontFamily: 'system-ui, sans-serif',
    };
    setTextElements([...textElements, newEl]);
    setNewText('');
  };

  // Add badge
  const handleAddBadge = () => {
    if (!newBadgeLabel.trim()) return;
    const colors = ['#ec4899', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newB: BadgeElement = {
      id: 'b-' + Date.now(),
      label: newBadgeLabel.trim(),
      x: dimensions.width / 2,
      y: 60 + badges.length * 30,
      bg: randomColor,
    };
    setBadges([...badges, newB]);
  };

  // Export Canvas as PNG Image
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `syncflow_media_${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900/40 via-purple-900/30 to-indigo-900/30 border border-amber-500/30 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Task 5: Canva Video &amp; Audio File Editor</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Canva-Style Audio, Video &amp; Canvas Editor
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Add responsive text overlays, animated waveform tracks, custom visual filters, stickers, and export presentation graphics or video slides.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPNG}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export High-Res PNG</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Layout: Canvas Viewport & Sidebar Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Canvas Viewport */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center space-y-4">
            {/* Viewport Toolbar */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Aspect Ratio:</span>
                {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      aspectRatio === ratio
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${
                  isPlaying ? 'bg-amber-600' : 'bg-indigo-600'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-white" />}
                <span>{isPlaying ? 'Pause Motion' : 'Play Motion'}</span>
              </button>
            </div>

            {/* Canvas Container */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950 flex items-center justify-center max-w-full">
              <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                className="max-h-[460px] w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Canva Tools & Layers */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            {/* Tool Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl text-xs">
              {[
                { id: 'text', label: 'Text', icon: Type },
                { id: 'stickers', label: 'Badges', icon: Square },
                { id: 'filter', label: 'Filter', icon: Palette },
                { id: 'audio', label: 'Audio', icon: Music },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 transition-all ${
                      activeTab === t.id
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab: Text Tools */}
            {activeTab === 'text' && (
              <div className="space-y-3">
                <form onSubmit={handleAddText} className="space-y-2">
                  <input
                    type="text"
                    required
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter text layer..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newTextColor}
                      onChange={(e) => setNewTextColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      title="Text Color"
                    />
                    <button
                      type="submit"
                      className="flex-1 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      + Add Text Layer
                    </button>
                  </div>
                </form>

                {/* Text Layers List */}
                <div className="space-y-1.5 pt-2">
                  <p className="text-[11px] font-semibold text-slate-400">Current Layers:</p>
                  {textElements.map((el) => (
                    <div
                      key={el.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <span className="truncate pr-2 text-slate-800 dark:text-slate-200">{el.text}</span>
                      <button
                        onClick={() => setTextElements(textElements.filter((t) => t.id !== el.id))}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Stickers / Badges */}
            {activeTab === 'stickers' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newBadgeLabel}
                    onChange={(e) => setNewBadgeLabel(e.target.value)}
                    placeholder="Badge text..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <button
                    onClick={handleAddBadge}
                    className="w-full py-2 text-xs font-semibold rounded-xl bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    + Place Badge Overlay
                  </button>
                </div>

                <div className="space-y-1.5 pt-2">
                  <p className="text-[11px] font-semibold text-slate-400">Active Badges:</p>
                  {badges.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <span className="font-semibold text-white px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: b.bg }}>
                        {b.label}
                      </span>
                      <button
                        onClick={() => setBadges(badges.filter((item) => item.id !== b.id))}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Filter & Background */}
            {activeTab === 'filter' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Canvas Background Theme</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'dark', label: 'Obsidian Dark' },
                      { id: 'neon', label: 'Cyberpunk Neon' },
                      { id: 'sunset', label: 'Ruby Sunset' },
                      { id: 'ocean', label: 'Deep Ocean' },
                    ].map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setBgGradient(bg.id as any)}
                        className={`p-2 rounded-xl text-left border font-medium ${
                          bgGradient === bg.id
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-slate-400 font-semibold mb-1">Visual Filter Effect</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'none', label: 'None / Crisp' },
                      { id: 'cyberpunk', label: 'Neon Glow' },
                      { id: 'sepia', label: 'Vintage Warm' },
                      { id: 'noir', label: 'Dramatic Noir' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFilter(f.id as any)}
                        className={`p-2 rounded-xl text-left border font-medium ${
                          filter === f.id
                            ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Audio Controls */}
            {activeTab === 'audio' && (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium mb-1">
                    <span>Soundtrack Background Music:</span>
                    <span className="font-mono">{musicVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium mb-1">
                    <span>Voice Memo Narration Track:</span>
                    <span className="font-mono">{voiceVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={voiceVolume}
                    onChange={(e) => setVoiceVolume(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
