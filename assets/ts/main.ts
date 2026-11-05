import '../css/style.css';
import { createIcons, Users, Mail, ArrowRight, X, ChevronDown } from 'lucide';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

// ---------------------------------------------------------------------------
// 0. Analytics & Telemetry
// ---------------------------------------------------------------------------
try {
  inject();
  injectSpeedInsights();
} catch (err) {
  // Graceful fallback in environments where analytics are blocked
}

// ---------------------------------------------------------------------------
// 1. Icon & Plugin Initialization
// ---------------------------------------------------------------------------
function refreshIcons(): void {
  createIcons({
    icons: {
      Users,
      Mail,
      ArrowRight,
      X,
      ChevronDown
    }
  });
}
refreshIcons();

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
ScrollTrigger.config({ ignoreMobileResize: true });

// Prevent jumpy scroll on refresh & ensure starting at top
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.scrollTo(0, 0);
  }
});

// ---------------------------------------------------------------------------
// 2. Global State & Skin Config
// ---------------------------------------------------------------------------
export type GameId = 'orbitar' | 'impostor';
export type SkinKey = 'astronaut' | 'pilot' | 'mecha';

let activeGameId: GameId = 'orbitar';
let currentSkin: SkinKey = 'astronaut';
let isHeroSplash = true;

const SKIN_CONFIG: Record<SkinKey, { normal: string; alert: string; relaxed: string; name: string }> = {
  astronaut: {
    normal: 'assets/img/player-astronaut.svg',
    alert: 'assets/img/player-astronaut-alert.svg',
    relaxed: 'assets/img/player-astronaut-relaxed.svg',
    name: 'Astronauta'
  },
  pilot: {
    normal: 'assets/img/suit-pilot.svg',
    alert: 'assets/img/suit-pilot.svg',
    relaxed: 'assets/img/suit-pilot.svg',
    name: 'Piloto'
  },
  mecha: {
    normal: 'assets/img/suit-mecha.svg',
    alert: 'assets/img/suit-mecha.svg',
    relaxed: 'assets/img/suit-mecha.svg',
    name: 'Mecha'
  }
};

// ---------------------------------------------------------------------------
// 3. Scene 1: Hero Transition (Splash -> Adventure) [PRESERVED IDENTICAL]
// ---------------------------------------------------------------------------
const heroTl = gsap.timeline({ paused: true });
heroTl
  .to("#scroll-indicator", { opacity: 0, scale: 0.5, duration: 0.3, ease: "power1.out" })
  .to("#hero-logo-layer", { opacity: 0, scale: 1.05, duration: 0.7, ease: "power2.inOut" }, 0)
  .to("#hero-spotlight", { opacity: 0, duration: 0.5 }, 0)
  .to("#adventure-layer", { opacity: 1, y: 0, pointerEvents: "auto", duration: 0.7, ease: "power2.out" }, "-=0.4");

ScrollTrigger.create({
  trigger: "#hero-scene",
  start: "top top",
  end: "bottom bottom",
  scrub: 0.6,
  animation: heroTl,
  onUpdate: (self) => {
    isHeroSplash = self.progress < 0.15;
    const spotlight = document.getElementById('hero-spotlight');
    if (spotlight && !isHeroSplash) {
      spotlight.style.opacity = '0';
    }
  }
});

// Scroll Indicator UX Cue Click
document.getElementById('scroll-indicator')?.addEventListener('click', () => {
  const heroScene = document.getElementById('hero-scene');
  if (heroScene) {
    const targetY = heroScene.offsetTop + heroScene.offsetHeight * 0.75;
    gsap.to(window, { scrollTo: targetY, duration: 0.9, ease: "power2.inOut" });
  }
});

// Interactive 3D Tilt on Hero Logo & Mouse Spotlight
const heroTrigger = document.getElementById('hero-trigger');
const heroWrapper = document.getElementById('hero-logo-wrapper');
const heroSpotlight = document.getElementById('hero-spotlight');

