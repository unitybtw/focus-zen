import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Check, Circle, ListTodo, BarChart3, Clock, Music, X, ChevronLeft, ChevronRight, Focus, Cloud, Wind, Zap, Tag, History, Trophy, Target, TrendingUp } from 'lucide-react';
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
  const [dailyGoal] = useState(4);
  const xpPerLevel = level * 100;

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
    }
  }, []);

  // Persistence: Save on change
  useEffect(() => {
    const data = { level, xp, totalPomodoros, tasksCompleted, focusHistory, theme };
    localStorage.setItem('focusZen_progress', JSON.stringify(data));
    document.documentElement.setAttribute('data-theme', theme);
  }, [level, xp, totalPomodoros, tasksCompleted, focusHistory, theme]);

  // Background Noise State (White Noise Synth)
  const [noisePlaying, setNoisePlaying] = useState(false);
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
  }, [currentTrackIndex]); // Re-run when track index changes

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

  const toggleNoise = () => {
    if (!noisePlaying) {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(noiseVolume, ctx.currentTime);
      
      whiteNoise.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      whiteNoise.start();
      noiseNodeRef.current = { source: whiteNoise, gain: gainNode };
      setNoisePlaying(true);
    } else {
      if (noiseNodeRef.current) {
        noiseNodeRef.current.source.stop();
        noiseNodeRef.current = null;
      }
      setNoisePlaying(false);
    }
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
        silent: true // Custom synth plays instead of OS ping
      });
    }

    if (!isBreak) {
      setTotalPomodoros(prev => prev + 1);
      gainXp(50); // 50 XP for focusing
      
      // Add to history
      const newEntry = {
        id: Date.now(),
        tag: sessionTag,
        duration: Math.floor(defaultTime / 60),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setFocusHistory([newEntry, ...focusHistory].slice(0, 5)); // Keep last 5

      setIsBreak(true);
      setTimeLeft(breakTime);
    } else {
      setIsBreak(false);
      setTimeLeft(defaultTime);
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
      setTasks([{ id: Date.now(), text: inputValue, completed: false, xpClaimed: false }, ...tasks]);
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
              <span>İstatistik</span>
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

                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: noisePlaying ? 'var(--accent-cyan)' : 'var(--text-muted)'}}>
                    <Wind size={14} />
                    <span style={{fontSize: '0.75rem'}}>Derin Odak (Gürültü)</span>
                  </div>
                  <button className={`toggle-pill ${noisePlaying ? 'active' : ''}`} onClick={toggleNoise}>
                    {noisePlaying ? 'Açık' : 'Kapalı'}
                  </button>
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
                  <input 
                    type="text" 
                    placeholder="Yeni bir görev ekle ve Enter'a bas..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={addTask}
                  />
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
                      <span className="task-text">{task.text}</span>
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
                <h2>Performans</h2>
                
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

                {focusHistory.length > 0 && (
                  <div className="history-section fade-in" style={{ marginTop: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingLeft: '5px' }}>
                      <History size={18} color="var(--accent-cyan)" />
                      <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Son Aktivite</h3>
                    </div>
                    <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {focusHistory.map(entry => (
                        <div key={entry.id} className="history-item slide-up">
                          <div className="h-tag">
                            <span>{tags.find(t => t.label === entry.tag)?.icon}</span>
                            <span>{entry.tag}</span>
                          </div>
                          <div className="h-meta">
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{entry.duration} dk</span>
                            <span style={{ color: 'var(--text-muted)' }}>{entry.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
