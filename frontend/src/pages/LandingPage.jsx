import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import api from "../api/axiosConfig";
import "../styles/LandingPage.css";
import logoImg from "../assets/logo.png";

const LandingPage = () => {
    // State for loading and dynamic page content
    const [loading, setLoading] = useState(true);
    const [pageContent, setPageContent] = useState({
        INTRODUCTION: [],
        FEATURE: [],
        HOW_IT_WORKS: [],
    });

    // Fetch data from the public endpoint when the component loads
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await api.get('/landing-page-content');
                // Group the content by type for easier rendering
                const groupedContent = response.data.reduce((acc, item) => {
                    const { display_type } = item;
                    if (!acc[display_type]) {
                        acc[display_type] = [];
                    }
                    acc[display_type].push(item);
                    return acc;
                }, {});
                setPageContent(groupedContent);
            } catch (error) {
                console.error("Failed to load landing page content:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, []);

    // Smooth scroll function
    const scrollToSection = (id) => {
        const section = document.getElementById(id);
        if (section) {
            section.scrollIntoView({ behavior: "smooth" });
        }
    };

    if (loading) {
        return <div>Loading...</div>; // You can replace this with a styled spinner component
    }

    return (
        <div className="landing-page">
            {/* HEADER */}
            <header className="landing-header">
                <img src={logoImg} alt="DD BOT" className="landing-logo" style={{ height: "84px", width: "auto", cursor: "pointer" }} />
                <nav className="landing-nav">
                    <button onClick={() => scrollToSection("features")} className="landing-nav-link">Features</button>
                    <button onClick={() => scrollToSection("how-it-works")} className="landing-nav-link">How It Works</button>
                    <button onClick={() => scrollToSection("testimonials")} className="landing-nav-link">Testimonials</button>
                    <button onClick={() => scrollToSection("pricing")} className="landing-nav-link">Pricing</button>
                    <div className="landing-auth-buttons">
                        <Link to="/register" className="landing-button landing-button-outline">Sign up</Link>
                        <Link to="/login" className="landing-button landing-button-filled">Sign in</Link>
                    </div>
                </nav>
            </header>

            {/* MAIN CONTENT */}
            <main className="landing-main">
                {/* HERO */}
                <section className="landing-hero">
                    <div className="landing-hero-content">
                        <div className="landing-intro-box">
                            <h1 className="landing-main-title">Perfect Books & Videos for Your Child, Instantly.</h1>
                            {/* Render introduction from state */}
                            <p className="landing-intro-text">
                                {pageContent.INTRODUCTION?.[0]?.display_text || "Default introduction text..."}
                            </p>
                        </div>
                        <div className="landing-video-box">
                            <div className="landing-video-placeholder">Video Placeholder</div>
                        </div>
                    </div>
                </section>

                {/* FEATURES */}
                <section id="features" className="landing-section">
                    <h2 className="landing-section-title">Our Features</h2>
                    <div className="landing-features-grid">
                        {/* Render features from state using .map() */}
                        {pageContent.FEATURE?.map((item, index) => (
                            <div key={item.id} className="landing-feature-box">
                                {/* You can add a 'title' field to your DB model for dynamic titles */}
                                <h3>Feature {index + 1}</h3>
                                <p>{item.display_text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section id="how-it-works" className="landing-section alternate-bg">
                    <h2 className="landing-section-title">How It Works</h2>
                    <div className="landing-steps">
                        {/* Render "How It Works" steps from state */}
                        {pageContent.HOW_IT_WORKS?.map((item, index) => (
                            <React.Fragment key={item.id}>
                                <div className="landing-step-box">
                                    <h3>Step {index + 1}</h3>
                                    <p>{item.display_text}</p>
                                </div>
                                {index < pageContent.HOW_IT_WORKS.length - 1 && <div className="landing-step-arrow">→</div>}
                            </React.Fragment>
                        ))}
                    </div>
                </section>

                {/* TESTIMONIALS (Static for now) */}
                <section id="testimonials" className="landing-section">
                    <h2 className="landing-section-title">Customer Reviews</h2>
                    <div className="landing-testimonials-grid">
                        <div className="landing-testimonial-box"><p>"A wonderful learning tool for my kids!" – Sarah</p><span>🌟🌟🌟🌟🌟</span></div>
                        <div className="landing-testimonial-box"><p>"Great content and easy to use." – Daniel</p><span>🌟🌟🌟🌟</span></div>
                        <div className="landing-testimonial-box"><p>"My children love the recommendations!" – Emily</p><span>🌟🌟🌟🌟🌟</span></div>
                        <div className="landing-testimonial-box"><p>"Perfect for parents who care about learning." – John</p><span>🌟🌟🌟🌟</span></div>
                    </div>
                </section>

                {/* PRICING (Static for now) */}
                <section id="pricing" className="landing-section alternate-bg">
                    <h2 className="landing-section-title">Pricing Plans</h2>
                    <div className="landing-pricing-boxes">
                        <div className="landing-pricing-box">
                            <h3>Free Plan</h3>
                            <ul>
                                <li>✅ Access to 500+ books</li>
                                <li>✅ 200+ educational videos</li>
                                <li>✅ 1 child profile</li>
                                <li>✅ Basic AI recommendations</li>
                                <li className="disabled">❌ No parental progress tracking</li>
                            </ul>
                            <p className="landing-price">$0/month</p>
                            <Link to="/register" className="landing-button landing-button-outline">Choose Free</Link>
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
                            <Link to="/register" className="landing-button landing-button-filled">Choose Premium</Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="landing-footer">
                <p>Ready to get started?</p>
                <Link to="/register" className="landing-button landing-button-primary">Create Your Account</Link>
            </footer>
        </div>
    );
};

export default LandingPage;