if (heroTrigger && heroWrapper && heroSpotlight) {
  heroTrigger.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isHeroSplash) return;

    const rect = heroTrigger.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    const pctX = ((e.clientX - rect.left) / rect.width) * 100;
    const pctY = ((e.clientY - rect.top) / rect.height) * 100;

    gsap.to(heroWrapper, {
      rotateX: normY * -12,
      rotateY: normX * 12,
      duration: 0.5,
      ease: "power1.out",
      overwrite: "auto"
    });

    gsap.to(heroSpotlight, {
      "--mouse-x": `${pctX}%`,
      "--mouse-y": `${pctY}%`,
      duration: 0.8,
      ease: "power2.out",
      overwrite: "auto"
    });
  });

  heroTrigger.addEventListener('mouseenter', () => {
    if (isHeroSplash) {
      gsap.to(heroSpotlight, { opacity: 1, duration: 0.5 });
    }
  });

  heroTrigger.addEventListener('mouseleave', () => {
    gsap.to(heroWrapper, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: "power1.out",
      overwrite: "auto"
    });
    gsap.to(heroSpotlight, { opacity: 0, duration: 0.5 });
  });
}

// ---------------------------------------------------------------------------
// 4. Skin Selection Logic
// ---------------------------------------------------------------------------
export function selectSkin(skinKey: SkinKey): void {
  currentSkin = skinKey;
  const cfg = SKIN_CONFIG[skinKey];

  // Update card preview image
  const portalImg = document.getElementById('portal-bot-img') as HTMLImageElement | null;
  if (portalImg) portalImg.src = cfg.normal;

  // Update theater bot image
  const botImg = document.getElementById('orbitar-bot-img') as HTMLImageElement | null;
  if (botImg) botImg.src = cfg.normal;

  // Update active pill button UI in the card
  ['astronaut', 'pilot', 'mecha'].forEach((k) => {
    const btn = document.getElementById(`portal-skin-${k}`);
    if (!btn) return;
    if (k === skinKey) {
      btn.className = 'portal-skin-btn flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-cyan-400/20 border-2 border-cyan-400 text-white text-xs font-mono font-bold transition-all';
    } else {
      btn.className = 'portal-skin-btn flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-dark-800 border border-white/10 text-slate-400 hover:text-white text-xs font-mono transition-all';
    }
  });
}

// Attach skin buttons
document.getElementById('portal-skin-astronaut')?.addEventListener('click', (e) => {
  e.stopPropagation();
  selectSkin('astronaut');
});
document.getElementById('portal-skin-pilot')?.addEventListener('click', (e) => {
  e.stopPropagation();
  selectSkin('pilot');
});
document.getElementById('portal-skin-mecha')?.addEventListener('click', (e) => {
  e.stopPropagation();
  selectSkin('mecha');
});

// ---------------------------------------------------------------------------
// 5. Orbitar Geometry & Positioning
// ---------------------------------------------------------------------------
interface GeometryPoint {
  x: number;
  y: number;
  r: number;
}

interface OrbitarGeometry {
  p1: GeometryPoint;
  p2: GeometryPoint;
  hazard: { x: number; y: number };
}

function getOrbitarGeometry(): OrbitarGeometry | null {
  const world = document.getElementById('world-orbitar');
  const ring1 = document.getElementById('planet-1-ring');
  const ring2 = document.getElementById('planet-2-ring');
  const hazard = document.getElementById('hazard-container');

  if (!world || !ring1 || !ring2 || !hazard) return null;

  const wRect = world.getBoundingClientRect();
  const r1Rect = ring1.getBoundingClientRect();
  const r2Rect = ring2.getBoundingClientRect();
  const hRect = hazard.getBoundingClientRect();

  return {
    p1: {
      x: r1Rect.left - wRect.left + r1Rect.width / 2,
      y: r1Rect.top - wRect.top + r1Rect.height / 2,
      r: r1Rect.width / 2
    },
    p2: {
      x: r2Rect.left - wRect.left + r2Rect.width / 2,
      y: r2Rect.top - wRect.top + r2Rect.height / 2,
      r: r2Rect.width / 2
    },
    hazard: {
      x: hRect.left - wRect.left + hRect.width / 2,
      y: hRect.top - wRect.top + hRect.height / 2
    }
  };
}

