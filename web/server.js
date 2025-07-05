const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const apiRoutes = require('./routes/api');
const analyticsRoutes = require('./routes/analytics');

// Import services
const DatabaseService = require('../database/service');
const AnalyticsService = require('../analytics/service');
const I18nService = require('../utils/i18n');

class WebServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: process.env.WEB_CORS_ORIGIN || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        this.port = process.env.WEB_PORT || 3000;
        this.db = new DatabaseService();
        this.analytics = new AnalyticsService();
        this.i18n = new I18nService();
    }

    async initialize() {
        // Initialize database
        await this.db.initialize();
        
        // Initialize i18n
        await this.i18n.initialize();
        
        // Setup middleware
        this.setupMiddleware();
        
        // Setup routes
        this.setupRoutes();
        
        // Setup socket handlers
        this.setupSocketHandlers();
        
        // Setup error handlers
        this.setupErrorHandlers();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
                    imgSrc: ["'self'", "data:", "https:", "https://media.valorant-api.com"],
                    fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
                    connectSrc: ["'self'", "ws:", "wss:"]
                }
            }
        }));

        // Compression
        this.app.use(compression());

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later.'
        });
        this.app.use('/api/', limiter);

        // CORS
        this.app.use(cors({
            origin: process.env.WEB_CORS_ORIGIN || "http://localhost:3000",
            credentials: true
        }));

        // Body parsing
        this.app.use(bodyParser.json({ limit: '10mb' }));
        this.app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

        // Session management
        this.app.use(session({
            secret: process.env.SESSION_SECRET || 'valorant-skin-tracker-secret',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        }));

        // Static files
        this.app.use(express.static(path.join(__dirname, 'public')));

        // View engine setup
        this.app.set('views', path.join(__dirname, 'views'));
        this.app.set('view engine', 'ejs');
        this.app.use(expressLayouts);
        this.app.set('layout', 'layout');
        this.app.set("layout extractScripts", true);
        this.app.set("layout extractStyles", true);
        
        // Configure layout to be disabled for error pages
        this.app.set("layout extractMetas", true);
        this.app.locals.renderWithoutLayout = (res, view, options) => {
            const originalLayout = res.app.locals.layout;
            res.app.locals.layout = false;
            res.render(view, options, (err, html) => {
                res.app.locals.layout = originalLayout;
                if (err) {
                    return res.send('Error rendering: ' + err);
                }
                res.send(html);
            });
        };

        // Make services available to routes
        this.app.locals.db = this.db;
        this.app.locals.analytics = this.analytics;
        this.app.locals.i18n = this.i18n;
        this.app.locals.io = this.io;
        
        // Make i18n t function available to all views
        this.app.use((req, res, next) => {
            const lang = req.session?.language || 'en';
            res.locals.t = (key, options) => this.i18n.t(key, lang, options);
            res.locals.lang = lang;
            next();
        });
    }

    setupRoutes() {
        // Main dashboard route - redirect to dashboard
        this.app.get('/', (req, res) => {
            if (req.session.user) {
                res.redirect('/dashboard');
            } else {
                res.redirect('/auth/login');
            }
        });

        // Authentication routes
        this.app.use('/auth', authRoutes);

        // Dashboard routes
        this.app.use('/dashboard', dashboardRoutes);

        // API routes
        this.app.use('/api', apiRoutes);

        // Analytics routes
        this.app.use('/analytics', analyticsRoutes);

        // Language switching
        this.app.get('/lang/:language', (req, res) => {
            const { language } = req.params;
            if (['en', 'id'].includes(language)) {
                req.session.language = language;
            }
            res.redirect(req.get('Referer') || '/');
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 User connected: ${socket.id}`);

            socket.on('join-room', (userId) => {
                socket.join(`user-${userId}`);
                console.log(`👤 User ${userId} joined their room`);
            });

            socket.on('disconnect', () => {
                console.log(`🔌 User disconnected: ${socket.id}`);
            });
        });
    }

    setupErrorHandlers() {
        // 404 handler
        this.app.use((req, res) => {
            const lang = req.session.language || 'en';
            this.app.locals.renderWithoutLayout(res, '404', { 
                title: this.i18n.t('error.404.title', lang),
                message: this.i18n.t('error.404.message', lang),
                lang: lang
            });
        });

        // Error handler
        this.app.use((err, req, res, next) => {
            console.error('🚨 Web server error:', err);
            const lang = req.session.language || 'en';
            this.app.locals.renderWithoutLayout(res, 'error', { 
                title: this.i18n.t('error.500.title', lang),
                message: process.env.NODE_ENV === 'production' 
                    ? this.i18n.t('error.500.message', lang)
                    : err.message,
                lang: lang
            });
        });
    }

    async start() {
        await this.initialize();
        
        this.server.listen(this.port, () => {
            console.log(`🌐 Web dashboard running on http://localhost:${this.port}`);
            console.log(`📊 Analytics dashboard: http://localhost:${this.port}/analytics`);
            console.log(`🔧 API endpoints: http://localhost:${this.port}/api`);
        });
    }

    // Method to broadcast real-time updates
    broadcastUpdate(userId, type, data) {
        this.io.to(`user-${userId}`).emit(type, data);
    }

    // Method to broadcast to all users
    broadcastGlobal(type, data) {
        this.io.emit(type, data);
    }
}

// Start server if this file is run directly
if (require.main === module) {
    const server = new WebServer();
    server.start().catch(console.error);
}

module.exports = WebServer;
