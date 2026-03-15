import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Günün en önemli görevini belirle", completed: false },
    { id: 2, text: "FocusZen ile 1. Pomodoro Seansı", completed: false },
    { id: 3, text: "GitHub deposunu oluştur", completed: false }
  ]);
  const [inputValue, setInputValue] = useState("");
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // Play a notification sound here in the future
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const addTask = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      setTasks([...tasks, { id: Date.now(), text: inputValue, completed: false }]);
      setInputValue("");
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
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
    <div className={`glass-container ${isRunning ? 'timer-running' : ''}`}>
      <div className="drag-region"></div>
      
      <header className="app-header">
        <h1><span>⚡</span> FocusZen</h1>
        <div className="no-drag" style={{cursor: 'pointer', padding: '10px'}} onClick={closeApp}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L13 13M1 13L13 1" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </header>

      <main className="app-content">
        {/* Timer Panel */}
        <section className="panel no-drag">
          <h2>Pomodoro / Focus</h2>
          <div className="timer-display">
            {formatTime(timeLeft)}
          </div>
          <div className="btn-group">
            <button className="btn primary" onClick={toggleTimer}>
              {isRunning ? 'DURAKLAT' : 'BAŞLA'}
            </button>
            <button className="btn" onClick={resetTimer}>SIFIRLA</button>
          </div>
          
          <div style={{marginTop: 'auto', textAlign: 'center', color: 'var(--text-secondary)'}}>
            <p>Hedef: Kodlamaya 25 dakika kesintisiz odaklan.</p>
          </div>
        </section>

        {/* Tasks Panel */}
        <section className="panel no-drag">
          <h2>Günlük Görevler</h2>
          <input 
            type="text" 
            className="task-input" 
            placeholder="Yeni görev ekle ve Enter'a bas..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={addTask}
          />
          <ul className="task-list">
            {tasks.map(task => (
              <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <input 
                  type="checkbox" 
                  className="task-checkbox" 
                  checked={task.completed} 
                  onChange={() => toggleTask(task.id)} 
                />
                <span className="task-text">{task.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default App;
