import React, { useEffect, useRef, useState } from "react";
import '../styles/ChildrenDashboard.css';
/**
 * @typedef {"user" | "bot"} Sender
 */

/**
 * @typedef {Object} BookCard
 * @property {string} id
 * @property {string} title
 * @property {string} [authors]
 * @property {string} [series]
 * @property {number} age_min
 * @property {number} age_max
 * @property {string} [badge]  // e.g., "4.9★ | 441 ratings | Best Seller"
 * @property {string} [why]
 * @property {string} [link]   // URL for more info
 */

/**
 * @typedef {Object} Message
 * @property {Sender} sender
 * @property {string} text
 * @property {BookCard[]} [items]
 */

const SUGGESTIONS = [
  "Bedtime stories for 5",
  "Funny books for 6-7",
  "Stories about friendship",
  "First day of school",
];

export default function ChildDashboard() {
  const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
  const role = localStorage.getItem("userRole") || "child";

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: `Hi ${profile.first_name || "there"}! I’m DD Bot.\nTry asking: “bedtime stories for a 6 year old” or tap a suggestion below.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = profile.id || "u1";
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg) return;

    setMessages((prev) => [...prev, { sender: "user", text: msg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, session_id: sessionId }),
      });
      const data = await res.json();
      const botMsg = {
        sender: "bot",
        text: data.reply || "I’m thinking…",
        items: Array.isArray(data.items) ? data.items : undefined,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Uh-oh! I had trouble fetching results. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* --- Child Profile Header --- */}
      <header className="child-header">
        <h1>Welcome, {profile.first_name || "Kid"}!</h1>
        <p className="child-role">Role: {role}</p>
      </header>

      {/* --- Chatbot Section --- */}
      <div className="chat-shell">
        <header className="chat-header">
          <div className="brand">
            <span className="avatar bot">
              <img src="/robot.png" alt="DD Bot" width={22} height={22} />
            </span>
            <div>
              <h2 className="brand-title">DD Bot</h2>
              <p className="brand-sub">Your friendly reading buddy!</p>
            </div>
          </div>
        </header>

        <main className="chat-area">
          {messages.map((m, i) => (
            <div key={i} className={`row ${m.sender}`}>
              <span className={`avatar ${m.sender}`}>
                {m.sender === "user" ? "🧑" : <img src="/robot.png" alt="DD Bot" width={22} height={22} />}
              </span>
              <div className={`bubble ${m.sender}`}>
                {m.text.split("\n").map((line, idx) => (
                  <p key={idx} className="bubble-line">{line}</p>
                ))}

                {/* Book cards */}
                {!!m.items?.length && (
                  <div className="cards">
                    {m.items.map((b) => (
                      <article key={b.id} className="book-card">
                        <h3 className="book-title">{b.title}</h3>
                        <p className="book-meta">
                          Age {b.age_min}-{b.age_max}
                          {b.badge ? <> · <span>{b.badge}</span></> : null}
                        </p>
                        {b.series ? <p className="book-series">{b.series}</p> : null}
                        {b.why ? <p className="book-why">Why: {b.why}</p> : null}
                        <div className="card-actions">
                          {b.link && (
                            <a className="btn primary" href={b.link} target="_blank" rel="noreferrer">
                              Open Link
                            </a>
                          )}
                          <button
                            className="btn"
                            onClick={() => sendMessage(`similar to ${b.id}`)}
                            title="More like this"
                          >
                            More like this
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="row bot">
              <span className="avatar bot">🤖</span>
              <div className="bubble bot">
                <div className="dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />

          {/* Suggestions */}
          <div className="chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
        </main>

        {/* Input */}
        <footer className="input-bar">
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask for a story… e.g., “funny books for age 7”"
          />
          <button className="send-btn" onClick={() => sendMessage()}>
            Send
          </button>
        </footer>
      </div>
    </div>
  );
}
