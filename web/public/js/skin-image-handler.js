// Unified Skin Image Handler for Valorant Skin Peek Bot
// Handles image loading, fallbacks, and placeholders consistently across all pages

// Generate skin image HTML with multiple fallback URLs
function generateSkinImageHTML(skinUuid, skinName, additionalClasses = '', containerClasses = '') {
    if (!skinUuid) {
        return generatePlaceholderHTML(skinName, additionalClasses, containerClasses);
    }

    // Multiple fallback URLs for better image loading
    const fallbackUrls = [
        `https://media.valorant-api.com/weaponskins/${skinUuid}/displayicon.png`,
        `https://media.valorant-api.com/weaponskinlevels/${skinUuid}/displayicon.png`,
        `https://media.valorant-api.com/weaponskins/${skinUuid}/chromas/standard/fullrender.png`,
        `https://media.valorant-api.com/weaponskins/${skinUuid}/chromas/standard/displayicon.png`
    ];

    return `
        <div class="skin-image-container ${containerClasses}">
            <img 
                class="skin-image ${additionalClasses}" 
                src="${fallbackUrls[0]}" 
                alt="${skinName || 'Skin Image'}"
                data-fallback-urls='${JSON.stringify(fallbackUrls.slice(1))}'
                onload="handleImageLoad(this)"
                onerror="handleImageError(this)"
                style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; display: none;"
            />
            ${generatePlaceholderHTML(skinName, 'skin-image-placeholder', '', 'display: flex;')}
        </div>
    `;
}

// Generate placeholder HTML for skins without image
function generatePlaceholderHTML(skinName = '', additionalClasses = '', containerClasses = '', style = '') {
    const weaponData = getWeaponDataFromName(skinName);
    
    return `
        <div class="skin-image-placeholder ${additionalClasses}" ${style ? `style="${style}"` : ''}>
            <div class="weapon-icon-container">
                <i class="${weaponData.icon} weapon-icon" style="color: ${weaponData.color}; font-size: 3rem; margin-bottom: 8px;"></i>
                <div style="color: #888; font-size: 0.9rem; text-align: center;">${weaponData.type}</div>
            </div>
            <div class="placeholder-animation">
                <div class="pulse-ring"></div>
                <div class="pulse-ring delayed"></div>
            </div>
        </div>
    `;
}
}

