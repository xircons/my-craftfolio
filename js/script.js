document.addEventListener('DOMContentLoaded', function() {
    
    // ===== VARIABLES =====
    const layoutGuide = document.getElementById('layoutGuide');
    const toggleLayoutBtn = document.getElementById('toggleLayout');
    const hero = document.querySelector('.hero');
    const contentSections = document.querySelectorAll('.content-section');
    
    // ===== LAYOUT GUIDE TOGGLE =====
    if (toggleLayoutBtn && layoutGuide) {
        // Show layout guide by default
        layoutGuide.style.display = 'block';
        toggleLayoutBtn.textContent = 'Hide Grid';
        
        toggleLayoutBtn.addEventListener('click', function() {
            const isVisible = layoutGuide.style.display !== 'none';
            layoutGuide.style.display = isVisible ? 'none' : 'block';
            this.textContent = isVisible ? 'Show Grid' : 'Hide Grid';
        });
    }
    
    // ===== SCROLL EFFECTS =====
    function handleScroll() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        
        // Fade only craftfolio image on scroll
        const craftfolioImg = document.querySelector('.hero img[alt="craftfolio"]');
        
        if (craftfolioImg) {
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
                
                // Apply only transform for smooth slide-up (no opacity change)
                const translateY = 50 - (clampedProgress * 50); // From 50px to 0px
                
                section.style.transform = `translateY(${translateY}px)`;
                
                // Add visible class when fully visible
                if (clampedProgress >= 0.9) {
                    section.classList.add('visible');
                }
            } else if (scrollY > fadeEnd) {
                // Fully visible
                section.style.transform = 'translateY(0px)';
                section.classList.add('visible');
            } else if (scrollY < fadeStart) {
                // Not yet visible
                section.style.transform = 'translateY(50px)';
                section.classList.remove('visible');
            }
        });
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
    
});