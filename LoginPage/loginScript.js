// --- Check for active session ---
if (localStorage.getItem('tranquility_user_email')) {
    window.location.replace('http://localhost:3000');
}

// Theme Switcher Trigger Interaction Loop with Dynamic Text
const toggle = document.getElementById('toggle');
const cardTitle = document.querySelector('.card-title');
const cardSubtitle = document.querySelector('.card-subtitle');

toggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        document.body.classList.add('light-mode-active');
        
        // Text changes for Light Theme (Day/Clarity)
        if (cardTitle) cardTitle.textContent = "Good Day";
        if (cardSubtitle) cardSubtitle.textContent = "Bring clarity to your space";
        
    } else {
        document.body.classList.remove('light-mode-active');
        
        // Text changes for Dark Theme (Night/Stillness)
        if (cardTitle) cardTitle.textContent = "Welcome";
        if (cardSubtitle) cardSubtitle.textContent = "Begin your journey into stillness";
    }
});

// --- Welcome Overlay Dismissal Sequence Handler ---
window.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    
    // Hold splash screen for exactly 3 seconds before executing smooth hide
    setTimeout(() => {
        if (welcomeScreen) {
            welcomeScreen.classList.add('fade-out');
        }
    }, 3000);
});

// --- Onboarding Form Submission Handler ---
const form = document.getElementById('onboardingForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect form data
        const formData = new FormData(form);
        const alias = formData.get('alias');
        const email = formData.get('email');
        const age = formData.get('age');
        const gender = formData.get('gender');

        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Entering...</span>';
        submitBtn.disabled = true;

        try {
            // Save to localStorage as expected by the dashboard
            localStorage.setItem('tranquility_user_alias', alias);
            localStorage.setItem('tranquility_user_year', age);
            localStorage.setItem('tranquility_user_email', email);

            // Optional: send to backend if backend login endpoint exists
            await fetch('http://localhost:8000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alias, email, age, gender })
            });

            // Redirect to dashboard
            window.location.href = 'http://localhost:3000';
        } catch (err) {
            console.error('Login Error:', err);
            // Even if backend fails, redirect to dashboard for the prototype
            window.location.href = 'http://localhost:3000';
        }
    });
}
