---
layout: base.njk
title: Contact Me
---

<section class="contact-section">
    <div class="contact-content">
        <h1>Get in Touch</h1>
        
        <div class="contact-grid">
            <div class="contact-info">
                <h2>Contact Information</h2>
                <p>Feel free to reach out to me through any of these channels:</p>
                
                <div class="contact-methods">
                    <div class="contact-method">
                        <h3>Email</h3>
                        <p><a href="mailto:your.email@example.com">your.email@example.com</a></p>
                    </div>
                    
                    <div class="contact-method">
                        <h3>GitHub</h3>
                        <p><a href="https://github.com/yourusername" target="_blank" rel="noopener">github.com/yourusername</a></p>
                    </div>
                    
                    <div class="contact-method">
                        <h3>LinkedIn</h3>
                        <p><a href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener">linkedin.com/in/yourusername</a></p>
                    </div>
                </div>
            </div>

            <div class="contact-form">
                <h2>Send Me a Message</h2>
                <form action="https://formspree.io/f/your-form-id" method="POST">
                    <div class="form-group">
                        <label for="name">Name</label>
                        <input type="text" id="name" name="name" required>
                    </div>

                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>

                    <div class="form-group">
                        <label for="subject">Subject</label>
                        <input type="text" id="subject" name="subject" required>
                    </div>

                    <div class="form-group">
                        <label for="message">Message</label>
                        <textarea id="message" name="message" rows="5" required></textarea>
                    </div>

                    <button type="submit" class="button primary">Send Message</button>
                </form>
            </div>
        </div>
    </div>
</section>

<style>
    .contact-section {
        padding: 4rem 0;
    }

    .contact-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
    }

    .contact-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4rem;
        margin-top: 2rem;
    }

    .contact-info h2,
    .contact-form h2 {
        margin-bottom: 1.5rem;
        color: var(--primary-color);
    }

    .contact-methods {
        margin-top: 2rem;
    }

    .contact-method {
        margin-bottom: 2rem;
    }

    .contact-method h3 {
        margin-bottom: 0.5rem;
        font-size: 1.2rem;
    }

    .contact-method a {
        color: var(--text-color);
        text-decoration: none;
        transition: color 0.2s ease;
    }

    .contact-method a:hover {
        color: var(--primary-color);
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
    }

    .form-group input,
    .form-group textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 0.375rem;
        background-color: var(--background-color);
        color: var(--text-color);
        font-size: 1rem;
    }

    .form-group input:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--primary-color);
    }

    .button.primary {
        background-color: var(--primary-color);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.375rem;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .button.primary:hover {
        transform: translateY(-2px);
    }

    @media (max-width: 768px) {
        .contact-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
        }

        .contact-section {
            padding: 2rem 0;
        }
    }
</style> 