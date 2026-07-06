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
