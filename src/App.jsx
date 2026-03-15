/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Check, Circle, ListTodo, BarChart3, Clock, Music, X, ChevronLeft, ChevronRight, Focus, Cloud, Wind, Zap, Tag, History, Trophy, Target, TrendingUp, Settings as SettingsIcon, Settings2, Bell, Volume2, Flag, ChevronUp, ChevronDown, ListFilter, CloudRain, Trees, Download, Upload, Info, Minimize2, Maximize2 } from 'lucide-react';
import { Howl } from 'howler';
import './index.css';

function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('timer'); // timer, tasks, stats

  // Gamification System
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('xp')) || 0);
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem('level')) || 1);
  const [dailyGoal] = useState(8); // 8 Pomodoros per day
  const [totalPomodoros, setTotalPomodoros] = useState(() => parseInt(localStorage.getItem('totalPomodoros')) || 0);
  const [tasksCompleted, setTasksCompleted] = useState(() => parseInt(localStorage.getItem('tasksCompleted')) || 0);

  // Elite Achievements System [NEW]
  const [achievements, setAchievements] = useState(() => {
    const saved = localStorage.getItem('achievements');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'early_riser', title: 'Erken Kalkan', description: 'Günün ilk seansını tamamla', icon: '🌅', unlocked: false },
      { id: 'deep_focus', title: 'Derin Odak', description: '4 seans üst üste tamamla', icon: '🧠', unlocked: false },
      { id: 'task_master', title: 'Görev Ustası', description: '10 görev tamamla', icon: '⚔️', unlocked: false },
      { id: 'zen_elite', title: 'Zen Elite', description: '100 seans tamamlayarak bir efsane ol', icon: '💎', unlocked: false }
    ];
  });

  // Zen Mode State [NEW]
  const [isZen, setIsZen] = useState(false);

  // Timer States
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [type, setType] = useState('focus'); // focus, short, long
  const [defaultTime, setDefaultTime] = useState(25 * 60);

  // Settings & Automation [NEW]
  const [focusDuration, setFocusDuration] = useState(() => parseInt(localStorage.getItem('focusDuration')) || 25);
  const [shortBreakDuration, setShortBreakDuration] = useState(() => parseInt(localStorage.getItem('shortBreakDuration')) || 5);
  const [longBreakDuration, setLongBreakDuration] = useState(() => parseInt(localStorage.getItem('longBreakDuration')) || 15);
  const [autoStartBreaks, setAutoStartBreaks] = useState(() => localStorage.getItem('autoStartBreaks') === 'true');
  const [autoStartFocus, setAutoStartFocus] = useState(() => localStorage.getItem('autoStartFocus') === 'true');

  // New History & Analytics [NEW]
  const [focusHistory, setFocusHistory] = useState(() => {
    const saved = localStorage.getItem('focusHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // Tasks System
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = useState('');
  const [inputPriority, setInputPriority] = useState('medium');

  // Ambient Sounds System
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [selectedAmbient, setSelectedAmbient] = useState('lofi'); // lofi, white, rain, forest
  const [volume, setVolume] = useState(0.5);
  
  const lofiRef = useRef(null);
  const soundRefs = useRef({});

  // UTILITIES
  const playSfx = useCallback((sfxType) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (sfxType === 'complete') {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      if (oscillator.frequency.exponentialRampToValueAtTime) {
        oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 1.5);
      }
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.5);
    } else if (sfxType === 'levelup') {
       [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
         const osc = audioCtx.createOscillator();
         const g = audioCtx.createGain();
         osc.connect(g);
         g.connect(audioCtx.destination);
         osc.type = 'triangle';
         osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
         g.gain.setValueAtTime(0.3, audioCtx.currentTime + i * 0.1);
         g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.1 + 0.3);
         osc.start(audioCtx.currentTime + i * 0.1);
         osc.stop(audioCtx.currentTime + i * 0.1 + 0.3);
       });
    }
  }, []);

  const unlockAchievement = useCallback((id) => {
    setAchievements(prev => prev.map(a => 
      (a.id === id && !a.unlocked) ? { ...a, unlocked: true } : a
    ));
  }, []);

  // TAGS
  const tags = [
    { label: 'İş', color: '#3b82f6', icon: <Zap size={10} /> },
    { label: 'Eğitim', color: '#8b5cf6', icon: <Cloud size={10} /> },
    { label: 'Kişisel', color: '#10b981', icon: <Wind size={10} /> }
  ];
  const [activeTagItem, setActiveTagItem] = useState(tags[0]);

  // EFFECTS
  useEffect(() => {
    localStorage.setItem('achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('focusHistory', JSON.stringify(focusHistory));
    localStorage.setItem('focusDuration', focusDuration);
    localStorage.setItem('shortBreakDuration', shortBreakDuration);
    localStorage.setItem('longBreakDuration', longBreakDuration);
    localStorage.setItem('autoStartBreaks', autoStartBreaks);
    localStorage.setItem('autoStartFocus', autoStartFocus);
  }, [focusHistory, focusDuration, shortBreakDuration, longBreakDuration, autoStartBreaks, autoStartFocus]);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const xpNeeded = level * 100;
    if (xp >= xpNeeded) {
      setXp(x => x - xpNeeded);
      setLevel(l => l + 1);
      playSfx('levelup');
    }
    localStorage.setItem('xp', xp);
    localStorage.setItem('level', level);
  }, [xp, level]);

  // TIMER CYCLE
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    playSfx('complete');
    
    if (type === 'focus') {
      setXp(prev => prev + 25);
      setTotalPomodoros(prev => {
        const newVal = prev + 1;
        localStorage.setItem('totalPomodoros', newVal);
        if (newVal === 1) unlockAchievement('early_riser');
        if (newVal === 100) unlockAchievement('zen_elite');
        return newVal;
      });
      
      const newEntry = {
        id: Date.now(),
        type: 'focus',
        duration: focusDuration,
        date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        day: new Date().toLocaleDateString('tr-TR', { weekday: 'short' }),
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        tag: activeTagItem?.label || 'Genel',
        tasksCompleted: 0
      };
      setFocusHistory(prev => [newEntry, ...prev].slice(0, 10));

      if (autoStartBreaks) {
        setType('short');
        setTimeLeft(shortBreakDuration * 60);
        setIsRunning(true);
      } else {
        setType('short');
        setTimeLeft(shortBreakDuration * 60);
      }
    } else {
      if (autoStartFocus) {
        setType('focus');
        setTimeLeft(focusDuration * 60);
        setIsRunning(true);
      } else {
        setType('focus');
        setTimeLeft(focusDuration * 60);
      }
    }
  }, [type, focusDuration, activeTagItem, autoStartBreaks, shortBreakDuration, autoStartFocus, playSfx, unlockAchievement]);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          if (next <= 10 && ambientPlaying) {
            const duckFactor = next / 10;
            if (selectedAmbient === 'lofi' && lofiRef.current) {
              lofiRef.current.volume(volume * duckFactor);
            } else if (soundRefs.current[selectedAmbient]) {
              soundRefs.current[selectedAmbient]?.gain.gain.setTargetAtTime(volume * duckFactor, 0, 0.1);
            }
          }
          return next;
        });
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // SOUND INITIALIZATION
  useEffect(() => {
    lofiRef.current = new Howl({
      src: ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'],
      loop: true,
      volume: volume,
      html5: true
    });

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const createNoise = (color) => {
      const bufferSize = 2 * audioCtx.sampleRate;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (color === 'white') output[i] = white;
        else if (color === 'pink') {
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }
      }
      const source = audioCtx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0;
      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      return { source, gain: gainNode };
    };

    soundRefs.current = {
      white: createNoise('white'),
      rain: createNoise('pink'),
      forest: createNoise('pink'),
    };

    return () => {
      if (lofiRef.current) lofiRef.current.stop();
      Object.values(soundRefs.current).forEach(s => s.source.stop());
    };
  }, []);

  useEffect(() => {
    if (lofiRef.current) lofiRef.current.volume(volume);
    Object.values(soundRefs.current).forEach(s => {
      if (ambientPlaying && selectedAmbient !== 'lofi') {
         s.gain.gain.setTargetAtTime(volume, 0, 0.1);
      }
    });
  }, [volume]);

  // HANDLERS
  const addTask = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const newTask = { id: Date.now(), text: inputValue, completed: false, priority: inputPriority, xpClaimed: false };
      setTasks(prev => [newTask, ...prev]);
      setInputValue('');
    }
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (!t.completed) {
          setXp(x => x + 10);
          setTasksCompleted(c => c + 1);
          return { ...t, completed: true, xpClaimed: true };
        }
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  const toggleLofi = () => {
    if (!ambientPlaying) {
      if (selectedAmbient === 'lofi') lofiRef.current.play();
      else {
        soundRefs.current[selectedAmbient].source.start(0);
        soundRefs.current[selectedAmbient].gain.gain.setTargetAtTime(volume, 0, 0.1);
      }
      setAmbientPlaying(true);
    } else {
      if (selectedAmbient === 'lofi') lofiRef.current.pause();
      else {
        soundRefs.current[selectedAmbient].gain.gain.setTargetAtTime(0, 0, 0.1);
      }
      setAmbientPlaying(false);
    }
  };

  const changeAmbient = (mode) => {
    const wasPlaying = ambientPlaying;
    if (wasPlaying) toggleLofi();
    setSelectedAmbient(mode);
    if (wasPlaying) setTimeout(() => toggleLofi(), 100);
  };

  const startFocus = () => {
    setType('focus');
    setTimeLeft(focusDuration * 60);
    setIsRunning(true);
    if (lofiRef.current) lofiRef.current.volume(volume);
  };

  const startShortBreak = () => {
    setType('short');
    setTimeLeft(shortBreakDuration * 60);
    setIsRunning(true);
  };

  const startLongBreak = () => {
    setType('long');
    setTimeLeft(longBreakDuration * 60);
    setIsRunning(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(defaultTime);
  };

  const toggleZen = () => setIsZen(!isZen);

  const exportData = () => {
    const data = { xp, level, totalPomodoros, tasksCompleted, achievements, focusDuration, shortBreakDuration, longBreakDuration, autoStartBreaks, autoStartFocus, focusHistory, tasks };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focuszen-backup-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.xp !== undefined) setXp(data.xp);
        if (data.level !== undefined) setLevel(data.level);
        if (data.totalPomodoros !== undefined) setTotalPomodoros(data.totalPomodoros);
        if (data.tasksCompleted !== undefined) setTasksCompleted(data.tasksCompleted);
        alert('Veriler başarıyla yüklendi!');
      } catch (err) {
        console.error(err);
        alert('Hata: Geçersiz dosya formatı.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`app-wrapper ${isRunning ? 'is-focusing' : ''} ${isZen ? 'zen-mode' : ''}`}>
      <div className="ambient-blob blob-1"></div>
      <div className="ambient-blob blob-2"></div>
      
      <div className="glass-container">
        <div className="drag-region"></div>
        <nav className="sidebar no-drag">
          <div className="brand">
            <div className="brand-icon elite-glow">
              <img src="/assets/icon-elite.png" alt="FocusZen Elite" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            </div>
          </div>
          <div className="nav-items">
            <button className={`nav-btn ${activeTab === 'timer' ? 'active' : ''}`} onClick={() => setActiveTab('timer')}>
              <Clock size={20} />
              <span>Zaman</span>
            </button>
            <button className={`nav-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
              <ListTodo size={20} />
              <span>İşler</span>
              {tasks.filter(t => !t.completed).length > 0 && <div className="task-badge">{tasks.filter(t => !t.completed).length}</div>}
            </button>
            <button className={`nav-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
              <BarChart3 size={20} />
              <span>Performans</span>
            </button>
            <button className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <Settings2 size={20} />
              <span>Ayarlar</span>
            </button>
            <button className={`nav-btn ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
              <Info size={20} />
              <span>Hakkında</span>
            </button>
          </div>
          <div className="goal-preview" title={`Günlük Hedef: ${totalPomodoros}/${dailyGoal}`}>
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="circle" strokeDasharray={`${Math.min((totalPomodoros / dailyGoal) * 100, 100)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="goal-text">{totalPomodoros}</div>
          </div>
          <div className="ambient-toggle">
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingBottom: '10px'}} onClick={toggleLofi}>
              <div className={`visualizer ${ambientPlaying ? 'playing' : ''}`}><span></span><span></span><span></span><span></span></div>
              <Music size={20} />
              <span style={{fontSize: '0.75rem', fontWeight: 500}}>Lo-Fi</span>
            </div>
            {ambientPlaying && (
              <div className="lofi-controls no-drag fade-in">
                <div className="ambient-presets">
                  {['lofi', 'white', 'rain', 'forest'].map(m => (
                    <button key={m} className={`preset-btn ${selectedAmbient === m ? 'active' : ''}`} onClick={() => changeAmbient(m)}>
                      {m === 'lofi' && <Music size={14} />}
                      {m === 'white' && <Cloud size={14} />}
                      {m === 'rain' && <CloudRain size={14} />}
                      {m === 'forest' && <Trees size={14} />}
                    </button>
                  ))}
                </div>
                {selectedAmbient === 'lofi' && <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="volume-slider" />}
              </div>
            )}
          </div>
        </nav>
        <main className="content-area">
          <div key={activeTab} className="tab-wrapper fade-blur-in">
            <header className="header no-drag">
              <div className="header-spacers"></div>
              <div className="theme-selector-bar">
                {[{ id: 'midnight', color: '#3b82f6' }, { id: 'forest', color: '#10b981' }, { id: 'ember', color: '#f43f5e' }, { id: 'lavender', color: '#8b5cf6' }].map(t => (
                  <button key={t.id} className="theme-dot" style={{ backgroundColor: t.color }} onClick={() => document.documentElement.setAttribute('data-theme', t.id)} title={t.id.charAt(0).toUpperCase() + t.id.slice(1)} />
                ))}
                <div className="v-divider"></div>
                <button className={`zen-toggle-btn ${isZen ? 'active' : ''}`} onClick={toggleZen} title={isZen ? 'Hızlı Modu Kapat' : 'Zen (Minimalist) Modu Aç'}>
                  {isZen ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
              </div>
              <div className="profile-compact">
                <div className="xp-bar-container">
                  <div className="xp-label">Lvl {level}</div>
                  <div className="xp-progress-bg"><div className="xp-progress-fill" style={{ width: `${(xp / (level * 100)) * 100}%` }}></div></div>
                </div>
              </div>
            </header>
            {activeTab === 'timer' && (
              <div className="timer-tab">
                <div className="timer-display-container">
                  <div className={`timer-ring ${type}`}>
                    <svg viewBox="0 0 100 100">
                      <circle className="ring-bg" cx="50" cy="50" r="45" />
                      <circle className="ring-progress" cx="50" cy="50" r="45" style={{ strokeDasharray: 283, strokeDashoffset: 283 - (timeLeft / defaultTime) * 283 }} />
                    </svg>
                    <div className="timer-content">
                      <span className="timer-type">{type === 'focus' ? 'Odaklanma' : 'Mola'}</span>
                      <span className="timer-clock">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>
                <div className="tag-selector slide-up">
                  {tags.map(t => <button key={t.label} className={`tag-btn ${activeTagItem.label === t.label ? 'active' : ''}`} onClick={() => setActiveTagItem(t)}>{t.icon}<span>{t.label}</span></button>)}
                </div>
                <div className="timer-controls slide-up">
                  <button className="ctrl-btn secondary" onClick={resetTimer} title="Sıfırla"><RotateCcw size={22} /></button>
                  <button className="ctrl-btn primary" onClick={() => setIsRunning(!isRunning)}>{isRunning ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" style={{ marginLeft: '4px' }} />}</button>
                  <button className="ctrl-btn secondary" onClick={handleTimerComplete} title="Atla"><Check size={22} /></button>
                </div>
              </div>
            )}
            {activeTab === 'tasks' && (
              <div className="tasks-tab">
                <div className="tasks-header slide-up">
                  <div className="input-glass">
                    <input type="text" placeholder="Yeni bir görev ekle..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={addTask} />
                    <div className="priority-select">{['low', 'medium', 'high'].map(p => <button key={p} className={`prio-btn ${inputPriority === p ? 'active' : ''} ${p}`} onClick={() => setInputPriority(p)} title={`${p.charAt(0).toUpperCase() + p.slice(1)} Öncelik`}><Flag size={14} /></button>)}</div>
                  </div>
                </div>
                <div className="task-list">
                  {tasks.map((task, index) => (
                    <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`} onClick={() => toggleTask(task.id)} style={{ animationDelay: `${index * 0.05}s` }}>
                      <button className="check-btn">{task.completed ? <Check className="check-icon" size={18} /> : <Circle className="uncheck-icon" size={18} />}</button>
                      <div className="task-content"><span className="task-text">{task.text}</span><div className="task-meta"><span className={`prio-badge ${task.priority || 'medium'}`}>{task.priority === 'high' ? 'Yüksek' : task.priority === 'low' ? 'Düşük' : 'Orta'}</span></div></div>
                      {task.completed && task.xpClaimed && <span className="xp-floating">+10 XP</span>}
                    </div>
                  ))}
                  {tasks.length === 0 && <div className="empty-state"><ListTodo size={40} opacity={0.3} /><p>Tüm görevler tamamlandı, harika iş çıkardın.</p></div>}
                </div>
              </div>
            )}
            {activeTab === 'stats' && (
              <div className="stats-tab fade-in">
                <h2>Performans Analizi</h2>
                <div className="stats-grid">
                  <div className="stat-card"><div className="stat-icon-wrapper"><Trophy size={18} /></div><h3>Gelişim</h3><div className="stat-value highlight">{level}</div><p className="stat-desc">Mevcut Seviye</p></div>
                  <div className="stat-card"><div className="stat-icon-wrapper"><Target size={18} /></div><h3>Odak</h3><div className="stat-value">{totalPomodoros}</div><p className="stat-desc">Oturum</p></div>
                  <div className="stat-card"><div className="stat-icon-wrapper"><TrendingUp size={18} /></div><h3>Başarı</h3><div className="stat-value">{tasksCompleted}</div><p className="stat-desc">Görev Tamamlandı</p></div>
                </div>
                <div className="achievements-section slide-up">
                  <div className="section-header"><Trophy size={18} color="var(--accent-cyan)" /><h3>Başarımlar</h3></div>
                  <div className="achievements-grid">
                    {achievements.map(a => <div key={a.id} className={`achievement-card ${a.unlocked ? 'unlocked' : 'locked'}`} title={a.description}><div className="a-icon">{a.icon}</div><div className="a-info"><span className="a-title">{a.title}</span></div></div>)}
                  </div>
                </div>
                <div className="analytics-card slide-up">
                  <div className="analytics-header"><TrendingUp size={18} color="var(--accent-cyan)" /><h3>Odak Akışı</h3></div>
                  <div className="pulse-chart-container">
                    <svg viewBox="0 0 400 100" className="pulse-svg">
                      <defs><linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.4" /><stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" /></linearGradient></defs>
                      <path className="pulse-path" d={`M 0 80 ${focusHistory.map((h, i) => `L ${(i + 1) * 80} ${80 - (h.duration / 60) * 50}`).join(' ')} L 400 80`} fill="url(#chartGradient)" />
                      <path className="pulse-line" d={`M 0 80 ${focusHistory.map((h, i) => `L ${(i + 1) * 80} ${80 - (h.duration / 60) * 50}`).join(' ')}`} fill="none" stroke="var(--accent-cyan)" strokeWidth="2" />
                      {focusHistory.map((h, i) => <circle key={h.id} cx={(i + 1) * 80} cy={80 - (h.duration / 60) * 50} r="3" fill="var(--accent-cyan)" className="pulse-point" />)}
                    </svg>
                    <div className="chart-labels"><span>Geçmiş Seanslar (Süre Yoğunluğu)</span></div>
                  </div>
                </div>
                {focusHistory.length > 0 && (
                  <div className="history-section fade-in" style={{ marginTop: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingLeft: '5px' }}><History size={18} color="var(--accent-cyan)" /><h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Son Aktivite</h3></div>
                    <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {focusHistory.map(entry => (
                        <div key={entry.id} className="history-item slide-up">
                          <div className="h-left"><div className="h-date-box"><span className="h-day">{entry.day || '...'}</span><span className="h-date">{entry.date || '...'}</span></div><div className="h-tag"><span>{tags.find(t => t.label === entry.tag)?.icon}</span><span>{entry.tag}</span></div></div>
                          <div className="h-right"><div className="h-meta"><span className="h-duration">{entry.duration} dk</span><span className="h-time">{entry.time}</span></div>{entry.tasksCompleted > 0 && <div className="h-badge" title="Tamamlanan Görevler"><Check size={10} /><span>{entry.tasksCompleted}</span></div>}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="settings-tab slide-up" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
                <h2>Uygulama Ayarları</h2>
                <div className="settings-card">
                  <div className="settings-group">
                    <div className="settings-header"><Clock size={18} color="var(--accent-cyan)" /><span>Süre Ayarları (Dakika)</span></div>
                    <div className="settings-inputs">
                      <div className="input-field"><label>Odak</label><input type="number" value={focusDuration} onChange={(e) => { const val = parseInt(e.target.value) || 1; setFocusDuration(val); if (!isRunning) { setType('focus'); setTimeLeft(val * 60); } }} /></div>
                      <div className="input-field"><label>Kısa Mola</label><input type="number" value={shortBreakDuration} onChange={(e) => setShortBreakDuration(parseInt(e.target.value) || 1)} /></div>
                      <div className="input-field"><label>Uzun Mola</label><input type="number" value={longBreakDuration} onChange={(e) => setLongBreakDuration(parseInt(e.target.value) || 1)} /></div>
                    </div>
                  </div>
                  <div className="divider" style={{ margin: '20px 0' }}></div>
                  <div className="settings-group">
                    <div className="settings-header"><Bell size={18} color="var(--accent-cyan)" /><span>Otomasyon</span></div>
                    <div className="settings-toggle"><span>Molayı Otomatik Başlat</span><button className={`toggle-pill ${autoStartBreaks ? 'active' : ''}`} onClick={() => setAutoStartBreaks(!autoStartBreaks)}>{autoStartBreaks ? 'Açık' : 'Kapalı'}</button></div>
                    <div className="settings-toggle"><span>Odağı Otomatik Başlat</span><button className={`toggle-pill ${autoStartFocus ? 'active' : ''}`} onClick={() => setAutoStartFocus(!autoStartFocus)}>{autoStartFocus ? 'Açık' : 'Kapalı'}</button></div>
                  </div>
                  <div className="divider" style={{ margin: '20px 0' }}></div>
                  <div className="settings-group">
                    <div className="settings-header"><History size={18} color="var(--accent-cyan)" /><span>Veri Taşınabilirliği</span></div>
                    <div className="data-actions"><button className="data-btn export" onClick={exportData}><Download size={16} /><span>Verileri Dışa Aktar</span></button><label className="data-btn import"><Upload size={16} /><span>Verileri İçe Aktar</span><input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} /></label></div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'about' && (
              <div className="about-tab slide-up" style={{ maxWidth: '500px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
                <div className="brand-hero"><div className="about-icon-wrapper"><Focus size={48} color="var(--accent-cyan)" /></div><h1>FocusZen</h1><p className="version-badge">Version 2.0.0 Pro</p></div>
                <div className="about-card">
                  <p className="vision-text">FocusZen, derin odaklanma ve sürdürülebilir üretkenlik için modern bir dijital sığınaktır. Nörobilim ve minimalizmden ilham alarak tasarlandı.</p>
                  <div className="divider" style={{ margin: '20px 0' }}></div>
                  <div className="credits-section"><h3>Geliştirme</h3><p>Designed & Built by <strong>Antigravity AI</strong></p><p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '5px' }}>© 2026 FocusZen. Tüm hakları saklıdır.</p></div>
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
