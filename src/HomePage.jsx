import { Link } from "react-router-dom"

const Header = () => (
  <header className="header">
    <div className="header-content">
      <div className="logo">
        <span className="logo-icon">📚</span>
        <span className="logo-text">KidsRead</span>
      </div>
      <nav className="nav">
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

const HeroSection = () => (
  <section className="hero">
    <div className="hero-content">
      <div className="announcement">
        🎉 KidsRead-AI chatbot for personalized book and video recommendations for children
      </div>
      <h1 className="hero-title">KidsRead</h1>
      <p className="hero-subtitle">Discover Amazing Stories & Videos</p>

      <div className="feature-cards">
        <div className="feature-card">
          <h3>Start Chatting</h3>
          <p>Chat with our AI to find age-appropriate books and videos for your child</p>
          <Link to="/chat">
            <button className="feature-button">Begin Conversation</button>
          </Link>
        </div>
        <div className="feature-card">
          <h3>Get Mobile App</h3>
          <p>Download our official mobile app for on-the-go book and video recommendations</p>
          <button className="feature-button">Download App</button>
        </div>
      </div>
    </div>
  </section>
)

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <div className="footer-brand">
        <div className="footer-logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">KidsRead</span>
        </div>
        <div className="social-links">
          <a href="#" className="social-link">
            📧
          </a>
          <a href="#" className="social-link">
            💬
          </a>
          <a href="#" className="social-link">
            🐙
          </a>
          <a href="#" className="social-link">
            🐦
          </a>
          <a href="#" className="social-link">
            📱
          </a>
        </div>
        <p className="copyright">© 2025 KidsRead AI Technology Co., Ltd. All rights reserved.</p>
      </div>
      <div className="footer-links">
        <div className="footer-column">
          <h4>Features</h4>
          <a href="#">Book Recommendations</a>
          <a href="#">Video Suggestions</a>
          <a href="#">Age-Based Filtering</a>
          <a href="#">Reading Progress</a>
          <a href="#">Parental Controls</a>
        </div>
        <div className="footer-column">
          <h4>Products</h4>
          <a href="#">KidsRead App</a>
          <a href="#">Web Platform</a>
          <a href="#">API Access</a>
          <a href="#">Premium Features</a>
        </div>
        <div className="footer-column">
          <h4>Support & Safety</h4>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Child Safety</a>
          <a href="#">Help Center</a>
        </div>
        <div className="footer-column">
          <h4>Join Us</h4>
          <a href="#">Career Opportunities</a>
          <a href="#">Partnership</a>
          <a href="#">Community</a>
          <a href="#">Newsletter</a>
        </div>
      </div>
    </div>
  </footer>
)

const HomePage = () => (
  <div className="app">
    <Header />
    <HeroSection />
    <Footer />
  </div>
)

export default HomePage