function setupInitialOrbitarPosition(): void {
  const geom = getOrbitarGeometry();
  const bot = document.getElementById('scrolly-bot');
  const speech = document.getElementById('orbitar-speech-container');
  if (!geom || !bot) return;

  const initAngle = 0;
  const x = geom.p1.x + Math.cos(initAngle) * geom.p1.r;
  const y = geom.p1.y + Math.sin(initAngle) * geom.p1.r;
  const rot = (initAngle * 180 / Math.PI) + 90;

  gsap.set(bot, {
    left: 0,
    top: 0,
    x: x,
    y: y,
    rotation: rot
  });

  if (speech) {
    gsap.set(speech, {
      left: 0,
      top: 0,
      x: x,
      y: y - 35,
      rotation: 0
    });
  }
}

function setupInitialImpostorPosition(): void {
  const cards = [
    document.getElementById('impostor-card-1'),
    document.getElementById('impostor-card-2'),
    document.getElementById('impostor-card-3')
  ];
  const magnifier = document.getElementById('impostor-magnifier');
  const isMobile = window.innerWidth < 640;
  const spread = isMobile ? 65 : 125;

  cards.forEach((card, idx) => {
    if (!card) return;
    const offset = idx - 1; // -1, 0, 1
    gsap.set(card, {
      x: offset * spread,
      y: Math.abs(offset) * 6,
      rotation: offset * 7,
      opacity: 1,
      scale: 1
    });
  });

  if (magnifier) {
    gsap.set(magnifier, { x: -1.8 * spread, y: -65, opacity: 0, scale: 0.8, rotation: 0 });
  }
}

// ---------------------------------------------------------------------------
// 6. Theater Worlds Sync & Switching
// ---------------------------------------------------------------------------
export function syncTheaterWorld(gameId: GameId): void {
  activeGameId = gameId;
  const worldOrbitar = document.getElementById('world-orbitar');
  const worldImpostor = document.getElementById('world-impostor');
  const ambientGlow = document.getElementById('games-ambient-glow');
  const canvas = document.getElementById('orbitar-space-canvas');

  if (gameId === 'orbitar') {
    if (ambientGlow) {
      ambientGlow.style.background = 'radial-gradient(ellipse at 50% 30%, rgba(72,202,228,0.18) 0%, rgba(11,16,25,0.92) 65%, transparent 100%)';
    }
    if (canvas) canvas.style.opacity = '1';
    if (worldOrbitar) worldOrbitar.classList.remove('hidden');
    if (worldImpostor) worldImpostor.classList.add('hidden');
    setupInitialOrbitarPosition();
  } else {
    if (ambientGlow) {
      ambientGlow.style.background = 'radial-gradient(ellipse at 50% 50%, rgba(197,120,203,0.15) 0%, rgba(10,15,26,0.90) 65%, transparent 100%)';
    }
    if (canvas) canvas.style.opacity = '0';
    if (worldOrbitar) worldOrbitar.classList.add('hidden');
    if (worldImpostor) worldImpostor.classList.remove('hidden');
    setupInitialImpostorPosition();
  }

  updateShowcase(gameId);
}

