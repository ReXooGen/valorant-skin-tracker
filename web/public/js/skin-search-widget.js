// Auto-correct and Skin Search UI Component
// Provides search functionality with auto-suggestions like Discord bot

class SkinSearchWidget {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.options = {
            minLength: 2,
            maxResults: 8,
            showImages: true,
            allowAddToWishlist: true,
            placeholder: 'Search for skins...',
            ...options
        };
        
        this.resultsContainer = null;
        this.currentQuery = '';
        this.searchTimeout = null;
        this.selectedIndex = -1;
        
        this.init();
    }
    
    init() {
        this.input.placeholder = this.options.placeholder;
        this.createResultsContainer();
        this.bindEvents();
    }
    
    createResultsContainer() {
        this.resultsContainer = document.createElement('div');
        this.resultsContainer.className = 'skin-search-results';
        this.resultsContainer.style.display = 'none';
        
        // Insert after input element
        this.input.parentNode.insertBefore(this.resultsContainer, this.input.nextSibling);
        
        // Add CSS if not already present
        this.addStyles();
    }
    
    bindEvents() {
        // Input events
        this.input.addEventListener('input', (e) => this.handleInput(e));
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.input.addEventListener('focus', () => this.handleFocus());
        this.input.addEventListener('blur', (e) => this.handleBlur(e));
        
        // Close results when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.resultsContainer.contains(e.target)) {
                this.hideResults();
            }
        });
    }
    
    handleInput(e) {
        const query = e.target.value.trim();
        this.currentQuery = query;
        
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        if (query.length < this.options.minLength) {
            this.hideResults();
            return;
        }
        
        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }
    
    handleKeydown(e) {
        if (!this.resultsContainer.style.display || this.resultsContainer.style.display === 'none') {
            return;
        }
        
        const items = this.resultsContainer.querySelectorAll('.search-result-item');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelection(items);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection(items);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    items[this.selectedIndex].click();
                }
                break;
                
            case 'Escape':
                this.hideResults();
                this.input.blur();
                break;
        }
    }
    
    handleFocus() {
        if (this.currentQuery.length >= this.options.minLength) {
            this.showResults();
        }
    }
    
    handleBlur(e) {
        // Delay hiding to allow clicking on results
        setTimeout(() => {
            if (!this.resultsContainer.contains(document.activeElement)) {
                this.hideResults();
            }
        }, 150);
    }
    
    async performSearch(query) {
        try {
            const response = await fetch(`/api/skins/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.success && data.results) {
                this.displayResults(data.results, query);
            } else {
                this.displayNoResults(query);
            }
        } catch (error) {
            console.error('Search error:', error);
            this.displayError('Search failed. Please try again.');
        }
    }
    
    displayResults(results, query) {
        const limitedResults = results.slice(0, this.options.maxResults);
        
        let html = '';
        
        if (limitedResults.length === 0) {
            html = '<div class="search-no-results">No skins found</div>';
        } else {
            html = limitedResults.map((skin, index) => {
                const weaponData = window.SkinImageHandler ? 
                    window.SkinImageHandler.getWeaponDataFromName(skin.displayName) :
                    { icon: 'fas fa-crosshairs', color: '#666', type: 'Weapon' };
                
                return `
                    <div class="search-result-item" data-index="${index}" data-skin-uuid="${skin.uuid}" data-skin-name="${skin.displayName}">
                        <div class="result-image">
                            ${this.options.showImages ? `
                                <img src="https://media.valorant-api.com/weaponskins/${skin.uuid}/displayicon.png" 
                                     alt="${skin.displayName}"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="result-placeholder" style="display: none;">
                                    <i class="${weaponData.icon}" style="color: ${weaponData.color};"></i>
                                </div>
                            ` : `
                                <div class="result-placeholder">
                                    <i class="${weaponData.icon}" style="color: ${weaponData.color};"></i>
                                </div>
                            `}
                        </div>
                        <div class="result-info">
                            <div class="result-name">${this.highlightMatch(skin.displayName, query)}</div>
                            <div class="result-details">
                                <span class="result-weapon">${weaponData.type}</span>
                                ${skin.matchType ? `<span class="result-match-type">${this.getMatchTypeLabel(skin.matchType)}</span>` : ''}
                            </div>
                        </div>
                        ${this.options.allowAddToWishlist ? `
                            <div class="result-actions">
                                <button class="btn btn-sm btn-outline-primary add-to-wishlist-btn" 
                                        onclick="event.stopPropagation(); addSkinToWishlistFromSearch('${skin.uuid}', '${skin.displayName}')">
                                    <i class="fas fa-heart"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
        
        this.resultsContainer.innerHTML = html;
        this.showResults();
        this.selectedIndex = -1;
        
        // Bind click events
        this.bindResultEvents();
    }
    
    displayNoResults(query) {
        this.resultsContainer.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search text-muted"></i>
                <p>No skins found for "${query}"</p>
                <small class="text-muted">Try a different search term</small>
            </div>
        `;
        this.showResults();
    }
    
    displayError(message) {
        this.resultsContainer.innerHTML = `
            <div class="search-error">
                <i class="fas fa-exclamation-triangle text-warning"></i>
                <p>${message}</p>
            </div>
        `;
        this.showResults();
    }
    
    bindResultEvents() {
        const items = this.resultsContainer.querySelectorAll('.search-result-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const skinUuid = item.dataset.skinUuid;
                const skinName = item.dataset.skinName;
                this.selectSkin(skinUuid, skinName);
            });
            
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = parseInt(item.dataset.index);
                this.updateSelection(items);
            });
        });
    }
    
    selectSkin(skinUuid, skinName) {
        this.input.value = skinName;
        this.hideResults();
        
        // Trigger custom event
        const event = new CustomEvent('skinSelected', {
            detail: { skinUuid, skinName }
        });
        this.input.dispatchEvent(event);
        
        // Call callback if provided
        if (this.options.onSelect) {
            if (typeof this.options.onSelect === 'string') {
                // If it's a string, try to call the function by name
                if (window[this.options.onSelect]) {
                    window[this.options.onSelect]({ uuid: skinUuid, displayName: skinName });
                }
            } else if (typeof this.options.onSelect === 'function') {
                // If it's a function, call it directly
                this.options.onSelect({ uuid: skinUuid, displayName: skinName });
            }
        }
    }
    
    updateSelection(items) {
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    highlightMatch(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    getMatchTypeLabel(matchType) {
        const labels = {
            exact: 'Exact',
            starts_with: 'Starts with',
            contains: 'Contains',
            similar: 'Similar'
        };
        return labels[matchType] || '';
    }
    
    showResults() {
        this.resultsContainer.style.display = 'block';
    }
    
    hideResults() {
        this.resultsContainer.style.display = 'none';
        this.selectedIndex = -1;
    }
    
    addStyles() {
        if (document.getElementById('skin-search-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'skin-search-styles';
        style.textContent = `
            .skin-search-results {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: linear-gradient(145deg, rgba(15, 15, 15, 0.98), rgba(25, 25, 25, 0.95));
                border: 1px solid rgba(255, 70, 85, 0.3);
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 70, 85, 0.1);
                max-height: 400px;
                overflow-y: auto;
                z-index: 1000;
                margin-top: 8px;
                backdrop-filter: blur(20px);
                border-top: 2px solid var(--valorant-red);
            }
            
            .skin-search-results::-webkit-scrollbar {
                width: 6px;
            }
            
            .skin-search-results::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
            }
            
            .skin-search-results::-webkit-scrollbar-thumb {
                background: var(--valorant-red);
                border-radius: 3px;
            }
            
            .search-result-item {
                display: flex;
                align-items: center;
                padding: 16px;
                cursor: pointer;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .search-result-item::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 70, 85, 0.1), transparent);
                transition: left 0.6s;
            }
            
            .search-result-item:hover::before {
                left: 100%;
            }
            
            .search-result-item:hover,
            .search-result-item.selected {
                background: linear-gradient(135deg, rgba(255, 70, 85, 0.15), rgba(56, 157, 241, 0.1));
                border-color: var(--valorant-red);
                transform: translateX(4px);
            }
            
            .search-result-item:last-child {
                border-bottom: none;
                border-radius: 0 0 16px 16px;
            }
            
            .search-result-item:first-child {
                border-radius: 16px 16px 0 0;
            }
            
            .result-image {
                width: 50px;
                height: 50px;
                margin-right: 16px;
                border-radius: 10px;
                overflow: hidden;
                background: linear-gradient(135deg, rgba(255, 70, 85, 0.2), rgba(56, 157, 241, 0.2));
                border: 2px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s ease;
            }
            
            .search-result-item:hover .result-image {
                border-color: var(--valorant-red);
                transform: scale(1.05);
            }
            
            .result-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }
            
            .search-result-item:hover .result-image img {
                transform: scale(1.1);
            }
            
            .result-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.4rem;
                background: rgba(255, 255, 255, 0.05);
            }
            
            .result-info {
                flex: 1;
                min-width: 0;
            }
            
            .result-name {
                font-weight: 700;
                margin-bottom: 6px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: 1.1rem;
                color: var(--text-primary);
            }
            
            .result-name mark {
                background: linear-gradient(135deg, var(--valorant-red), #ff6b7a);
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 800;
                box-shadow: 0 2px 4px rgba(255, 70, 85, 0.3);
            }
            
            .result-details {
                display: flex;
                gap: 12px;
                font-size: 0.9rem;
                color: rgba(255, 255, 255, 0.7);
            }
            
            .result-weapon {
                color: var(--valorant-blue);
                font-weight: 600;
            }
            
            .result-match-type {
                background: rgba(255, 255, 255, 0.1);
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 600;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .result-actions {
                margin-left: 12px;
            }
            
            .add-to-wishlist-btn {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                border: 2px solid var(--valorant-red);
                background: transparent;
                color: var(--valorant-red);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-size: 1rem;
            }
            
            .add-to-wishlist-btn:hover {
                background: var(--valorant-red);
                color: white;
                transform: scale(1.1);
                box-shadow: 0 4px 15px rgba(255, 70, 85, 0.4);
            }
            
            .search-no-results,
            .search-error {
                padding: 32px;
                text-align: center;
                color: rgba(255, 255, 255, 0.7);
            }
            
            .search-no-results i,
            .search-error i {
                font-size: 3rem;
                margin-bottom: 16px;
                display: block;
                color: var(--valorant-red);
                opacity: 0.6;
            }
            
            .search-no-results p,
            .search-error p {
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: 8px;
                color: var(--text-primary);
            }
            
            .search-no-results small {
                color: var(--text-secondary);
                font-size: 0.9rem;
            }
        `;
        document.head.appendChild(style);
    }
}

// Function to add skin to wishlist from search
async function addSkinToWishlistFromSearch(skinUuid, skinName) {
    try {
        const response = await fetch('/api/wishlist/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                skinUuid: skinUuid,
                skinName: skinName
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', result.message || `${skinName} added to wishlist!`);
        } else {
            showNotification('error', result.error || 'Failed to add to wishlist');
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        showNotification('error', 'Failed to add to wishlist');
    }
}

// Initialize search widget on elements with data-skin-search attribute
document.addEventListener('DOMContentLoaded', function() {
    const searchInputs = document.querySelectorAll('[data-skin-search]');
    searchInputs.forEach(input => {
        const options = JSON.parse(input.dataset.skinSearchOptions || '{}');
        new SkinSearchWidget(input, options);
    });
});

// Export for manual initialization
window.SkinSearchWidget = SkinSearchWidget;
