const fs = require('fs');
const path = require('path');

class I18nService {
    constructor() {
        this.translations = {};
        this.defaultLanguage = 'en';
        this.supportedLanguages = ['en', 'id'];
        this.localesPath = path.join(__dirname, '..', 'locales');
    }

    async initialize() {
        // Ensure locales directory exists
        if (!fs.existsSync(this.localesPath)) {
            fs.mkdirSync(this.localesPath, { recursive: true });
        }

        // Load translations for each supported language
        for (const lang of this.supportedLanguages) {
            await this.loadLanguage(lang);
        }

        console.log('✅ I18n service initialized with languages:', this.supportedLanguages.join(', '));
    }

    async loadLanguage(language) {
        const langFile = path.join(this.localesPath, `${language}.json`);
        
        if (fs.existsSync(langFile)) {
            try {
                const content = fs.readFileSync(langFile, 'utf8');
                this.translations[language] = JSON.parse(content);
            } catch (error) {
                console.error(`❌ Error loading ${language} translations:`, error);
                this.translations[language] = {};
            }
        } else {
            // Create default translation file if it doesn't exist
            this.translations[language] = this.getDefaultTranslations(language);
            await this.saveLanguage(language);
        }
    }

    async saveLanguage(language) {
        const langFile = path.join(this.localesPath, `${language}.json`);
        try {
            fs.writeFileSync(langFile, JSON.stringify(this.translations[language], null, 2), 'utf8');
        } catch (error) {
            console.error(`❌ Error saving ${language} translations:`, error);
        }
    }

    getDefaultTranslations(language) {
        if (language === 'id') {
            return {
                "common": {
                    "yes": "Ya",
                    "no": "Tidak",
                    "cancel": "Batal",
                    "confirm": "Konfirmasi",
                    "save": "Simpan",
                    "delete": "Hapus",
                    "edit": "Edit",
                    "loading": "Memuat...",
                    "error": "Terjadi kesalahan",
                    "success": "Berhasil",
                    "warning": "Peringatan",
                    "info": "Informasi"
                },
                "dashboard": {
                    "title": "Dashboard Valorant Skin Tracker",
                    "welcome": "Selamat datang di Valorant Skin Tracker",
                    "description": "Kelola skin wishlist dan lacak harga skin Valorant Anda",
                    "menu": {
                        "dashboard": "Dashboard",
                        "store": "Toko",
                        "wishlist": "Wishlist",
                        "analytics": "Analitik",
                        "settings": "Pengaturan",
                        "logout": "Keluar"
                    }
                },
                "store": {
                    "title": "Toko Harian",
                    "refresh": "Refresh Toko",
                    "lastUpdated": "Terakhir diperbarui",
                    "addToWishlist": "Tambah ke Wishlist",
                    "removeFromWishlist": "Hapus dari Wishlist",
                    "price": "Harga",
                    "currency": "VP",
                    "noSkins": "Tidak ada skin tersedia",
                    "error": "Gagal memuat toko"
                },
                "wishlist": {
                    "title": "Wishlist Saya",
                    "empty": "Wishlist kosong",
                    "addSkin": "Tambah Skin",
                    "removeSkin": "Hapus Skin",
                    "priority": "Prioritas",
                    "priceAlert": "Alert Harga",
                    "inStore": "Tersedia di Toko!",
                    "notInStore": "Tidak tersedia"
                },
                "analytics": {
                    "title": "Analitik",
                    "overview": "Ringkasan",
                    "priceHistory": "Riwayat Harga",
                    "storeHistory": "Riwayat Toko",
                    "trends": "Tren",
                    "totalSkins": "Total Skin",
                    "averagePrice": "Harga Rata-rata",
                    "mostExpensive": "Termahal",
                    "cheapest": "Termurah"
                },
                "auth": {
                    "login": "Masuk",
                    "logout": "Keluar",
                    "register": "Daftar",
                    "username": "Nama Pengguna",
                    "password": "Kata Sandi",
                    "email": "Email",
                    "discordId": "Discord ID",
                    "loginSuccess": "Berhasil masuk",
                    "loginError": "Gagal masuk",
                    "registerSuccess": "Berhasil mendaftar",
                    "registerError": "Gagal mendaftar"
                },
                "settings": {
                    "title": "Pengaturan",
                    "language": "Bahasa",
                    "notifications": "Notifikasi",
                    "tokenManagement": "Manajemen Token",
                    "dataExport": "Ekspor Data",
                    "dangerZone": "Zona Bahaya",
                    "deleteAccount": "Hapus Akun"
                },
                "notifications": {
                    "skinInStore": "Skin dalam wishlist tersedia di toko!",
                    "priceAlert": "Alert harga untuk skin",
                    "newBundle": "Bundle baru tersedia",
                    "tokenExpiring": "Token akan kadaluarsa"
                },
                "error": {
                    "404": {
                        "title": "Halaman Tidak Ditemukan",
                        "message": "Halaman yang Anda cari tidak ada."
                    },
                    "500": {
                        "title": "Kesalahan Server",
                        "message": "Terjadi kesalahan internal server."
                    },
                    "unauthorized": "Tidak diizinkan",
                    "forbidden": "Dilarang",
                    "tokenExpired": "Token telah kadaluarsa",
                    "invalidToken": "Token tidak valid"
                }
            };
        } else {
            // English (default)
            return {
                "common": {
                    "yes": "Yes",
                    "no": "No",
                    "cancel": "Cancel",
                    "confirm": "Confirm",
                    "save": "Save",
                    "delete": "Delete",
                    "edit": "Edit",
                    "loading": "Loading...",
                    "error": "An error occurred",
                    "success": "Success",
                    "warning": "Warning",
                    "info": "Information"
                },
                "dashboard": {
                    "title": "Valorant Skin Tracker Dashboard",
                    "welcome": "Welcome to Valorant Skin Tracker",
                    "description": "Manage your Valorant skin wishlist and track skin prices",
                    "menu": {
                        "dashboard": "Dashboard",
                        "store": "Store",
                        "wishlist": "Wishlist",
                        "analytics": "Analytics",
                        "settings": "Settings",
                        "logout": "Logout"
                    }
                },
                "store": {
                    "title": "Daily Store",
                    "refresh": "Refresh Store",
                    "lastUpdated": "Last updated",
                    "addToWishlist": "Add to Wishlist",
                    "removeFromWishlist": "Remove from Wishlist",
                    "price": "Price",
                    "currency": "VP",
                    "noSkins": "No skins available",
                    "error": "Failed to load store"
                },
                "wishlist": {
                    "title": "My Wishlist",
                    "empty": "Wishlist is empty",
                    "addSkin": "Add Skin",
                    "removeSkin": "Remove Skin",
                    "priority": "Priority",
                    "priceAlert": "Price Alert",
                    "inStore": "Available in Store!",
                    "notInStore": "Not available"
                },
                "analytics": {
                    "title": "Analytics",
                    "overview": "Overview",
                    "priceHistory": "Price History",
                    "storeHistory": "Store History",
                    "trends": "Trends",
                    "totalSkins": "Total Skins",
                    "averagePrice": "Average Price",
                    "mostExpensive": "Most Expensive",
                    "cheapest": "Cheapest"
                },
                "auth": {
                    "login": "Login",
                    "logout": "Logout",
                    "register": "Register",
                    "username": "Username",
                    "password": "Password",
                    "email": "Email",
                    "discordId": "Discord ID",
                    "loginSuccess": "Login successful",
                    "loginError": "Login failed",
                    "registerSuccess": "Registration successful",
                    "registerError": "Registration failed"
                },
                "settings": {
                    "title": "Settings",
                    "language": "Language",
                    "notifications": "Notifications",
                    "tokenManagement": "Token Management",
                    "dataExport": "Data Export",
                    "dangerZone": "Danger Zone",
                    "deleteAccount": "Delete Account"
                },
                "notifications": {
                    "skinInStore": "Wishlist skin is available in store!",
                    "priceAlert": "Price alert for skin",
                    "newBundle": "New bundle available",
                    "tokenExpiring": "Token expiring soon"
                },
                "error": {
                    "404": {
                        "title": "Page Not Found",
                        "message": "The page you are looking for does not exist."
                    },
                    "500": {
                        "title": "Server Error",
                        "message": "An internal server error occurred."
                    },
                    "unauthorized": "Unauthorized",
                    "forbidden": "Forbidden",
                    "tokenExpired": "Token has expired",
                    "invalidToken": "Invalid token"
                }
            };
        }
    }