export function updateShowcase(gameId: GameId): void {
  const scOrbitar = document.getElementById('showcase-orbitar');
  const scImpostor = document.getElementById('showcase-impostor');
  const scGlow = document.getElementById('showcase-ambient-glow');

  if (gameId === 'orbitar') {
    if (scOrbitar) scOrbitar.classList.remove('hidden');
    if (scImpostor) scImpostor.classList.add('hidden');
    if (scGlow) scGlow.style.background = 'radial-gradient(circle 500px at 50% 50%, rgba(72,202,228,0.18) 0%, transparent 70%)';
  } else {
    if (scOrbitar) scOrbitar.classList.add('hidden');
    if (scImpostor) scImpostor.classList.remove('hidden');
    if (scGlow) scGlow.style.background = 'radial-gradient(circle 500px at 50% 50%, rgba(197,120,203,0.15) 0%, transparent 70%)';
  }
}

// Launch Game from Adventure Cards
export function launchGame(gameId: GameId): void {
  activeGameId = gameId;
  const clickedCard = document.getElementById(`portal-${gameId}`);
  if (clickedCard) {
    clickedCard.classList.add('portal-card-expanding');
  }

  syncTheaterWorld(gameId);

  const theaterScene = document.getElementById('games-theater-scene');
  if (theaterScene) {
    gsap.to(window, {
      scrollTo: theaterScene.offsetTop,
      duration: 0.9,
      ease: "power2.inOut",
      onComplete: () => {
        if (clickedCard) clickedCard.classList.remove('portal-card-expanding');
      }
    });
  }
}

document.getElementById('portal-orbitar')?.addEventListener('click', () => launchGame('orbitar'));
document.getElementById('portal-impostor')?.addEventListener('click', () => launchGame('impostor'));

// ---------------------------------------------------------------------------
// 7. Scene 2: Theater Cinematic Timelines Driven by Scrub
// ---------------------------------------------------------------------------
let orbitarTimeline: gsap.core.Timeline | null = null;
let impostorTimeline: gsap.core.Timeline | null = null;

