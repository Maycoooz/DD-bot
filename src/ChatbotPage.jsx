"use client"

import { Link } from "react-router-dom"
import { useState } from "react"

const ChatHeader = () => (
  <header className="header">
    <div className="header-content">
      <Link to="/" className="logo-link">
        <span className="logo-icon">📚</span>
        <span className="logo-text">KidsRead</span>
      </Link>
      <nav className="nav">
        <Link to="/" className="nav-link">
          Home
        </Link>
        <a href="#" className="nav-link">
          API Access
        </a>
        <a href="#" className="nav-link">
          English
        </a>
      </nav>
    </div>
  </header>
)

const Sidebar = ({ conversations, currentConversationId, onSelectConversation, onNewConversation }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <button className="new-chat-button" onClick={onNewConversation}>
          <span className="new-chat-icon">✏️</span>
          {!isCollapsed && <span>New Chat</span>}
        </button>
        <button className="collapse-button" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      {!isCollapsed && (
        <div className="sidebar-content">
          <div className="conversations-list">
            <h3>Recent Conversations</h3>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${currentConversationId === conversation.id ? "active" : ""}`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="conversation-title">{conversation.title}</div>
                <div className="conversation-date">{conversation.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const ChatbotPage = () => {
  const [conversations, setConversations] = useState([
    {
      id: 1,
      title: "Books for 5-year-old",
      date: "Today",
      messages: [
        {
          id: 1,
          type: "bot",
          content:
            "Hello! I'm KidsRead AI. I can help you find amazing books and videos for your child. What's your child's age and what kind of stories do they enjoy?",
        },
      ],
    },
    {
      id: 2,
      title: "Adventure stories for kids",
      date: "Yesterday",
      messages: [
        {
          id: 1,
          type: "bot",
          content:
            "Hello! I'm KidsRead AI. I can help you find amazing books and videos for your child. What's your child's age and what kind of stories do they enjoy?",
        },
        {
          id: 2,
          type: "user",
          content: "My 8-year-old loves adventure stories",
        },
        {
          id: 3,
          type: "bot",
          content:
            "Great! For 8-year-olds who love adventure, I'd recommend books like 'The Magic Tree House' series, 'Dog Man' series, and 'Wings of Fire' series. These have exciting plots and age-appropriate content.",
        },
      ],
    },
    {
      id: 3,
      title: "Educational videos",
      date: "2 days ago",
      messages: [
        {
          id: 1,
          type: "bot",
          content:
            "Hello! I'm KidsRead AI. I can help you find amazing books and videos for your child. What's your child's age and what kind of stories do they enjoy?",
        },
        {
          id: 2,
          type: "user",
          content: "Can you recommend educational videos for my 6-year-old?",
        },
      ],
    },
  ])

  const [currentConversationId, setCurrentConversationId] = useState(1)
  const [input, setInput] = useState("")

  const currentConversation = conversations.find((conv) => conv.id === currentConversationId)
  const messages = currentConversation?.messages || []

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: input,
    }

    const botMessage = {
      id: Date.now() + 1,
      type: "bot",
      content:
        "Thanks for sharing! Based on what you've told me, I'd recommend some wonderful books and videos. This is a demo response - in a real implementation, this would connect to an AI service to provide personalized recommendations.",
    }

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversationId ? { ...conv, messages: [...conv.messages, userMessage, botMessage] } : conv,
      ),
    )
    setInput("")
  }

  const handleSelectConversation = (conversationId) => {
    setCurrentConversationId(conversationId)
  }

  const handleNewConversation = () => {
    const newConversation = {
      id: Date.now(),
      title: "New conversation",
      date: "Now",
      messages: [
        {
          id: 1,
          type: "bot",
          content:
            "Hello! I'm KidsRead AI. I can help you find amazing books and videos for your child. What's your child's age and what kind of stories do they enjoy?",
        },
      ],
    }

    setConversations((prev) => [newConversation, ...prev])
    setCurrentConversationId(newConversation.id)
  }

  return (
    <div className="app">
      <ChatHeader />
      <div className="chat-layout">
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />

        <div className="chat-container">
          <div className="chat-header">
            <h1>Chat with KidsRead AI</h1>
            <p>Get personalized book and video recommendations for your child</p>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-avatar">{message.type === "bot" ? "🤖" : "👤"}</div>
                <div className="message-content">{message.content}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="chat-input-form">
            <div className="chat-input-container">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me about your child's reading preferences..."
                className="chat-input"
              />
              <button type="submit" className="chat-send-button">
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChatbotPage
