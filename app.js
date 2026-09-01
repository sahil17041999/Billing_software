require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const cors = require("cors");
const compression = require("compression");

const { sequelize, pool, testConnection } = require("./config/database");
const { setupAssociations, seedSubscriptionPlans } = require("./models");
const { attachUser, requirePlanFeature, errorHandler } = require("./middleware/auth");
const { sqlInjectionGuard, securityHeaders, sanitizeInputs } = require("./middleware/security");

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE SETUP
// ============================================

// High Performance Gzip/Deflate Compression
app.use(compression({
  threshold: 512, // Compress any response over 512 bytes
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Enterprise HTTP Security Headers (X-Frame-Options, XSS, nosniff)
app.use(securityHeaders);

// CORS
app.use(cors());

// Body Parser & Input Sanitization
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInputs);

// SQL Injection Detection and Firewall Guard
app.use(sqlInjectionGuard);

// Session Management
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'grocery_billing',
  checkExpirationInterval: 900000, // 15 minutes
  expiration: 86400000 // 24 hours
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Attach user to request
app.use(attachUser);

// EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
if (process.env.NODE_ENV === 'production') {
  app.enable('view cache');
}

// Static files with Cache-Control headers and ETag
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// ============================================
// DATABASE INITIALIZATION
// ============================================

const initializeApp = async () => {
  try {
    // Test database connection
    await testConnection();

    // Setup model associations
    setupAssociations();

    // Sync database models
    await sequelize.sync({ alter: false });
    console.log("✓ Database models synchronized");

    // Ensure default subscription plans exist
    if (typeof seedSubscriptionPlans === 'function') {
      await seedSubscriptionPlans();
    }

  } catch (error) {
    console.error("✗ Failed to initialize database:", error.message);
    process.exit(1);
  }
};

// ============================================
// ROUTES
// ============================================

// Import all routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const masterRoutes = require('./routes/master');
const purchaseRoutes = require('./routes/purchase');
const salesRoutes = require('./routes/sales');
const returnsRoutes = require('./routes/returns');
const expensesRoutes = require('./routes/expenses');
const dayendRoutes = require('./routes/dayend');
const inventoryRoutes = require('./routes/inventory');
const ledgerRoutes = require('./routes/ledger');
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const subscriptionRoutes = require('./routes/subscription');
const notificationRoutes = require('./routes/notification');
const subscriberRoutes = require('./routes/subscriber');

// Favicon handler
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "assets", "images", "logos", "favicon.png"));
});

// Home route
app.get("/", (req, res) => {
  if (req.session.userId) {
    if (req.session.role === 'cashier') {
      return res.redirect('/admin/sales/pos');
    }
    if (req.session.companyId > 1) {
      return res.redirect('/subscriber/dashboard');
    }
    return res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/login');
  }
});

// Public B2C Subscription & Pricing Storefront
app.get("/pricing", (req, res) => require('./controllers/subscription').getPublicPricing(req, res));
app.get("/plans", (req, res) => res.redirect('/pricing'));
app.post("/api/subscriptions/order", (req, res) => require('./controllers/subscription').orderSubscription(req, res));

// ============================================
// STRICT BI-DIRECTIONAL PANEL ISOLATION GUARDS
// ============================================
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();

  const currentPath = req.path;

  // 1. If Store Subscriber (companyId > 1) is logged in:
  if (req.session && req.session.userId && req.session.companyId > 1) {
    // If subscriber visits admin login, redirect to store dashboard
    if (currentPath === '/admin/login' || currentPath === '/login' || currentPath === '/auth/login') {
      return res.redirect('/subscriber/dashboard');
    }
    // If subscriber accesses admin dashboard
    if (currentPath === '/admin' || currentPath === '/admin/' || currentPath === '/admin/dashboard' || currentPath === '/admin/dashboard/') {
      return res.redirect('/subscriber/dashboard');
    }
    // Subscriptions management page for subscribers points to their dashboard plan section
    if (currentPath === '/admin/subscription' || currentPath === '/admin/subscription/') {
      return res.redirect('/subscriber/dashboard#my-plan-section');
    }
    // Allow admin-only plans management to reach isSuperAdmin middleware for proper 403 handling
    if (currentPath.startsWith('/admin/subscription/plans')) {
      return next();
    }
    // If subscriber accesses operational modules under /admin/..., redirect to /subscriber/...
    if (currentPath.startsWith('/admin/')) {
      if (currentPath === '/admin/logout' || currentPath.startsWith('/admin/api')) {
        return next();
      }
      const subscriberUrl = req.originalUrl.replace(/^\/admin/, '/subscriber');
      return res.redirect(subscriberUrl);
    }
  }

  // 2. If Platform Founder / Super Admin (companyId === 1 or isSuperAdmin) is logged in:
  if (req.session && req.session.userId && (req.session.companyId === 1 || req.isSuperAdmin)) {
    // If admin visits subscriber login, redirect to admin dashboard
    if (currentPath === '/subscriber/login' || currentPath === '/portal/login') {
      return res.redirect('/admin/dashboard');
    }
    // If admin visits subscriber dashboard, invoices, or profile, redirect to admin dashboard
    if (currentPath === '/subscriber' || currentPath === '/subscriber/' || currentPath === '/subscriber/dashboard' || currentPath === '/subscriber/invoices' || currentPath === '/subscriber/profile') {
      return res.redirect('/admin/dashboard');
    }
    // If admin visits operational modules on /subscriber/..., redirect back to /admin/...
    if (currentPath.startsWith('/subscriber/')) {
      if (currentPath === '/subscriber/logout') {
        return next();
      }
      const adminUrl = req.originalUrl.replace(/^\/subscriber/, '/admin');
      return res.redirect(adminUrl);
    }
  }

  next();
});