function buildOrbitarTimeline(): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });
  const bot = document.getElementById('scrolly-bot');
  const botImg = document.getElementById('orbitar-bot-img') as HTMLImageElement | null;
  const botThruster = document.getElementById('bot-thruster');
  const botShield = document.getElementById('bot-shield');
  const botSpeech = document.getElementById('bot-speech');
  const m1 = document.getElementById('orbitar-m1');
  const m2 = document.getElementById('orbitar-m2');
  const m3 = document.getElementById('orbitar-m3');

  const geom = getOrbitarGeometry();
  if (!geom || !bot || !botImg) return tl;

  const p1 = geom.p1;
  const p2 = geom.p2;
  const hazard = geom.hazard;
  const orbitState = { angle: 0 };
  const betaOrbit = { angle: Math.PI };

  // Phase 1: 1.5 concentric orbits around Planeta Alfa
  tl.to(m1, { opacity: 1, y: 0, duration: 0.6, ease: "power1.out" }, 0.1)
    .to(orbitState, {
      angle: Math.PI * 3,
      duration: 3,
      ease: "power1.inOut",
      onUpdate: () => {
        const x = p1.x + Math.cos(orbitState.angle) * p1.r;
        const y = p1.y + Math.sin(orbitState.angle) * p1.r;
        const rot = (orbitState.angle * 180 / Math.PI) + 90;
        gsap.set(bot, { x: x, y: y, rotation: rot });
        gsap.set('#orbitar-speech-container', { x: x, y: y - 35, rotation: 0 });
      }
    }, 0)
    .to(m1, { opacity: 0, y: -10, duration: 0.5 }, 2.6);

  // Phase 2: Slingshot release with thruster boost toward Plasma Barrier
  tl.call(() => {
      if (botSpeech) {
        botSpeech.style.opacity = '1';
        botSpeech.textContent = '¡Despegue Slingshot! 🚀';
      }
      gsap.to(botThruster, { opacity: 1, duration: 0.2 });
    }, [], 3.0)
    .to(m2, { opacity: 1, y: 0, duration: 0.6 }, 3.0)
    .to(bot, {
      x: hazard.x - 45,
      y: hazard.y + 15,
      rotation: 28,
      duration: 2.2,
      ease: "power2.in",
      onUpdate: () => {
        const bx = gsap.getProperty(bot, "x") as number;
        const by = gsap.getProperty(bot, "y") as number;
        gsap.set('#orbitar-speech-container', { x: bx, y: by - 35, rotation: 0 });
      }
    }, 3.0)
    .to(m2, { opacity: 0, y: -10, duration: 0.4 }, 4.9);

  // Phase 3: Traversal of Plasma Barrier with cyan Shield activation
  tl.call(() => {
      if (botSpeech) {
        botSpeech.textContent = '¡Escudos de plasma activos! ⚡';
      }
      if (botShield) gsap.to(botShield, { opacity: 1, duration: 0.2 });
      if (botImg) {
        if (currentSkin === 'astronaut') botImg.src = SKIN_CONFIG.astronaut.alert;
      }
    }, [], 5.2)
    .to(m3, { opacity: 1, y: 0, duration: 0.6 }, 5.2)
    .to(bot, {
      x: hazard.x + 40,
      y: hazard.y - 35,
      rotation: 34,
      duration: 1.8,
      ease: "power1.out",
      onUpdate: () => {
        const bx = gsap.getProperty(bot, "x") as number;
        const by = gsap.getProperty(bot, "y") as number;
        gsap.set('#orbitar-speech-container', { x: bx, y: by - 35, rotation: 0 });
      }
    }, 5.2)
    .to(bot, {
      rotation: "+=6",
      yoyo: true,
      repeat: 3,
      duration: 0.15
    }, 5.5)
    .to(m3, { opacity: 0, y: -10, duration: 0.4 }, 6.8);

  // Phase 4: Capture into Planeta Beta (Goal) orbit!
  tl.call(() => {
      if (botSpeech) {
        botSpeech.textContent = '¡Planeta Beta Asegurado! ✨';
      }
      if (botShield) gsap.to(botShield, { opacity: 0, duration: 0.3 });
      if (botThruster) gsap.to(botThruster, { opacity: 0, duration: 0.3 });
      if (botImg && currentSkin === 'astronaut') {
        botImg.src = SKIN_CONFIG.astronaut.relaxed;
      }
    }, [], 7.0)
    .to(betaOrbit, {
      angle: Math.PI * 3,
      duration: 2.8,
      ease: "power2.out",
      onUpdate: () => {
        const x = p2.x + Math.cos(betaOrbit.angle) * p2.r;
        const y = p2.y + Math.sin(betaOrbit.angle) * p2.r;
        const rot = (betaOrbit.angle * 180 / Math.PI) + 90;
        gsap.set(bot, { x: x, y: y, rotation: rot });
        gsap.set('#orbitar-speech-container', { x: x, y: y - 35, rotation: 0 });
      }
    }, 7.0);

  return tl;
}

