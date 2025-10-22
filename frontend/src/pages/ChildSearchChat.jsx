import React, { useState, useEffect, useRef } from "react";
import '../styles/ChildrenDashboard.css';
import logoImg from "../assets/logo.png";

const SUGGESTIONS = ["Bedtime stories for 5", "Funny books for 6-7", "Stories about friendship", "First day of school"];

export default function ChildSearchChat({ userId, selectedChatId}) {
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatListRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChatId) fetchChatMessages(selectedChatId);
  }, [selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function fetchChats() {
    try {
      const res = await fetch(`/api/user/${userId}/chats`);
      if (!res.ok) throw new Error("Failed to fetch chats");
      setChats(await res.json());
    } catch (err) {
      console.error("fetchChats:", err);
    }
  }

  async function fetchChatMessages(chatId) {
  setChatLoading(true);
  try {
    const res = await fetch(`/api/chats/${chatId}/messages`);
    if (!res.ok) throw new Error("Failed to fetch messages");
    const data = await res.json();
    setMessages(data || []);
  } catch (err) {
    console.error("fetchChatMessages:", err);
    setMessages([]);
  } finally {
    setChatLoading(false);
  }
}

  async function sendMessage(text) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    const userMsg = { id: `tmp-${Date.now()}`, sender: "user", text: msg, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, session_id: userId, chat_id: selectedChatId }),
      });
      const data = await res.json();
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.reply || "Sorry, no reply.",
        items: data.items || [],
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
      fetchChats();
    } catch (err) {
      console.error("sendMessage:", err);
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, sender: "bot", text: "Error sending message." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="child-dashboard__chat-header">
        <div className="child-dashboard__chat-brand">
          <img src={logoImg} alt="bot" className="child-dashboard__bot-icon" />
          <div>
            <div className="child-dashboard__bot-title">DD Bot</div>
            <div className="child-dashboard__bot-sub">Your friendly reading buddy!</div>
          </div>
        </div>
      </header>

      <main className="child-dashboard__messages">
        {chatLoading && <div className="child-dashboard__loading">Loading messages...</div>}
        {!selectedChatId && <div className="child-dashboard__placeholder">Select a chat to start</div>}

        <div className="child-dashboard__messages-list">
          {messages.map(m => (
            <div key={m.id} className={`child-dashboard__message-row ${m.sender === "user" ? "user" : "bot"}`}>
              <div className="child-dashboard__message-avatar">{m.sender === "user" ? "🧑" : "🤖"}</div>
              <div className="child-dashboard__message-bubble">
                {m.text.split("\n").map((l, i) => <p key={i}>{l}</p>)}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="child-dashboard__input-area">
        <div className="child-dashboard__suggestions">
          {SUGGESTIONS.map(s => <button key={s} onClick={() => sendMessage(s)} className="child-dashboard__suggestion">{s}</button>)}
        </div>

        <div className="child-dashboard__input-row">
          <input
            className="child-dashboard__textinput"
            placeholder="Ask for a story… e.g., “funny books for age 7”"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button className="child-dashboard__send-btn" onClick={() => sendMessage()} disabled={loading}>
            {loading ? "..." : "Send"}
          </button>
        </div>
      </footer>
    </>
  );
}