// Authentication routes
app.use("/", authRoutes);
app.use("/admin", authRoutes);

// Dashboard routes
app.use("/admin/dashboard", dashboardRoutes);

// Master setup routes
app.use("/admin/master", masterRoutes);
app.use("/subscriber/master", masterRoutes);

// Purchase management routes
app.use("/admin/purchases", purchaseRoutes);
app.use("/subscriber/purchases", purchaseRoutes);

// Sales/POS routes
app.use("/admin/sales", salesRoutes);
app.use("/sales", salesRoutes);
app.use("/subscriber/sales", salesRoutes);

// Returns management routes
app.use("/admin/returns", returnsRoutes);
app.use("/subscriber/returns", returnsRoutes);

// Expenses routes
app.use("/admin/expenses", expensesRoutes);
app.use("/subscriber/expenses", expensesRoutes);

// Day end closing routes (requires plan feature 'dayend')
app.use("/admin/day-end", requirePlanFeature('dayend'), dayendRoutes);
app.use("/subscriber/day-end", requirePlanFeature('dayend'), dayendRoutes);

// Inventory management routes
app.use("/admin/inventory", inventoryRoutes);
app.use("/subscriber/inventory", inventoryRoutes);

// Ledger routes (requires plan feature 'ledger')
app.use("/admin/ledger", requirePlanFeature('ledger'), ledgerRoutes);
app.use("/subscriber/ledger", requirePlanFeature('ledger'), ledgerRoutes);

// Reports routes (requires plan feature 'reports')
app.use("/admin/reports", requirePlanFeature('reports'), reportsRoutes);
app.use("/subscriber/reports", requirePlanFeature('reports'), reportsRoutes);

// User management & profile routes
app.use("/admin/users", usersRoutes);
app.use("/subscriber/users", usersRoutes);

// System & SMTP Settings routes (requires plan feature 'smtp')
app.use("/admin/settings", requirePlanFeature('smtp'), settingsRoutes);
app.use("/subscriber/settings", requirePlanFeature('smtp'), settingsRoutes);

// Subscription & Licensing routes
app.use("/admin/subscription", subscriptionRoutes);

// Subscriber Store Owner Management Panel & Login routes
app.use("/subscriber", subscriberRoutes);
app.use("/portal", subscriberRoutes);

// Notification routes
app.use("/api/notifications", notificationRoutes);
app.get("/admin/notifications", require('./controllers/notification').getNotificationsPage);
app.get("/subscriber/notifications", require('./controllers/notification').getNotificationsPage);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Grocery Billing Software is running",
    timestamp: new Date()
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).render('error', { error: 'Route not found' });
});

app.use(errorHandler);

// ============================================
// SERVER START
// ============================================

const startServer = async () => {
  try {
    await initializeApp();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n====================================================`);
      console.log(`🚀 GROCERY POS & BILLING ERP WEB APP ACTIVE`);
      console.log(`====================================================`);
      console.log(`✓ Local Web Access:    http://localhost:${PORT}`);
      console.log(`✓ Network/LAN Access:  http://0.0.0.0:${PORT} (or your local IP)`);
      console.log(`✓ PWA Manifest:        http://localhost:${PORT}/manifest.json`);
      console.log(`✓ Environment:         ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Database:            ${process.env.DB_NAME}`);
      console.log(`====================================================\n`);
    });
  } catch (error) {
    console.error("✗ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\nShutting down gracefully...");
  await sequelize.close();
  process.exit(0);
});