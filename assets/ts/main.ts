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
ScrollTrigger.clearScrollMemory('manual');
window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

window.addEventListener('beforeunload', () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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

let spaceCanvasWakeup: (() => void) | null = null;
let spaceCanvasSleep: (() => void) | null = null;
let addStarParallax: ((dx: number, dy: number) => void) | null = null;

let lastBotX: number | null = null;
let lastBotY: number | null = null;
let plasmaWavePhase = 0;

function updatePlasmaWave(phase: number): void {
  const outer = document.getElementById('plasma-filament-outer');
  const core = document.getElementById('plasma-filament-core');
  if (!outer && !core) return;

  const w1 = Math.sin(phase) * 12;
  const w2 = Math.cos(phase * 1.3) * 12;

  const dOuter = `M 30,60 C ${80 + w1 * 0.5},${40 + w1} ${180 - w2 * 0.5},${80 - w2} 230,60`;
  const dCore = `M 30,60 C ${90 - w2 * 0.4},${48 - w2 * 0.7} ${170 + w1 * 0.4},${72 + w1 * 0.7} 230,60`;

  if (outer) outer.setAttribute('d', dOuter);
  if (core) core.setAttribute('d', dCore);
}

function updateBotMotionEffects(currentX: number, currentY: number): void {
  if (lastBotX !== null && lastBotY !== null) {
    const dx = currentX - lastBotX;
    const dy = currentY - lastBotY;
    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
      addStarParallax?.(-dx * 0.25, -dy * 0.25);
      plasmaWavePhase += Math.hypot(dx, dy) * 0.04;
      updatePlasmaWave(plasmaWavePhase);
    }
  }
  lastBotX = currentX;
  lastBotY = currentY;
}

