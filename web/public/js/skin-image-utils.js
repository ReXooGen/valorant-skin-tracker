/**
 * Unified Skin Image Loading Utilities
 * Provides consistent image loading across all pages
 */

class SkinImageLoader {
    constructor() {
        this.fallbackUrls = [
            'https://media.valorant-api.com/weaponskins/{uuid}/displayicon.png',
            'https://media.valorant-api.com/weaponskinlevels/{uuid}/displayicon.png',
            'https://media.valorant-api.com/weaponskins/{uuid}/chromas/standard/fullrender.png'
        ];
        
        this.weaponIcons = {
            'vandal': 'fas fa-fire',
            'phantom': 'fas fa-crosshairs',
            'operator': 'fas fa-crosshairs',
            'sheriff': 'fas fa-dot-circle',
            'guardian': 'fas fa-bullseye',
            'classic': 'fas fa-circle',
            'knife': 'fas fa-cut',
            'melee': 'fas fa-cut',
            'unknown': 'fas fa-question'
        };
        
        this.weaponColors = {
            'vandal': '#389df1',
            'phantom': '#ff4655',
            'operator': '#ff9500',
            'sheriff': '#ffaa00',
            'guardian': '#00aaff',
            'classic': '#888',
            'knife': '#ff0066',
            'melee': '#ff0066',
            'unknown': '#666'
        };
    }

    /**
     * Load skin image with multiple fallbacks
     * @param {HTMLImageElement} imgElement - The image element to load
     * @param {string} skinUuid - The skin UUID
     * @param {string} skinName - The skin name
     */
    loadSkinImage(imgElement, skinUuid, skinName) {
        if (!imgElement || !skinUuid) return;

        let currentIndex = 0;
        const fallbackUrls = this.fallbackUrls.map(url => url.replace('{uuid}', skinUuid));
        
        const tryNextImage = () => {
            if (currentIndex >= fallbackUrls.length) {
                this.showPlaceholder(imgElement, skinName);
                return;
            }
            
            const img = new Image();
            img.onload = () => {
                imgElement.src = fallbackUrls[currentIndex];
                imgElement.style.display = 'block';
                const placeholder = imgElement.parentElement?.querySelector('.skin-image-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
            };
            img.onerror = () => {
                currentIndex++;
                tryNextImage();
            };
            img.src = fallbackUrls[currentIndex];
        };
        
        tryNextImage();
    }

    /**
     * Show weapon-based placeholder when images fail
     * @param {HTMLImageElement} imgElement - The image element
     * @param {string} skinName - The skin name
     */
    showPlaceholder(imgElement, skinName) {
        const weaponType = this.getWeaponTypeFromName(skinName);
        const placeholder = imgElement.parentElement?.querySelector('.skin-image-placeholder');
        
        if (placeholder) {
            const iconContainer = placeholder.querySelector('.weapon-icon-container');
            if (iconContainer) {
                iconContainer.innerHTML = `
                    <i class="${this.weaponIcons[weaponType]} weapon-icon" style="color: ${this.weaponColors[weaponType]}; font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.8;"></i>
                    <small style="color: #999; text-transform: uppercase; letter-spacing: 0.5px;">${weaponType}</small>
                `;
            }
            placeholder.style.display = 'flex';
        }
        
        imgElement.style.display = 'none';
    }

    /**
     * Get weapon type from skin name
     * @param {string} skinName - The skin name
     * @returns {string} The weapon type
     */
    getWeaponTypeFromName(skinName) {
        if (!skinName) return 'unknown';
        
        const name = skinName.toLowerCase();
        
        if (name.includes('vandal')) return 'vandal';
        if (name.includes('phantom')) return 'phantom';
        if (name.includes('operator')) return 'operator';
        if (name.includes('sheriff')) return 'sheriff';
        if (name.includes('guardian')) return 'guardian';
        if (name.includes('marshal')) return 'guardian';
        if (name.includes('classic')) return 'classic';
        if (name.includes('knife') || name.includes('melee') || name.includes('karambit') || name.includes('butterfly')) return 'knife';
        if (name.includes('spectre')) return 'phantom';
        if (name.includes('ares') || name.includes('odin')) return 'operator';
        
        return 'unknown';
    }

    /**
     * Initialize all skin images on the page
     */
    initializeAllImages() {
        const images = document.querySelectorAll('.skin-image[data-skin-uuid]');
        images.forEach(img => {
            const skinUuid = img.getAttribute('data-skin-uuid');
            const skinName = img.getAttribute('data-skin-name');
            if (skinUuid && skinName) {
                this.loadSkinImage(img, skinUuid, skinName);
            }
        });
    }

    /**
     * Create and insert a skin image element
     * @param {string} skinUuid - The skin UUID
     * @param {string} skinName - The skin name
     * @param {string} containerSelector - CSS selector for container
     * @param {Object} options - Additional options
     */
    createSkinImage(skinUuid, skinName, containerSelector, options = {}) {
        const container = document.querySelector(containerSelector);
        if (!container) return null;

        const imageContainer = document.createElement('div');
        imageContainer.className = 'skin-image-container';
        
        const img = document.createElement('img');
        img.className = 'skin-image';
        img.setAttribute('data-skin-uuid', skinUuid);
        img.setAttribute('data-skin-name', skinName);
        img.alt = skinName;
        
        const placeholder = document.createElement('div');
        placeholder.className = 'skin-image-placeholder';
        placeholder.innerHTML = '<div class="weapon-icon-container"></div>';
        
        imageContainer.appendChild(img);
        imageContainer.appendChild(placeholder);
        container.appendChild(imageContainer);
        
        // Load the image
        this.loadSkinImage(img, skinUuid, skinName);
        
        return imageContainer;
    }
}

// Global instance
window.SkinImageLoader = new SkinImageLoader();

// Global convenience function for backward compatibility
window.loadSkinImage = function(imgElement, skinUuid, skinName) {
    return window.SkinImageLoader.loadSkinImage(imgElement, skinUuid, skinName);
};

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    window.SkinImageLoader.initializeAllImages();
    
    // Re-scan for new images every 2 seconds (for dynamic content)
    setInterval(function() {
        const uninitializedImages = document.querySelectorAll('.skin-image[data-skin-uuid]:not([src])');
        uninitializedImages.forEach(img => {
            const skinUuid = img.getAttribute('data-skin-uuid');
            const skinName = img.getAttribute('data-skin-name');
            if (skinUuid && skinName) {
                window.SkinImageLoader.loadSkinImage(img, skinUuid, skinName);
            }
        });
    }, 2000);
});
