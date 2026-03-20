import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [code, setCode] = useState('');
  const [evaluation, setEvaluation] = useState("");
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pastMistakes, setPastMistakes] = useState([]);

  useEffect(() => {
    const savedName = localStorage.getItem('codeSensei_userName');
    if (savedName) {
      setUserName(savedName);
      setIsLoggedIn(true);
    }
    fetchQuestion();
  }, []);

  const fetchQuestion = async () => {
    setErrorMsg('');
    try {
      const response = await axios.get('http://localhost:5000/api/get-question');
      setQuestion(response.data);
    } catch (err) {
      console.error("Failed to fetch question:", err);
      setErrorMsg("Error loading question. Please check if backend is running on port 5000.");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem('codeSensei_userName', userName.trim());
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('codeSensei_userName');
    setUserName('');
    setIsLoggedIn(false);
    setEvaluation("");
    setCode('');
    setErrorMsg('');
    setPastMistakes([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !userName.trim() || !question) return;

    setLoading(true);
    setEvaluation("");
    setErrorMsg('');

    try {
      const response = await axios.post('http://localhost:5000/api/submit', {
        userName,
        code,
        topic: question.topic
      });
      
      setPastMistakes(response.data.pastMistakes || []);
      setEvaluation(response.data.feedback);
    } catch (error) {
      console.error("Submit error:", error);
      setErrorMsg(error.response?.data?.error || "Failed to connect to the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const renderEvaluation = (text) => {
    if (!text) return null;
    const lines = text.split('\n').filter(l => l.trim());
    const isCorrect = lines.some(l => l.includes('Status:') && l.toLowerCase().includes('correct') && !l.toLowerCase().includes('incorrect'));
    
    return (
      <div className="evaluation-content">
        <h3 style={{ color: isCorrect ? '#3fb950' : '#f85149', marginBottom: '1rem', fontSize: '1.25rem' }}>
           {isCorrect ? '✅ Correct' : '❌ Incorrect'}
        </h3>
        {lines.map((l, i) => {
          if (l.startsWith('Status:')) return null;
          if (l.startsWith('Mistake:')) return <p key={i}>Mistake: {l.replace('Mistake:', '').trim()}</p>;
          if (l.startsWith('Hint:')) return <p key={i}>💡 Hint: {l.replace('Hint:', '').trim()}</p>;
          if (l.startsWith('Warning:')) return <p key={i}>⚠️ Warning: {l.replace('Warning:', '').trim()}</p>;
          return <p key={i}>{l}</p>;
        })}
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="container login-container dark-theme">
        <header className="header">
          <h1>CodeSensei <span className="badge">Beta</span></h1>
          <p>Your intelligent code review assistant</p>
        </header>
        <main className="main-content">
          <section className="card login-card">
            <h2>Welcome!</h2>
            <p>Please enter your name to begin practicing.</p>
            <form onSubmit={handleLogin} className="login-form">
              <input
                 type="text"
                 className="user-name-input"
                 placeholder="e.g. Alice"
                 value={userName}
                 onChange={(e) => setUserName(e.target.value)}
                 required
                 autoFocus
               />
               <button type="submit" className="submit-btn login-btn" disabled={!userName.trim()}>
                 Start Practice
               </button>
            </form>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="container dark-theme">
      <header className="header">
        <h1>CodeSensei <span className="badge">Beta</span></h1>
        <p>Your intelligent code review assistant</p>
      </header>
      
      <main className="main-content">
        
        <div className="user-greeting">
          <span className="greeting-text">Welcome back, {userName}!</span>
          <button onClick={handleLogout} className="logout-btn">Change User</button>
        </div>

        {errorMsg && (
          <div className="error-banner">
            {errorMsg}
          </div>
        )}

        {/* SECTION 1: QUESTION */}
        <section className="card">
          <div className="card-header">
            <h2>1. Problem Statement</h2>
            <button type="button" className="refresh-btn" onClick={fetchQuestion} disabled={!question || loading}>
              Change Question
            </button>
          </div>
          {question ? (
            <div className="question-content">
              <span className="topic-badge">{question.topic}</span>
              <h3 className="question-title">{question.title}</h3>
              <p className="question-desc">{question.description}</p>
            </div>
          ) : (
            <div className="loading-state">
              <p>Loading question...</p>
            </div>
          )}
        </section>

        {/* SECTION 2: CODE INPUT */}
        <section className="card">
          <div className="card-header">
            <h2>2. Code Input</h2>
          </div>
          
          <div>
            <h3 style={{ color: "#ffbd2e", marginTop: 0 }}>⚠️ Past Mistakes</h3>
            {pastMistakes.length === 0 ? (
              <p style={{ margin: 0, color: "#8b949e" }}>No past mistakes yet</p>
            ) : (
              <ul>
                {pastMistakes.map((m, i) => (
                  <li key={i}>
                    {m.data?.mistake || m.mistake || (typeof m === 'string' ? m : JSON.stringify(m))}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleSubmit} className="code-form" style={{ marginTop: "1rem" }}>
            <div className="input-group">
              <div className="editor-container">
                <textarea
                  className="code-input"
                  placeholder="function solve() {&#10;  // your code here&#10;}"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck="false"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || !code.trim() || !userName.trim() || !question}
            >
              Submit Code for Review
            </button>
            {loading && <p style={{ marginTop: "1rem", color: "#58a6ff", fontWeight: "600", textAlign: "center" }}>⏳ Analyzing your solution...</p>}
          </form>
        </section>

        {/* SECTION 3: FEEDBACK */}
        {evaluation && !loading && (
          <section className="card evaluation-card">
            {renderEvaluation(evaluation)}
          </section>
        )}

      </main>
    </div>
  );
}

export default App;
