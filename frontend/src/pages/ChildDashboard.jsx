// ChildDashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import '../styles/ChildrenDashboard.css';
import logoImg from "../assets/logo.png";
import deleteImg from "../assets/delete.png";
import api from "../api/axiosConfig";

// Import the new components to be used in the modals
import AddAppReview from './AddAppReview';
import DeleteAppReview from './DeleteAppReview';

import ChildSearchFavorite from './ChildSearchFavorite';
import ChildSearchChat from './ChildSearchChat';
import ChildEditInterest from './ChildEditInterest';
import ChildSearchBook from './ChildSearchBook';
import ChildSearchVideo from './ChildSearchVideo';
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


// This constant is no longer used by the new AddAppReview component,
// but is kept in case other parts of the app reference it.
const REVIEW_TYPES = ["app", "book", "video", "chatbot", "others"];

export default function ChildDashboard() {
  const [currentView, setCurrentView] = useState("chat");
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [showDeleteReviewsModal, setShowDeleteReviewsModal] = useState(false);
  const [showBooksModal, setShowBooksModal] = useState(false);
  const [showVideosModal, setShowVideosModal] = useState(false);

  const [chat, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [chatToDelete, setChatToDelete] = useState(null);

  const [childInterests, setChildInterests] = useState([]);

  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
  const userId = profile.id;
  const username = profile.first_name || "Guest";
const [parentTier, setParentTier] = useState("FREE");
useEffect(() => {
  async function fetchTier() {
    try {
      const res = await api.get(`/child/${userId}/parent-tier`);
      setParentTier(res.data.tier?.toUpperCase() || "FREE");
    } catch (err) {
      console.error("Failed to fetch parent tier:", err);
      setParentTier("FREE");
    }
  }
  fetchTier();
}, [userId]);

const isFreeParent = parentTier === "FREE";
// ⬇️ ADD THIS reusable popup component
function UpgradePopup({ title, onClose }) {
  return (
    <div className="upgrade-popup">
      <button className="upgrade-close" onClick={onClose}>✖</button>
      <h3>Upgrade to PRO to use {title}</h3>
      <p>Your current plan is <strong>FREE</strong>. This feature is for PRO users only.</p>
    </div>
  );
}


async function handleNewChat() {
  if (!userId) return;

  try {
    const res = await api.post(`/child/${userId}/chat`);
    const data =  res.data;

    // Update React state
    setChats((prev) => [data, ...prev]);
    setFilteredChats((prev) => [data, ...prev]);
    setSelectedChatId(data.id);
    setCurrentView("chat");
  } catch (err) {
    console.error("Failed to create new chat:", err);
    alert("Could not create a new chat. Try again.");
  }
}

  useEffect(() => {
  fetchChatHistory();
}, []);

async function fetchChatHistory() {
  try {
    const res = await api.get(`/child/${userId}/chat`);
    const data = res.data;
    setChats(data);
    setFilteredChats(data);
  } catch (err) {
    console.error("Failed to fetch chat history:", err);
  }
}

// ✅ Fetch all user's favorites (books + videos)
const [userFavorites, setUserFavorites] = useState([]);

async function fetchUserFavorites() {
  if (!userId) return;
  try {
    const res = await api.get(`/favorite/${userId}`);
    setUserFavorites(res.data);
  } catch (err) {
    console.error("Failed to fetch user favorites:", err.response || err);
  }
}

useEffect(() => {
  fetchUserFavorites();
}, [userId]);


  useEffect(() => {
    async function fetchChildInterests() {
      if (!userId) return;
      try {
        const res = await api.get(`/child/${userId}/interests`);
        const interests = Array.isArray(res.data)
          ? res.data.map((i) => i.name)
          : [];
        setChildInterests(interests);
      } catch (err) {
        console.error("Failed to load child interests:", err);
      }
    }
    fetchChildInterests();
  }, [userId]);

  function handleSearchChange(e) {
    const q = e.target.value.toLowerCase();
    setSearchTerm(q);
    if (!q.trim()) {
      setFilteredChats(chat);
    } else {
      setFilteredChats(
        chat.filter((chat) => (chat.title || "").toLowerCase().includes(q))
      );
    }
  }

  function handleLogout() {
    localStorage.clear();
    window.location.href = "/login";
  }

  return (
    <div className="child-dashboard">
      {/* Header */}
      <header className="child-dashboard__top">
        <div className="child-dashboard__brand-left">
          <img src={logoImg} alt="logo" className="child-dashboard__logo" />
        </div>
        <div className="child-dashboard__brand-right">
          <span className="child-dashboard__welcome">Welcome, {username}!</span>
          <button className="child-dashboard__logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="child-dashboard__content">
        {/* Sidebar */}
        <aside className="child-dashboard__sidebar">
          <div className="child-dashboard__controls">
            <button
              className="child-dashboard__btn child-dashboard__btn--primary child-dashboard__btn--full"
              onClick={handleNewChat}

            >
              ＋ New Chat
            </button>

            <input
              className="child-dashboard__search"
              type="search"
              placeholder="Search chat..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        {/* Chat History */}
          <div className="child-dashboard__section">
            <h4 className="child-dashboard__section-title">Chat History</h4>
            <ul className="child-dashboard__chat-list">
              {filteredChats.length === 0 && (
                <li className="child-dashboard__chat-empty">No chats found</li>
              )}
              {filteredChats.map((chat) => (
                <li
                  key={chat.id}
                  className={`child-dashboard__chat-item ${
                    selectedChatId === chat.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedChatId(chat.id);
                    setCurrentView("chat");
                  }}
                >
                  <div>{chat.title || `Chat ${chat.id}`}</div>
                  <div>
                    {new Date(
                      chat.last_updated || chat.created_at || Date.now()
                    ).toLocaleString()}
                  </div>
                  <img
                    src={deleteImg}
                    alt="Delete chat"
                    style={{ cursor: "pointer", float: "right", width: "20px", height: "26px" }}
                    onClick={(e) => {
                    e.stopPropagation();
                    setChatToDelete(chat);
                    }}
                    />
                </li>
              ))}
            </ul>
          </div>
{/* Delete Chat Modal */}
    {chatToDelete && (
      <div
        className="child-dashboard__modal-overlay"
        onClick={() => setChatToDelete(null)}
      >
        <div
          className="child-dashboard__modal"
          onClick={(e) => e.stopPropagation()}
        >
          <h3>Delete Chat</h3>
          <p>
            Are you sure you want to delete "
            {chatToDelete.title || `Chat ${chatToDelete.id}`}?
          </p>
          <div className="child-dashboard__modal-actions">
            <button
              className="child-dashboard__btn child-dashboard__btn--small child-dashboard__btn--outline"
              onClick={() => setChatToDelete(null)}
            >
              Cancel
            </button>
            <button
              className="child-dashboard__btn child-dashboard__btn--small child-dashboard__btn--danger"
              onClick={async () => {
                try {
                  await api.delete(`/chat/${chatToDelete.id}`);
                  setChats((prev) =>
                    prev.filter((c) => c.id !== chatToDelete.id)
                  );
                  setFilteredChats((prev) =>
                    prev.filter((c) => c.id !== chatToDelete.id)
                  );
                  if (selectedChatId === chatToDelete.id)
                    setSelectedChatId(null);
                  setChatToDelete(null);
                } catch (err) {
                  console.error("Failed to delete chat:", err);
                  alert("Failed to delete chat.");
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

          <div className="child-dashboard__section">
            <h4 className="child-dashboard__section-title">General</h4>
            <button
              className="child-dashboard__chip"
              onClick={() => setShowInterestsModal(true)}
            >
              Interests
            </button>
            <button
              className="child-dashboard__chip"
                onClick={() => setShowFavoritesModal(true)}
            >
              Favorites
            </button>
          </div>

          <div className="child-dashboard__section">
            <h4 className="child-dashboard__section-title">Library</h4>
            <button
              className="child-dashboard__chip"
              onClick={() => setShowBooksModal(true)}
            >
              Search Books
            </button>
            <button
              className="child-dashboard__chip"
              onClick={() => setShowVideosModal(true)}
            >
              Search Videos
            </button>
          </div>

          <div className="child-dashboard__section">
            <h4 className="child-dashboard__section-title">Reviews</h4>
            <button
              className="child-dashboard__btn child-dashboard__btn--small"
              onClick={() => setShowAddReviewModal(true)}
            >
              Add Review
            </button>
            <button
              className="child-dashboard__btn child-dashboard__btn--small child-dashboard__btn--outline"
              onClick={() => setShowDeleteReviewsModal(true)}
            >
              Delete Reviews
            </button>
          </div>
        </aside>

        {/* Main Chat Panel */}
        <div className="child-dashboard__chat-panel">
          {currentView === "chat" && (
            <ChildSearchChat userId={userId} 
            selectedChatId={selectedChatId}
            setSelectedChatId={setSelectedChatId}
            fetchChatHistory={fetchChatHistory}
            />
          )}
        </div>
      </div>

{/* Favorites Modal */}
{showFavoritesModal && (
  <div className={`child-dashboard__modal-overlay ${isFreeParent ? "blurred" : ""}`}>
    {isFreeParent ? (
      <UpgradePopup title="Favorites" onClose={() => setShowFavoritesModal(false)} />
    ) : (

        <ChildSearchFavorite
          userId={userId}
          onClose={() => setShowFavoritesModal(false)}
          refreshFavorites={fetchUserFavorites}
        />

    )}
  </div>
)}


      {/* Interests Modal */}
{showInterestsModal && (
  <div className={`child-dashboard__modal-overlay ${isFreeParent ? "blurred" : ""}`}>
    {isFreeParent ? (
      <UpgradePopup title="Interests" onClose={() => setShowInterestsModal(false)} />
    ) : (
      
        <ChildEditInterest
          userId={userId}
          initialInterests={childInterests}
          onSaved={(newInterests) => {
            setChildInterests(newInterests);
            setShowInterestsModal(false);
          }}
          onClose={() => setShowInterestsModal(false)}
        />

    )}
  </div>
)}



{/* Books Modal */}
{showBooksModal && (
  <div className={`child-dashboard__modal-overlay ${isFreeParent ? "blurred" : ""}`}>
    {isFreeParent ? (
      <UpgradePopup title="Search Books" onClose={() => setShowBooksModal(false)} />
    ) : (
      <div
        className="child-dashboard__modal child-dashboard__modal--wide"
        onClick={(e) => e.stopPropagation()}
      >
        <ChildSearchBook
          userId={userId}
          userFavorites={userFavorites}
          refreshFavorites={fetchUserFavorites}
        />
        <div className="child-dashboard__modal-actions">
          <button
            className="child-dashboard__btn child-dashboard__btn--outline"
            onClick={() => setShowBooksModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    )}
  </div>
)}


      {/* Videos Modal */}
{showVideosModal && (
  <div className={`child-dashboard__modal-overlay ${isFreeParent ? "blurred" : ""}`}>
    {isFreeParent ? (
      <UpgradePopup title="Search Videos" onClose={() => setShowVideosModal(false)} />
    ) : (
      <div
        className="child-dashboard__modal child-dashboard__modal--wide"
        onClick={(e) => e.stopPropagation()}
      >
        <ChildSearchVideo
          userId={userId}
          userFavorites={userFavorites}
          refreshFavorites={fetchUserFavorites}
        />
        <div className="child-dashboard__modal-actions">
          <button
            className="child-dashboard__btn child-dashboard__btn--outline"
            onClick={() => setShowVideosModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    )}
  </div>
)}


      {/* Add Review Modal */}
      {showAddReviewModal && (
        <div
          className="child-dashboard__modal-overlay"
          onClick={() => setShowAddReviewModal(false)}
        >
          <div
            className="child-dashboard__modal child-dashboard__modal--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <AddAppReview />
            <div className="child-dashboard__modal-actions">
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

      {/* Delete Review Modal */}
      {showDeleteReviewsModal && (
        <div
          className="child-dashboard__modal-overlay"
          onClick={() => setShowDeleteReviewsModal(false)}
        >
          <div
            className="child-dashboard__modal child-dashboard__modal--wide"
            onClick={(e) => e.stopPropagation()}
          >
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