function lerpColor(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, t: number): string {
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// ---------------------------------------------------------------------------
// 3. Persistent Fixed Background System & Hero Transition
// ---------------------------------------------------------------------------
export function updateGlobalBackground(progress: number, gameId: GameId): void {
  const bgBase = document.getElementById('global-bg-base');
  const heroGlow = document.getElementById('global-hero-glow');
  const orbGlow = document.getElementById('global-orbitar-glow');
  const impGlow = document.getElementById('global-impostor-glow');
  const spaceCanvas = document.getElementById('global-space-canvas');

  // Hero Splash Screen and initial view of "Elegí tu Próxima Aventura"
  // Remains 100% identical to the first screen until user scrolls past 0.55
  if (progress <= 0.55) {
    if (bgBase) bgBase.style.backgroundColor = '#030612';
    if (heroGlow) heroGlow.style.opacity = '1';
    if (orbGlow) orbGlow.style.opacity = '0';
    if (impGlow) impGlow.style.opacity = '0';
    if (spaceCanvas) spaceCanvas.style.opacity = '0';
    spaceCanvasSleep?.();
    return;
  }

  // Smooth gradual blending as user continues scrolling down (0.55 -> 0.95)
  const blend = Math.min(Math.max((progress - 0.55) / 0.38, 0), 1);

  if (heroGlow) heroGlow.style.opacity = (1 - blend).toString();

  if (gameId === 'orbitar') {
    if (orbGlow) orbGlow.style.opacity = blend.toString();
    if (impGlow) impGlow.style.opacity = '0';
    if (spaceCanvas) spaceCanvas.style.opacity = blend.toString();
    // Continuous RGB transition from #030612 (3,6,18) to #0B1019 (11,16,25)
    if (bgBase) bgBase.style.backgroundColor = lerpColor(3, 6, 18, 11, 16, 25, blend);
    if (blend > 0) spaceCanvasWakeup?.();
  } else {
    // Impostor
    if (impGlow) impGlow.style.opacity = blend.toString();
    if (orbGlow) orbGlow.style.opacity = '0';
    if (spaceCanvas) spaceCanvas.style.opacity = '0';
    // Continuous RGB transition from #030612 (3,6,18) to #0a0f1a (10,15,26)
    if (bgBase) bgBase.style.backgroundColor = lerpColor(3, 6, 18, 10, 15, 26, blend);
    spaceCanvasSleep?.();
  }
}

export function updatePortalCardsUI(gameId: GameId): void {
  const portalOrb = document.getElementById('portal-orbitar');
  const portalImp = document.getElementById('portal-impostor');
  if (!portalOrb || !portalImp) return;

  if (gameId === 'orbitar') {
    portalOrb.classList.add('active', 'border-2', 'border-cyan-400/80', 'shadow-[0_0_35px_rgba(34,211,238,0.25)]');
    portalOrb.classList.remove('border-white/10');
    portalImp.classList.remove('active', 'border-2', 'border-potasio-primary/80', 'shadow-[0_0_35px_rgba(244,238,90,0.3)]');
    portalImp.classList.add('border-white/10');
  } else {
    portalImp.classList.add('active', 'border-2', 'border-potasio-primary/80', 'shadow-[0_0_35px_rgba(244,238,90,0.3)]');
    portalImp.classList.remove('border-white/10');
    portalOrb.classList.remove('active', 'border-2', 'border-cyan-400/80', 'shadow-[0_0_35px_rgba(34,211,238,0.25)]');
    portalOrb.classList.add('border-white/10');
  }
}

const heroTl = gsap.timeline({ paused: true });
heroTl
  .to("#scroll-indicator", { opacity: 0, scale: 0.5, duration: 0.25, ease: "power1.out" })
  .to("#hero-logo-layer", { opacity: 0, scale: 1.05, duration: 0.55, ease: "power2.inOut" }, 0)
  .to("#hero-spotlight", { opacity: 0, duration: 0.4 }, 0)
  .to("#adventure-layer", { opacity: 1, y: 0, pointerEvents: "auto", duration: 0.55, ease: "power2.out" }, "-=0.3")
  .to({}, { duration: 0.4 }); // Hold adventure layer steady while background stays original splash

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

    updateGlobalBackground(self.progress, activeGameId);
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
// 5. Orbitar Geometry & Positioning (Planeta Inicio, Intermedio, Objetivo)
// ---------------------------------------------------------------------------
interface GeometryPoint {
  x: number;
  y: number;
  r: number;
}

interface OrbitarGeometry {
  p1: GeometryPoint;
  pMid: GeometryPoint;
  p2: GeometryPoint;
  hazard: { x: number; y: number };
}

function getOrbitarGeometry(): OrbitarGeometry | null {
  const world = document.getElementById('world-orbitar');
  const body1 = document.getElementById('planet-1-body');
  const bodyMid = document.getElementById('planet-mid-body');
  const body2 = document.getElementById('planet-2-body');
  const hazard = document.getElementById('hazard-container');

  if (!world || !body1 || !bodyMid || !body2 || !hazard) return null;

  const wRect = world.getBoundingClientRect();
  const b1Rect = body1.getBoundingClientRect();
  const bMidRect = bodyMid.getBoundingClientRect();
  const b2Rect = body2.getBoundingClientRect();
  const hRect = hazard.getBoundingClientRect();

  // Radio calculado sobre el cuerpo del planeta en sí (no sobre el anillo exterior)
  // El disco sólido en SVG tiene radio 42/50 del wrapper.
  // Sumamos offset (+14) para que el centro del sprite del bot orbite pegado a la superficie.
  const r1 = (b1Rect.width / 2) * 0.84 + 14;
  const rMid = (bMidRect.width / 2) * 0.84 + 14;
  const r2 = (b2Rect.width / 2) * 0.88 + 14;

  return {
    p1: {
      x: b1Rect.left - wRect.left + b1Rect.width / 2,
      y: b1Rect.top - wRect.top + b1Rect.height / 2,
      r: r1
    },
    pMid: {
      x: bMidRect.left - wRect.left + bMidRect.width / 2,
      y: bMidRect.top - wRect.top + bMidRect.height / 2,
      r: rMid
    },
    p2: {
      x: b2Rect.left - wRect.left + b2Rect.width / 2,
      y: b2Rect.top - wRect.top + b2Rect.height / 2,
      r: r2
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
  if (!geom || !bot) return;

  // Ubicado inicialmente sobre la superficie del Planeta de Inicio en ángulo 0:
  const initAngle = 0;
  const x = geom.p1.x + Math.cos(initAngle) * geom.p1.r;
  const y = geom.p1.y + Math.sin(initAngle) * geom.p1.r;
  const rot = 90;

  gsap.set(bot, {
    left: 0,
    top: 0,
    x: x,
    y: y,
    rotation: rot
  });
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
export function selectGame(gameId: GameId): void {
  activeGameId = gameId;
  updatePortalCardsUI(gameId);
  updateGlobalBackground(1.0, gameId);
  syncTheaterWorld(gameId);
}

export function syncTheaterWorld(gameId: GameId): void {
  activeGameId = gameId;
  const worldOrbitar = document.getElementById('world-orbitar');
  const worldImpostor = document.getElementById('world-impostor');

  // Update fixed global background for the chosen game world
  updateGlobalBackground(1.0, gameId);
  updatePortalCardsUI(gameId);

  if (gameId === 'orbitar') {
    if (worldOrbitar) worldOrbitar.classList.remove('hidden');
    if (worldImpostor) worldImpostor.classList.add('hidden');
    spaceCanvasWakeup?.();
    setupInitialOrbitarPosition();
  } else {
    if (worldOrbitar) worldOrbitar.classList.add('hidden');
    if (worldImpostor) worldImpostor.classList.remove('hidden');
    spaceCanvasSleep?.();
    setupInitialImpostorPosition();
  }

  updateShowcase(gameId);
}

export function updateShowcase(gameId: GameId): void {
  const scOrbitar = document.getElementById('showcase-orbitar');
  const scImpostor = document.getElementById('showcase-impostor');

  if (gameId === 'orbitar') {
    if (scOrbitar) scOrbitar.classList.remove('hidden');
    if (scImpostor) scImpostor.classList.add('hidden');
  } else {
    if (scOrbitar) scOrbitar.classList.add('hidden');
    if (scImpostor) scImpostor.classList.remove('hidden');
  }
}

// Launch Game from Adventure Cards
export function launchGame(gameId: GameId): void {
  selectGame(gameId);
  const clickedCard = document.getElementById(`portal-${gameId}`);
  if (clickedCard) {
    clickedCard.classList.add('portal-card-expanding');
  }

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
  const m1 = document.getElementById('orbitar-m1');
  const m2 = document.getElementById('orbitar-m2');
  const m3 = document.getElementById('orbitar-m3');

  const geom = getOrbitarGeometry();
  if (!geom || !bot || !botImg) return tl;

  const p1 = geom.p1;
  const pMid = geom.pMid;
  const p2 = geom.p2;

  // Estados de ángulo para cada planeta
  const orbit1 = { angle: 0 };
  const orbitMid = { angle: Math.PI }; // llega por el lado izquierdo de pMid (180°)
  const orbitGoal = { angle: Math.PI / 2 }; // llega por la parte inferior de p2 (90°)

  // -------------------------------------------------------------------------
  // FASE 1: Órbita en Planeta de Inicio (2 vueltas completas hasta ángulo 0)
  // -------------------------------------------------------------------------
  tl.to(m1, { opacity: 1, y: 0, duration: 0.5, ease: "power1.out" }, 0.1)
    .to(orbit1, {
      angle: Math.PI * 4, // 2 vueltas completas: termina exactamente en 4*PI = 0 rad (lado derecho)
      duration: 3.0,
      ease: "power1.inOut",
      onUpdate: () => {
        const x = p1.x + Math.cos(orbit1.angle) * p1.r;
        const y = p1.y + Math.sin(orbit1.angle) * p1.r;
        const rot = (orbit1.angle * 180 / Math.PI) + 90; // inicia en 90° y termina en 810° (90° mod 360)
        gsap.set(bot, { x: x, y: y, rotation: rot });
        updateBotMotionEffects(x, y);
      }
    }, 0)
    .to(m1, { opacity: 0, y: -10, duration: 0.4 }, 2.6);

  // -------------------------------------------------------------------------
  // FASE 2: Salto desde ángulo 0° hacia Planeta Intermedio (horizontal)
  // -------------------------------------------------------------------------
  tl.call(() => {
      gsap.to(botThruster, { opacity: 1, duration: 0.2 });
    }, [], 3.0)
    .to(m2, { opacity: 1, y: 0, duration: 0.5 }, 3.0)
    .to(bot, {
      x: pMid.x - pMid.r,
      y: pMid.y,
      rotation: 810, // Cabeza apunta a la derecha, propulsor a los pies impulsando a la derecha
      duration: 2.0,
      ease: "power2.inOut",
      onUpdate: () => {
        const bx = gsap.getProperty(bot, "x") as number;
        const by = gsap.getProperty(bot, "y") as number;
        updateBotMotionEffects(bx, by);
      }
    }, 3.0)
    .to(m2, { opacity: 0, y: -10, duration: 0.4 }, 4.7);

  // -------------------------------------------------------------------------
  // FASE 3: Órbita en Planeta Intermedio y preparación de salida a 90° (arriba)
  // -------------------------------------------------------------------------
  tl.call(() => {
      gsap.to(botThruster, { opacity: 0, duration: 0.2 });
    }, [], 5.0)
    .to(orbitMid, {
      // De Math.PI (lado izquierdo) gira 1.25 vueltas hasta 3.5*PI (vértice superior = hacia arriba)
      angle: Math.PI + Math.PI * 2.5,
      duration: 2.2,
      ease: "power1.inOut",
      onUpdate: () => {
        const x = pMid.x + Math.cos(orbitMid.angle) * pMid.r;
        const y = pMid.y + Math.sin(orbitMid.angle) * pMid.r;
        // Rotación continua sin desenrollarse: transiciona de 810° a 720° (0° mod 360, cabeza hacia arriba)
        const t = (orbitMid.angle - Math.PI) / (Math.PI * 2.5);
        const rot = 810 - t * 90;
        gsap.set(bot, { x: x, y: y, rotation: rot });
        updateBotMotionEffects(x, y);
      }
    }, 5.0);

  // -------------------------------------------------------------------------
  // FASE 4: Salto a 90° (vertical hacia arriba) esquivando la Barrera de Plasma
  // -------------------------------------------------------------------------
  tl.call(() => {
      gsap.to(botThruster, { opacity: 1, duration: 0.2 });
    }, [], 7.2)
    .to(m3, { opacity: 1, y: 0, duration: 0.5 }, 7.2)
    .to(bot, {
      x: p2.x,
      y: p2.y + p2.r,
      rotation: 720, // Cabeza apunta hacia ARRIBA (hacia el objetivo), propulsor a los pies impulsando abajo
      duration: 2.0,
      ease: "power2.inOut",
      onUpdate: () => {
        const bx = gsap.getProperty(bot, "x") as number;
        const by = gsap.getProperty(bot, "y") as number;
        updateBotMotionEffects(bx, by);
      }
    }, 7.2)
    .to(m3, { opacity: 0, y: -10, duration: 0.4 }, 8.9);

  // -------------------------------------------------------------------------
  // FASE 5: Captura y Órbita en Planeta Objetivo
  // -------------------------------------------------------------------------
  tl.call(() => {
      gsap.to(botThruster, { opacity: 0, duration: 0.3 });
      if (botImg && currentSkin === 'astronaut') {
        botImg.src = SKIN_CONFIG.astronaut.relaxed;
      }
    }, [], 9.2)
    .to(orbitGoal, {
      angle: (Math.PI / 2) + Math.PI * 3.5,
      duration: 2.8,
      ease: "power2.out",
      onUpdate: () => {
        const x = p2.x + Math.cos(orbitGoal.angle) * p2.r;
        const y = p2.y + Math.sin(orbitGoal.angle) * p2.r;
        const rot = (orbitGoal.angle * 180 / Math.PI) + 90 + 540;
        gsap.set(bot, { x: x, y: y, rotation: rot });
        updateBotMotionEffects(x, y);
      }
    }, 9.2);

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
  snap: {
    snapTo: [0, 1],
    duration: { min: 0.7, max: 1.1 },
    delay: 0,
    ease: "power2.inOut"
  },
  animation: bottomTl
});

// Single wheel motion trigger to glide through superposition without stopping midway
let isBottomAutoScrolling = false;
const bottomSceneEl = document.getElementById('bottom-scene');

if (bottomSceneEl) {
  bottomSceneEl.addEventListener('wheel', (e) => {
    if (isBottomAutoScrolling) return;

    const rect = bottomSceneEl.getBoundingClientRect();
    if (rect.top <= 10 && rect.bottom >= window.innerHeight - 10) {
      const maxScroll = rect.height - window.innerHeight;
      const currentScroll = -rect.top;
      const progress = maxScroll > 0 ? currentScroll / maxScroll : 0;

      if (e.deltaY > 15 && progress < 0.4) {
        e.preventDefault();
        isBottomAutoScrolling = true;
        const targetY = bottomSceneEl.offsetTop + maxScroll;
        gsap.to(window, {
          scrollTo: targetY,
          duration: 1.1,
          ease: "power2.inOut",
          onComplete: () => {
            setTimeout(() => { isBottomAutoScrolling = false; }, 200);
          }
        });
      } else if (e.deltaY < -15 && progress > 0.6) {
        e.preventDefault();
        isBottomAutoScrolling = true;
        const targetY = bottomSceneEl.offsetTop;
        gsap.to(window, {
          scrollTo: targetY,
          duration: 1.1,
          ease: "power2.inOut",
          onComplete: () => {
            setTimeout(() => { isBottomAutoScrolling = false; }, 200);
          }
        });
      }
    }
  }, { passive: false });
}

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
// 9. Reusable Orbitar Space Canvas (Twinkling Stars & Comets)
// ---------------------------------------------------------------------------
function initSpaceCanvas(canvasId: string, isVisibleFn: () => boolean): void {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let stars: Array<{ x: number; y: number; radius: number; baseAlpha: number; phase: number; speed: number; colorType: string }> = [];
  let comets: Array<{ x: number; y: number; dx: number; dy: number; length: number; opacity: number; decay: number }> = [];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let isRunning = false;
  let animId: number | null = null;
  let lastComet = Date.now();

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

  function render(): void {
    if (!isRunning || !ctx) return;
    ctx.clearRect(0, 0, width, height);

    // Render twinkling stars
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

    animId = requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize);
  resize();

  spaceCanvasWakeup = () => {
    if (isVisibleFn() && !isRunning) {
      isRunning = true;
      render();
    }
  };

  spaceCanvasSleep = () => {
    isRunning = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  };

  addStarParallax = (dx: number, dy: number) => {
    if (!width || !height) return;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x = (s.x + dx + width) % width;
      s.y = (s.y + dy + height) % height;
    }
  };

  const section = canvas.closest('section') || canvas.parentElement;
  if (section) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && isVisibleFn()) {
          spaceCanvasWakeup?.();
        } else {
          spaceCanvasSleep?.();
        }
      });
    }, { threshold: 0.05 });
    observer.observe(section);
  }

  isRunning = true;
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
export function resetAllStates(): void {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  activeGameId = 'orbitar';
  currentSkin = 'astronaut';
  isHeroSplash = true;
  lastBotX = null;
  lastBotY = null;

  heroTl.progress(0);
  bottomTl.progress(0);
  if (orbitarTimeline) orbitarTimeline.progress(0);
  if (impostorTimeline) impostorTimeline.progress(0);

  updateGlobalBackground(0, 'orbitar');
  updatePortalCardsUI('orbitar');
  setupInitialOrbitarPosition();
  setupInitialImpostorPosition();

  ScrollTrigger.refresh(true);
}

function initApp(): void {
  initTheaterScrollytelling();
  initSpaceCanvas('global-space-canvas', () => activeGameId === 'orbitar');
  refreshIcons();
  resetAllStates();
}

window.addEventListener('pageshow', () => {
  resetAllStates();
});

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
