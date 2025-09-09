import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import logoImg from "./assets/logo.png"

const Header = () => (
  <header className="header">
    <div className="header-content">
      <div className="logo">
        <img
          src={logoImg || "/placeholder.svg"}
          alt="DD Bot"
          className="logo-image"
          onError={(e) => {
            e.target.onerror = null
            e.target.src = "/placeholder.svg"
          }}
        />
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
        🎉 DD Bot-AI chatbot for personalized book and video recommendations for children
      </div>
      <h1 className="hero-title">DD Bot</h1>
      <p className="hero-subtitle">Discover Amazing Stories & Videos</p>

      <div className="feature-cards">
        <div className="feature-card">
          <h3>Start Chatting</h3>
          <p>Chat with our AI to find age-appropriate books and videos for your child</p>
          <Link to="/login">
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
          <img
            src={logoImg || "/placeholder.svg"}
            alt="DD Bot"
            className="logo-image"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = "/placeholder.svg"
            }}
          />
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
        <p className="copyright">© 2025 DD Bot AI Technology Co., Ltd. All rights reserved.</p>
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
          <a href="#">DD Bot App</a>
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

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch('/api/')
        if (!response.ok) {
          throw new Error('Failed to fetch testimonials')
        }
        const data = await response.json()
        setTestimonials(data)
      } catch (err) {
        console.error('Error fetching testimonials:', err)
        setError('Failed to load testimonials. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  if (loading) {
    return (
      <section className="testimonials">
        <h2 className="section-title">What Parents Say</h2>
        <div className="loading">Loading testimonials...</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="testimonials">
        <h2 className="section-title">What Parents Say</h2>
        <div className="error">{error}</div>
      </section>
    )
  }

  return (
    <section className="testimonials">
      <h2 className="section-title">What Parents Say</h2>
      <div className="testimonial-cards">
        {testimonials.length > 0 ? (
          testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <p className="testimonial-text">"{testimonial.review_text}"</p>
              <div className="testimonial-author">
                <span className="author-name">{testimonial.parent_name}</span>
                <span className="author-title">Parent</span>
              </div>
            </div>
          ))
        ) : (
          <p>No testimonials available at the moment.</p>
        )}
      </div>
    </section>
  )
}

const HomePage = () => (
  <div className="app">
    <Header />
    <HeroSection />
    <TestimonialsSection />
    <Footer />
  </div>
)

export default HomePage
