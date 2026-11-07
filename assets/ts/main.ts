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

export function isMobileViewport(): boolean {
  return window.innerWidth < 768;
}

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

  const w1 = Math.sin(phase) * 10;
  const w2 = Math.cos(phase * 0.85) * 10;

  // Ondulación sinusoidal pausada y natural de los filamentos entre microplanetas
  const dOuter = `M 30,60 C ${80 + w1 * 0.3},${45 + w1} ${180 - w2 * 0.3},${75 - w2} 230,60`;
  const dCore = `M 30,60 C ${95 - w2 * 0.25},${52 - w2 * 0.6} ${165 + w1 * 0.25},${68 + w1 * 0.6} 230,60`;

  if (outer) outer.setAttribute('d', dOuter);
  if (core) core.setAttribute('d', dCore);
}

function updateBotMotionEffects(currentX: number, currentY: number, isFlying: boolean = false): void {
  if (lastBotX !== null && lastBotY !== null) {
    const dx = currentX - lastBotX;
    const dy = currentY - lastBotY;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.05) {
      // Las estrellas solo se mueven cuando el personaje está volando (no cuando rota en un planeta)
      if (isFlying) {
        addStarParallax?.(-dx * 0.25, -dy * 0.25);
      }
      // Ondulación sinusoidal suave de la barrera de plasma (ritmo pausado y apreciable)
      plasmaWavePhase += dist * 0.005;
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
  // Remains 100% identical to the first screen until user begins scrolling in Screen 2
  if (progress <= 0.52) {
    if (bgBase) bgBase.style.backgroundColor = '#030612';
    if (heroGlow) heroGlow.style.opacity = '1';
    if (orbGlow) orbGlow.style.opacity = '0';
    if (impGlow) impGlow.style.opacity = '0';
    if (spaceCanvas) spaceCanvas.style.opacity = '0';
    spaceCanvasSleep?.();
    return;
  }

  // Smooth gradual blending as user continues scrolling down in Screen 2 (0.52 -> 0.96)
  const blend = Math.min(Math.max((progress - 0.52) / 0.44, 0), 1);

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
  const frameOrb = document.getElementById('portal-frame-orbitar');
  const frameImp = document.getElementById('portal-frame-impostor');

  if (portalOrb && portalImp) {
    if (gameId === 'orbitar') {
      portalOrb.classList.add('active');
      portalImp.classList.remove('active');
    } else {
      portalImp.classList.add('active');
      portalOrb.classList.remove('active');
    }
  }

  if (frameOrb && frameImp) {
    if (gameId === 'orbitar') {
      frameOrb.classList.add('border-2', 'border-cyan-400/80', 'shadow-[0_0_35px_rgba(34,211,238,0.25)]');
      frameOrb.classList.remove('border', 'border-white/10', 'shadow-xl');
      frameImp.classList.remove('border-2', 'border-potasio-primary/80', 'shadow-[0_0_35px_rgba(244,238,90,0.3)]');
      frameImp.classList.add('border', 'border-white/10', 'shadow-xl');
    } else {
      frameImp.classList.add('border-2', 'border-potasio-primary/80', 'shadow-[0_0_35px_rgba(244,238,90,0.3)]');
      frameImp.classList.remove('border', 'border-white/10', 'shadow-xl');
      frameOrb.classList.remove('border-2', 'border-cyan-400/80', 'shadow-[0_0_35px_rgba(34,211,238,0.25)]');
      frameOrb.classList.add('border', 'border-white/10', 'shadow-xl');
    }
  }

  const dotOrb = document.getElementById('dot-orbitar');
  const dotImp = document.getElementById('dot-impostor');
  if (dotOrb && dotImp) {
    if (gameId === 'orbitar') {
      dotOrb.className = "w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all scale-125";
      dotImp.className = "w-2.5 h-2.5 rounded-full bg-slate-600 transition-all scale-100";
    } else {
      dotImp.className = "w-2.5 h-2.5 rounded-full bg-potasio-primary shadow-[0_0_8px_rgba(244,238,90,0.8)] transition-all scale-125";
      dotOrb.className = "w-2.5 h-2.5 rounded-full bg-slate-600 transition-all scale-100";
    }
  }
}

export function getHeroScrollProgress(): number {
  const heroScene = document.getElementById('hero-scene');
  if (!heroScene) return 0;
  const vh = window.innerHeight;
  const heroRect = heroScene.getBoundingClientRect();
  const heroStickyScrollable = Math.max(1, heroRect.height - vh);
  const heroScrolled = Math.max(0, -heroRect.top);
  return Math.min(Math.max(heroScrolled / heroStickyScrollable, 0), 1);
}

export function updateAdventureModalTransition(): void {
  const heroScene = document.getElementById('hero-scene');
  const theaterScene = document.getElementById('games-theater-scene');
  const bottomScene = document.getElementById('bottom-scene');
  const adventureHeader = document.getElementById('adventure-header');
  const cards = document.querySelectorAll<HTMLElement>('.portal-card');
  const travelingStage = document.getElementById('game-showcase-stage');
  const badgeAnchor = document.getElementById('theater-badge-anchor');

  if (!heroScene || !theaterScene || !bottomScene || !travelingStage || !badgeAnchor || cards.length === 0) return;

  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const heroRect = heroScene.getBoundingClientRect();
  const theaterRect = theaterScene.getBoundingClientRect();
  const bottomRect = bottomScene.getBoundingClientRect();

  // 1. Hero Scene Scroll Progress (Screen 1 -> Screen 2 -> Centering Selected Modal)
  const heroStickyScrollable = Math.max(1, heroRect.height - vh);
  const heroScrolled = Math.max(0, -heroRect.top);
  const heroProgress = Math.min(Math.max(heroScrolled / heroStickyScrollable, 0), 1);

  // Phase 1: Centering selected card & fading unselected cards (heroProgress: 0.54 -> 0.92)
  const rawCenter = Math.min(Math.max((heroProgress - 0.54) / 0.38, 0), 1);
  const easeCenter = gsap.parseEase("power2.inOut")(rawCenter);

  // Phase 2: Simultaneous shrinking (frame + inner content except title)
  // AND descending into the top-left corner of Screen 3 as we scroll down toward Screen 3
  const shrinkDockStartScroll = heroStickyScrollable * 0.90;
  const shrinkDockTotalScroll = Math.max(1, heroRect.height - shrinkDockStartScroll);
  const rawShrinkDock = Math.min(Math.max((heroScrolled - shrinkDockStartScroll) / shrinkDockTotalScroll, 0), 1);
  const easeShrinkDock = gsap.parseEase("power2.inOut")(rawShrinkDock);

  // Allow card to travel freely out of carousel boundaries during Phase 2 shrink & dock
  const adventureContainer = document.getElementById('adventure-cards-container');
  if (adventureContainer) {
    adventureContainer.style.overflow = rawShrinkDock > 0 ? 'visible' : '';
  }

  // 1. Fade out "Elegí tu Próxima Aventura" header during Phase 1
  if (adventureHeader) {
    gsap.set(adventureHeader, {
      opacity: 1 - easeCenter,
      y: -16 * easeCenter
    });
  }

  // Target badge dimensions & position from #theater-badge-anchor in Screen 3
  const badgeW = badgeAnchor.offsetWidth || 150;
  const badgeH = badgeAnchor.offsetHeight || 52;
  const dockedVpX = badgeAnchor.offsetLeft + badgeW / 2;
  const dockedVpY = badgeAnchor.offsetTop + badgeH / 2;

  // Prevent #hero-scene from blocking pointer events once Screen 3 arrives
  const isInScreen3OrLater = theaterRect.top <= 1;
  if (theaterRect.top <= 4) {
    heroScene.style.pointerEvents = 'none';
  } else {
    heroScene.style.pointerEvents = 'auto';
  }

  cards.forEach((card) => {
    const gameKey = card.getAttribute('data-game') as GameId | null;
    const isSelected = gameKey === activeGameId;
    const frameEl = card.querySelector<HTMLElement>('.portal-card-frame');
    const titleEl = card.querySelector<HTMLElement>('.portal-card-title');
    const extraEls = card.querySelectorAll<HTMLElement>('.portal-card-extra');

    if (!isSelected) {
      gsap.set(card, {
        x: 0,
        y: 0,
        opacity: 1 - easeCenter,
        scale: 1 - 0.05 * easeCenter,
        pointerEvents: rawCenter > 0.15 ? 'none' : 'auto',
        zIndex: 10
      });
      if (frameEl) {
        gsap.set(frameEl, { clearProps: "width,height,left,top,borderRadius" });
      }
      if (titleEl) {
        gsap.set(titleEl, { x: 0, y: 0, scale: 1 });
      }
      if (extraEls.length > 0) {
        gsap.set(extraEls, { x: 0, y: 0, scale: 1, opacity: 1 });
      }
      return;
    }

    // Selected Card: calculate invariant untransformed center in viewport
    const curCardX = (gsap.getProperty(card, "x") as number) || 0;
    const curCardY = (gsap.getProperty(card, "y") as number) || 0;
    const cardRect = card.getBoundingClientRect();
    const cardW = cardRect.width;
    const cardH = cardRect.height;
    const baseCardCenterX = (cardRect.left - curCardX) + cardW / 2;
    const baseCardCenterY = (cardRect.top - curCardY) + cardH / 2;

    const vpCenterX = vw / 2;
    const vpCenterY = vh / 2;

    // Viewport target position across Phase 1 (center) and simultaneous Phase 2&3 (shrink & dock to top-left of Screen 3)
    const centerVpX = baseCardCenterX + (vpCenterX - baseCardCenterX) * easeCenter;
    const centerVpY = baseCardCenterY + (vpCenterY - baseCardCenterY) * easeCenter;

    const targetVpX = centerVpX + (dockedVpX - centerVpX) * easeShrinkDock;
    const targetVpY = centerVpY + (dockedVpY - centerVpY) * easeShrinkDock;

    const dx = targetVpX - baseCardCenterX;
    const dy = targetVpY - baseCardCenterY;

    gsap.set(card, {
      x: dx,
      y: dy,
      scale: 1,
      opacity: isInScreen3OrLater ? 0 : 1,
      pointerEvents: rawCenter > 0.25 ? 'none' : 'auto',
      zIndex: 40
    });

    // Modal Frame (.portal-card-frame) dimensions at current shrink progress
    const curFrameW = cardW + (badgeW - cardW) * easeShrinkDock;
    const curFrameH = cardH + (badgeH - cardH) * easeShrinkDock;
    const ratioW = cardW > 0 ? curFrameW / cardW : 1;
    const ratioH = cardH > 0 ? curFrameH / cardH : 1;

    if (frameEl) {
      const frameLeft = (cardW - curFrameW) / 2;
      const frameTop = (cardH - curFrameH) / 2;
      const frameRadius = 24 - 8 * easeShrinkDock;

      gsap.set(frameEl, {
        width: curFrameW,
        height: curFrameH,
        left: frameLeft,
        top: frameTop,
        borderRadius: frameRadius
      });
    }

    // Inner content (.portal-card-extra) shrinks together with the modal frame AND fades out
    if (extraEls.length > 0) {
      const extraOpacity = Math.max(0, 1 - rawShrinkDock * 1.4);
      const extraScale = Math.min(ratioW, ratioH);

      extraEls.forEach((extraEl) => {
        const curExtraX = (gsap.getProperty(extraEl, "x") as number) || 0;
        const curExtraY = (gsap.getProperty(extraEl, "y") as number) || 0;
        const extraRect = extraEl.getBoundingClientRect();

        // Invariant untransformed local center of extraEl inside card
        const baseExtraLocalX = (extraRect.left - cardRect.left - curExtraX) + extraRect.width / 2;
        const baseExtraLocalY = (extraRect.top - cardRect.top - curExtraY) + extraRect.height / 2;

        const vecX = baseExtraLocalX - (cardW / 2);
        const vecY = baseExtraLocalY - (cardH / 2);

        gsap.set(extraEl, {
          x: vecX * (ratioW - 1),
          y: vecY * (ratioH - 1),
          scale: extraScale,
          opacity: extraOpacity
        });
      });
    }

    // Title (.portal-card-title) does NOT shrink (scale: 1), only centers inside the shrinking modal
    if (titleEl) {
      const curTitleX = (gsap.getProperty(titleEl, "x") as number) || 0;
      const curTitleY = (gsap.getProperty(titleEl, "y") as number) || 0;
      const titleRect = titleEl.getBoundingClientRect();
      const baseTitleLocalCenterX = (titleRect.left - cardRect.left - curTitleX) + titleRect.width / 2;
      const baseTitleLocalCenterY = (titleRect.top - cardRect.top - curTitleY) + titleRect.height / 2;

      const titleTargetDx = (cardW / 2) - baseTitleLocalCenterX;
      const titleTargetDy = (cardH / 2) - baseTitleLocalCenterY;

      gsap.set(titleEl, {
        x: titleTargetDx * easeShrinkDock,
        y: titleTargetDy * easeShrinkDock,
        scale: 1
      });
    }
  });

  // -------------------------------------------------------------------------
  // 3. Screen 3 & Screen 4: Traveling Showcase Card (Badge in Corner -> Full Showcase Card)
  // -------------------------------------------------------------------------
  const travelingCard = document.getElementById(`traveling-card-${activeGameId}`);
  const otherGameId = activeGameId === 'orbitar' ? 'impostor' : 'orbitar';
  const otherTravelingCard = document.getElementById(`traveling-card-${otherGameId}`);
  const showcaseAnchor = document.getElementById(`showcase-anchor-${activeGameId}`);
  const titleAnchor = document.getElementById(`showcase-title-anchor-${activeGameId}`);

  if (otherTravelingCard) {
    otherTravelingCard.classList.add('hidden');
    gsap.set(otherTravelingCard, { opacity: 0, pointerEvents: 'none' });
  }

  if (!travelingCard || !showcaseAnchor) return;
  travelingCard.classList.remove('hidden');

  // 1. If we haven't reached Screen 3 yet, traveling stage and cards are completely hidden
  if (!isInScreen3OrLater) {
    gsap.set(travelingStage, { opacity: 0, scale: 1, pointerEvents: 'none' });
    gsap.set(travelingCard, { opacity: 0, pointerEvents: 'none' });
    return;
  }

  // Measure target showcase dimensions from anchor
  const anchorRect = showcaseAnchor.getBoundingClientRect();
  const showcaseW = anchorRect.width || Math.min(vw - 32, 896);
  const showcaseH = anchorRect.height || 360;

  // Target center of showcase in viewport
  const targetShowcaseCenterX = vw / 2;
  const targetShowcaseCenterY = vh / 2;

  // 2. Are we inside Screen 4 / transitioning to Screen 5 (bottomRect.top <= 0)?
  const isInsideBottomScene = bottomRect.top <= 0;

  if (isInsideBottomScene) {
    // Docked at Screen 4 or transitioning to Screen 5:
    // Dimensions, frame, content scale, and title position are locked at full showcase size.
    // The fade out, scale up (1.04), and pointer-events into Screen 5 are governed exclusively by bottomTl!
    // We intentionally DO NOT overwrite travelingStage opacity/scale so it smoothly dissolves and stays hidden in Screen 5.
    const isExitingToShowcase = bottomTl.progress() > 0.05;

    gsap.set(travelingCard, {
      x: targetShowcaseCenterX - showcaseW / 2,
      y: targetShowcaseCenterY - showcaseH / 2,
      width: showcaseW,
      height: showcaseH,
      opacity: 1,
      scale: 1,
      pointerEvents: isExitingToShowcase ? 'none' : 'auto'
    });

    const travelingFrame = document.getElementById(`traveling-frame-${activeGameId}`);
    if (travelingFrame) {
      gsap.set(travelingFrame, {
        width: showcaseW,
        height: showcaseH,
        borderRadius: 24
      });
    }

    const travelingContent = document.getElementById(`traveling-content-${activeGameId}`);
    if (travelingContent) {
      gsap.set(travelingContent, {
        width: showcaseW,
        height: showcaseH,
        left: 0,
        top: 0,
        scale: 1,
        opacity: 1,
        pointerEvents: isExitingToShowcase ? 'none' : 'auto'
      });
    }

    const travelingTitle = document.getElementById(`traveling-title-${activeGameId}`);
    if (travelingTitle && titleAnchor) {
      const tSpan = titleAnchor.querySelector('span');
      const tSpanRect = tSpan ? tSpan.getBoundingClientRect() : titleAnchor.getBoundingClientRect();
      const targetTitleLocalX = tSpanRect.left - anchorRect.left;
      const targetTitleLocalY = tSpanRect.top - anchorRect.top;

      gsap.set(travelingTitle, {
        left: 0,
        top: 0,
        x: targetTitleLocalX,
        y: targetTitleLocalY,
        scale: 1
      });
    }

    return;
  }

  // 3. Screen 3 and Transition Screen 3 -> Screen 4 (bottomRect.top > 0)
  // Ensure traveling stage is active and clean
  gsap.set(travelingStage, { opacity: 1, scale: 1, pointerEvents: 'none' });

  // Progress of transition from Screen 3 corner to Screen 4 center
  // User confirmed: "Puede empezar a moverse apenas asoma la pantalla 4"
  // When bottomRect.top is at vh, bottom scene starts entering -> progress = 0
  // When bottomRect.top is at 0, bottom scene is fully docked -> progress = 1
  const rawShowcaseProgress = Math.min(Math.max((vh - bottomRect.top) / vh, 0), 1);
  const easeShowcase = gsap.parseEase("power2.inOut")(rawShowcaseProgress);

  // Interpolated center of the card
  const curCardCenterX = dockedVpX + (targetShowcaseCenterX - dockedVpX) * easeShowcase;
  const curCardCenterY = dockedVpY + (targetShowcaseCenterY - dockedVpY) * easeShowcase;

  // Interpolated dimensions of the frame
  const curFrameW = badgeW + (showcaseW - badgeW) * easeShowcase;
  const curFrameH = badgeH + (showcaseH - badgeH) * easeShowcase;
  const curRadius = 16 + (24 - 16) * easeShowcase;

  // Card container position (centered at curCardCenterX, curCardCenterY)
  gsap.set(travelingCard, {
    x: curCardCenterX - curFrameW / 2,
    y: curCardCenterY - curFrameH / 2,
    width: curFrameW,
    height: curFrameH,
    opacity: 1,
    scale: 1,
    pointerEvents: rawShowcaseProgress >= 0.85 ? 'auto' : 'none'
  });

  const travelingFrame = document.getElementById(`traveling-frame-${activeGameId}`);
  if (travelingFrame) {
    gsap.set(travelingFrame, {
      width: curFrameW,
      height: curFrameH,
      borderRadius: curRadius
    });
  }

  // Showcase Content (scales up and fades in as card expands, avoiding overflow when small)
  const travelingContent = document.getElementById(`traveling-content-${activeGameId}`);
  if (travelingContent) {
    const contentOpacity = Math.min(Math.max((rawShowcaseProgress - 0.20) / 0.70, 0), 1);
    const ratioW = showcaseW > 0 ? curFrameW / showcaseW : 1;
    const ratioH = showcaseH > 0 ? curFrameH / showcaseH : 1;
    const contentScale = Math.min(ratioW, ratioH);
    const offsetX = (curFrameW - showcaseW) / 2;
    const offsetY = (curFrameH - showcaseH) / 2;

    gsap.set(travelingContent, {
      width: showcaseW,
      height: showcaseH,
      left: offsetX,
      top: offsetY,
      scale: contentScale,
      opacity: contentOpacity,
      pointerEvents: rawShowcaseProgress >= 0.85 ? 'auto' : 'none'
    });
  }

  // Game Title (NEVER disappears, NEVER scales, glides from badge center to showcase title anchor)
  const travelingTitle = document.getElementById(`traveling-title-${activeGameId}`);
  if (travelingTitle) {
    const titleRect = travelingTitle.getBoundingClientRect();
    const titleW = titleRect.width;
    const titleH = titleRect.height;

    // In badge (easeShowcase = 0): centered in frame
    const badgeTitleLocalX = (curFrameW - titleW) / 2;
    const badgeTitleLocalY = (curFrameH - titleH) / 2;

    // In showcase (easeShowcase = 1): next to icon in right column
    let targetTitleLocalX = badgeTitleLocalX;
    let targetTitleLocalY = badgeTitleLocalY;

    if (titleAnchor) {
      const tSpan = titleAnchor.querySelector('span');
      const tSpanRect = tSpan ? tSpan.getBoundingClientRect() : titleAnchor.getBoundingClientRect();
      targetTitleLocalX = tSpanRect.left - anchorRect.left;
      targetTitleLocalY = tSpanRect.top - anchorRect.top;
    }

    const curTitleX = badgeTitleLocalX + (targetTitleLocalX - badgeTitleLocalX) * easeShowcase;
    const curTitleY = badgeTitleLocalY + (targetTitleLocalY - badgeTitleLocalY) * easeShowcase;

    gsap.set(travelingTitle, {
      left: 0,
      top: 0,
      x: curTitleX,
      y: curTitleY,
      scale: 1
    });
  }
}

const heroTl = gsap.timeline({ paused: true });
heroTl
  .to("#scroll-indicator", { opacity: 0, scale: 0.5, duration: 0.25, ease: "power1.out" })
  .to("#hero-logo-layer", { opacity: 0, scale: 1.05, duration: 0.50, ease: "power2.inOut" }, 0)
  .to("#hero-spotlight", { opacity: 0, duration: 0.35 }, 0)
  .to("#adventure-layer", { opacity: 1, y: 0, pointerEvents: "auto", duration: 0.50, ease: "power2.out" }, 0.15)
  .to({}, { duration: 0.85 }); // Compact span for Screen 2 modal centering

ScrollTrigger.create({
  trigger: "#hero-scene",
  start: "top top",
  end: "bottom bottom",
  scrub: 0.5,
  animation: heroTl,
  onUpdate: (self) => {
    isHeroSplash = self.progress < 0.15;
    const spotlight = document.getElementById('hero-spotlight');
    if (spotlight && !isHeroSplash) {
      spotlight.style.opacity = '0';
    }

    updateGlobalBackground(self.progress, activeGameId);
    updateAdventureModalTransition();
  }
});

window.addEventListener('scroll', () => {
  updateAdventureModalTransition();
}, { passive: true });

// Scroll Indicator UX Cue Click
document.getElementById('scroll-indicator')?.addEventListener('click', () => {
  const heroScene = document.getElementById('hero-scene');
  if (heroScene) {
    const heroStickyScrollable = Math.max(1, heroScene.offsetHeight - window.innerHeight);
    const targetY = heroScene.offsetTop + heroStickyScrollable * 0.50;
    gsap.to(window, { scrollTo: targetY, duration: 0.9, ease: "power2.inOut" });
  }
});

// ---------------------------------------------------------------------------
// Screen 1 (Splash) <-> Screen 2 ("Elegí tu Próxima Aventura") Auto-Glide
// ---------------------------------------------------------------------------
let isHeroAutoScrolling = false;
const heroSceneEl = document.getElementById('hero-scene');

function triggerHeroGlide(targetY: number): void {
  isHeroAutoScrolling = true;
  gsap.to(window, {
    scrollTo: targetY,
    duration: 0.9,
    ease: "power2.inOut",
    onComplete: () => {
      setTimeout(() => {
        isHeroAutoScrolling = false;
      }, 150);
    }
  });
}

if (heroSceneEl) {
  window.addEventListener('wheel', (e) => {
    if (isHeroAutoScrolling) return;

    const rect = heroSceneEl.getBoundingClientRect();
    if (rect.top <= 10 && rect.bottom >= window.innerHeight - 10) {
      const heroStickyScrollable = Math.max(1, rect.height - window.innerHeight);
      const currentScroll = -rect.top;
      const progress = currentScroll / heroStickyScrollable;

      // Downward wheel from Screen 1 (Splash) -> Glide into Screen 2 top
      if (e.deltaY > 15 && progress < 0.35) {
        e.preventDefault();
        const targetY = heroSceneEl.offsetTop + heroStickyScrollable * 0.50;
        triggerHeroGlide(targetY);
      }
      // Upward wheel from Screen 2 top -> Glide back up to Screen 1 (Splash)
      else if (e.deltaY < -15 && progress >= 0.38 && progress <= 0.54) {
        e.preventDefault();
        triggerHeroGlide(heroSceneEl.offsetTop);
      }
    }
  }, { passive: false });
}

// Consolidated Touch Glide Handling for Screen 1 <-> Screen 2 and Screen 4 <-> Screen 5
let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
  if (e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (e.touches.length === 0) return;

  const currentX = e.touches[0].clientX;
  const currentY = e.touches[0].clientY;
  const deltaX = touchStartX - currentX;
  const deltaY = touchStartY - currentY; // positive = dragged up = scrolling page down

  // If gesture is predominantly horizontal (e.g. mobile card carousel swipe), do not intercept
  if (Math.abs(deltaX) > Math.abs(deltaY)) return;

  // 1. Hero Scene Touch Auto-Glide (Screen 1 <-> Screen 2)
  if (heroSceneEl) {
    if (isHeroAutoScrolling) {
      e.preventDefault();
      return;
    }
    const rect = heroSceneEl.getBoundingClientRect();
    if (rect.top <= 10 && rect.bottom >= window.innerHeight - 10) {
      const heroStickyScrollable = Math.max(1, rect.height - window.innerHeight);
      const currentScroll = -rect.top;
      const progress = currentScroll / heroStickyScrollable;

      if (deltaY > 25 && progress < 0.35) {
        e.preventDefault();
        const targetY = heroSceneEl.offsetTop + heroStickyScrollable * 0.50;
        triggerHeroGlide(targetY);
        return;
      } else if (deltaY < -25 && progress >= 0.38 && progress <= 0.54) {
        e.preventDefault();
        triggerHeroGlide(heroSceneEl.offsetTop);
        return;
      }
    }
  }

  // 2. Bottom Scene Touch Auto-Glide (Screen 4 <-> Screen 5)
  if (bottomSceneEl) {
    if (isBottomAutoScrolling) {
      e.preventDefault();
      return;
    }
    const rect = bottomSceneEl.getBoundingClientRect();
    if (rect.top <= 10 && rect.bottom >= window.innerHeight - 10) {
      const maxScroll = rect.height - window.innerHeight;
      const currentScroll = -rect.top;
      const progress = maxScroll > 0 ? currentScroll / maxScroll : 0;

      if (deltaY > 25 && progress < 0.4) {
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
        return;
      } else if (deltaY < -25 && progress > 0.6) {
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
        return;
      }
    }
  }
}, { passive: false });

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

  // Update theater bot image (en planeta de inicio astronauta usa alert)
  const botImg = document.getElementById('orbitar-bot-img') as HTMLImageElement | null;
  if (botImg) {
    if (skinKey === 'astronaut') {
      const isInitial = !orbitarTimeline || orbitarTimeline.time() < 2.95;
      botImg.src = isInitial ? cfg.alert : cfg.normal;
    } else {
      botImg.src = cfg.normal;
    }
  }

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
  // Sumamos offset (+14 desktop / +10 mobile) para que el sprite del bot orbite pegado a la superficie.
  const botOffset = isMobileViewport() ? 10 : 14;
  const r1 = (b1Rect.width / 2) * 0.84 + botOffset;
  const rMid = (bMidRect.width / 2) * 0.84 + botOffset;
  const r2 = (b2Rect.width / 2) * 0.88 + botOffset;

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
  const botImg = document.getElementById('orbitar-bot-img') as HTMLImageElement | null;
  const thruster = document.getElementById('bot-thruster');
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

  // Sprite inicial en planeta de inicio: alert
  if (currentSkin === 'astronaut' && botImg) {
    botImg.src = SKIN_CONFIG.astronaut.alert;
  }
  if (thruster) {
    thruster.classList.remove('bot-thruster-boost');
  }
}