function buildImpostorTimeline(): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });
  const magnifier = document.getElementById('impostor-magnifier');
  const cards = [
    document.getElementById('impostor-card-1'),
    document.getElementById('impostor-card-2'),
    document.getElementById('impostor-card-3')
  ];
  const card3Front = document.getElementById('card-3-front');
  const card3Back = document.getElementById('card-3-back');

  const isMobile = window.innerWidth < 640;
  const spread = isMobile ? 65 : 125;

  // Step 0: Magnifier enters
  tl.to(magnifier, { opacity: 1, scale: 1.1, x: -spread - 10, y: -25, duration: 0.8, ease: "power2.out" }, 0.2);

  // Step 1: Scan Augusto (Card 1)
  tl.call(() => {
      const w = document.getElementById('card-1-word');
      const s = document.getElementById('card-1-status');
      if (w) {
        w.textContent = 'CALCULADORA';
        w.className = 'text-center font-display font-bold text-xs sm:text-sm text-purple-300 drop-shadow-[0_0_8px_rgba(197,120,203,0.8)]';
      }
      if (s) {
        s.textContent = '✓ Palabra clave';
        s.className = 'text-[9px] font-mono text-purple-300 text-center font-bold';
      }
      if (cards[0]) cards[0].classList.add('border-purple-400/60');
    }, [], 1.0)
    .to(cards[0], { scale: 1.08, duration: 0.3, yoyo: true, repeat: 1 }, 1.0);

  // Step 2: Scan Paloma (Card 2)
  tl.to(magnifier, { x: -10, y: -30, duration: 0.8, ease: "power1.inOut" }, 1.8)
    .call(() => {
      const w = document.getElementById('card-2-word');
      const s = document.getElementById('card-2-status');
      if (w) {
        w.textContent = 'CALCULADORA';
        w.className = 'text-center font-display font-bold text-xs sm:text-sm text-purple-300 drop-shadow-[0_0_8px_rgba(197,120,203,0.8)]';
      }
      if (s) {
        s.textContent = '✓ Palabra clave';
        s.className = 'text-[9px] font-mono text-purple-300 text-center font-bold';
      }
      if (cards[1]) cards[1].classList.add('border-purple-400/60');
    }, [], 2.6)
    .to(cards[1], { scale: 1.08, duration: 0.3, yoyo: true, repeat: 1 }, 2.6);

  // Step 3: Scan Juan (Card 3) - Tension and Slam reveal
  tl.to(magnifier, { x: spread - 10, y: -25, scale: 1.25, duration: 0.9, ease: "power2.out" }, 3.4)
    .call(() => {
      const w = document.getElementById('card-3-word');
      const s = document.getElementById('card-3-status');
      if (w) {
        w.textContent = '¿Sospechoso?';
        w.className = 'text-center font-display font-bold text-xs sm:text-sm text-potasio-primary animate-pulse';
      }
      if (s) {
        s.textContent = '⚠️ Pistas dudosas';
        s.className = 'text-[9px] font-mono text-potasio-primary text-center font-bold';
      }
    }, [], 4.3)
    .to(cards[2], { x: "+=4", yoyo: true, repeat: 7, duration: 0.08 }, 4.4)
    .call(() => {
      if (card3Front) card3Front.classList.add('hidden');
      if (card3Back) card3Back.classList.remove('hidden');
      if (cards[2]) {
        cards[2].className = 'impostor-card w-24 h-36 sm:w-28 sm:h-42 rounded-2xl bg-gradient-to-br from-slate-900 to-red-950 border-2 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.8)] p-3 flex flex-col justify-between transform-style-3d will-change-transform transition-all z-30 scale-110';
      }
    }, [], 5.1)
    .to(cards[2], { scale: 1.15, duration: 0.25, yoyo: true, repeat: 1 }, 5.1)
    // Step 4: Move magnifier aside so card is visible
    .to(magnifier, {
      x: spread * 1.55,
      y: -75,
      rotation: 20,
      scale: 0.95,
      duration: 0.7,
      ease: "power2.out"
    }, 5.6);

  return tl;
}

function initTheaterScrollytelling(): void {
  if (orbitarTimeline) orbitarTimeline.kill();
  if (impostorTimeline) impostorTimeline.kill();

  setupInitialOrbitarPosition();
  setupInitialImpostorPosition();

  orbitarTimeline = buildOrbitarTimeline();
  impostorTimeline = buildImpostorTimeline();

  ScrollTrigger.create({
    trigger: "#games-theater-scene",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.6,
    onUpdate: (self) => {
      if (activeGameId === 'orbitar' && orbitarTimeline) {
        orbitarTimeline.progress(self.progress);
      } else if (activeGameId === 'impostor' && impostorTimeline) {
        impostorTimeline.progress(self.progress);
      }
    }
  });
}

