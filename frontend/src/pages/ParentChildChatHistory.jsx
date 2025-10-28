import React, { useState, useEffect } from "react";
import api from "../api/axiosConfig";
import "../styles/ParentChildChatHistory.css";

function ParentChildChatHistory() {
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [chats, setChats] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  //  Fetch the list of children for this parent
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await api.get("/parent/my-children");
        setChildrenList(res.data);
        if (res.data.length > 0) setSelectedChildId(res.data[0].id);
      } catch (err) {
        console.error(err);
        setError("Failed to load children.");
      }
    };
    fetchChildren();
  }, []);

  // Fetch chats for the selected child
  useEffect(() => {
    if (!selectedChildId) return;
    const fetchChats = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/child/${selectedChildId}/chat`);
        setChats(Array.isArray(res.data) ? res.data : []);
        setError("");
      } catch (err) {
        console.error(err);
        setChats([]);
        setError("Failed to load chat history.");
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [selectedChildId]);

  //  When a chat title is clicked, open popup and load messages
  const handleOpenChat = async (chatId) => {
    try {
      const res = await api.get(`/chat/${chatId}/message`); //
      setChatMessages(Array.isArray(res.data) ? res.data : []);
      setSelectedChat(chatId);
      setShowPopup(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load messages.");
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedChat(null);
    setChatMessages([]);
  };

  if (childrenList.length === 0) return <p>No children found.</p>;

  return (
    <div className="child-favorites-dashboard">
      <h2>Child Chat History</h2>

      {/* Select Child */}
      <div style={{ marginBottom: "10px" }}>
        <label>Select Child: </label>
        <select
          value={selectedChildId}
          onChange={(e) => setSelectedChildId(Number(e.target.value))}
        >
          {childrenList.map((child) => (
            <option key={child.id} value={child.id}>
              {child.first_name} {child.last_name}
            </option>
          ))}
        </select>
      </div>

      {/* Chat list display */}
      {loading ? (
        <p>Loading chat history...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : chats.length > 0 ? (
        <ul>
          {chats.map((chat) => (
            <li
              key={chat.id}
              style={{
                marginBottom: "10px",
                cursor: "pointer",
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "8px",
              }}
              onClick={() => handleOpenChat(chat.id)}
            >
              <strong>{chat.title || `Chat ${chat.id}`}</strong>
              <br />
              <small>
                Created:{" "}
                {chat.started_at
                  ? new Date(chat.started_at).toLocaleString()
                  : "N/A"}
              </small>
              <br />
              <small>
                Last Updated:{" "}
                {chat.last_updated
                  ? new Date(chat.last_updated).toLocaleString()
                  : "N/A"}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No chats found for this child.</p>
      )}

      {/* Popup Modal */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-container">
            <button className="close-button" onClick={handleClosePopup}>
              ✖
            </button>
            <h3>Chat Messages</h3>

            {chatMessages.length === 0 ? (
              <p>No messages found for this chat.</p>
            ) : (
              <div className="messages-container">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-bubble ${
                      msg.sender === "user" ? "user-msg" : "bot-msg"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <small>
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleString()
                        : ""}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentChildChatHistory;
