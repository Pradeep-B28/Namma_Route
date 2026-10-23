// Motion and 3D Interaction Controller for Namma Route
// Handles loader lifecycle, entrance reveals, 3D card tilt, micro interactions and parallax

export class MotionController {
  constructor() {
    this.startTime = performance.now();
    this.urlParams = new URLSearchParams(window.location.search);
    this.isTestMode = this.urlParams.get('test') === '1';
    this.isDemoMode = this.urlParams.get('demo') === '1';
    this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    this.loaderEl = document.getElementById('app-loader');
    this.loaderBar = document.getElementById('loader-bar-fill');
    this.mapSection = document.querySelector('.map-section');
    this.parallaxContainer = document.getElementById('parallax-container');
    this.layerFar = document.getElementById('parallax-far');
    this.layerMid = document.getElementById('parallax-mid');
    this.layerNear = document.getElementById('parallax-near');

    this.revealObserver = null;
    this.parallaxActive = false;
    this.parallaxRunning = false;
    this.mouseTarget = { x: 0, y: 0 };
    this.currentFar = { x: 0, y: 0 };
    this.currentMid = { x: 0, y: 0 };
    this.currentNear = { x: 0, y: 0 };
  }

  init() {
    this.setupTapRipples();
    this.initTabIndicators();

    if (this.isTestMode) {
      if (this.loaderEl) this.loaderEl.remove();
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed'));
      if (this.mapSection) {
        this.mapSection.classList.remove('map-entering');
        this.mapSection.classList.add('map-entered');
        this.mapSection.style.transform = 'none';
      }
      return;
    }

    if (this.mapSection) {
      this.mapSection.classList.add('map-entering');
    }

    if (this.isFinePointer && !this.isDemoMode && !this.prefersReduced) {
      this.initCardTilt();
    }

    if (!this.prefersReduced && !this.isDemoMode && !this.isTestMode) {
      this.initParallax();
    }
  }

  setLoaderProgress(pct) {
    if (this.loaderBar) {
      this.loaderBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }
  }

  finishLoader(onDone = null) {
    if (this.isTestMode) {
      if (this.loaderEl) this.loaderEl.remove();
      if (onDone) onDone();
      return;
    }

    this.setLoaderProgress(100);
    const elapsed = performance.now() - this.startTime;
    const minWait = this.prefersReduced ? 150 : 700;
    const remaining = Math.max(0, minWait - elapsed);

    setTimeout(() => {
      if (this.loaderEl) {
        this.loaderEl.classList.add('loader-hidden');
        setTimeout(() => {
          if (this.loaderEl) this.loaderEl.remove();
          this.startEntranceSequence();
          if (onDone) onDone();
        }, 400);
      } else {
        this.startEntranceSequence();
        if (onDone) onDone();
      }
    }, remaining);
  }

