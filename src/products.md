---
layout: base.njk
title: Products
---

<section class="products-section">
    <div class="products-content">
        <h1>Handmade Bangles & Bracelets</h1>
        <p>Explore our unique collection of handmade bangles and bracelets.</p>
        
        <div class="product-grid">
            <div class="product-card">
                <img src="images/products/bangle1.jpg" alt="Bangle 1" class="product-image">
                <h3>Bangle 1</h3>
                <p>Beautiful handmade bangle with intricate design.</p>
                <p class="price">₹500</p>
                <button class="button primary" onclick="openRazorpay('Bangle 1', 500)">Buy Now</button>
            </div>
            
            <div class="product-card">
                <img src="images/products/bracelet1.jpg" alt="Bracelet 1" class="product-image">
                <h3>Bracelet 1</h3>
                <p>Elegant handmade bracelet with modern style.</p>
                <p class="price">₹750</p>
                <button class="button primary" onclick="openRazorpay('Bracelet 1', 750)">Buy Now</button>
            </div>
        </div>
    </div>
</section>

<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
    function openRazorpay(productName, amount) {
        var options = {
            key: "YOUR_RAZORPAY_KEY", // Replace with your Razorpay Key ID
            amount: amount * 100, // Amount in paise
            currency: "INR",
            name: "Your Store Name",
            description: productName,
            image: "/images/logo.png", // Replace with your logo
            handler: function (response) {
                alert("Payment successful! Payment ID: " + response.razorpay_payment_id);
            },
            prefill: {
                name: "Customer Name",
                email: "customer@example.com",
                contact: "9999999999"
            },
            theme: {
                color: "#F37254"
            }
        };
        var rzp = new Razorpay(options);
        rzp.open();
    }
</script>

<style>
    .products-section {
        padding: 4rem 0;
    }

    .products-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
    }

    .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
    }

    .product-card {
        background: var(--background-color);
        border-radius: 0.5rem;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
    }

    .product-card:hover {
        transform: translateY(-4px);
    }

    .product-image {
        width: 100%;
        height: 300px;
        object-fit: cover;
        border-radius: 0.25rem;
    }

    .product-card h3 {
        margin: 1rem 0 0.5rem;
        font-size: 1.5rem;
    }

    .product-card p {
        margin-bottom: 1rem;
        line-height: 1.6;
    }

    .price {
        font-weight: bold;
        font-size: 1.25rem;
        color: var(--primary-color);
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
        .product-grid {
            grid-template-columns: 1fr;
        }
    }
</style> 