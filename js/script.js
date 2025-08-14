document.addEventListener('DOMContentLoaded', function() {
    
    // ===== VARIABLES =====
    const layoutGuide = document.getElementById('layoutGuide');
    const toggleLayoutBtn = document.getElementById('toggleLayout');
    const hero = document.querySelector('.hero');
    const heroContainer = document.querySelector('.hero .container');
    const heroLogo = document.querySelector('.hero .logo');
    const heroLogoLink = document.querySelector('.hero .logo-link');
    const worksSection = document.querySelector('.works-box');
    let aboutLabelEl = null;
    const rootFontSizePx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    function ensureAboutLabel() {
        if (!aboutLabelEl) {
            aboutLabelEl = document.createElement('img');
            aboutLabelEl.className = 'about-label';
            aboutLabelEl.alt = 'about';
            aboutLabelEl.src = 'img/about.png';
            document.body.appendChild(aboutLabelEl);
        }
        return aboutLabelEl;
    }
    const contentSections = document.querySelectorAll('.content-section');
    
    // ===== LAYOUT GUIDE TOGGLE =====
    if (toggleLayoutBtn && layoutGuide) {
        // Initialize based on computed visibility (hidden by default via CSS)
        const isVisible = getComputedStyle(layoutGuide).display !== 'none';
        toggleLayoutBtn.textContent = isVisible ? 'Hide Grid' : 'Show Grid';
        toggleLayoutBtn.setAttribute('aria-pressed', String(isVisible));
        toggleLayoutBtn.setAttribute('aria-label', 'Toggle layout grid overlay');

        toggleLayoutBtn.addEventListener('click', function() {
            const currentlyVisible = getComputedStyle(layoutGuide).display !== 'none';
            const willShow = !currentlyVisible;
            layoutGuide.style.display = willShow ? 'block' : 'none';
            this.textContent = willShow ? 'Hide Grid' : 'Show Grid';
            this.setAttribute('aria-pressed', String(willShow));
        });
    }
    
    // ===== SCROLL EFFECTS =====
    function handleScroll() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        
        // Fade only craftfolio image on scroll (unless we're in about state)
        const craftfolioImg = document.querySelector('.hero img[alt="craftfolio"]');
        
        if (craftfolioImg && !hero.classList.contains('show-about')) {
            const fadeStart = 0.5;
            const fadeEnd = windowHeight * 1;
            const opacity = Math.max(0.2, 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart));
            craftfolioImg.style.opacity = opacity;
        }
        
        // Continuous reveal content sections for smoother feel
        contentSections.forEach(section => {
            const sectionTop = section.offsetTop;
            const revealPoint = windowHeight * 0.6;
            const fadeStart = sectionTop - revealPoint;
            const fadeEnd = sectionTop + (windowHeight * 0.2);
            
            if (scrollY >= fadeStart && scrollY <= fadeEnd) {
                // Calculate continuous progress (0 to 1)
                const progress = (scrollY - fadeStart) / (fadeEnd - fadeStart);
                const clampedProgress = Math.max(0, Math.min(1, progress));
                
                // Apply transform with rem units for consistency
                const translateBasePx = 50; // 50px base from design
                const translateYPx = translateBasePx - (clampedProgress * translateBasePx);
                const translateYRem = translateYPx / rootFontSizePx;
                section.style.transform = `translateY(${translateYRem}rem)`;
                
                // Add visible class when fully visible
                if (clampedProgress >= 0.9) {
                    section.classList.add('visible');
                }
            } else if (scrollY > fadeEnd) {
                // Fully visible
                section.style.transform = 'translateY(0rem)';
                section.classList.add('visible');
            } else if (scrollY < fadeStart) {
                // Not yet visible
                section.style.transform = 'translateY(3.125rem)'; // 50px
                section.classList.remove('visible');
            }
        });

        // Swap to ABOUT label only AFTER the entire works section has passed
        if (worksSection) {
            const rect = worksSection.getBoundingClientRect();
            const hasPassed = rect.bottom <= 0; // section completely above viewport
            const label = ensureAboutLabel();
            if (hasPassed) {
                label.classList.add('visible');
                hero.classList.add('show-about');
            } else {
                label.classList.remove('visible');
                hero.classList.remove('show-about');
            }
        }
    }
    
    // Throttle scroll events for better performance
    let ticking = false;
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }
    
    // Add scroll event listener with throttling
    window.addEventListener('scroll', requestTick, { passive: true });
    
    // Initial call to set initial states
    handleScroll();

    // ===== HERO LOGO HOVER SWAP (keep exact position/size) =====
    if (heroLogo) {
        const defaultLogoSrc = heroLogo.getAttribute('src');
        const hoverLogoSrc = 'img/logo-white.png';
        const overlayOffsetLeftPx = 25; // desired margin-left for bg
        const overlayScale = 0.7; // 1.0 = same as logo; < 1.0 smaller; > 1.0 bigger
        const overlayPaddingPx = 0; // extra pixels around logo inside the square (can be negative)
        // Adjust animation times here (in milliseconds)
        const logoAnimInMs = 500;
        const logoAnimOutMs = 500;
        let logoOverlayEl = null;

        let overlayRafId = null;
        let overlayRemoveTimeoutId = null;
        const positionOverlay = () => {
            if (!logoOverlayEl) return;
            const rect = heroLogo.getBoundingClientRect();
            const padding = overlayPaddingPx; // px padding around logo inside the square
            const side = Math.max(rect.width, rect.height) * overlayScale + padding * 2; // square side
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            logoOverlayEl.style.left = (centerX - side / 2 + overlayOffsetLeftPx) + 'px';
            logoOverlayEl.style.top = (centerY - side / 2) + 'px';
            logoOverlayEl.style.width = side + 'px';
            logoOverlayEl.style.height = side + 'px';
        };

        const startOverlayLoop = () => {
            const loop = () => {
                positionOverlay();
                overlayRafId = requestAnimationFrame(loop);
            };
            overlayRafId = requestAnimationFrame(loop);
        };

        const stopOverlayLoop = () => {
            if (overlayRafId) {
                cancelAnimationFrame(overlayRafId);
                overlayRafId = null;
            }
        };

        const showOverlay = () => {
            // cancel any pending removal if user re-enters quickly
            if (overlayRemoveTimeoutId) {
                clearTimeout(overlayRemoveTimeoutId);
                overlayRemoveTimeoutId = null;
            }
            if (!logoOverlayEl) {
                logoOverlayEl = document.createElement('div');
                logoOverlayEl.className = 'logo-bg-overlay';
                (hero || document.body).appendChild(logoOverlayEl);
                // Base layer styles
                Object.assign(logoOverlayEl.style, {
                    position: 'fixed',
                    backgroundColor: 'transparent', // actual fill rendered by ::before
                    zIndex: 100,
                    pointerEvents: 'none'
                });
                // set animation durations via CSS variables
                logoOverlayEl.style.setProperty('--logo-anim-ms', `${logoAnimInMs}ms`);
                logoOverlayEl.style.setProperty('--logo-anim-out-ms', `${logoAnimOutMs}ms`);
            }
            // ensure we are in open state
            logoOverlayEl.classList.remove('anim-reset');
            // eslint-disable-next-line no-unused-expressions
            logoOverlayEl.offsetWidth;
            logoOverlayEl.classList.add('open');
            positionOverlay();
            startOverlayLoop();
        };

        const hideOverlay = () => {
            if (overlayRemoveTimeoutId) {
                clearTimeout(overlayRemoveTimeoutId);
                overlayRemoveTimeoutId = null;
            }
            stopOverlayLoop();
            if (logoOverlayEl && logoOverlayEl.parentNode) {
                logoOverlayEl.parentNode.removeChild(logoOverlayEl);
                logoOverlayEl = null;
            }
        };

        const applyHoverLogo = () => {
            heroLogo.setAttribute('src', hoverLogoSrc);
            showOverlay();
        };
        const removeHoverLogo = () => {
            heroLogo.setAttribute('src', defaultLogoSrc);
            if (!logoOverlayEl) return;
            // transition back by removing 'open'
            logoOverlayEl.classList.remove('open');
            stopOverlayLoop();
            const cleanupDelay = Math.max(0, logoAnimOutMs + 30);
            overlayRemoveTimeoutId = setTimeout(() => { hideOverlay(); }, cleanupDelay);
        };

        const hoverTarget = heroLogoLink || heroLogo;
        hoverTarget.addEventListener('mouseenter', applyHoverLogo);
        hoverTarget.addEventListener('mouseleave', removeHoverLogo);
        // Keyboard accessibility
        hoverTarget.addEventListener('focus', applyHoverLogo);
        hoverTarget.addEventListener('blur', removeHoverLogo);
        // Reposition overlay on window resize while hovering
        window.addEventListener('resize', () => { if (logoOverlayEl) positionOverlay(); });
        window.addEventListener('scroll', () => { if (logoOverlayEl) positionOverlay(); }, { passive: true });
    }
    
});