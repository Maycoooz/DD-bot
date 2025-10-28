import React, { useState, useEffect, useRef } from "react";
import '../styles/ChildrenDashboard.css';
import logoImg from "../assets/logo.png";
import api from "../api/axiosConfig";

const SUGGESTIONS = ["Bedtime stories for 5", "Funny books for 6-7", "Stories about friendship", "First day of school"];

export default function ChildSearchChat({ userId, selectedChatId, setSelectedChatId, fetchChatHistory  }) {
  const [chat, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatListRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ✅ Store active chat in localStorage to persist after refresh
  const [activeChatId, setActiveChatId] = useState(
    selectedChatId || localStorage.getItem("activeChatId") || null
  );

  useEffect(() => {
    fetchChats();
  }, []);

  // ✅ When user selects a chat, save to localStorage
  useEffect(() => {
    if (selectedChatId) {
      setActiveChatId(selectedChatId);
      localStorage.setItem("activeChatId", selectedChatId);
      fetchChatMessages(selectedChatId);
    }
  }, [selectedChatId]);

  // ✅ On refresh, re-fetch last active chat messages
  useEffect(() => {
    if (activeChatId) {
      fetchChatMessages(activeChatId);
    }
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function fetchChats() {
    try {
      const res = await api.get(`/child/${userId}/chat`);
      setChats(res.data);
    } catch (err) {
      console.error("fetchChats:", err);
    }
  }

  async function fetchChatMessages(chat_id) {
    setChatLoading(true);
    try {
      const res = await api.get(`/chat/${chat_id}/message`);
      setMessages(res.data || []);
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

  const userMsg = { 
    id: `tmp-${Date.now()}`, 
    sender: "user", 
    text: msg, 
    created_at: new Date().toISOString() 
  };
  setMessages(prev => [...prev, userMsg]);
  setInput("");
  setLoading(true);
 
  try {
    // 🚀 Send message to backend chatbot
    const res = await api.post("/chatbot", {
      userId,
      chat_id: selectedChatId || null, // allow backend to create new chat if needed
      message: msg,
    });

    const data = res.data;

    if (data.new_chat || !activeChatId) {
  setActiveChatId(data.chat_id);
  localStorage.setItem("activeChatId", data.chat_id);

  // ✅ Notify parent (ChildDashboard) to refresh sidebar instantly
  if (fetchChatHistory) {
    await fetchChatHistory();
  }

  // ✅ Also update the selected chat in parent
  if (setSelectedChatId) {
    setSelectedChatId(data.chat_id);
  }

  // ✅ Load messages of the new chat immediately
  await fetchChatMessages(data.chat_id);
}


    // ✅ Add bot reply
    const botMsg = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text: data.reply || "Sorry, I couldn’t find anything.",
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, botMsg]);
  } catch (err) {
    console.error("sendMessage:", err);
    setMessages(prev => [
      ...prev,
      { id: `err-${Date.now()}`, sender: "bot", text: "Error sending message." },
    ]);
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
        {!activeChatId && <div className="child-dashboard__placeholder">Key in something to start a chat with DD Bot</div>}

        <div className="child-dashboard__messages-list">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`child-dashboard__message-row ${
                m.sender === "user" ? "user" : "bot"
              }`}
            >
              <div className="child-dashboard__message-avatar">
                {m.sender === "user" ? "🧑" : "🤖"}
              </div>
              <div className="child-dashboard__message-bubble">
                {m.text.split("\n").map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
                {m.intent && (
                  <small className="intent-label">
                    Intent: {m.intent} ({(m.confidence * 100).toFixed(1)}%)
                  </small>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="child-dashboard__input-area">
        <div className="child-dashboard__suggestions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="child-dashboard__suggestion"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="child-dashboard__input-row">
          <input
            className="child-dashboard__textinput"
            placeholder="Ask for a story… e.g., “funny books for age 7”"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            className="child-dashboard__send-btn"
            onClick={() => sendMessage()}
            disabled={loading}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </footer>
    </>
  );
}
