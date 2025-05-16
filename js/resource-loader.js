// Resource loader for Legal Light House
(function() {
    'use strict';
    
    // Keep track of resource load status
    const resourceCache = {};
    
    // Create and attach a Resource Hint Manager
    class ResourceHintManager {
        constructor() {
            this.hints = {
                preconnect: [],
                prefetch: [],
                preload: []
            };
        }
        
        // Add preconnect hint for domain
        addPreconnect(url, crossorigin = true) {
            if (this.hints.preconnect.includes(url)) return;
            this.hints.preconnect.push(url);
            
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = url;
            if (crossorigin) link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        }
        
        // Add prefetch hint for resource
        addPrefetch(url, as = 'image') {
            if (this.hints.prefetch.includes(url)) return;
            this.hints.prefetch.push(url);
            
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            link.as = as;
            document.head.appendChild(link);
            
            return new Promise((resolve, reject) => {
                link.onload = () => resolve(url);
                link.onerror = () => reject(new Error(`Failed to prefetch: ${url}`));
            });
        }
        
        // Add preload hint for critical resource
        addPreload(url, as = 'image', callback = null) {
            if (this.hints.preload.includes(url)) return;
            this.hints.preload.push(url);
            
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = url;
            link.as = as;
            if (as === 'font') {
                link.type = 'font/woff2';
                link.crossOrigin = 'anonymous';
            }
            document.head.appendChild(link);
            
            if (callback) {
                link.onload = () => callback(url, true);
                link.onerror = () => callback(url, false);
            }
            
            return new Promise((resolve, reject) => {
                link.onload = () => resolve(url);
                link.onerror = () => reject(new Error(`Failed to preload: ${url}`));
            });
        }
    }
    
    // Image preloader
    function preloadImages(images, allDone) {
        let loadedCount = 0;
        const toLoad = images.length;
        
        function imageLoaded() {
            loadedCount++;
            if (loadedCount === toLoad && allDone) {
                allDone();
            }
        }
        
        for (let i = 0; i < toLoad; i++) {
            if (resourceCache[images[i]]) {
                imageLoaded();
            } else {
                const img = new Image();
                img.addEventListener('load', function() {
                    resourceCache[this.src] = true;
                    imageLoaded();
                }, { once: true });
                img.addEventListener('error', function() {
                    resourceCache[this.src] = false;
                    imageLoaded();
                }, { once: true });
                img.src = images[i];
                resourceCache[images[i]] = img;
            }
        }
    }
    
    // Apply memory optimization techniques
    function optimizeMemory() {
        // Limit the number of cached resources
        const MAX_CACHE_SIZE = 100;
        const keys = Object.keys(resourceCache);
        
        if (keys.length > MAX_CACHE_SIZE) {
            const removeCount = keys.length - MAX_CACHE_SIZE;
            const keysToRemove = keys.slice(0, removeCount);
            
            keysToRemove.forEach(key => {
                delete resourceCache[key];
            });
        }
    }
    
    // Initialize on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        const resourceHints = new ResourceHintManager();
        
        // Preconnect to important domains
        resourceHints.addPreconnect('https://fonts.googleapis.com');
        resourceHints.addPreconnect('https://fonts.gstatic.com');
        resourceHints.addPreconnect('https://cdn.jsdelivr.net');
        
        // Find important visible images to preload
        const visibleImages = Array.from(document.querySelectorAll('.thumbnail img, .logo img'))
            .map(img => img.getAttribute('src'))
            .filter(src => src);
            
        // Preload critical visible images
        if (visibleImages.length > 0) {
            preloadImages(visibleImages, () => {
                // Images loaded, optimize memory
                setTimeout(optimizeMemory, 3000);
            });
        }
        
        // Expose globally
        window.ResourceLoader = {
            preloadImages,
            resourceHints,
            optimizeMemory
        };
    });
})(); 