// ---------------------------------------------------------------------------
// 8. Scene 3: Showcase -> Contact Transition
// ---------------------------------------------------------------------------
const bottomTl = gsap.timeline({ paused: true });
bottomTl
  .to("#showcase-layer", { opacity: 0, scale: 1.04, pointerEvents: "none", duration: 0.7, ease: "power2.inOut" })
  .to("#contact-layer", { opacity: 1, y: 0, pointerEvents: "auto", duration: 0.7, ease: "power2.out" }, "-=0.4");

ScrollTrigger.create({
  trigger: "#bottom-scene",
  start: "top top",
  end: "bottom bottom",
  scrub: 0.6,
  animation: bottomTl
});

// Scroll Cue inside Showcase to view Contact
document.getElementById('showcase-scroll-cue')?.addEventListener('click', () => {
  const bottomScene = document.getElementById('bottom-scene');
  if (bottomScene) {
    const targetY = bottomScene.offsetTop + bottomScene.offsetHeight * 0.85;
    gsap.to(window, { scrollTo: targetY, duration: 0.9, ease: "power2.inOut" });
  }
});

// Anchor Navigation for navlinks (#contact, #about, #games)
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;

    if (targetId === '#contact' || targetId === '#about') {
      e.preventDefault();
      const bottomScene = document.getElementById('bottom-scene');
      if (bottomScene) {
        const targetY = bottomScene.offsetTop + bottomScene.offsetHeight * 0.85;
        gsap.to(window, { scrollTo: targetY, duration: 0.9, ease: "power2.inOut" });
      }
    } else if (targetId === '#games' || targetId === '#games-theater') {
      e.preventDefault();
      const theaterScene = document.getElementById('games-theater-scene');
      if (theaterScene) {
        gsap.to(window, { scrollTo: theaterScene.offsetTop, duration: 0.9, ease: "power2.inOut" });
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 9. Orbitar Space Canvas (Twinkling Stars & Comets)
// ---------------------------------------------------------------------------
let isCanvasRunning = false;
let canvasAnimId: number | null = null;

function initOrbitarCanvas(): void {
  const canvas = document.getElementById('orbitar-space-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let stars: Array<{ x: number; y: number; radius: number; baseAlpha: number; phase: number; speed: number; colorType: string }> = [];
  let comets: Array<{ x: number; y: number; dx: number; dy: number; length: number; opacity: number; decay: number }> = [];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize(): void {
    if (!canvas) return;
    const parent = canvas.parentElement;
    width = parent ? parent.offsetWidth : window.innerWidth;
    height = parent ? parent.offsetHeight : window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.scale(dpr, dpr);
    initStars();
  }

  function initStars(): void {
    stars = [];
    const count = Math.min(Math.floor((width * height) / 7500), 130);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + 0.4,
        baseAlpha: Math.random() * 0.7 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.008,
        colorType: Math.random() < 0.3 ? 'playerCyan' : 'neutralGrey'
      });
    }
  }

  function spawnComet(): void {
    if (comets.length >= 2) return;
    const startX = Math.random() * (width * 0.75);
    const startY = Math.random() * (height * 0.35);
    const angle = (Math.PI / 4) + (Math.random() * 0.2 - 0.1);
    const speed = Math.random() * 4.5 + 3.5;
    const length = Math.random() * 80 + 70;
    comets.push({
      x: startX,
      y: startY,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      length: length,
      opacity: 1,
      decay: 0.012
    });
  }

  let lastComet = Date.now();

  function render(): void {
    if (!isCanvasRunning || !ctx) return;
    ctx.clearRect(0, 0, width, height);

    // Stars matching Colors.ts (#8B949E & #48CAE4)
    for (const star of stars) {
      star.phase += star.speed;
      const alpha = star.baseAlpha * (0.6 + 0.4 * Math.sin(star.phase));
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.colorType === 'playerCyan'
        ? `rgba(72, 202, 228, ${alpha})`
        : `rgba(139, 148, 158, ${alpha})`;
      ctx.fill();
    }

    // Spawn comets periodically
    const now = Date.now();
    if (now - lastComet > 4500 + Math.random() * 3500) {
      spawnComet();
      lastComet = now;
    }

    // Render comets
    for (let i = comets.length - 1; i >= 0; i--) {
      const c = comets[i];
      c.x += c.dx;
      c.y += c.dy;
      c.opacity -= c.decay;

      if (c.opacity <= 0 || c.x > width + 100 || c.y > height + 100) {
        comets.splice(i, 1);
        continue;
      }

      const dist = Math.hypot(c.dx, c.dy);
      const tailX = c.x - (c.dx / dist) * c.length;
      const tailY = c.y - (c.dy / dist) * c.length;

      const grad = ctx.createLinearGradient(tailX, tailY, c.x, c.y);
      grad.addColorStop(0, 'rgba(72, 202, 228, 0)');
      grad.addColorStop(0.7, `rgba(72, 202, 228, ${c.opacity * 0.6})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${c.opacity})`);

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(c.x, c.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(c.x, c.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
      ctx.shadowColor = '#48cae4';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    canvasAnimId = requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize);
  resize();

  // Save GPU: Only render canvas when theater is in viewport
  const theaterSection = document.getElementById('games-theater');
  if (theaterSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && activeGameId === 'orbitar') {
          if (!isCanvasRunning) {
            isCanvasRunning = true;
            render();
          }
        } else {
          isCanvasRunning = false;
          if (canvasAnimId) cancelAnimationFrame(canvasAnimId);
        }
      });
    }, { threshold: 0.05 });
    observer.observe(theaterSection);
  }

  isCanvasRunning = true;
  render();
}

