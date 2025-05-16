// Main JavaScript file for Legal Light House SPA
document.addEventListener('DOMContentLoaded', function() {
    // Cache for storing page content
    const pageCache = {};
    
    // Add transitions CSS
    const transitionsCSS = document.createElement('link');
    transitionsCSS.rel = 'stylesheet';
    transitionsCSS.href = './css/transitions.css';
    document.head.appendChild(transitionsCSS);
    
    // Create transition indicator
    const transitionIndicator = document.createElement('div');
    transitionIndicator.className = 'page-transition-indicator';
    document.body.appendChild(transitionIndicator);
    
    // Initialize the application
    initApp();
    
    function initApp() {
        // Remove any previous event listeners to avoid duplicates
        document.removeEventListener('click', handleNavigation);
        
        // Re-add the event listener with capture phase for earlier interception
        document.addEventListener('click', handleNavigation, true);
        
        // Handle menu icon clicks for mobile
        setupMobileMenu();
        
        // Load initial page content based on current URL
        const initialPath = window.location.pathname;
        const defaultPage = '/index.html';
        
        // If on root path, load the default page
        if (initialPath === '/' || initialPath === '') {
            loadPage(defaultPage, false);
        } else {
            // Otherwise load the current page
            loadPage(initialPath, false);
        }
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', function(event) {
            if (event.state && event.state.path) {
                loadPage(event.state.path, false);
            }
        });
        
        // Optimize image loading
        document.addEventListener('DOMContentLoaded', optimizeImages);
        
        // Apply performance optimizations
        applyPerformanceOptimizations();
    }
    
    function handleNavigation(event) {
        // Check if the click was on a navigation link or any of its children
        let target = event.target;
        
        // If the click was on an icon or span inside an anchor, find the anchor
        while (target && target.tagName !== 'A') {
            target = target.parentElement;
            if (!target) return; // Not a navigation element
        }
        
        // We have an anchor tag
        if (target && target.tagName === 'A') {
            // Get the href attribute
            const href = target.getAttribute('href');
            
            // Only handle internal navigation - improved to handle various internal link formats
            if (href && !href.startsWith('#') && !href.includes('://')) {
                // Prevent default link behavior
                event.preventDefault();
                
                // Update the URL and load the page
                loadPage(href, true);
                
                // Update active state immediately for better feedback
                updateActiveNavItem(href);
                
                // Close any mobile menu if it exists
                const sidebar = document.querySelector('.sidebar');
                if (sidebar && window.innerWidth < 768 && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
                
                // Scroll to top for better UX
                window.scrollTo(0, 0);
            }
        }
    }
    
    function loadPage(path, updateHistory) {
        // Show loading effect
        const currentContent = document.querySelector('.content');
        if (currentContent) {
            currentContent.classList.add('loading');
        }
        
        // Show transition indicator
        transitionIndicator.classList.add('loading');
        
        // Show loading indicator for longer operations
        const loadStartTime = performance.now();
        const minLoadingTime = 50; // ms - don't show loader for very fast operations
        let loaderShown = false;
        
        // Only show the loader if the operation takes more than minLoadingTime
        const loaderTimeout = setTimeout(() => {
            showLoading(true);
            loaderShown = true;
        }, minLoadingTime);
        
        // If the page is in cache, use it immediately
        if (pageCache[path]) {
            clearTimeout(loaderTimeout);
            
            // Add a small delay to show the transition even for cached pages
            setTimeout(() => {
                updateContent(pageCache[path]);
                updateActiveNavItem(path);
                currentContent.classList.remove('loading');
                
                // Complete the transition animation
                transitionIndicator.classList.remove('loading');
                transitionIndicator.classList.add('complete');
                
                setTimeout(() => {
                    transitionIndicator.classList.remove('complete');
                    transitionIndicator.style.transform = 'scaleX(0)';
                    
                    // After animation completes, reset transform
                    setTimeout(() => {
                        transitionIndicator.style.transition = 'none';
                        transitionIndicator.style.transform = '';
                        setTimeout(() => {
                            transitionIndicator.style.transition = '';
                        }, 10);
                    }, 300);
                }, 300);
                
                if (updateHistory) {
                    window.history.pushState({ path: path }, '', path);
                }
            }, 100);
            
            return;
        }
        
        // Otherwise fetch the page
        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(html => {
                // Parse the HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Store in cache
                pageCache[path] = doc;
                
                // Update the page content
                updateContent(doc);
                
                // Update active navigation item
                updateActiveNavItem(path);
                
                // Update browser history if needed
                if (updateHistory) {
                    window.history.pushState({ path: path }, '', path);
                }
                
                // Remove loading classes
                currentContent.classList.remove('loading');
                clearTimeout(loaderTimeout);
                if (loaderShown) {
                    showLoading(false);
                }
                
                // Complete the transition animation
                transitionIndicator.classList.remove('loading');
                transitionIndicator.classList.add('complete');
                
                setTimeout(() => {
                    transitionIndicator.classList.remove('complete');
                    transitionIndicator.style.transform = 'scaleX(0)';
                    
                    // After animation completes, reset transform
                    setTimeout(() => {
                        transitionIndicator.style.transition = 'none';
                        transitionIndicator.style.transform = '';
                        setTimeout(() => {
                            transitionIndicator.style.transition = '';
                        }, 10);
                    }, 300);
                }, 300);
                
                // Apply performance optimizations to new content
                optimizeImages();
            })
            .catch(error => {
                console.error('Error loading page:', error);
                currentContent.classList.remove('loading');
                clearTimeout(loaderTimeout);
                if (loaderShown) {
                    showLoading(false);
                }
                
                // Reset transition indicator
                transitionIndicator.classList.remove('loading');
                transitionIndicator.style.transform = 'scaleX(0)';
            });
    }
    
    function updateContent(doc) {
        // Extract the content area from the loaded page
        const newContent = doc.querySelector('.content');
        
        // Get the current content area
        const currentContent = document.querySelector('.content');
        
        // Replace it with the new content
        if (newContent && currentContent) {
            currentContent.innerHTML = newContent.innerHTML;
        }
        
        // Update the page title
        document.title = doc.title;
    }
    
    function updateActiveNavItem(path) {
        // Remove active class from all sidebar items
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Get the filename from the path
        const filename = path.split('/').pop();
        
        // Find the matching nav item and set it as active
        document.querySelectorAll('.sidebar-item a').forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === filename || linkHref === path || 
                path.endsWith('/' + linkHref) || path.endsWith('\\' + linkHref)) {
                const sidebarItem = link.closest('.sidebar-item');
                if (sidebarItem) {
                    sidebarItem.classList.add('active');
                }
            }
        });
    }
    
    function showLoading(show) {
        // Create loading indicator if it doesn't exist
        let loadingIndicator = document.getElementById('loading-indicator');
        
        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'loading-indicator';
            loadingIndicator.innerHTML = `
                <div class="loading-spinner"></div>
            `;
            loadingIndicator.style.position = 'fixed';
            loadingIndicator.style.top = '60px';
            loadingIndicator.style.right = '20px';
            loadingIndicator.style.background = 'rgba(0, 0, 0, 0.7)';
            loadingIndicator.style.borderRadius = '4px';
            loadingIndicator.style.padding = '10px';
            loadingIndicator.style.zIndex = '1000';
            loadingIndicator.style.display = 'none';
            
            const spinner = document.createElement('style');
            spinner.textContent = `
                .loading-spinner {
                    width: 20px;
                    height: 20px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: #8a3ab9;
                    animation: spin 1s ease-in-out infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            
            document.head.appendChild(spinner);
            document.body.appendChild(loadingIndicator);
        }
        
        loadingIndicator.style.display = show ? 'block' : 'none';
    }
    
    // Preload common pages to make navigation even faster
    function preloadPages() {
        const commonPages = [
            'index.html',
            'dashboard.html',
            'community.html',
            'search.html',
            'learning.html',
            'quiz.html',
            'cases.html',
            'leaderboard.html',
            'settings.html'
        ];
        
        // Use requestIdleCallback or setTimeout to load pages during idle time
        const loadNextPage = (index) => {
            if (index >= commonPages.length) return;
            
            const page = commonPages[index];
            if (!pageCache[page]) {
                fetch(page)
                    .then(response => response.text())
                    .then(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        pageCache[page] = doc;
                        
                        // Load next page when browser is idle
                        if (window.requestIdleCallback) {
                            requestIdleCallback(() => loadNextPage(index + 1));
                        } else {
                            setTimeout(() => loadNextPage(index + 1), 100);
                        }
                    })
                    .catch(error => {
                        console.warn('Error preloading page:', page, error);
                        // Try next page anyway
                        if (window.requestIdleCallback) {
                            requestIdleCallback(() => loadNextPage(index + 1));
                        } else {
                            setTimeout(() => loadNextPage(index + 1), 100);
                        }
                    });
            } else {
                // Skip already cached pages
                loadNextPage(index + 1);
            }
        };
        
        // Start loading pages during idle time
        if (window.requestIdleCallback) {
            requestIdleCallback(() => loadNextPage(0));
        } else {
            setTimeout(() => loadNextPage(0), 100);
        }
    }
    
    // Optimize image loading
    function optimizeImages() {
        const images = document.querySelectorAll('img:not(.loaded)');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.getAttribute('data-src') || img.getAttribute('src');
                        
                        if (src) {
                            img.src = src;
                            img.classList.add('loaded');
                            img.classList.add('preload-img');
                            
                            // Once loaded, stop observing
                            observer.unobserve(img);
                            
                            // Add loaded class after image loads
                            img.onload = () => {
                                img.classList.add('loaded');
                            };
                        }
                    }
                });
            });
            
            images.forEach(img => {
                // Set data-src if not already
                if (!img.getAttribute('data-src') && img.getAttribute('src')) {
                    img.setAttribute('data-src', img.getAttribute('src'));
                    img.classList.add('preload-img');
                }
                
                imageObserver.observe(img);
            });
        }
    }
    
    // Apply various performance optimizations
    function applyPerformanceOptimizations() {
        // Use passive event listeners for better scroll performance
        document.addEventListener('touchstart', function() {}, { passive: true });
        document.addEventListener('touchmove', function() {}, { passive: true });
        document.addEventListener('wheel', function() {}, { passive: true });
        
        // Debounce scroll and resize events
        let scrollTimeout;
        let resizeTimeout;
        
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                // Handle scroll events here
            }, 100);
        }, { passive: true });
        
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                // Handle resize events here
            }, 100);
        }, { passive: true });
        
        // Preconnect to external domains
        const domains = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdn.jsdelivr.net'
        ];
        
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }
    
    // Setup mobile menu toggle
    function setupMobileMenu() {
        const menuIcon = document.querySelector('.menu-icon');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuIcon && sidebar) {
            // Remove any existing listeners
            const newMenuIcon = menuIcon.cloneNode(true);
            if (menuIcon.parentNode) {
                menuIcon.parentNode.replaceChild(newMenuIcon, menuIcon);
            }
            
            // Add new click listener
            newMenuIcon.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event from bubbling up
                sidebar.classList.toggle('open');
                
                // Close menu when clicking outside
                document.addEventListener('click', function closeSidebar(e) {
                    if (!sidebar.contains(e.target) && e.target !== newMenuIcon) {
                        sidebar.classList.remove('open');
                        document.removeEventListener('click', closeSidebar);
                    }
                });
            });
        }
        
        // Handle window resize for responsive behavior
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && sidebar) {
                sidebar.classList.remove('open');
            }
        });
    }
    
    // Fix sidebar active states when directly loading a page
    function fixDirectPageLoad() {
        // Get current path
        const currentPath = window.location.pathname;
        const filename = currentPath.split('/').pop();
        
        // Update active state based on current URL
        if (filename) {
            updateActiveNavItem(filename);
        }
    }
    
    // Call fixDirectPageLoad after DOM is loaded
    document.addEventListener('DOMContentLoaded', fixDirectPageLoad);
    
    // Start preloading after initial page load
    setTimeout(preloadPages, 1000);
    
    // Add click events to all sidebar items for non-SPA fallback
    document.querySelectorAll('.sidebar-item a').forEach(link => {
        link.addEventListener('click', function(e) {
            // This ensures that even if the SPA navigation fails,
            // the classic links will still work correctly
            const href = this.getAttribute('href');
            try {
                if (href && !href.startsWith('#') && !href.includes('://')) {
                    e.preventDefault();
                    loadPage(href, true);
                }
            } catch (err) {
                console.warn('SPA navigation failed, falling back to normal navigation', err);
                // Let the default link behavior handle the navigation
            }
        });
    });
    
    // If no active sidebar item is found, try to match based on current URL
    const activeItem = document.querySelector('.sidebar-item.active');
    if (!activeItem) {
        const currentPath = window.location.pathname;
        const filename = currentPath.split('/').pop() || 'index.html';
        updateActiveNavItem(filename);
    }
}); 