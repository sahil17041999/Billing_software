require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const cors = require("cors");
const compression = require("compression");

const { sequelize, pool, testConnection } = require("./config/database");
const { setupAssociations } = require("./models");
const { attachUser, requirePlanFeature, errorHandler } = require("./middleware/auth");

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

// CORS
app.use(cors());

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Home route
app.get("/", (req, res) => {
  if (req.session.userId) {
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/login');
  }
});

// Public B2C Subscription & Pricing Storefront
app.get("/pricing", (req, res) => require('./controllers/subscription').getPublicPricing(req, res));
app.get("/plans", (req, res) => res.redirect('/pricing'));
app.post("/api/subscriptions/order", (req, res) => require('./controllers/subscription').orderSubscription(req, res));

// Authentication routes
app.use("/", authRoutes);
app.use("/admin", authRoutes);

// Dashboard routes
app.use("/admin/dashboard", dashboardRoutes);

// Master setup routes
app.use("/admin/master", masterRoutes);

// Purchase management routes
app.use("/admin/purchases", purchaseRoutes);

// Sales/POS routes
app.use("/admin/sales", salesRoutes);
app.use("/sales", salesRoutes);

// Returns management routes
app.use("/admin/returns", returnsRoutes);

// Expenses routes
app.use("/admin/expenses", expensesRoutes);

// Day end closing routes (requires plan feature 'dayend')
app.use("/admin/day-end", requirePlanFeature('dayend'), dayendRoutes);

// Inventory management routes
app.use("/admin/inventory", inventoryRoutes);

// Ledger routes (requires plan feature 'ledger')
app.use("/admin/ledger", requirePlanFeature('ledger'), ledgerRoutes);

// Reports routes (requires plan feature 'reports')
app.use("/admin/reports", requirePlanFeature('reports'), reportsRoutes);

// User management & profile routes
app.use("/admin/users", usersRoutes);

// System & SMTP Settings routes (requires plan feature 'smtp')
app.use("/admin/settings", requirePlanFeature('smtp'), settingsRoutes);

// Subscription & Licensing routes
app.use("/admin/subscription", subscriptionRoutes);

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