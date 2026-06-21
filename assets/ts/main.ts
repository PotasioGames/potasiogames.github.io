import '../css/style.css';
import { createIcons, Users, Mail, ArrowRight, X } from 'lucide';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Vercel Analytics
inject();

// Initialize Vercel Speed Insights
injectSpeedInsights();

// Initialize Icons
createIcons({
  icons: {
    Users,
    Mail,
    ArrowRight,
    X
  }
});

// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// State control
let textVisible = false;
let animating = false;

// Timeline Setup
const tl = gsap.timeline({ paused: true });

// Build Animation (Splash -> Text)
// 1. Hide Scroll Indicator
// 2. Zoom/Fade out Splash
// 3. Move Text Up and Fade In
// 4. Darken Navbar
tl.to("#scroll-indicator", { opacity: 0, scale: 0.5, duration: 0.3, ease: "power1.out" })
  .to("#hero-bg", { opacity: 0, scale: 1.1, duration: 1.2, ease: "power2.inOut" }, 0)
  .to("#hero-content", { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, "-=0.8")
  .to("#navbar", { backgroundColor: "rgba(10, 15, 26, 0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", duration: 0.5 }, 0.2);

// Helper Functions
function animateToText() {
  animating = true;
  tl.play().then(() => {
    animating = false;
    textVisible = true;
  });
}

function animateToSplash() {
  animating = true;
  tl.reverse().then(() => {
    animating = false;
    textVisible = false;
  });
}

// --- Custom Observer Logic for "Scroll-Jacking" ---

// Wheel Handler
window.addEventListener("wheel", (e: WheelEvent) => {
  if (animating) {
    e.preventDefault();
    return;
  }

  if (!textVisible) {
    // State 0: Splash Mode
    // Block ALL scroll until we transition
    e.preventDefault();

    // If scrolling DOWN, trigger transition
    if (e.deltaY > 0) {
      animateToText();
    }
  } else {
    // State 1: Text Mode
    // Only block if we are at the top and scrolling UP
    if (window.scrollY <= 0 && e.deltaY < 0) {
      e.preventDefault();
      animateToSplash();
    }
  }
}, { passive: false });

// Touch Handler (Mobile)
let touchStartY = 0;

window.addEventListener("touchstart", (e: TouchEvent) => {
  touchStartY = e.touches[0].clientY;
}, { passive: false });

window.addEventListener("touchmove", (e: TouchEvent) => {
  if (animating) {
    e.preventDefault();
    return;
  }

  const currentY = e.touches[0].clientY;
  const deltaY = touchStartY - currentY; // Positive = Scroll Down

  if (!textVisible) {
    // Splash Mode: Block all
    e.preventDefault();
    if (deltaY > 5) { // Threshold
      animateToText();
    }
  } else {
    // Text Mode: Block Top-Up
    if (window.scrollY <= 0 && deltaY < -5) {
      e.preventDefault();
      animateToSplash();
    }
  }
}, { passive: false });

// --- Code Redemption Deep Link Logic ---
(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    const appUrl = `impostor://redeem?code=${encodeURIComponent(code)}`;
    const modal = document.getElementById('redeem-modal');
    const openBtn = document.getElementById('redeem-open-btn') as HTMLAnchorElement;
    const spinner = document.getElementById('redeem-spinner');
    const icon = document.getElementById('redeem-icon');
    const title = document.getElementById('redeem-title');
    const message = document.getElementById('redeem-message');
    const closeBtn = document.getElementById('redeem-close-btn');

    if (!modal) return;

    // Show modal
    modal.classList.remove('hidden');
    if (openBtn) openBtn.href = appUrl;

    // Re-initialize icons just for the modal
    createIcons({
      icons: { X }
    });

    // Attempt to open the app automatically after 500ms
    setTimeout(() => {
      window.location.href = appUrl;
    }, 500);

    // After 2 seconds, show manual UI
    setTimeout(() => {
      if (spinner) spinner.classList.add('hidden');
      if (icon) icon.classList.remove('hidden');
      if (title) title.textContent = '¡Código Detectado!';
      if (message) message.textContent = 'Toca el botón para activar tu código en la app Impostor.';
    }, 2000);

    // Close modal
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }
})();