function setupInitialImpostorPosition(): void {
  const cards = [
    document.getElementById('impostor-card-1'),
    document.getElementById('impostor-card-2'),
    document.getElementById('impostor-card-3')
  ];
  const magnifier = document.getElementById('impostor-magnifier');
  const isMobile = isMobileViewport();
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
let isProgrammaticCarouselScroll = false;
let carouselScrollTimeout: number | null = null;

export function selectGame(gameId: GameId): void {
  activeGameId = gameId;
  updatePortalCardsUI(gameId);
  updateGlobalBackground(getHeroScrollProgress(), gameId);
  syncTheaterWorld(gameId);
  updateAdventureModalTransition();

  if (isMobileViewport()) {
    const selectedCard = document.getElementById(`portal-${gameId}`);
    if (selectedCard) {
      isProgrammaticCarouselScroll = true;
      selectedCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      if (carouselScrollTimeout) clearTimeout(carouselScrollTimeout);
      carouselScrollTimeout = window.setTimeout(() => {
        isProgrammaticCarouselScroll = false;
      }, 450);
    }
  }
}

export function syncTheaterWorld(gameId: GameId): void {
  activeGameId = gameId;
  const worldOrbitar = document.getElementById('world-orbitar');
  const worldImpostor = document.getElementById('world-impostor');

  // Update fixed global background for the chosen game world
  updateGlobalBackground(getHeroScrollProgress(), gameId);
  updatePortalCardsUI(gameId);

  if (gameId === 'orbitar') {
    if (worldOrbitar) worldOrbitar.classList.remove('hidden');
    if (worldImpostor) worldImpostor.classList.add('hidden');
    if (getHeroScrollProgress() > 0.42) spaceCanvasWakeup?.();
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
  const scOrbitar = document.getElementById('showcase-anchor-orbitar');
  const scImpostor = document.getElementById('showcase-anchor-impostor');

  if (gameId === 'orbitar') {
    if (scOrbitar) scOrbitar.classList.remove('hidden');
    if (scImpostor) scImpostor.classList.add('hidden');
  } else {
    if (scOrbitar) scOrbitar.classList.add('hidden');
    if (scImpostor) scImpostor.classList.remove('hidden');
  }
}

// Select Game from Adventure Cards
export function launchGame(gameId: GameId): void {
  selectGame(gameId);
}

document.getElementById('portal-orbitar')?.addEventListener('click', () => selectGame('orbitar'));
document.getElementById('portal-impostor')?.addEventListener('click', () => selectGame('impostor'));
document.getElementById('dot-orbitar')?.addEventListener('click', () => selectGame('orbitar'));
document.getElementById('dot-impostor')?.addEventListener('click', () => selectGame('impostor'));

// Mobile horizontal carousel scroll tracking
const adventureCarousel = document.getElementById('adventure-cards-container');
let carouselDebounce: number | null = null;

if (adventureCarousel) {
  adventureCarousel.addEventListener('scroll', () => {
    if (!isMobileViewport() || isProgrammaticCarouselScroll) return;
    if (carouselDebounce) cancelAnimationFrame(carouselDebounce);
    carouselDebounce = requestAnimationFrame(() => {
      const containerRect = adventureCarousel.getBoundingClientRect();
      const cCenterX = containerRect.left + containerRect.width / 2;
      const orbCard = document.getElementById('portal-orbitar');
      const impCard = document.getElementById('portal-impostor');
      if (orbCard && impCard) {
        const orbDist = Math.abs(orbCard.getBoundingClientRect().left + orbCard.getBoundingClientRect().width / 2 - cCenterX);
        const impDist = Math.abs(impCard.getBoundingClientRect().left + impCard.getBoundingClientRect().width / 2 - cCenterX);
        const chosen: GameId = orbDist < impDist ? 'orbitar' : 'impostor';
        if (chosen !== activeGameId) {
          selectGame(chosen);
        }
      }
    });
  }, { passive: true });
}

// ---------------------------------------------------------------------------
// 7. Scene 2: Theater Cinematic Timelines Driven by Scrub
// ---------------------------------------------------------------------------
let orbitarTimeline: gsap.core.Timeline | null = null;
let impostorTimeline: gsap.core.Timeline | null = null;

function buildOrbitarTimeline(): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });
  const bot = document.getElementById('scrolly-bot');
  const botImg = document.getElementById('orbitar-bot-img') as HTMLImageElement | null;
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
        updateBotMotionEffects(x, y, false); // En órbita: las estrellas no se mueven
      }
    }, 0)
    .to(m1, { opacity: 0, y: -10, duration: 0.4 }, 2.6);

  // -------------------------------------------------------------------------
  // FASE 2: Salto desde ángulo 0° hacia Planeta Intermedio (horizontal)
  // -------------------------------------------------------------------------
  tl.to(m2, { opacity: 1, y: 0, duration: 0.5 }, 3.0)
    .to(bot, {
      x: pMid.x - pMid.r,
      y: pMid.y,
      rotation: 810, // Cabeza apunta a la derecha, propulsor a los pies impulsando a la derecha
      duration: 2.0,
      ease: "power2.inOut",
      onUpdate: () => {
        const bx = gsap.getProperty(bot, "x") as number;
        const by = gsap.getProperty(bot, "y") as number;
        updateBotMotionEffects(bx, by, true); // En vuelo: las estrellas se mueven en parallax inverso
      }
    }, 3.0)
    .to(m2, { opacity: 0, y: -10, duration: 0.4 }, 4.7);

  // -------------------------------------------------------------------------
  // FASE 3: Órbita en Planeta Intermedio y preparación de salida a 90° (arriba)
  // -------------------------------------------------------------------------
  tl.to(orbitMid, {
      // De Math.PI (lado izquierdo) gira 1.25 vueltas hasta 3.5*PI (vértice superior = hacia arriba)
      angle: Math.PI + Math.PI * 2.5,
      duration: 2.2,
      ease: "power1.inOut",
      onUpdate: () => {
        const x = pMid.x + Math.cos(orbitMid.angle) * pMid.r;
        const y = pMid.y + Math.sin(orbitMid.angle) * pMid.r;
        // Pies apoyados en el planeta intermedio, terminando en 1080° (0° mod 360, cabeza hacia arriba)
        const rot = (orbitMid.angle * 180 / Math.PI) + 90 + 360;
        gsap.set(bot, { x: x, y: y, rotation: rot });
        updateBotMotionEffects(x, y, false); // En órbita: las estrellas no se mueven
      }
    }, 5.0);

  // -------------------------------------------------------------------------
  // FASE 4: Salto a 90° (vertical hacia arriba) esquivando la Barrera de Plasma
  // -------------------------------------------------------------------------
  tl.to(m3, { opacity: 1, y: 0, duration: 0.5 }, 7.2)
    .to(bot, {
      x: p2.x,
      y: p2.y + p2.r,
      rotation: 1080, // Cabeza apunta hacia ARRIBA (hacia el objetivo), propulsor a los pies impulsando abajo
      duration: 2.0,
      ease: "power2.inOut",
      onUpdate: () => {
        const bx = gsap.getProperty(bot, "x") as number;
        const by = gsap.getProperty(bot, "y") as number;
        updateBotMotionEffects(bx, by, true); // En vuelo: las estrellas se mueven en parallax inverso
      }
    }, 7.2)
    .to(m3, { opacity: 0, y: -10, duration: 0.4 }, 8.9);

  // -------------------------------------------------------------------------
  // FASE 5: Captura y Órbita en Planeta Objetivo
  // -------------------------------------------------------------------------
  tl.to(orbitGoal, {
      angle: (Math.PI / 2) + Math.PI * 3.5,
      duration: 2.8,
      ease: "power2.out",
      onUpdate: () => {
        const x = p2.x + Math.cos(orbitGoal.angle) * p2.r;
        const y = p2.y + Math.sin(orbitGoal.angle) * p2.r;
        // Pies apoyados sobre el Planeta Objetivo y cabeza apuntando hacia afuera (+720 = 0° mod 360)
        const rot = (orbitGoal.angle * 180 / Math.PI) + 90 + 720;
        gsap.set(bot, { x: x, y: y, rotation: rot });
        updateBotMotionEffects(x, y, false); // En órbita: las estrellas no se mueven
      }
    }, 9.2);

  // Callback general reactivo para sincronizar sprite y propulsor hacia adelante y en reversa
  tl.eventCallback("onUpdate", () => {
    const t = tl.time();
    const botImgEl = document.getElementById('orbitar-bot-img') as HTMLImageElement | null;
    const thrusterEl = document.getElementById('bot-thruster');

    // Transición de sprite según la fase de vuelo (skin astronauta):
    // 1. Planeta de Inicio (t < 2.95): alert
    // 2. Volando y tránsito intermedio (2.95 <= t < 9.15): normal
    // 3. Planeta Objetivo (t >= 9.15): relaxed
    if (currentSkin === 'astronaut' && botImgEl) {
      if (t < 2.95) {
        if (!botImgEl.src.includes('player-astronaut-alert.svg')) {
          botImgEl.src = SKIN_CONFIG.astronaut.alert;
        }
      } else if (t < 9.15) {
        if (!botImgEl.src.includes('player-astronaut.svg') || botImgEl.src.includes('alert') || botImgEl.src.includes('relaxed')) {
          botImgEl.src = SKIN_CONFIG.astronaut.normal;
        }
      } else {
        if (!botImgEl.src.includes('player-astronaut-relaxed.svg')) {
          botImgEl.src = SKIN_CONFIG.astronaut.relaxed;
        }
      }
    }

    // Efecto de propulsor: boost al volar, idle vivo al orbitar o detenerse
    const isFlying = (t >= 2.95 && t <= 5.05) || (t >= 7.15 && t <= 9.25);
    if (thrusterEl) {
      if (isFlying) {
        thrusterEl.classList.add('bot-thruster-boost');
      } else {
        thrusterEl.classList.remove('bot-thruster-boost');
      }
    }
  });

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

  const isMobile = isMobileViewport();
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
  .fromTo("#game-showcase-stage",
    { opacity: 1, scale: 1, pointerEvents: "auto" },
    { opacity: 0, scale: 1.04, pointerEvents: "none", duration: 0.7, ease: "power2.inOut" }
  )
  .to("#showcase-layer", { opacity: 0, pointerEvents: "none", duration: 0.7, ease: "power2.inOut" }, 0)
  .to("#showcase-scroll-cue", { opacity: 0, duration: 0.35, ease: "power1.out" }, 0)
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
  window.addEventListener('wheel', (e) => {
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
  updateShowcase('orbitar');
  setupInitialOrbitarPosition();
  setupInitialImpostorPosition();
  updateAdventureModalTransition();

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
  updateAdventureModalTransition();
});

window.addEventListener('resize', () => {
  updateAdventureModalTransition();
  ScrollTrigger.refresh();
});

window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    updateAdventureModalTransition();
    ScrollTrigger.refresh();
  }, 200);
});
