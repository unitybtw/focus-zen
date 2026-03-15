import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Check, Circle, ListTodo, BarChart3, Clock, Music, X } from 'lucide-react';
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
  const defaultTime = 25 * 60;
  const breakTime = 5 * 60;
  const [timeLeft, setTimeLeft] = useState(defaultTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const audioRef = useRef(null); // Reference for Howler instance

  useEffect(() => {
    // Initialize Howler with local lofi track downloaded to public folder
    audioRef.current = new Howl({
      src: ['/lofi.mp3'],
      loop: true,
      volume: 0.4,
      html5: true // Force HTML5 Audio so it streams properly without filling RAM
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.unload();
      }
    };
  }, []);

  const toggleLofi = () => {
    if (!ambientPlaying) {
      audioRef.current.play();
      setAmbientPlaying(true);
    } else {
      audioRef.current.pause();
      setAmbientPlaying(false);
    }
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

  // Sound Synthesizer (No external files needed)
  const playAlarmSound = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtxRef.current;
    
    // Cyberpunk synth beep
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  const handleSessionEnd = () => {
    playAlarmSound();
    if (!isBreak) {
      setTotalPomodoros(prev => prev + 1);
      gainXp(50); // 50 XP for focusing
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

  const closeApp = () => {
    if (window.require) {
      const { app } = window.require('electron');
      app?.quit();
    } else {
      window.close();
    }
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
            <div className="brand-icon">⚡</div>
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

          <div className="ambient-toggle" onClick={toggleLofi}>
            <div className={`visualizer ${ambientPlaying ? 'playing' : ''}`}>
              <span></span><span></span><span></span><span></span>
            </div>
            <Music size={16} />
            <span style={{fontSize: '0.8rem'}}>Lo-Fi</span>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="content-area">
          {/* Header */}
          <header className="header no-drag">
            <div className="user-profile">
              <div className="level-badge">LVL {level}</div>
              <div className="xp-bar-container">
                <div className="xp-bar" style={{width: `${(xp / xpPerLevel) * 100}%`}}></div>
              </div>
              <span className="xp-text">{xp}/{xpPerLevel} XP</span>
            </div>
            <button className="close-btn" onClick={closeApp}><X size={18} /></button>
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

                <div className="quote-container">
                   <p>"{currentQuote}"</p>
                </div>
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
                  {tasks.map(task => (
                    <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`} onClick={() => toggleTask(task.id)}>
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
                <h2>İstatistikler</h2>
                
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>Gelişim</h3>
                    <div className="stat-value highlight">{level}</div>
                    <p className="stat-desc">Mevcut Seviye</p>
                  </div>
                  <div className="stat-card">
                    <h3>Odak</h3>
                    <div className="stat-value">{totalPomodoros * 25}</div>
                    <p className="stat-desc">Dakika</p>
                  </div>
                  <div className="stat-card">
                    <h3>Başarı</h3>
                    <div className="stat-value">{tasksCompleted}</div>
                    <p className="stat-desc">Görev Tamamlandı</p>
                  </div>
                </div>

                <div className="radar-container" style={{background: 'rgba(255,255,255,0.02)'}}>
                   <div style={{color: 'var(--text-muted)', textAlign: 'center', opacity: 0.6}}>
                     Çalışma alışkanlıkları grafiği çok yakında eklenecek.
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
