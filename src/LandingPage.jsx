import { Link } from "react-router-dom";
import "./main.css";
import logoImg from "./assets/logo.png"


const LandingPage = () => {
  // Smooth scroll function
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="landing-page">
      {/* HEADER */}
      <header className="landing-header">
        <img src={logoImg} alt="DD BOT" className="landing-logo" style={{ height: "84px", width: "auto", cursor: "pointer" }} />
        <nav className="landing-nav">
          <button
            onClick={() => scrollToSection("features")}
            className="landing-nav-link"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="landing-nav-link"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection("testimonials")}
            className="landing-nav-link"
          >
            Testimonials
          </button>
          <button
            onClick={() => scrollToSection("pricing")}
            className="landing-nav-link"
          >
            Pricing
          </button>
          <div className="landing-auth-buttons">
            <Link
              to="/signup"
              className="landing-button landing-button-outline"
            >
              Sign up
            </Link>
            <Link
              to="/login"
              className="landing-button landing-button-filled"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="landing-main">
        {/* HERO */}
        <section className="landing-hero">
          <div className="landing-hero-content">
            <div className="landing-intro-box">
              <h2 className="landing-section-title">
                INTRODUCTION ABOUT THE CHATBOT
              </h2>
              <p className="landing-intro-text">
                DD Bot is an intelligent chatbot designed to help parents find
                the perfect books and videos for their children. Our
                AI-powered recommendations are tailored to your child's age,
                interests, and learning goals.
              </p>
            </div>

            <div className="landing-video-box">
              <h2 className="landing-section-title">VIDEO</h2>
              <div className="landing-video-placeholder">
                {/* replace this with an actual video  */}
                <div
                  style={{
                    width: "100%",
                    height: "200px",
                    backgroundColor: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                    borderRadius: "0.5rem",
                  }}
                >
                  Video Placeholder
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="landing-features">
          <h2 className="landing-section-title">OUR FEATURES</h2>
          <div className="landing-features-grid">
            <div className="landing-feature-box">
              <h3>Personalized Recommendations</h3>
              <p>
                Get books and videos tailored to your child’s age and interests.
              </p>
            </div>
            <div className="landing-feature-box">
              <h3>Educational Videos</h3>
              <p>
                Curated videos that enhance your child’s reading and learning.
              </p>
            </div>
            <div className="landing-feature-box">
              <h3>Safe Content</h3>
              <p>
                All recommendations are age-appropriate and parent-approved.
              </p>
            </div>
            <div className="landing-feature-box">
              <h3>Progress Tracking</h3>
              <p>
                Monitor reading and watching habits to guide your child’s growth.
              </p>
            </div>
            <div className="landing-feature-box">
              <h3>Parent Dashboard</h3>
              <p>
                Manage child accounts and view personalized insights easily.
              </p>
            </div>
            <div className="landing-feature-box">
              <h3>Multi-language Support</h3>
              <p>Learn and explore in different languages.</p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="landing-how-it-works">
          <h2 className="landing-section-title">HOW IT WORKS</h2>
          <div className="landing-steps">
            <div className="landing-step-box">
              <h3>Create Account</h3>
              <p>Sign up and create profiles for your children.</p>
            </div>
            <div className="landing-step-arrow">→</div>
            <div className="landing-step-box">
              <h3>Chat with Bot</h3>
              <p>Tell us about your child’s interests and preferences.</p>
            </div>
            <div className="landing-step-arrow">→</div>
            <div className="landing-step-box">
              <h3>Get Recommendations</h3>
              <p>Receive personalized book and video suggestions instantly.</p>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="landing-testimonials">
          <h2 className="landing-section-title">CUSTOMER REVIEWS</h2>
          <div className="landing-testimonials-grid">
            <div className="landing-testimonial-box">
              <p>🌟🌟🌟🌟🌟 “A wonderful learning tool for my kids!” – Sarah</p>
            </div>
            <div className="landing-testimonial-box">
              <p>🌟🌟🌟🌟 “Great content and easy to use.” – Daniel</p>
            </div>
            <div className="landing-testimonial-box">
              <p>🌟🌟🌟🌟🌟 “My children love the recommendations!” – Emily</p>
            </div>
            <div className="landing-testimonial-box">
              <p>🌟🌟🌟🌟 “Perfect for parents who care about learning.” – John</p>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="landing-pricing">
          <h2 className="landing-section-title">PRICING PLANS</h2>
          <div className="landing-pricing-boxes">
            <div className="landing-pricing-box">
              <h3>Free Plan</h3>
              <ul>
                <li>✅ Access to 500+ books</li>
                <li>✅ 200+ educational videos</li>
                <li>✅ 1 child profile</li>
                <li>✅ Basic AI recommendations</li>
                <li>❌ No parental progress tracking</li>
              </ul>
              <p className="landing-price">$0/month</p>
              <Link
                to="/signup"
                className="landing-button landing-button-outline"
              >
                Choose Free
              </Link>
            </div>

            <div className="landing-pricing-box landing-premium">
              <h3>Premium Plan</h3>
              <ul>
                <li>✅ Unlimited access to books & videos</li>
                <li>✅ Up to 5 child profiles</li>
                <li>✅ Advanced AI learning insights</li>
                <li>✅ Parental dashboard & analytics</li>
                <li>✅ Priority support</li>
              </ul>
              <p className="landing-price">$9.99/month</p>
              <Link
                to="/signup"
                className="landing-button landing-button-filled"
              >
                Choose Premium
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="landing-footer">
        <Link to="/home" className="landing-button landing-button-primary">
          Get Started
        </Link>
      </footer>
    </div>
  );
};

export default LandingPage;
