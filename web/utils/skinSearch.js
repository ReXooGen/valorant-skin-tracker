// Web utility functions for skin search and auto-correct
const axios = require('axios');

// Calculate Levenshtein distance for string similarity
function calculateLevenshteinDistance(str1, str2) {
    const matrix = [];
    
    // Create empty matrix
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// Calculate similarity percentage
function calculateSimilarity(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 100;
    
    const distance = calculateLevenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return ((maxLength - distance) / maxLength) * 100;
}

// Search skins with auto-correct functionality
async function searchSkinsWithAutoCorrect(searchTerm) {
    try {
        console.log(`🔍 Web search for skins: "${searchTerm}"`);
        
        // Get all weapon skins from API
        const response = await axios.get("https://valorant-api.com/v1/weapons/skins");
        const allSkins = response.data.data;
        
        // Filter out default skins
        const validSkins = allSkins.filter(skin => skin.themeUuid && skin.displayName);
        
        const normalizedSearch = searchTerm.toLowerCase().trim();
        const results = [];
        
        // Find matches with different priority levels
        validSkins.forEach(skin => {
            const skinName = skin.displayName.toLowerCase();
            const similarity = calculateSimilarity(normalizedSearch, skinName);
            
            let matchType = 'none';
            let priority = 0;
            
            // Exact match
            if (skinName === normalizedSearch) {
                matchType = 'exact';
                priority = 100;
            }
            // Starts with search term
            else if (skinName.startsWith(normalizedSearch)) {
                matchType = 'starts_with';
                priority = 90;
            }
            // Contains search term
            else if (skinName.includes(normalizedSearch)) {
                matchType = 'contains';
                priority = 80;
            }
            // High similarity (fuzzy match)
            else if (similarity >= 70) {
                matchType = 'similar';
                priority = similarity;
            }
            // Word match (any word in skin name matches any word in search)
            else {
                const searchWords = normalizedSearch.split(' ');
                const skinWords = skinName.split(' ');
                
                let wordMatches = 0;
                searchWords.forEach(searchWord => {
                    skinWords.forEach(skinWord => {
                        if (skinWord.includes(searchWord) || searchWord.includes(skinWord)) {
                            wordMatches++;
                        }
                    });
                });
                
                if (wordMatches > 0) {
                    matchType = 'word_match';
                    priority = 50 + (wordMatches * 10);
                }
            }
            
            if (matchType !== 'none') {
                results.push({
                    ...skin,
                    matchType,
                    priority,
                    similarity: Math.round(similarity)
                });
            }
        });
        
        // Sort by priority (higher first)
        results.sort((a, b) => b.priority - a.priority);
        
        console.log(`✅ Found ${results.length} matching skins`);
        return results.slice(0, 20); // Return top 20 matches
        
    } catch (error) {
        console.error('❌ Error searching skins:', error);
        return [];
    }
}

// Get suggestions for auto-correct
function getSkinSuggestions(searchTerm, allSkins, maxSuggestions = 5) {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const suggestions = [];
    
    allSkins.forEach(skin => {
        if (!skin.themeUuid || !skin.displayName) return;
        
        const skinName = skin.displayName.toLowerCase();
        const similarity = calculateSimilarity(normalizedSearch, skinName);
        
        if (similarity >= 50) { // Only suggest if similarity is 50% or higher
            suggestions.push({
                name: skin.displayName,
                uuid: skin.uuid,
                similarity: Math.round(similarity)
            });
        }
    });
    
    // Sort by similarity and return top suggestions
    return suggestions
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxSuggestions);
}

// Validate skin name and provide suggestions
async function validateSkinName(skinName) {
    try {
        const response = await axios.get("https://valorant-api.com/v1/weapons/skins");
        const allSkins = response.data.data.filter(skin => skin.themeUuid);
        
        // Check for exact match
        const exactMatch = allSkins.find(skin => 
            skin.displayName.toLowerCase() === skinName.toLowerCase()
        );
        
        if (exactMatch) {
            return {
                isValid: true,
                exactMatch: exactMatch,
                suggestions: []
            };
        }
        
        // Get suggestions for correction
        const suggestions = getSkinSuggestions(skinName, allSkins);
        
        return {
            isValid: false,
            exactMatch: null,
            suggestions: suggestions
        };
        
    } catch (error) {
        console.error('Error validating skin name:', error);
        return {
            isValid: false,
            exactMatch: null,
            suggestions: []
        };
    }
}

// Get skin details by UUID
async function getSkinByUUID(uuid) {
    try {
        const response = await axios.get(`https://valorant-api.com/v1/weapons/skins/${uuid}`);
        return response.data.data;
    } catch (error) {
        console.error('Error getting skin by UUID:', error);
        return null;
    }
}

// Get multiple skin details by UUIDs
async function getSkinsByUUIDs(uuids) {
    try {
        const promises = uuids.map(uuid => getSkinByUUID(uuid));
        const results = await Promise.all(promises);
        return results.filter(skin => skin !== null);
    } catch (error) {
        console.error('Error getting skins by UUIDs:', error);
        return [];
    }
}

module.exports = {
    searchSkinsWithAutoCorrect,
    validateSkinName,
    getSkinSuggestions,
    getSkinByUUID,
    getSkinsByUUIDs,
    calculateSimilarity,
    calculateLevenshteinDistance
};