// Handle successful image load
function handleImageLoad(imgElement) {
    const placeholder = imgElement.parentElement.querySelector('.skin-image-placeholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    imgElement.style.display = 'block';
    imgElement.style.opacity = '1';
    imgElement.classList.add('loaded');
}

// Handle image load error with fallback chain
function handleImageError(imgElement) {
    const fallbackUrls = JSON.parse(imgElement.getAttribute('data-fallback-urls') || '[]');
    
    if (fallbackUrls.length > 0) {
        // Try next fallback URL
        const nextUrl = fallbackUrls.shift();
        imgElement.setAttribute('data-fallback-urls', JSON.stringify(fallbackUrls));
        imgElement.src = nextUrl;
    } else {
        // All fallbacks failed, show placeholder
        imgElement.style.display = 'none';
        const placeholder = imgElement.parentElement.querySelector('.skin-image-placeholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
    }
}

// Get weapon data from skin name
function getWeaponDataFromName(skinName = '') {
    const name = skinName.toLowerCase();
    
    // Define weapon types and their styling
    const weaponTypes = {
        phantom: { icon: 'fas fa-crosshairs', color: '#ff4655', type: 'Phantom' },
        vandal: { icon: 'fas fa-fire', color: '#389df1', type: 'Vandal' },
        operator: { icon: 'fas fa-crosshairs', color: '#ff9500', type: 'Operator' },
        marshal: { icon: 'fas fa-bullseye', color: '#00ff88', type: 'Marshal' },
        knife: { icon: 'fas fa-cut', color: '#ff0066', type: 'Melee' },
        karambit: { icon: 'fas fa-cut', color: '#ff0066', type: 'Karambit' },
        butterfly: { icon: 'fas fa-cut', color: '#ff0066', type: 'Butterfly' },
        sheriff: { icon: 'fas fa-crosshairs', color: '#ffaa00', type: 'Sheriff' },
        guardian: { icon: 'fas fa-bullseye', color: '#00aaff', type: 'Guardian' },
        classic: { icon: 'fas fa-crosshairs', color: '#888888', type: 'Classic' },
        shorty: { icon: 'fas fa-crosshairs', color: '#ff6b6b', type: 'Shorty' },
        frenzy: { icon: 'fas fa-crosshairs', color: '#4ecdc4', type: 'Frenzy' },
        ghost: { icon: 'fas fa-crosshairs', color: '#a8e6cf', type: 'Ghost' },
        spectre: { icon: 'fas fa-crosshairs', color: '#c7ceea', type: 'Spectre' },
        bucky: { icon: 'fas fa-crosshairs', color: '#ffd3a5', type: 'Bucky' },
        judge: { icon: 'fas fa-crosshairs', color: '#fd9853', type: 'Judge' },
        bulldog: { icon: 'fas fa-fire', color: '#ee9ca7', type: 'Bulldog' },
        ares: { icon: 'fas fa-fire', color: '#ffeaa7', type: 'Ares' },
        odin: { icon: 'fas fa-fire', color: '#fab1a0', type: 'Odin' }
    };

    // Find matching weapon type
    for (const [key, data] of Object.entries(weaponTypes)) {
        if (name.includes(key)) {
            return data;
        }
    }

    // Default fallback
    return { icon: 'fas fa-crosshairs', color: '#666666', type: 'Weapon' };
}

// Get rarity data from price
function getRarityFromPrice(price) {
    if (price >= 2175) {
        return { name: 'Legendary', color: '#ffaa00', tier: 4 };
    } else if (price >= 1775) {
        return { name: 'Epic', color: '#aa00ff', tier: 3 };
    } else if (price >= 1275) {
        return { name: 'Rare', color: '#0088ff', tier: 2 };
    } else if (price >= 875) {
        return { name: 'Uncommon', color: '#00ff88', tier: 1 };
    } else {
        return { name: 'Common', color: '#888888', tier: 0 };
    }
}

// Initialize image handlers on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS for image loading animations if not already present
    if (!document.getElementById('skin-image-styles')) {
        const style = document.createElement('style');
        style.id = 'skin-image-styles';
        style.textContent = `
            .skin-image {
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .skin-image.loaded {
                opacity: 1;
            }
            
            .skin-image-placeholder {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
                border: 2px dashed rgba(255,255,255,0.2);
                border-radius: 8px;
                position: relative;
                overflow: hidden;
            }
            
            .weapon-icon-container {
                position: relative;
                z-index: 2;
            }
            
            .weapon-icon {
                font-size: 2rem;
                margin-bottom: 0.5rem;
            }
            
            .weapon-type-label {
                font-size: 0.8rem;
                color: rgba(255,255,255,0.7);
                text-align: center;
                margin-top: 0.5rem;
            }
            
            .placeholder-animation {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1;
            }
            
            .pulse-ring {
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                height: 60px;
                width: 60px;
                position: absolute;
                animation: pulse 2s infinite;
            }
            
            .pulse-ring.delayed {
                animation-delay: 1s;
            }
            
            @keyframes pulse {
                0% {
                    transform: scale(0.5);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.2);
                    opacity: 0.3;
                }
                100% {
                    transform: scale(1.5);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
});

// Export functions for use in other scripts
window.SkinImageHandler = {
    generateSkinImageHTML,
    generatePlaceholderHTML,
    handleImageLoad,
    handleImageError,
    getWeaponDataFromName,
    getRarityFromPrice
};