  startEntranceSequence() {
    // 0ms: Header reveal
    const header = document.querySelector('.app-header');
    if (header) header.classList.add('is-revealed');

    // 100ms: Map lift (B1)
    setTimeout(() => {
      if (this.mapSection) {
        this.mapSection.classList.add('map-entered');
        const clearMapTransform = () => {
          this.mapSection.style.transform = 'none';
          this.mapSection.classList.remove('map-entering');
        };
        setTimeout(clearMapTransform, 950);
      }
    }, 100);

    // 200ms+: Panel sections staggered by 60ms
    const panelItems = document.querySelectorAll('.panel-inner [data-reveal]');
    panelItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('is-revealed');
      }, 200 + index * 60);
    });

    this.setupIntersectionReveals();
  }

  setupIntersectionReveals() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    this.revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          this.revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((el) => {
      this.revealObserver.observe(el);
    });
  }

  revealResultCard(cardEl) {
    if (!cardEl) return;
    cardEl.classList.remove('is-revealed');
    // Force DOM reflow
    void cardEl.offsetWidth;
    cardEl.classList.add('is-revealed');
  }

  initCardTilt() {
    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.tilt-card');
      if (!card || card.closest('.map-section')) return;

      const rect = card.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;

      const rotX = ((0.5 - ny) * 12).toFixed(2);
      const rotY = ((nx - 0.5) * 12).toFixed(2);

      card.classList.add('is-tilting');
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      card.style.setProperty('--mouse-x', `${(nx * 100).toFixed(1)}%`);
      card.style.setProperty('--mouse-y', `${(ny * 100).toFixed(1)}%`);
    });

    document.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.tilt-card');
      if (!card || card.closest('.map-section')) return;
      const related = e.relatedTarget;
      if (related && card.contains(related)) return;

      card.classList.remove('is-tilting');
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
      setTimeout(() => {
        if (!card.classList.contains('is-tilting')) {
          card.style.transform = '';
        }
      }, 300);
    });
  }

  setupTapRipples() {
    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('button, .primary-button, .compare-button, .ctrl-btn, .swap-button, .share-btn');
      if (!btn || btn.disabled) return;

      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'tap-ripple-effect';
      const size = Math.max(rect.width, rect.height) * 1.6;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      const prevPos = window.getComputedStyle(btn).position;
      if (prevPos === 'static') btn.style.position = 'relative';
      btn.style.overflow = 'hidden';

      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 450);
    });
  }

  initTabIndicators() {
    this.updateTabPill('travel-mode-tabs', 'travel-tab-indicator', '.travel-tab-btn.active');
    this.updateTabPill('algo-mode-tabs', 'algo-tab-indicator', '.mode-btn.active');

    window.addEventListener('resize', () => {
      this.updateTabPill('travel-mode-tabs', 'travel-tab-indicator', '.travel-tab-btn.active');
      this.updateTabPill('algo-mode-tabs', 'algo-tab-indicator', '.mode-btn.active');
    });
  }

  updateTabPill(containerId, indicatorId, activeSelector) {
    const container = document.getElementById(containerId);
    const indicator = document.getElementById(indicatorId);
    if (!container || !indicator) return;

    const activeBtn = container.querySelector(activeSelector);
    if (!activeBtn) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const left = btnRect.left - containerRect.left;
    const width = btnRect.width;

    indicator.style.transform = `translateX(${left}px)`;
    indicator.style.width = `${width}px`;
  }

  initParallax() {
    if (!this.parallaxContainer || !this.layerFar || !this.layerMid || !this.layerNear) return;
    this.parallaxActive = true;

    if (this.isFinePointer) {
      window.addEventListener('mousemove', (e) => {
        const halfW = window.innerWidth / 2;
        const halfH = window.innerHeight / 2;
        this.mouseTarget.x = (e.clientX - halfW) / halfW;
        this.mouseTarget.y = (e.clientY - halfH) / halfH;
        if (!this.parallaxRunning) {
          this.parallaxRunning = true;
          requestAnimationFrame(() => this.tickParallax());
        }
      });
    }

    // Scroll parallax on phone/overflow
    const scrollContainer = window.innerWidth <= 840 ? window : document.querySelector('.panel-section');
    const handleScroll = () => {
      if (window.innerWidth > 840 && this.isFinePointer) return;
      const scrollY = window.innerWidth <= 840 ? window.scrollY : (scrollContainer?.scrollTop || 0);
      this.layerFar.style.transform = `translate3d(0, ${(scrollY * 0.1).toFixed(1)}px, 0)`;
      this.layerMid.style.transform = `translate3d(0, ${(scrollY * 0.2).toFixed(1)}px, 0)`;
      this.layerNear.style.transform = `translate3d(0, ${(scrollY * 0.3).toFixed(1)}px, 0)`;
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.parallaxRunning = false;
    });
  }

  tickParallax() {
    if (!this.parallaxRunning || !this.parallaxActive || document.hidden) return;

    // Opposite to pointer movement
    const targetFarX = -this.mouseTarget.x * 6;
    const targetFarY = -this.mouseTarget.y * 6;
    const targetMidX = -this.mouseTarget.x * 12;
    const targetMidY = -this.mouseTarget.y * 12;
    const targetNearX = -this.mouseTarget.x * 20;
    const targetNearY = -this.mouseTarget.y * 20;

    this.currentFar.x += (targetFarX - this.currentFar.x) * 0.08;
    this.currentFar.y += (targetFarY - this.currentFar.y) * 0.08;
    this.currentMid.x += (targetMidX - this.currentMid.x) * 0.08;
    this.currentMid.y += (targetMidY - this.currentMid.y) * 0.08;
    this.currentNear.x += (targetNearX - this.currentNear.x) * 0.08;
    this.currentNear.y += (targetNearY - this.currentNear.y) * 0.08;

    this.layerFar.style.transform = `translate3d(${this.currentFar.x.toFixed(2)}px, ${this.currentFar.y.toFixed(2)}px, 0)`;
    this.layerMid.style.transform = `translate3d(${this.currentMid.x.toFixed(2)}px, ${this.currentMid.y.toFixed(2)}px, 0)`;
    this.layerNear.style.transform = `translate3d(${this.currentNear.x.toFixed(2)}px, ${this.currentNear.y.toFixed(2)}px, 0)`;

    const diff = Math.abs(targetNearX - this.currentNear.x) + Math.abs(targetNearY - this.currentNear.y);
    if (diff > 0.05) {
      requestAnimationFrame(() => this.tickParallax());
    } else {
      this.parallaxRunning = false;
    }
  }
}