    // Get translated text with nested key support (e.g., 'dashboard.title')
    t(key, language = null, params = {}) {
        const lang = language || this.defaultLanguage;
        const translations = this.translations[lang] || this.translations[this.defaultLanguage] || {};
        
        // Support nested keys
        const keys = key.split('.');
        let value = translations;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to English if key not found
                value = this.getNestedValue(this.translations[this.defaultLanguage], key);
                break;
            }
        }
        
        // If still not found, return the key itself
        if (typeof value !== 'string') {
            value = key;
        }
        
        // Replace parameters in the string
        return this.replaceParams(value, params);
    }

    getNestedValue(obj, key) {
        const keys = key.split('.');
        let value = obj;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Return original key if not found
            }
        }
        
        return value;
    }

    replaceParams(text, params) {
        if (typeof text !== 'string' || !params || typeof params !== 'object') {
            return text;
        }
        
        return text.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
            return params[paramName] !== undefined ? params[paramName] : match;
        });
    }

    // Get all available languages
    getAvailableLanguages() {
        return this.supportedLanguages.map(lang => ({
            code: lang,
            name: this.getLanguageName(lang),
            native: this.getLanguageNativeName(lang)
        }));
    }

    getLanguageName(code) {
        const names = {
            'en': 'English',
            'id': 'Indonesian'
        };
        return names[code] || code;
    }

    getLanguageNativeName(code) {
        const names = {
            'en': 'English',
            'id': 'Bahasa Indonesia'
        };
        return names[code] || code;
    }

    // Add or update translation
    setTranslation(language, key, value) {
        if (!this.translations[language]) {
            this.translations[language] = {};
        }

        const keys = key.split('.');
        let obj = this.translations[language];

        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!obj[k] || typeof obj[k] !== 'object') {
                obj[k] = {};
            }
            obj = obj[k];
        }

        obj[keys[keys.length - 1]] = value;
        this.saveLanguage(language);
    }

    // Express middleware for request localization
    middleware() {
        return (req, res, next) => {
            // Determine language from query, session, or headers
            const lang = req.query.lang || 
                         req.session.language || 
                         req.get('Accept-Language')?.split(',')[0]?.substring(0, 2) || 
                         this.defaultLanguage;

            req.language = this.supportedLanguages.includes(lang) ? lang : this.defaultLanguage;
            req.session.language = req.language;

            // Add translation function to request
            req.t = (key, params = {}) => this.t(key, req.language, params);

            // Add translation function to response locals
            res.locals.t = req.t;
            res.locals.language = req.language;
            res.locals.availableLanguages = this.getAvailableLanguages();

            next();
        };
    }
}

module.exports = I18nService;
