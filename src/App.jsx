import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Check, Circle, ListTodo, BarChart3, Clock, Music, X, ChevronLeft, ChevronRight, Focus, Cloud, Wind, Zap, Tag, History, Trophy, Target, TrendingUp, Settings as SettingsIcon, Settings2, Bell, Volume2, Flag, ChevronUp, ChevronDown, ListFilter, CloudRain, Trees, Download, Upload } from 'lucide-react';
import { Howl } from 'howler';
import './index.css';

function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('timer'); // timer, tasks, stats

  // Gamification System
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [totalPomodoros, setTotalPomodoros] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [sessionCount, setSessionCount] = useState(0); // For Long Break logic
  const [dailyGoal] = useState(4);
  const xpPerLevel = level * 100;

  // Timer Settings State
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartFocus, setAutoStartFocus] = useState(false);

  // Add XP
  const gainXp = (amount) => {
    let newXp = xp + amount;
    if (newXp >= xpPerLevel) {
      newXp = newXp - xpPerLevel;
      setLevel(level + 1);
      playLevelUpSound();
    }
    setXp(newXp);
  };

  // Timer State
  const [defaultTime, setDefaultTime] = useState(25 * 60);
  const breakTime = 5 * 60;
  const [timeLeft, setTimeLeft] = useState(defaultTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [lofiVolume, setLofiVolume] = useState(0.4);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef(null); // Reference for Howler instance

  const lofiTracks = [
    { id: 1, name: "Local Chill", file: "/lofi.mp3" },
    { id: 2, name: "Lofi Radio", file: "https://stream.laut.fm/lofi" },
    { id: 3, name: "Chillhop FM", file: "https://lofi.stream.laut.fm/lofi" }
  ];

  // Main Application State
  const [theme, setTheme] = useState('midnight'); // midnight, forest, ember, lavender
  const [sessionTag, setSessionTag] = useState('İş'); // İş, Eğitim, Yaratıcı, Kişisel
  const [focusHistory, setFocusHistory] = useState([]);
  
  const tags = [
    { label: 'İş', icon: '💼', color: '#3b82f6' },
    { label: 'Eğitim', icon: '🎓', color: '#10b981' },
    { label: 'Yaratıcı', icon: '🎨', color: '#8b5cf6' },
    { label: 'Kişisel', icon: '🧘', color: '#f43f5e' }
  ];

  // Persistence: Load on startup
  useEffect(() => {
    const saved = localStorage.getItem('focusZen_progress');
    if (saved) {
      const data = JSON.parse(saved);
      setLevel(data.level || 1);
      setXp(data.xp || 0);
      setTotalPomodoros(data.totalPomodoros || 0);
      setTasksCompleted(data.tasksCompleted || 0);
      setFocusHistory(data.focusHistory || []);
      setTheme(data.theme || 'midnight');
      if (data.focusDuration) {
        setFocusDuration(data.focusDuration);
        setDefaultTime(data.focusDuration * 60);
        setTimeLeft(data.focusDuration * 60);
      }
      if (data.shortBreakDuration) setShortBreakDuration(data.shortBreakDuration);
      if (data.longBreakDuration) setLongBreakDuration(data.longBreakDuration);
      if (data.autoStartBreaks) setAutoStartBreaks(data.autoStartBreaks);
      if (data.autoStartFocus) setAutoStartFocus(data.autoStartFocus);
      if (data.sessionCount) setSessionCount(data.sessionCount);
    }
  }, []);

  // Persistence: Save on change
  useEffect(() => {
    const data = { 
      level, xp, totalPomodoros, tasksCompleted, focusHistory, theme,
      focusDuration, shortBreakDuration, longBreakDuration, 
      autoStartBreaks, autoStartFocus, sessionCount
    };
    localStorage.setItem('focusZen_progress', JSON.stringify(data));
    document.documentElement.setAttribute('data-theme', theme);
  }, [level, xp, totalPomodoros, tasksCompleted, focusHistory, theme, focusDuration, shortBreakDuration, longBreakDuration, autoStartBreaks, autoStartFocus, sessionCount]);

  // Background Noise State (White Noise Synth)
  const [noisePlaying, setNoisePlaying] = useState(false);
  const [noiseType, setNoiseType] = useState('white'); // white, rain, forest
  const [noiseVolume, setNoiseVolume] = useState(0.2);
  const noiseNodeRef = useRef(null);


  useEffect(() => {
    // Unload previous track if exists
    if (audioRef.current) {
      audioRef.current.unload();
    }

    // Initialize Howler with local lofi track downloaded to public folder
    audioRef.current = new Howl({
      src: [lofiTracks[currentTrackIndex].file],
      format: ['mp3'],
      loop: true,
      volume: lofiVolume,
      html5: true // Force HTML5 Audio so it streams properly without filling RAM
    });

    if (ambientPlaying) {
      audioRef.current.play();
    }

    // Request notification permission on boot
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.unload();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackIndex]);

  // Keyboard Shortcuts [NEW]
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch(e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          setIsRunning(prev => !prev);
          break;
        case 'r':
          setIsRunning(false);
          // sessionCount used instead of nextSessionCount for reset logic alignment
          setTimeLeft(isBreak ? (sessionCount % 4 === 0 ? longBreakDuration : shortBreakDuration) * 60 : focusDuration * 60);
          break;
        case '1': setActiveTab('timer'); break;
        case '2': setActiveTab('tasks'); break;
        case '3': setActiveTab('stats'); break;
        case '4': setActiveTab('settings'); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBreak, focusDuration, shortBreakDuration, longBreakDuration, sessionCount]);

  const toggleLofi = () => {
    if (!ambientPlaying) {
      audioRef.current.play();
      setAmbientPlaying(true);
    } else {
      audioRef.current.pause();
      setAmbientPlaying(false);
    }
  };

  const changeLofiVolume = (e) => {
    const vol = parseFloat(e.target.value);
    setLofiVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume(vol);
    }
  };

  const toggleNoise = (type = 'white') => {
    // If clicking same type while playing, stop it
    if (noisePlaying && noiseType === type) {
      if (noiseNodeRef.current) {
        noiseNodeRef.current.source.stop();
        noiseNodeRef.current = null;
      }
      setNoisePlaying(false);
      return;
    }

    // If already playing another type, stop first
    if (noisePlaying) {
      if (noiseNodeRef.current) {
        noiseNodeRef.current.source.stop();
      }
    }

    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtxRef.current;
    
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      gainNode.gain.setValueAtTime(noiseVolume * 1.5, ctx.currentTime);
    } else if (type === 'forest') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.Q.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.setValueAtTime(noiseVolume * 0.8, ctx.currentTime);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      gainNode.gain.setValueAtTime(noiseVolume, ctx.currentTime);
    }

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    source.start();
    noiseNodeRef.current = { source, gain: gainNode, filter };
    setNoiseType(type);
    setNoisePlaying(true);
  };

  const changeNoiseVolume = (e) => {
    const vol = parseFloat(e.target.value);
    setNoiseVolume(vol);
    if (noiseNodeRef.current) {
      noiseNodeRef.current.gain.gain.setValueAtTime(vol, audioCtxRef.current.currentTime);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % lofiTracks.length);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + lofiTracks.length) % lofiTracks.length);
  };

  // Quotes Array for a more organic feel
  const quotes = [
    "İşlenmemiş elmas sadece bir taştır.",
    "Büyük işler başarmak için, sadece harekete geçmek yetmez.",
    "Zor yollar, çoğu zaman en güzel yerlere çıkar."
  ];
  const [currentQuote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

  // Tasks State
  const [tasks, setTasks] = useState([
    { id: 1, text: "Günün öncelikli görevini belirle", completed: false, xpClaimed: false },
    { id: 2, text: "FocusZen uygulamasını incele", completed: false, xpClaimed: false }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [inputPriority, setInputPriority] = useState('medium'); // low, medium, high

  // Refs for audio (Using browser oscillator API for futuristic beep sounds)
  const audioCtxRef = useRef(null);

  // Sound Synthesizer (No external files needed) - Zen Bell
  const playAlarmSound = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtxRef.current;
    
    // Zen Bowl frequencies
    const frequencies = [432, 864, 1296];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      // Fade in quickly
      gainNode.gain.linearRampToValueAtTime(0.3 / (i + 1), ctx.currentTime + 0.1);
      // Long fading resonance
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 4);
    });
  };

  const handleSessionEnd = () => {
    playAlarmSound();

    // Trigger Native Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("FocusZen", {
        body: isBreak ? "Mola sona erdi, yeniden odaklanma vakti!" : "Odak süren bitti, harika çalıştın. Biraz dinlen.",
        icon: "/icon.png",
        silent: true
      });
    }

    if (!isBreak) {
      const nextSessionCount = sessionCount + 1;
      setSessionCount(nextSessionCount);
      setTotalPomodoros(prev => prev + 1);
      gainXp(50);
      
      const newEntry = {
        id: Date.now(),
        tag: sessionTag,
        duration: focusDuration,
        date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        day: new Date().toLocaleDateString('tr-TR', { weekday: 'short' }),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tasksCompleted: tasks.filter(t => t.completed).length
      };
      setFocusHistory(prev => [newEntry, ...prev].slice(0, 10)); // Increased to 10 entries

      setIsBreak(true);
      const isLongBreak = nextSessionCount % 4 === 0;
      const nextDuration = isLongBreak ? longBreakDuration : shortBreakDuration;
      setTimeLeft(nextDuration * 60);
      setDefaultTime(nextDuration * 60);
      
      if (autoStartBreaks) setIsRunning(true);
    } else {
      setIsBreak(false);
      setTimeLeft(focusDuration * 60);
      setDefaultTime(focusDuration * 60);
      
      if (autoStartFocus) setIsRunning(true);
    }
  };

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      handleSessionEnd();
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timeLeft]);


  const playLevelUpSound = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtxRef.current;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  };

  // Timer controls
  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? breakTime : defaultTime);
  };

  const changeDefaultTime = (minutes) => {
    if (!isRunning && !isBreak) {
      const newTime = minutes * 60;
      setDefaultTime(newTime);
      setTimeLeft(newTime);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Task Controls
  const addTask = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      setTasks([{ id: Date.now(), text: inputValue, completed: false, xpClaimed: false, priority: inputPriority }, ...tasks]);
      setInputValue("");
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        if (!t.completed && !t.xpClaimed) {
          gainXp(10); // 10 XP only for the first time
          setTasksCompleted(prev => prev + 1);
          return { ...t, completed: true, xpClaimed: true }; // Mark as claimed
        }
        return { ...t, completed: !t.completed }; // Just toggle visuals after
      }
      return t;
    }));
  };

  // Data Portability [NEW]
  const exportData = () => {
    const data = {
      level, xp, totalPomodoros, tasksCompleted, focusHistory, theme, 
      focusDuration, shortBreakDuration, longBreakDuration, 
      autoStartBreaks, autoStartFocus, sessionCount, tasks
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focus-zen-backup-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.level) setLevel(data.level);
        if (data.xp) setXp(data.xp);
        if (data.totalPomodoros) setTotalPomodoros(data.totalPomodoros);
        if (data.tasksCompleted) setTasksCompleted(data.tasksCompleted);
        if (data.focusHistory) setFocusHistory(data.focusHistory);
        if (data.theme) setTheme(data.theme);
        if (data.focusDuration) setFocusDuration(data.focusDuration);
        if (data.shortBreakDuration) setShortBreakDuration(data.shortBreakDuration);
        if (data.longBreakDuration) setLongBreakDuration(data.longBreakDuration);
        if (data.autoStartBreaks) setAutoStartBreaks(data.autoStartBreaks);
        if (data.autoStartFocus) setAutoStartFocus(data.autoStartFocus);
        if (data.sessionCount) setSessionCount(data.sessionCount);
        if (data.tasks) setTasks(data.tasks);
        alert('Veriler başarıyla içe aktarıldı!');
      } catch {
        alert('Hata: Geçersiz dosya formatı.');
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className={`app-wrapper ${isRunning ? 'is-focusing' : ''}`}>
      {/* Background ambient lighting effects */}
      <div className="ambient-blob blob-1"></div>
      <div className="ambient-blob blob-2"></div>
      
      <div className="glass-container">
        {/* Electron Drag Region for Frameless Window */}
        <div className="drag-region"></div>
        
        {/* Sidebar */}
        <nav className="sidebar no-drag">
          <div className="brand">
            <div className="brand-icon"><Focus size={28} color="var(--accent-cyan)" /></div>
          </div>
          
          <div className="nav-items">
            <button className={`nav-btn ${activeTab === 'timer' ? 'active' : ''}`} onClick={() => setActiveTab('timer')}>
              <Clock size={20} />
              <span>Zaman</span>
            </button>
            <button className={`nav-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
              <ListTodo size={20} />
              <span>İşler</span>
              {tasks.filter(t => !t.completed).length > 0 && 
                <div className="task-badge">{tasks.filter(t => !t.completed).length}</div>
              }
            </button>
            <button className={`nav-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
              <BarChart3 size={20} />
              <span>Performans</span>
            </button>
            <button className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <Settings2 size={20} />
              <span>Ayarlar</span>
            </button>
          </div>

          {/* Daily Goal Progress Ring */}
          <div className="goal-preview" title={`Günlük Hedef: ${totalPomodoros}/${dailyGoal}`}>
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="circle" 
                strokeDasharray={`${Math.min((totalPomodoros / dailyGoal) * 100, 100)}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
              />
            </svg>
            <div className="goal-text">{totalPomodoros}</div>
          </div>

          <div className="ambient-toggle">
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingBottom: '10px'}} onClick={toggleLofi}>
              <div className={`visualizer ${ambientPlaying ? 'playing' : ''}`}>
                <span></span><span></span><span></span><span></span>
              </div>
              <Music size={20} />
              <span style={{fontSize: '0.75rem', fontWeight: 500}}>Lo-Fi</span>
            </div>
            
            {ambientPlaying && (
              <div className="lofi-controls no-drag fade-in">
                <div className="track-selector">
                  <button className="track-btn" onClick={prevTrack}><ChevronLeft size={16} /></button>
                  <span className="track-name">{lofiTracks[currentTrackIndex].name}</span>
                  <button className="track-btn" onClick={nextTrack}><ChevronRight size={16} /></button>
                </div>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={lofiVolume} 
                  onChange={changeLofiVolume} 
                  className="volume-slider"
                />

                <div className="divider"></div>

                <div className="noise-selector-group">
                  <div className="noise-header">
                    <Volume2 size={14} />
                    <span>Ambiyans (Gürültü)</span>
                  </div>
                  <div className="noise-options">
                    <button className={`noise-opt-btn ${noisePlaying && noiseType === 'white' ? 'active' : ''}`} onClick={() => toggleNoise('white')} title="Beyaz Gürültü">
                      <Wind size={14} />
                    </button>
                    <button className={`noise-opt-btn ${noisePlaying && noiseType === 'rain' ? 'active' : ''}`} onClick={() => toggleNoise('rain')} title="Yağmur">
                      <CloudRain size={14} />
                    </button>
                    <button className={`noise-opt-btn ${noisePlaying && noiseType === 'forest' ? 'active' : ''}`} onClick={() => toggleNoise('forest')} title="Orman">
                      <Trees size={14} />
                    </button>
                  </div>
                </div>

                {noisePlaying && (
                  <input 
                    type="range" 
                    min="0" max="0.5" step="0.02" 
                    value={noiseVolume} 
                    onChange={changeNoiseVolume} 
                    className="volume-slider"
                  />
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="content-area">
          {/* Header */}
          <header className="header no-drag">
            <div className="header-spacers"></div>
            
            <div className="theme-selector-bar">
              {[
                { id: 'midnight', color: '#3b82f6' },
                { id: 'forest', color: '#10b981' },
                { id: 'ember', color: '#f43f5e' },
                { id: 'lavender', color: '#8b5cf6' }
              ].map(t => (
                <div 
                  key={t.id} 
                  className={`theme-bubble ${theme === t.id ? 'active' : ''}`}
                  style={{ background: t.color }}
                  onClick={() => setTheme(t.id)}
                  title={`${t.id.charAt(0).toUpperCase() + t.id.slice(1)} Teması`}
                />
              ))}
            </div>

            <div className="streak-badge" title="Günlük Odak Serisi">
              <Zap size={14} fill="currentColor" />
              <span>3 Gün</span>
            </div>

            <div className="user-profile">
              <div className="level-badge">LVL {level}</div>
              <div className="xp-bar-container">
                <div className="xp-bar" style={{width: `${(xp / xpPerLevel) * 100}%`}}></div>
              </div>
              <span className="xp-text">{xp}/{xpPerLevel} XP</span>
            </div>
          </header>

          <div className="tab-render no-drag fade-in">
            {/* TIMER TAB */}
            {activeTab === 'timer' && (
              <div className="timer-tab">
                
                <div className="timer-circle">
                  <div className="timer-text">{formatTime(timeLeft)}</div>
                  <div className="status-label">
                    <span className={`status-dot ${isBreak ? 'break' : 'focus'}`}></span>
                    {isBreak ? 'Mola Vakti' : 'Focus Modu'}
                  </div>
                  <div className={`timer-ring ${isRunning ? 'spin' : ''}`}></div>
                </div>

                <div className="controls">
                  <button className="control-btn primary" onClick={toggleTimer}>
                    {isRunning ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  <button className="control-btn secondary" onClick={resetTimer}>
                    <RotateCcw size={20} />
                  </button>
                </div>

                {!isRunning && !isBreak && (
                  <div className="time-selectors">
                    <button className={`time-btn ${defaultTime === 15*60 ? 'active' : ''}`} onClick={() => changeDefaultTime(15)}>15</button>
                    <button className={`time-btn ${defaultTime === 25*60 ? 'active' : ''}`} onClick={() => changeDefaultTime(25)}>25</button>
                    <button className={`time-btn ${defaultTime === 45*60 ? 'active' : ''}`} onClick={() => changeDefaultTime(45)}>45</button>
                    <button className={`time-btn ${defaultTime === 60*60 ? 'active' : ''}`} onClick={() => changeDefaultTime(60)}>60</button>
                  </div>
                )}

                <div className="quote-container">
                   <p>"{currentQuote}"</p>
                </div>

                <div className="divider" style={{margin: '20px 0', width: '200px', opacity: 0.1}}></div>

                {/* Session Tag Selector */}
                <div className="tag-selector slide-up">
                  {tags.map(t => (
                    <button 
                      key={t.label} 
                      className={`tag-btn ${sessionTag === t.label ? 'active' : ''}`}
                      onClick={() => !isRunning && setSessionTag(t.label)}
                      style={{ '--tag-color': t.color }}
                    >
                      <span className="tag-icon">{t.icon}</span>
                      <span className="tag-label">{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* Pomodoro Session Tracker Feature */}
                {totalPomodoros > 0 && (
                  <div className="session-dots-container fade-in" style={{ marginTop: '25px' }}>
                    {[...Array(Math.min(totalPomodoros, 10))].map((_, i) => (
                       <span key={i} className="session-dot filled" title="Tamamlanan Odak"></span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TASKS TAB */}
            {activeTab === 'tasks' && (
              <div className="tasks-tab slide-up">
                <h2>Yapılacaklar</h2>
                <div className="input-group">
                  <div className="task-input-wrapper">
                    <input 
                      type="text" 
                      placeholder="Yeni bir görev ekle..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={addTask}
                    />
                    <div className="priority-select">
                      {['low', 'medium', 'high'].map(p => (
                        <button 
                          key={p}
                          className={`prio-btn ${inputPriority === p ? 'active' : ''} ${p}`}
                          onClick={() => setInputPriority(p)}
                          title={`${p.charAt(0).toUpperCase() + p.slice(1)} Öncelik`}
                        >
                          <Flag size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="task-list">
                  {tasks.map((task, index) => (
                    <div 
                      key={task.id} 
                      className={`task-card ${task.completed ? 'completed' : ''}`} 
                      onClick={() => toggleTask(task.id)}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <button className="check-btn">
                         {task.completed ? <Check className="check-icon" size={18} /> : <Circle className="uncheck-icon" size={18} />}
                      </button>
                      <div className="task-content">
                        <span className="task-text">{task.text}</span>
                        <div className="task-meta">
                          <span className={`prio-badge ${task.priority || 'medium'}`}>
                            {task.priority === 'high' ? 'Yüksek' : task.priority === 'low' ? 'Düşük' : 'Orta'}
                          </span>
                        </div>
                      </div>
                      {task.completed && task.xpClaimed && <span className="xp-floating">+10 XP</span>}
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="empty-state">
                      <ListTodo size={40} opacity={0.3} />
                      <p>Tüm görevler tamamlandı, harika iş çıkardın.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STATS TAB */}
            {activeTab === 'stats' && (
              <div className="stats-tab fade-in">
                <h2>Performans Analizi</h2>
                
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon-wrapper"><Trophy size={18} /></div>
                    <h3>Gelişim</h3>
                    <div className="stat-value highlight">{level}</div>
                    <p className="stat-desc">Mevcut Seviye</p>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon-wrapper"><Target size={18} /></div>
                    <h3>Odak</h3>
                    <div className="stat-value">{totalPomodoros}</div>
                    <p className="stat-desc">Oturum</p>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon-wrapper"><TrendingUp size={18} /></div>
                    <h3>Başarı</h3>
                    <div className="stat-value">{tasksCompleted}</div>
                    <p className="stat-desc">Görev Tamamlandı</p>
                  </div>
                </div>

                {/* Focus Pulse Chart [NEW] */}
                <div className="analytics-card slide-up">
                  <div className="analytics-header">
                    <TrendingUp size={18} color="var(--accent-cyan)" />
                    <h3>Odak Akışı</h3>
                  </div>
                  <div className="pulse-chart-container">
                    <svg viewBox="0 0 400 100" className="pulse-svg">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path 
                        className="pulse-path"
                        d={`M 0 80 ${focusHistory.map((h, i) => `L ${(i + 1) * 80} ${80 - (h.duration / 60) * 50}`).join(' ')} L 400 80`}
                        fill="url(#chartGradient)"
                      />
                      <path 
                        className="pulse-line"
                        d={`M 0 80 ${focusHistory.map((h, i) => `L ${(i + 1) * 80} ${80 - (h.duration / 60) * 50}`).join(' ')}`}
                        fill="none"
                        stroke="var(--accent-cyan)"
                        strokeWidth="2"
                      />
                      {focusHistory.map((h, i) => (
                        <circle 
                          key={h.id} 
                          cx={(i + 1) * 80} 
                          cy={80 - (h.duration / 60) * 50} 
                          r="3" 
                          fill="var(--accent-cyan)" 
                          className="pulse-point"
                        />
                      ))}
                    </svg>
                    <div className="chart-labels">
                      <span>Geçmiş Seanslar (Süre Yoğunluğu)</span>
                    </div>
                  </div>
                </div>

                {focusHistory.length > 0 && (
                  <div className="history-section fade-in" style={{ marginTop: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingLeft: '5px' }}>
                      <History size={18} color="var(--accent-cyan)" />
                      <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Son Aktivite</h3>
                    </div>
                    <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {focusHistory.map(entry => (
                        <div key={entry.id} className="history-item slide-up">
                          <div className="h-left">
                            <div className="h-date-box">
                              <span className="h-day">{entry.day || '...'}</span>
                              <span className="h-date">{entry.date || '...'}</span>
                            </div>
                            <div className="h-tag">
                              <span>{tags.find(t => t.label === entry.tag)?.icon}</span>
                              <span>{entry.tag}</span>
                            </div>
                          </div>
                          <div className="h-right">
                            <div className="h-meta">
                              <span className="h-duration">{entry.duration} dk</span>
                              <span className="h-time">{entry.time}</span>
                            </div>
                            {entry.tasksCompleted > 0 && (
                              <div className="h-badge" title="Tamamlanan Görevler">
                                <Check size={10} />
                                <span>{entry.tasksCompleted}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS TAB [NEW] */}
            {activeTab === 'settings' && (
              <div className="settings-tab slide-up" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
                <h2>Uygulama Ayarları</h2>
                
                <div className="settings-card">
                  <div className="settings-group">
                    <div className="settings-header">
                      <Clock size={18} color="var(--accent-cyan)" />
                      <span>Süre Ayarları (Dakika)</span>
                    </div>
                    <div className="settings-inputs">
                      <div className="input-field">
                        <label>Odak</label>
                        <input type="number" value={focusDuration} onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setFocusDuration(val);
                          if (!isRunning) { setDefaultTime(val * 60); setTimeLeft(val * 60); }
                        }} />
                      </div>
                      <div className="input-field">
                        <label>Kısa Mola</label>
                        <input type="number" value={shortBreakDuration} onChange={(e) => setShortBreakDuration(parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="input-field">
                        <label>Uzun Mola</label>
                        <input type="number" value={longBreakDuration} onChange={(e) => setLongBreakDuration(parseInt(e.target.value) || 1)} />
                      </div>
                    </div>
                  </div>

                  <div className="divider" style={{ margin: '20px 0' }}></div>

                  <div className="settings-group">
                    <div className="settings-header">
                      <Bell size={18} color="var(--accent-cyan)" />
                      <span>Otomasyon</span>
                    </div>
                    <div className="settings-toggle">
                      <span>Molayı Otomatik Başlat</span>
                      <button className={`toggle-pill ${autoStartBreaks ? 'active' : ''}`} onClick={() => setAutoStartBreaks(!autoStartBreaks)}>
                        {autoStartBreaks ? 'Açık' : 'Kapalı'}
                      </button>
                    </div>
                    <div className="settings-toggle">
                      <span>Odağı Otomatik Başlat</span>
                      <button className={`toggle-pill ${autoStartFocus ? 'active' : ''}`} onClick={() => setAutoStartFocus(!autoStartFocus)}>
                        {autoStartFocus ? 'Açık' : 'Kapalı'}
                      </button>
                    </div>
                  </div>

                  <div className="divider" style={{ margin: '20px 0' }}></div>

                  <div className="settings-group">
                    <div className="settings-header">
                      <History size={18} color="var(--accent-cyan)" />
                      <span>Veri Taşınabilirliği</span>
                    </div>
                    <div className="data-actions">
                      <button className="data-btn export" onClick={exportData}>
                        <Download size={16} />
                        <span>Verileri Dışa Aktar</span>
                      </button>
                      <label className="data-btn import">
                        <Upload size={16} />
                        <span>Verileri İçe Aktar</span>
                        <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
                      </label>
                    </div>
                    <p className="settings-hint">İlerleyişinizi ve ayarlarınızı bir JSON dosyası olarak yedekleyin.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
