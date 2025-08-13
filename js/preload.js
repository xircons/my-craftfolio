(function () {
    'use strict';

    var preloadVisibleMs = 500;      // 1) visible duration
    var logoFadeMs = 400;            // 2) logo fade duration
    var curtainAnimMs = 1200;        // 3) curtains animation duration
    var preloaderId = 'preloader';

    function lockScroll() {
        var html = document.documentElement;
        var body = document.body;

        // Preserve previous inline styles to restore later
        var prev = {
            htmlOverflow: html.style.overflow,
            bodyOverflow: body.style.overflow
        };

        html.style.overflow = 'hidden';
        body.style.overflow = 'hidden';
        return function unlock() {
            html.style.overflow = prev.htmlOverflow;
            body.style.overflow = prev.bodyOverflow;
        };
    }

    // Add active blockers to prevent scroll events even before inline overflow is set
    function addActiveScrollBlockers(target) {
        if (!target) return function noop(){};
        var prevent = function (e) { e.preventDefault(); };
        var onKeyDown = function (e) {
            var keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Space', ' '];
            if (keys.indexOf(e.key) !== -1 || e.keyCode === 32) {
                e.preventDefault();
            }
        };
        target.addEventListener('wheel', prevent, { passive: false });
        target.addEventListener('touchmove', prevent, { passive: false });
        window.addEventListener('keydown', onKeyDown, true);
        return function removeBlockers() {
            target.removeEventListener('wheel', prevent, { passive: false });
            target.removeEventListener('touchmove', prevent, { passive: false });
            window.removeEventListener('keydown', onKeyDown, true);
        };
    }

    function runSequence() {
        var preloader = document.getElementById(preloaderId);
        if (!preloader) return;

        var removeBlockers = addActiveScrollBlockers(preloader);
        var unlock = lockScroll();

        // Helper: wait for transition end (with timeout fallback)
        function waitForCurtains(callback) {
            var topCurtain = preloader.querySelector('.curtain-top');
            var bottomCurtain = preloader.querySelector('.curtain-bottom');
            var done = false;
            var fallback = setTimeout(function () {
                if (done) return; done = true; callback();
            }, Math.max(50, curtainAnimMs + 60));

            function onEnd(e) {
                if (done) return;
                if (e && e.propertyName !== 'transform') return;
                done = true;
                clearTimeout(fallback);
                topCurtain && topCurtain.removeEventListener('transitionend', onEnd);
                bottomCurtain && bottomCurtain.removeEventListener('transitionend', onEnd);
                callback();
            }
            topCurtain && topCurtain.addEventListener('transitionend', onEnd, { once: true });
            bottomCurtain && bottomCurtain.addEventListener('transitionend', onEnd, { once: true });
        }

        // Ensure initial layout computed before transitioning
        requestAnimationFrame(function () {
            setTimeout(function () {
                // 2) Fade out logo
                preloader.classList.add('logo-hidden');

                setTimeout(function () {
                    // Force reflow so the curtain transition always triggers
                    var _force1 = preloader.offsetWidth;
                    var _force2 = (preloader.querySelector('.curtain-top') || {}).offsetHeight;

                    // 3-4) Open curtains
                    preloader.classList.add('curtains-open');

                    // 6) After animation completes: remove and unlock scroll
                    waitForCurtains(function () {
                        try {
                            if (preloader && preloader.parentNode) {
                                preloader.parentNode.removeChild(preloader);
                            }
                        } finally {
                            removeBlockers();
                            unlock();
                        }
                    });
                }, Math.max(0, logoFadeMs));
            }, Math.max(0, preloadVisibleMs));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runSequence, { once: true });
    } else {
        runSequence();
    }
})();


