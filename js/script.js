document.addEventListener('DOMContentLoaded', function() {
    
    // ===== VARIABLES =====
    const layoutGuide = document.getElementById('layoutGuide');
    const toggleLayoutBtn = document.getElementById('toggleLayout');
    const hero = document.querySelector('.hero');
    const heroContainer = document.querySelector('.hero .container');
    const heroLogo = document.querySelector('.hero .logo');
    const heroLogoLink = document.querySelector('.hero .logo-link');
    const navbar = document.querySelector('.navbar');
    const worksSection = document.querySelector('.works-box');
    const connectSection = document.querySelector('.connect');
    let aboutLabelEl = null;
    const rootFontSizePx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const enableLogoHover = false; // disable logo hover swap/overlay

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
    // Exclude connect from scroll-reveal animations so it sits flush, no offset
    const contentSections = document.querySelectorAll('.content-section:not(.connect)');

    // Ensure navbar is always clickable above content by lifting it to body
    if (navbar) {
        // Move out of .hero stacking context
        if (navbar.parentElement && navbar.parentElement !== document.body) {
            document.body.appendChild(navbar);
        }
        // Fix to viewport with high z-index
        Object.assign(navbar.style, {
            position: 'fixed',
            top: '0',
            right: '0',
            zIndex: '2147483647'
        });
    }
    
    // Lift the logo out of the hero stacking context so it can sit above sections
    if (heroLogoLink && heroLogo) {
        if (heroLogoLink.parentElement && heroLogoLink.parentElement !== document.body) {
            document.body.appendChild(heroLogoLink);
        }
        Object.assign(heroLogo.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            paddingLeft: '3.75rem',
            paddingTop: '1.25rem',
            width: '5.625rem',
            height: 'auto',
            boxSizing: 'border-box',
            zIndex: '2147483646'
        });
    }

    // ===== LAYOUT GUIDE TOGGLE =====
    if (toggleLayoutBtn && layoutGuide) {
        // Initialize based on computed visibility (hidden by default via CSS)
        const isVisible = getComputedStyle(layoutGuide).display !== 'none';
        toggleLayoutBtn.textContent = isVisible ? 'hide grid' : 'show grid';
        toggleLayoutBtn.setAttribute('aria-pressed', String(isVisible));
        toggleLayoutBtn.setAttribute('aria-label', 'Toggle layout grid overlay');

        toggleLayoutBtn.addEventListener('click', function() {
            const currentlyVisible = getComputedStyle(layoutGuide).display !== 'none';
            const willShow = !currentlyVisible;
            layoutGuide.style.display = willShow ? 'block' : 'none';
            this.textContent = willShow ? 'hide grid' : 'show grid';
            this.setAttribute('aria-pressed', String(willShow));
        });
    }
    
    // ===== SCROLL EFFECTS =====
    let isAtBottom = false;
    let lastTouchY = 0;

    function getDeepContentBottomPx() {
        // Brute-force: measure every element bottom, but IGNORE fixed-position overlays
        // Fixed elements (e.g., preloader, overlays) move with the viewport and would
        // incorrectly increase the computed bottom as you scroll.
        let totalBottom = 0;
        const all = document.querySelectorAll('*');
        for (let i = 0; i < all.length; i += 1) {
            const el = all[i];
            // Skip known non-layout overlays fast
            if (el.id === 'preloader' || el.classList.contains('layout-guide') || el.classList.contains('logo-bg-overlay')) {
                continue;
            }
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            if (cs.position === 'fixed') continue; // ignore fixed layers
            const rect = el.getBoundingClientRect();
            const bottom = rect.bottom + window.pageYOffset;
            if (bottom > totalBottom) totalBottom = bottom;
        }
        return Math.ceil(totalBottom);
    }

    function logScrollDebug(tag = 'SCROLL DEBUG') {
        try {
            const lastEl = document.querySelector('.connect');
            const lastBottom = lastEl ? (lastEl.getBoundingClientRect().bottom + window.pageYOffset) : -1;
            console.log('=== ' + tag + ' ===');
            console.log('window.innerHeight:', window.innerHeight);
            console.log('document.body.scrollHeight:', document.body.scrollHeight);
            console.log('document.body.offsetHeight:', document.body.offsetHeight);
            console.log('document.documentElement.scrollHeight:', document.documentElement.scrollHeight);
            console.log('document.documentElement.clientHeight:', document.documentElement.clientHeight);
            console.log('Last element bottom (.connect):', lastBottom);
            console.log('Current scrollY:', window.scrollY);
            console.log('Max possible scroll (body.scrollHeight - innerHeight):', document.body.scrollHeight - window.innerHeight);
            // Computed styles snapshot
            const csHtml = getComputedStyle(document.documentElement);
            const csBody = getComputedStyle(document.body);
            const csConnect = lastEl ? getComputedStyle(lastEl) : null;
            console.log('computed html { h:', csHtml.height, 'mb:', csHtml.marginBottom, 'pb:', csHtml.paddingBottom, '}');
            console.log('computed body { h:', csBody.height, 'mb:', csBody.marginBottom, 'pb:', csBody.paddingBottom, '}');
            if (csConnect) console.log('computed .connect { h:', csConnect.height, 'mb:', csConnect.marginBottom, 'pb:', csConnect.paddingBottom, '}');
        } catch (e) {
            console.warn('[debug] failed to log', e);
        }
    }

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

        // Show ABOUT label after works; keep it for the rest of the page
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

        // Ensure connect title image does not flash by forcing GPU compositing when near viewport
        const connectTitle = document.getElementById('contactTitle');
        if (connectTitle) {
            const rect = connectTitle.getBoundingClientRect();
            // Clamp the image inside its container horizontally
            const container = connectSection ? connectSection.querySelector('.connect-container') : null;
            if (container) {
                const cRect = container.getBoundingClientRect();
                const overflowRight = rect.right - cRect.right;
                const overflowBottom = rect.bottom - cRect.bottom;
                let tx = 0, ty = 0;
                if (overflowRight > 0) tx = -overflowRight;
                if (overflowBottom > 0) ty = -overflowBottom;
                connectTitle.style.transform = `translate(${Math.round(tx)}px, ${Math.round(ty)}px)`;
            }
        }

        // Remove hard bottom scroll clamp so page height equals content
        isAtBottom = false;
        document.documentElement.style.overflowY = 'auto';
        document.body.style.overflowY = 'auto';
        // Ensure no forced bottom padding is added by the browser
        document.documentElement.style.paddingBottom = '0px';
        document.body.style.paddingBottom = '0px';
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
    // Prevent iOS/macOS bounce at the bottom
    window.addEventListener('touchmove', requestTick, { passive: true });
    
    // Initial sizing
    function recalcDocumentHeight() {
        try {
            // Set min-heights based purely on deepest non-fixed content
            const exactHeight = getDeepContentBottomPx();
            document.body.style.minHeight = exactHeight + 'px';
            document.documentElement.style.minHeight = exactHeight + 'px';
            // Debug logs
            console.debug('[scrollGuard] exactHeight', exactHeight,
                'docHeight', document.documentElement.scrollHeight,
                'winH', window.innerHeight);
        } catch (e) {
            console.warn('[scrollGuard] sizing error', e);
        }
    }

    recalcDocumentHeight();
    handleScroll();

    // Recalculate on resize and orientation change to keep bounds correct
    window.addEventListener('resize', () => { recalcDocumentHeight(); requestTick(); });
    window.addEventListener('orientationchange', () => { recalcDocumentHeight(); requestTick(); });

    // After all resources load, re-measure in case images/fonts changed heights
    window.addEventListener('load', () => { recalcDocumentHeight(); requestTick(); });

    // Optional: enable debug zeroing with a key (Shift+D)
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'd' && e.shiftKey) {
            document.body.classList.toggle('no-bottom-space-debug');
            recalcDocumentHeight();
            requestTick();
        }
        if (e.key.toLowerCase() === 'l' && e.shiftKey) {
            logScrollDebug('SCROLL DEBUG (manual)');
        }
    });

    // Aggressive: wheel/touch prevent when at bottom or at top
    function atTop() { return window.scrollY <= 0; }
    window.addEventListener('wheel', (e) => {
        if ((isAtBottom && e.deltaY > 0) || (atTop() && e.deltaY < 0)) {
            e.preventDefault();
        }
        // Re-enable scrolling immediately when user scrolls upward from bottom
        if (e.deltaY < 0) {
            document.documentElement.style.overflowY = 'auto';
            document.body.style.overflowY = 'auto';
        }
    }, { passive: false });

    window.addEventListener('touchstart', (e) => { if (e.touches && e.touches[0]) lastTouchY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchmove', (e) => {
        const currentY = (e.touches && e.touches[0]) ? e.touches[0].clientY : lastTouchY;
        const deltaY = lastTouchY - currentY; // positive means scroll down
        if ((isAtBottom && deltaY > 0) || (atTop() && deltaY < 0)) {
            e.preventDefault();
        }
        if (deltaY < 0) { // user swipes down (scroll up)
            document.documentElement.style.overflowY = 'auto';
            document.body.style.overflowY = 'auto';
        }
    }, { passive: false });

    // Initial comprehensive debug
    logScrollDebug('SCROLL DEBUG (init)');

    // ===== HERO LOGO HOVER SWAP (disabled) =====
    if (enableLogoHover && heroLogo) {
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
    
    // ===== CONNECT: GMT+7 current time (API + smooth auto-update) =====
    (function updateGmt7Time() {
        const el = document.getElementById('gmt7Time');
        if (!el) return;
        const fmt = (dateLike) => {
            const d = new Date(dateLike);
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            return `${hh}:${mm}`;
        };
        // Fallback using client time shifted to GMT+7
        const setFromOffset = () => {
            const now = new Date();
            const utc = now.getTime() + now.getTimezoneOffset() * 60000;
            const gmt7 = new Date(utc + 7 * 3600000);
            el.textContent = fmt(gmt7);
        };
        // Try worldtimeapi once for accuracy, then tick locally
        fetch('https://worldtimeapi.org/api/timezone/Asia/Bangkok', { cache: 'no-store' })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => { if (data && data.datetime) el.textContent = fmt(data.datetime); else setFromOffset(); })
            .catch(setFromOffset);
        // Smooth auto update every second
        setInterval(setFromOffset, 1000);
    })();

    // ===== CONNECT: info > info-group left-to-right reveal (with reverse order) =====
    (function revealConnectInfo() {
        const container = document.querySelector('.connect .info');
        if (!container) return;

        // Track scroll direction shared from outer scope
        let lastScrollY = window.scrollY;
        let isScrollingDown = true;
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            isScrollingDown = y > lastScrollY;
            lastScrollY = y;
        }, { passive: true });

        const groups = container.querySelectorAll('.info-group');
        if (!groups.length) return;

        // Mark children of each group as reveal lines
        groups.forEach(group => {
            const children = group.querySelectorAll(':scope > *');
            children.forEach(el => el.classList.add('reveal-line'));
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const el = entry.target;
                const group = el.closest('.info-group') || container;
                const siblings = Array.from(group.querySelectorAll(':scope > .reveal-line'));
                const index = Math.max(0, siblings.indexOf(el));
                const total = Math.max(1, siblings.length);
                const forwardIdx = index;
                const reverseIdx = (total - 1 - index);
                const chosenIdx = isScrollingDown ? forwardIdx : reverseIdx;
                const delayMs = Math.min(800, 90 * chosenIdx);
                el.style.transitionDelay = delayMs + 'ms';

                if (entry.isIntersecting) {
                    el.classList.add('is-visible');
                } else {
                    el.classList.remove('is-visible');
                }
            });
        }, { root: null, threshold: 0.1 });

        container.querySelectorAll('.info-group > *').forEach(el => observer.observe(el));
    })();

    // ===== CONNECT: form field > label left-to-right reveal (with reverse order) =====
    (function revealConnectFormLabels() {
        const form = document.querySelector('.connect .form');
        if (!form) return;

        // Track scroll direction
        let lastScrollY = window.scrollY;
        let isScrollingDown = true;
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            isScrollingDown = y > lastScrollY;
            lastScrollY = y;
        }, { passive: true });

        const labels = Array.from(form.querySelectorAll('.field > label'));
        if (!labels.length) return;

        labels.forEach(el => el.classList.add('reveal-line'));

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const el = entry.target;
                const siblings = labels; // stagger across all labels in the form
                const index = Math.max(0, siblings.indexOf(el));
                const total = Math.max(1, siblings.length);
                const forwardIdx = index;
                const reverseIdx = (total - 1 - index);
                const chosenIdx = isScrollingDown ? forwardIdx : reverseIdx;
                const delayMs = Math.min(900, 80 * chosenIdx);
                el.style.transitionDelay = delayMs + 'ms';

                if (entry.isIntersecting) {
                    el.classList.add('is-visible');
                } else {
                    el.classList.remove('is-visible');
                }
            });
        }, { root: null, threshold: 0.1 });

        labels.forEach(el => observer.observe(el));
    })();

    // ===== WORKS: link items to GitHub repos =====
    (function linkWorksToGithub() {
        const username = 'xircons';
        document.querySelectorAll('.works-container .work-item[data-repo]').forEach((item) => {
            const repo = item.getAttribute('data-repo');
            if (!repo) return;
            const url = `https://github.com/${username}/${repo}`;
            item.setAttribute('href', url);
            item.setAttribute('target', '_blank');
            item.setAttribute('rel', 'noopener noreferrer');
        });
    })();

    // ===== Custom Cursor =====
    class CustomCursor {
        constructor(options = {}) {
            this.cursor = document.getElementById('customCursor');
            if (!this.cursor) return;

            this.ease = typeof options.ease === 'number' ? options.ease : 0.2; // 0..1
            this.isDown = false;
            this.isHover = false;
            this.isVisible = false;

            this.targetX = window.innerWidth / 2;
            this.targetY = window.innerHeight / 2;
            this.currentX = this.targetX;
            this.currentY = this.targetY;

            this.rafId = null;

            this.onMouseMove = this.onMouseMove.bind(this);
            this.onMouseOver = this.onMouseOver.bind(this);
            this.onMouseOut = this.onMouseOut.bind(this);
            this.onMouseDown = this.onMouseDown.bind(this);
            this.onMouseUp = this.onMouseUp.bind(this);
            this.onWindowBlur = this.onWindowBlur.bind(this);
            this.onWindowFocus = this.onWindowFocus.bind(this);
            this.animate = this.animate.bind(this);

            this.addEvents();
            this.start();
        }

        addEvents() {
            document.addEventListener('mousemove', this.onMouseMove, { passive: true });
            document.addEventListener('mouseover', this.onMouseOver, { passive: true });
            document.addEventListener('mouseout', this.onMouseOut, { passive: true });
            document.addEventListener('mousedown', this.onMouseDown, { passive: true });
            document.addEventListener('mouseup', this.onMouseUp, { passive: true });
            document.addEventListener('mouseleave', this.onWindowBlur, { passive: true });
            window.addEventListener('blur', this.onWindowBlur, { passive: true });
            window.addEventListener('focus', this.onWindowFocus, { passive: true });
        }

        removeEvents() {
            document.removeEventListener('mousemove', this.onMouseMove);
            document.removeEventListener('mouseover', this.onMouseOver);
            document.removeEventListener('mouseout', this.onMouseOut);
            document.removeEventListener('mousedown', this.onMouseDown);
            document.removeEventListener('mouseup', this.onMouseUp);
            document.removeEventListener('mouseleave', this.onWindowBlur);
            window.removeEventListener('blur', this.onWindowBlur);
            window.removeEventListener('focus', this.onWindowFocus);
        }

        start() { if (!this.rafId) this.rafId = requestAnimationFrame(this.animate); }
        stop() { if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; } }

        onMouseMove(e) {
            this.targetX = e.clientX;
            this.targetY = e.clientY;
            if (!this.isVisible) {
                this.isVisible = true;
                this.cursor.classList.add('is-visible');
                this.cursor.classList.remove('is-hidden');
            }
            this.setHover(this.isElementInteractive(e.target));
        }

        onMouseOver(e) { this.setHover(this.isElementInteractive(e.target)); }
        onMouseOut(e) { const toEl = e.relatedTarget; this.setHover(this.isElementInteractive(toEl)); }
        onMouseDown() { this.isDown = true; this.cursor.classList.add('is-down'); }
        onMouseUp() { this.isDown = false; this.cursor.classList.remove('is-down'); }
        onWindowBlur() {
            this.isDown = false;
            this.cursor.classList.remove('is-down');
            this.isVisible = false;
            this.cursor.classList.remove('is-hover', 'is-visible');
            this.cursor.classList.add('is-hidden');
        }
        onWindowFocus() { /* wait for mousemove */ }

        setHover(state) {
            if (state === this.isHover) return;
            this.isHover = state;
            if (this.isHover) this.cursor.classList.add('is-hover');
            else this.cursor.classList.remove('is-hover');
        }

        isElementInteractive(el) {
            if (!el || el.nodeType !== 1) return false;
            let node = el, depth = 0;
            while (node && node !== document.body && depth < 6) {
                if (this.matchesInteractive(node)) return true;
                node = node.parentElement; depth += 1;
            }
            return false;
        }

        matchesInteractive(node) {
            const interactiveSelector = [
                'a','button','label','select','input','textarea',
                '[role="button"]','[role="link"]',
                '.interactive-element','.link','.special-hover','[data-interactive="true"]'
            ].join(',');
            if (node.matches(interactiveSelector)) return true;
            const cs = window.getComputedStyle(node);
            if (cs.cursor === 'pointer') return true;
            if (typeof node.onclick === 'function') return true;
            if (node.hasAttribute && (node.hasAttribute('onclick') || node.hasAttribute('tabindex'))) return true;
            return false;
        }

        animate() {
            const dx = this.targetX - this.currentX;
            const dy = this.targetY - this.currentY;
            this.currentX += dx * this.ease;
            this.currentY += dy * this.ease;
            const size = this.cursor.offsetWidth || parseFloat(getComputedStyle(this.cursor).width) || 12;
            const half = size / 2;
            this.cursor.style.transform = `translate3d(${(this.currentX - half).toFixed(2)}px, ${(this.currentY - half).toFixed(2)}px, 0)`;
            this.rafId = requestAnimationFrame(this.animate);
        }

        destroy() { this.stop(); this.removeEvents(); this.cursor?.parentNode?.removeChild(this.cursor); }
    }

    // Initialize
    new CustomCursor();

    // ===== ABOUT-ME: staggered left-to-right line reveal =====
    (function revealAboutLines() {
        const aboutSection = document.querySelector('.about-me');
        if (!aboutSection) return;

        // Track scroll direction
        let lastScrollY = window.scrollY;
        let isScrollingDown = true;
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            isScrollingDown = y > lastScrollY;
            lastScrollY = y;
        }, { passive: true });

        // Select textual lines to animate
        const candidates = aboutSection.querySelectorAll(
            '.about-container > p, .about-container h1, .lists-two-col h2, .lists-two-col li, .lists-two-col p'
        );
        if (!candidates.length) return;

        // Add base class
        candidates.forEach((el) => el.classList.add('reveal-line'));

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const el = entry.target;
                const parent = el.closest('.lists-two-col') || aboutSection;
                // Stagger: index among siblings inside same block
                const siblings = Array.from(parent.querySelectorAll('.reveal-line'));
                const index = Math.max(0, siblings.indexOf(el));
                const total = Math.max(1, siblings.length);
                const forwardIdx = index;
                const reverseIdx = (total - 1 - index);
                const chosenIdx = isScrollingDown ? forwardIdx : reverseIdx;

                // Extra delay controls
                const dataReverseExtra = parseInt(el.getAttribute('data-reverse-extra') || '0', 10);
                const dataExtra = parseInt(el.getAttribute('data-extra') || '0', 10);
                const extraMs = isScrollingDown ? dataExtra : (dataReverseExtra > 0 ? dataReverseExtra : dataExtra);

                const delayMs = Math.min(3000, 80 * chosenIdx + extraMs);
                el.style.transitionDelay = delayMs + 'ms';

                if (entry.isIntersecting) {
                    el.classList.add('is-visible');
                } else {
                    el.classList.remove('is-visible');
                }
            });
        }, { root: null, threshold: 0.15 });

        candidates.forEach((el) => observer.observe(el));
    })();

    // contact form submission moved to js/contact.js

});