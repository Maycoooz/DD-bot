import React, { useEffect, useRef, useState } from "react";
import '../styles/ChildrenDashboard.css';
import logoImg from "../assets/logo.png";

// Import the new components to be used in the modals
import AddAppReview from './AddAppReview';
import DeleteAppReview from './DeleteAppReview';
import SearchBooks from "./SearchBooks";
import SearchVideos from "./SearchVideos";

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

// This constant is no longer used by the new AddAppReview component,
// but is kept in case other parts of the app reference it.
const REVIEW_TYPES = ["app", "book", "video", "chatbot", "others"];


export default function ChildDashboard() {

  const [currentView, setCurrentView] = useState('chat') // 'chat', 'searchBooks', 'searchVideos'

  // profile/session
  const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
  const userId = profile.id || "u1";
  const username = profile.first_name;

  // chat
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // interests & favorites
  const [allInterests, setAllInterests] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // reviews
  // This state is no longer used by the new DeleteAppReview modal,
  // but is kept for now.
  const [reviews, setReviews] = useState([]); 
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [showDeleteReviewsModal, setShowDeleteReviewsModal] = useState(false);

  // add review form state
  // These are no longer used by the new AddAppReview component.
  const [reviewType, setReviewType] = useState(REVIEW_TYPES[0]);
  const [reviewText, setReviewText] = useState("");
  const [reviewStars, setReviewStars] = useState(5);

  // chat input
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // refs for scrolling
  const chatListRef = useRef(null);
  const messagesEndRef = useRef(null);

  // --- Fetchers ---
  useEffect(() => {
    fetchChats();
    fetchInterests();
    fetchUserInterests();
    fetchFavorites();
  }, []);

  useEffect(() => {
    // load messages when chat selected
    if (selectedChatId) fetchChatMessages(selectedChatId);
    // eslint-disable-next-line
  }, [selectedChatId]);

  useEffect(() => {
    // auto-scroll messages to bottom when changed
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function fetchChats() {
    try {
      const res = await fetch(`/api/user/${userId}/chats`);
      if (!res.ok) throw new Error("Failed to fetch chats");
      const data = await res.json();
      setChats(data || []);
      // keep chat list scrolled to top (or bottom) as required
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

   async function fetchInterests() {
    try {
      // Fetch all possible interest types (the 12 defaults)
      const res = await fetch(`/parent/interests`);
      if (!res.ok) throw new Error("Failed to fetch available interests");
      const data = await res.json();
      setAllInterests(data || []);
    } catch (err) {
      console.error("fetchInterests:", err);
    }
  }

  async function fetchUserInterests() {
    try {
      // Fetch current user's interests (the ones selected during registration)
      const res = await fetch(`/parent/my-children`);
      if (!res.ok) throw new Error("Failed to fetch children");
      const data = await res.json();

      // Assuming you have userId or profile.id in localStorage
      const child = Array.isArray(data) ? data.find(c => c.id === userId) : null; // Changed from sessionId to userId
      const interests = child?.interests || [];
      setUserInterests(interests.map(i => i.name));
    } catch (err) {
      console.error("fetchUserInterests:", err);
    }
  }

  async function saveUserInterests() {
    try {
      const res = await fetch(`/parent/interests`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: userInterests }),
      });
      if (!res.ok) throw new Error("Failed to save interests");
      setShowInterestsModal(false);
      alert("✅ Interests updated successfully!");
    } catch (err) {
      console.error("saveUserInterests:", err);
      alert("Failed to save interests.");
    }
  }

  // This toggleInterest is for the *string name* from the API
  function toggleInterest(name) {
    setUserInterests(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  }

  useEffect(() => {
    if (showInterestsModal) {
      fetchInterests();
      fetchUserInterests();
    }
    // eslint-disable-next-line
  }, [showInterestsModal]);

  async function fetchFavorites() {
    try {
      const res = await fetch(`/api/user/${userId}/favorites`);
      if (!res.ok) throw new Error("Failed to fetch favorites");
      const data = await res.json();
      setFavorites(data || []);
    } catch (err) {
      console.error("fetchFavorites:", err);
    }
  }

  async function deleteFavorite(favId) {
    if (!window.confirm("Delete this favorite?")) return;
    try {
      const res = await fetch(`/api/user/${userId}/favorites/${favId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setFavorites((prev) => prev.filter((f) => f.id !== favId));
    } catch (err) {
      console.error("deleteFavorite:", err);
      alert("Could not delete favorite.");
    }
  }

  // --- Original Review Functions ---
  // These functions (fetchReviews, submitReview, deleteReview)
  // are no longer used by the new modals, which are self-contained.
  // They are left here in case other parts of the app use them.

  async function fetchReviews() {
    try {
      const res = await fetch(`/api/user/${userId}/reviews`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data || []);
    } catch (err) {
      console.error("fetchReviews:", err);
    }
  }

  async function submitReview() {
    if (!reviewText.trim()) {
      alert("Please write your review.");
      return;
    }
    try {
      const body = {
        user_id: userId,
        type: reviewType,
        text: reviewText.trim(),
        stars: reviewStars,
      };
      const res = await fetch(`/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to submit review");
      setReviewText("");
      setReviewStars(5);
      setShowAddReviewModal(false);
      fetchReviews(); // Refresh review list
    } catch (err) {
      console.error("submitReview:", err);
      alert("Could not save review.");
    }
  }

  async function deleteReview(reviewId) {
    if (!window.confirm("Delete this review?")) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error("deleteReview:", err);
      alert("Could not delete review.");
    }
  }

  // --- Chat send ---
  async function sendMessage(text) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    // simple optimistic UI
    const userMsg = {
      id: `tmp-${Date.now()}`,
      sender: "user",
      text: msg,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // POST to bot endpoint
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
      setMessages((prev) => [...prev, botMsg]);
      // Optionally refresh chat list to show last updated
      fetchChats();
    } catch (err) {
      console.error("sendMessage:", err);
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, sender: "bot", text: "Error sending message." }]);
    } finally {
      setLoading(false);
    }
  }

  // logout
  function handleLogout() {
    localStorage.clear();
    window.location.href = "/login";
  }

  return (
    <div className="child-dashboard">
      {/* Top header: logo left, welcome + logout on right */}
      <header className="child-dashboard__top">
        <div className="child-dashboard__brand-left">
          <img src={logoImg} alt="logo" className="child-dashboard__logo" />
        </div>

        <div className="child-dashboard__brand-right">
          <span className="child-dashboard__welcome">Welcome, {username}!</span>
          <button className="child-dashboard__logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="child-dashboard__content">
        {/* Sidebar (left) */}
        <aside className="child-dashboard__sidebar" aria-label="Left navigation">
          <div className="child-dashboard__controls">
            <button
              className="child-dashboard__btn child-dashboard__btn--primary child-dashboard__btn--full"
              onClick={() => {
                setCurrentView('chat'); 
                const newChat = { id: `new-${Date.now()}`, title: "New chat", last_updated: new Date().toISOString() };
                setChats((c) => [newChat, ...c]);
                setSelectedChatId(newChat.id);
              }}
            >
              ＋ New Chat
            </button>

            <input
              className="child-dashboard__search"
              type="search"
              placeholder="Search chats..."
              onChange={(e) => {
                // For now simple client filter
                const q = e.target.value.toLowerCase();
                if (!q) {
                  fetchChats();
                  return;
                }
                setChats((prev) => prev.filter((ch) => (ch.title || "").toLowerCase().includes(q)));
              }}
            />
          </div>

          <div className="child-dashboard__section child-dashboard__section--chats">
            <h4 className="child-dashboard__section-title">Chats</h4>
            <ul ref={chatListRef} className="child-dashboard__chat-list" role="list">
              {chats.length === 0 && <li className="child-dashboard__chat-empty">No chats yet</li>}
              {chats.map((c) => (
                <li
                  key={c.id}
                  className={`child-dashboard__chat-item ${selectedChatId === c.id ? "selected" : ""}`}
                  onClick= {() =>{
                    setSelectedChatId(c.id);
                    setCurrentView('chat');
                  }}
                >
                  <div className="child-dashboard__chat-title">{c.title || `Chat ${c.id}`}</div>
                  <div className="child-dashboard__chat-meta">{new Date(c.last_updated || c.created_at || Date.now()).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="child-dashboard__section child-dashboard__section--general">
            <h4 className="child-dashboard__section-title">General</h4>

            <div className="child-dashboard__general-buttons">
              <button className="child-dashboard__chip" onClick={() => setShowInterestsModal(true)}>Interests</button>
              <button className="child-dashboard__chip" onClick={() => {
                // quick UX: show favorites inline (expand)
                const el = document.querySelector(".child-dashboard__favorites-list");
                if (el) el.classList.toggle("expanded");
              }}>Favorites</button>
            </div>

            <div className="child-dashboard__favorites-list">
              {favorites.length === 0 && <div className="child-dashboard__fav-empty">No favorites</div>}
              {favorites.map((f) => (
                <div key={f.id} className="child-dashboard__fav-row">
                  <a className="child-dashboard__fav-title" href={f.link || "#"} target="_blank" rel="noreferrer">{f.title}</a>
                  <button className="child-dashboard__fav-del" onClick={() => deleteFavorite(f.id)}>Delete</button>
                </div>
              ))}
            </div>
          </div>

          {/* --- Library Section --- */}
          <div className="child-dashboard__section child-dashboard__section--library">
            <h4 className="child-dashboard__section-title">Library</h4>
            <div className="child-dashboard__general-buttons">
              <button 
                className="child-dashboard__chip" 
                // --- Update onClick to set state ---
                onClick={() => setCurrentView('searchBooks')}
              >
                Search Books
              </button>
              <button 
                className="child-dashboard__chip" 
                // --- Update onClick to set state ---
                onClick={() => setCurrentView('searchVideos')}
              >
                Search Videos
              </button>
            </div>
          </div>
          {/* --- End Section --- */}


          <div className="child-dashboard__section child-dashboard__section--reviews">
            <h4 className="child-dashboard__section-title">Reviews</h4>
            <div className="child-dashboard__review-controls">
              <button className="child-dashboard__btn child-dashboard__btn--small" onClick={() => setShowAddReviewModal(true)}>Add Review</button>
              <button className="child-dashboard__btn child-dashboard__btn--small child-dashboard__btn--outline" onClick={() => setShowDeleteReviewsModal(true)}>Delete Reviews</button>
            </div>
          </div>
        </aside>

        {/* Chat area (right) */}
        <div className="child-dashboard__chat-panel">
          {currentView === 'chat' && (
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

              <main className="child-dashboard__messages" role="log" aria-live="polite">
                {chatLoading && <div className="child-dashboard__loading">Loading messages...</div>}
                {!selectedChatId && <div className="child-dashboard__placeholder">Select a chat to start</div>}

                <div className="child-dashboard__messages-list">
                  {messages.map((m) => (
                    <div key={m.id} className={`child-dashboard__message-row ${m.sender === "user" ? "user" : "bot"}`}>
                      <div className="child-dashboard__message-avatar">{m.sender === "user" ? "🧑" : "🤖"}</div>
                      <div className="child-dashboard__message-bubble">
                        {m.text.split("\n").map((l, i) => <p key={i} className="child-dashboard__message-line">{l}</p>)}
                        {/* optional items */}
                        {m.items && m.items.length > 0 && (
                          <div className="child-dashboard__message-cards">
                            {m.items.map((b) => (
                              <article key={b.id} className="child-dashboard__book-card">
                                <div className="child-dashboard__book-title">{b.title}</div>
                                <div className="child-dashboard__book-meta">Age {b.age_min}-{b.age_max}</div>
                                <div className="child-dashboard__book-actions">
                                  {b.link && <a href={b.link} target="_blank" rel="noreferrer" className="child-dashboard__book-open">Open</a>}
                                  <button onClick={() => sendMessage(`similar to ${b.id}`)} className="child-dashboard__book-more">More like this</button>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </main>

              <footer className="child-dashboard__input-area">
                <div className="child-dashboard__suggestions">
                  {SUGGESTIONS.map((s) => <button key={s} onClick={() => sendMessage(s)} className="child-dashboard__suggestion">{s}</button>)}
                </div>

                <div className="child-dashboard__input-row">
                  <input
                    className="child-dashboard__textinput"
                    placeholder="Ask for a story… e.g., “funny books for age 7”"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button className="child-dashboard__send-btn" onClick={() => sendMessage()} disabled={loading}>
                    {loading ? "..." : "Send"}
                  </button>
                </div>
              </footer>
            </>
          )}
          {/* If view is 'searchBooks', render the SearchBooks component */}
          {currentView === 'searchBooks' && (
            // We add a simple wrapper so it fits in the panel
            <div className="child-dashboard__search-wrapper">
              <SearchBooks />
            </div>
          )}

          {/* If view is 'searchVideos', render the SearchVideos component */}
          {currentView === 'searchVideos' && (
            <div className="child-dashboard__search-wrapper">
              <SearchVideos />
            </div>
          )}
        </div>
      </div>

      {/* ---------------- Modals (popups) ---------------- */}

      {/* Interests Modal */}
      {showInterestsModal && (
        <div
            className="child-dashboard__modal-overlay"
            onClick={() => setShowInterestsModal(false)}
        >
            <div
            className="child-dashboard__modal"
            onClick={(e) => e.stopPropagation()}
            >
            <h3>Edit Interests</h3>
            <p className="child-dashboard__hint">
                Select the topics you’re most interested in:
            </p>

            <div className="child-dashboard__interest-list">
                {(allInterests.length ? allInterests : [
                { name: "FICTION" },
                { name: "NONFICTION" },
                { name: "COMIC" },
                { name: "ART" },
                { name: "GEOGRAPHY" },
                { name: "SCIENCE" },
                { name: "ANIMALS" },
                { name: "HISTORY" },
                { name: "FANTASY" },
                { name: "TECHNOLOGY" },
                { name: "SPORTS" },
                { name: "COOKING" },
                ]).map((interest) => {
                const checked = userInterests.includes(interest.name);
                return (
                    <label
                    key={interest.name}
                    className="child-dashboard__interest-item"
                    >
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleInterest(interest.name)}
                    />
                    <span>{interest.name}</span>
                    </label>
                );
                })}
            </div>

            <div className="child-dashboard__modal-actions">
                <button
                className="child-dashboard__btn child-dashboard__btn--primary"
                onClick={saveUserInterests}
                >
                Save
                </button>
                <button
                className="child-dashboard__btn child-dashboard__btn--outline"
                onClick={() => setShowInterestsModal(false)}
                >
                Cancel
                </button>
            </div>
            </div>
        </div>
      )}

      {/* --- UPDATED Add Review Modal --- */}
      {/* This modal now renders the self-contained AddAppReview component. */}
      {showAddReviewModal && (
        <div className="child-dashboard__modal-overlay" onClick={() => setShowAddReviewModal(false)}>
          <div className="child-dashboard__modal child-dashboard__modal--wide" onClick={(e) => e.stopPropagation()}>
            {/* AddAppReview is self-contained. It has its own state,
              its own H2 title, and its own submit button.
              We just provide a "Cancel" button for the modal.
            */}
            <AddAppReview />
            <div className="child-dashboard__modal-actions" style={{ justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #eee', marginTop: '1rem' }}>
                <button 
                  className="child-dashboard__btn child-dashboard__btn--outline" 
                  onClick={() => setShowAddReviewModal(false)}
                >
                  Cancel
                </button>
            </div>
          </div>
        </div>
      )}

      {/* --- UPDATED Manage/Delete Reviews Modal --- */}
      {/* This modal now renders the self-contained DeleteAppReview component. */}
      {showDeleteReviewsModal && (
        <div className="child-dashboard__modal-overlay" onClick={() => setShowDeleteReviewsModal(false)}>
          <div className="child-dashboard__modal child-dashboard__modal--wide" onClick={(e) => e.stopPropagation()}>
            {/* DeleteAppReview is self-contained. It fetches its own reviews
              and handles its own delete logic.
              We just provide a "Close" button for the modal.
            */}
            <DeleteAppReview />
            <div className="child-dashboard__modal-actions">
              <button 
                className="child-dashboard__btn child-dashboard__btn--outline" 
                onClick={() => setShowDeleteReviewsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