// ---------------------------------------------------------------------------
// 10. Contact Form Mailto Obfuscation (Strict Security Rule)
// ---------------------------------------------------------------------------
document.getElementById('contact-btn')?.addEventListener('click', (e) => {
  e.preventDefault();
  const user = "potasiogames";
  const domain = "hotmail.com";
  const subject = encodeURIComponent("Contacto desde Potasio Games");
  window.location.href = `mailto:${user}@${domain}?subject=${subject}`;
});

// ---------------------------------------------------------------------------
// 11. Code Redemption Deep Link Modal
// ---------------------------------------------------------------------------
(function initCodeRedemption() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    const appUrl = `impostor://redeem?code=${encodeURIComponent(code)}`;
    const modal = document.getElementById('redeem-modal');
    const openBtn = document.getElementById('redeem-open-btn') as HTMLAnchorElement | null;
    const spinner = document.getElementById('redeem-spinner');
    const icon = document.getElementById('redeem-icon');
    const title = document.getElementById('redeem-title');
    const message = document.getElementById('redeem-message');
    const closeBtn = document.getElementById('redeem-close-btn');

    if (!modal) return;

    modal.classList.remove('hidden');
    if (openBtn) openBtn.href = appUrl;
    refreshIcons();

    setTimeout(() => {
      window.location.href = appUrl;
    }, 500);

    setTimeout(() => {
      if (spinner) spinner.classList.add('hidden');
      if (icon) icon.classList.remove('hidden');
      if (title) title.textContent = '¡Código Detectado!';
      if (message) message.textContent = 'Toca el botón para activar tu código en la app Impostor.';
    }, 2000);

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }
})();

// ---------------------------------------------------------------------------
// 12. Lifecycle & Resize Bindings
// ---------------------------------------------------------------------------
function initApp(): void {
  initTheaterScrollytelling();
  initOrbitarCanvas();
  refreshIcons();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initApp, 60);
} else {
  document.addEventListener('DOMContentLoaded', initApp);
}

ScrollTrigger.addEventListener("refreshInit", () => {
  setupInitialOrbitarPosition();
  setupInitialImpostorPosition();
});

window.addEventListener('resize', () => {
  ScrollTrigger.refresh();
});
