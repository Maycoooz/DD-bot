import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import api from "../api/axiosConfig";
import "../styles/LandingPage.css";
import logoImg from "../assets/logo.png";

const LandingPage = () => {
    // State for loading and all dynamic page content
    const [loading, setLoading] = useState(true);
    const [pageContent, setPageContent] = useState({
        INTRODUCTION: [],
        FEATURE: [],
        HOW_IT_WORKS: [],
        VIDEO: [],
        PRICING: [],
    });

    // Fetch data from the public endpoint when the component loads
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await api.get('/landing-page-content');
                // Group the content by type for easier rendering in the JSX
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

    // Smooth scroll function for navigation
    const scrollToSection = (id) => {
        const section = document.getElementById(id);
        if (section) {
            section.scrollIntoView({ behavior: "smooth" });
        }
    };

    if (loading) {
        return <div className="loading-state">Loading Page...</div>;
    }

    // Helper to get a single content item
    const getContent = (type) => pageContent[type]?.[0] || {};
    // Helper to get a list of content items
    const getContentList = (type) => pageContent[type] || [];

    return (
        <div className="landing-page">
            {/* HEADER */}
            <header className="landing-header">
                <img src={logoImg} alt="DD BOT" className="landing-logo" style={{ height: "84px", width: "auto", cursor: "pointer" }} />
                <nav className="landing-nav">
                    <button onClick={() => scrollToSection("features")} className="landing-nav-link">Features</button>
                    <button onClick={() => scrollToSection("how-it-works")} className="landing-nav-link">How It Works</button>
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
                            <h1 className="landing-main-title">{getContent('INTRODUCTION').title || "Perfect Books & Videos for Your Child, Instantly."}</h1>
                            <p className="landing-intro-text">
                                {getContent('INTRODUCTION').display_text || "Loading introduction..."}
                            </p>
                        </div>
                        <div className="landing-video-box">
                            <div className="landing-video-placeholder">
                                {getContent('VIDEO').display_text ? (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={getContent('VIDEO').display_text}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                ) : "Video coming soon..."}
                            </div>
                        </div>
                    </div>
                </section>

                {/* FEATURES */}
                <section id="features" className="landing-section">
                    <h2 className="landing-section-title">Our Features</h2>
                    <div className="landing-features-grid">
                        {getContentList('FEATURE').map(item => (
                            <div key={item.id} className="landing-feature-box">
                                <h3>{item.title}</h3>
                                <p>{item.display_text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section id="how-it-works" className="landing-section alternate-bg">
                    <h2 className="landing-section-title">How It Works</h2>
                    <div className="landing-steps">
                        {getContentList('HOW_IT_WORKS').map((item, index, arr) => (
                            <React.Fragment key={item.id}>
                                <div className="landing-step-box">
                                    <h3>{item.title}</h3>
                                    <p>{item.display_text}</p>
                                </div>
                                {index < arr.length - 1 && <div className="landing-step-arrow">→</div>}
                            </React.Fragment>
                        ))}
                    </div>
                </section>

                {/* PRICING */}
                <section id="pricing" className="landing-section">
                    <h2 className="landing-section-title">Pricing Plans</h2>
                    <div className="landing-pricing-boxes">
                        <div className="landing-pricing-box">
                            <h3>Free Plan</h3>
                            <ul>
                                {getContentList('PRICING').filter(item => item.grouping_key === 'FREE_PLAN').map(item => (
                                    <li key={item.id}>{item.display_text}</li>
                                ))}
                            </ul>
                            <p className="landing-price">$0/month</p>
                            <Link to="/register" className="landing-button landing-button-outline">Choose Free</Link>
                        </div>
                        <div className="landing-pricing-box landing-premium">
                            <h3>Premium Plan</h3>
                            <ul>
                                {getContentList('PRICING').filter(item => item.grouping_key === 'PRO_PLAN').map(item => (
                                    <li key={item.id}>{item.display_text}</li>
                                ))}
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