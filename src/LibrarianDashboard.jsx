import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import logo from "./assets/logo.png";


const Header = ({ user, onLogout }) => {
  return (
    <header className="librarian-header">
      <div className="librarian-header-content">
        <div className="librarian-logo">
          <img src={logo} alt="DD-bot Logo" />
          <h1>DD-bot Librarian Dashboard</h1>
        </div>
        <div className="librarian-header-right">
          <span>Welcome, {user?.username || "Librarian"}</span>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

const Navigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "books", label: "Book Management" },
    { id: "videos", label: "Video Management" },
    { id: "reviews", label: "Review Moderation" },
    { id: "recommendations", label: "Recommendations" },
    { id: "reports", label: "Reports" },
    { id: "profile", label: "My Profile" },
  ];

  return (
    <nav className="librarian-nav">
      <div className="librarian-nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`librarian-tab ${activeTab === tab.id ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
};

const SectionCard = ({ title, subtitle, buttonText, color }) => (
  <div className="librarian-card">
    <div>
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {buttonText && (
      <button className={`librarian-card-btn ${color}`}>{buttonText}</button>
    )}
  </div>
);

const BookManagement = () => (
  <section className="librarian-section">
    <h2>Book Management</h2>
    <div className="librarian-section-content">
      <SectionCard
        title="Total Books"
        subtitle="1,250 books in collection"
        buttonText="View All Books"
        color="blue"
      />
      <SectionCard
        title="Pending Approval"
        subtitle="15 books awaiting review"
        buttonText="Review Pending"
        color="orange"
      />
      <SectionCard
        title="Popular Books"
        subtitle="Most read this month"
        buttonText="View Popular"
        color="purple"
      />
    </div>
  </section>
);

const VideoManagement = () => (
  <section className="librarian-section">
    <h2>Video Management</h2>
    <div className="librarian-section-content">
      <SectionCard
        title="Total Videos"
        subtitle="350 videos available"
        buttonText="View All Videos"
        color="blue"
      />
      <SectionCard
        title="Pending Review"
        subtitle="8 videos awaiting approval"
        buttonText="Review Videos"
        color="orange"
      />
      <SectionCard
        title="Most Watched"
        subtitle="Top videos this week"
        buttonText="View Analytics"
        color="purple"
      />
    </div>
  </section>
);

const ReviewModeration = () => (
  <section className="librarian-section">
    <h2>Review Moderation</h2>
    <div className="librarian-section-content">
      <SectionCard
        title="Pending Reviews"
        subtitle="12 reviews awaiting moderation"
        buttonText="Moderate Reviews"
        color="orange"
      />
      <SectionCard
        title="Flagged Content"
        subtitle="3 reviews flagged for review"
        buttonText="Review Flagged"
        color="red"
      />
      <SectionCard
        title="Approved Reviews"
        subtitle="1,245 reviews approved"
        buttonText="View Approved"
        color="green"
      />
    </div>
  </section>
);

const LibrarianDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("books");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "books":
        return <BookManagement />;
      case "videos":
        return <VideoManagement />;
      case "reviews":
        return <ReviewModeration />;
      default:
        return <BookManagement />;
    }
  };

  return (
    <div className="librarian-dashboard">
      <Header user={user} onLogout={handleLogout} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main>{renderContent()}</main>
    </div>
  );
};

export default LibrarianDashboard;
