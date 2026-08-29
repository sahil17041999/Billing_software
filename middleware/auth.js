// Authentication & RBAC Privilege Middleware
const { User, Company, Role, CompanySubscription, SubscriptionPlan } = require('../models');
const { checkPermission, PERMISSION_MODULES, DEFAULT_ROLE_PRESETS } = require('../config/permissions');

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/admin/login');
  }
  next();
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/admin/login');
  }
  if (req.session.role !== 'admin') {
    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    return res.status(403).render('error', {
      error: 'Access Denied',
      message: 'You need admin privileges to access this section.',
      backUrl: '/admin/dashboard'
    });
  }
  next();
};

// Check if user is Super Administrator (Platform Owner)
const isSuperAdmin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/admin/login');
  }
  if (!req.isSuperAdmin) {
    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.status(403).json({ success: false, error: 'Access denied. Super Administrator privileges required.' });
    }
    return res.status(403).render('error', {
      error: 'Access Denied',
      message: 'This section is reserved for the Super Administrator.',
      backUrl: '/admin/dashboard'
    });
  }
  next();
};

// Check if user is admin or manager
const isAdminOrManager = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/admin/login');
  }
  if (!['admin', 'manager'].includes(req.session.role)) {
    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.status(403).json({ error: 'Access denied. Manager or Admin required.' });
    }
    return res.status(403).render('error', {
      error: 'Access Denied',
      message: 'You need manager or admin privileges to access this section.',
      backUrl: '/admin/dashboard'
    });
  }
  next();
};

// Check specific privilege / permission key (e.g. 'pos.access', 'inventory.adjust', 'reports.sales')
const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    if (!req.session.userId) {
      return res.redirect('/admin/login');
    }

    if (req.isSuperAdmin) {
      return next();
    }

    try {
      const user = req.user || await User.findByPk(req.session.userId, {
        include: [{ association: 'role', model: Role }]
      });

      if (!user || !user.role) {
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
          return res.status(403).json({ error: 'Access denied. No role assigned.' });
        }
        return res.status(403).render('error', {
          error: 'Access Denied',
          message: 'You do not have the required permissions to access this section.',
          backUrl: '/admin/dashboard'
        });
      }

      const permissions = user.role.permissions || [];
      if (!checkPermission(permissions, permissionKey)) {
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
          return res.status(403).json({ error: `Access denied. Privilege "${permissionKey}" required.` });
        }
        return res.status(403).render('error', {
          error: 'Access Denied',
          message: `You do not have permission (${permissionKey}) to perform this action.`,
          backUrl: req.session.role === 'cashier' ? '/admin/sales/pos' : '/admin/dashboard'
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Authorization error' });
    }
  };
};

// Subscription Feature Guard Middleware
const requirePlanFeature = (featureKey) => {
  return (req, res, next) => {
    if (req.isSuperAdmin) return next();

    const planCode = req.subscriptionPlanCode || 'starter';
    if (planCode === 'enterprise' || planCode === 'pro') return next();

    // Starter plan only gives billing-related privileges:
    const starterAllowed = ['pos', 'sales', 'products', 'customers', 'profile', 'subscription', 'dashboard'];
    if (starterAllowed.includes(featureKey)) return next();

    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.status(403).json({
        success: false,
        error: `Feature "${featureKey}" is not included in your ${planCode.toUpperCase()} subscription. Please upgrade to the Professional Store plan to unlock it.`
      });
    }

    return res.status(403).render('error', {
      error: 'Plan Upgrade Required',
      message: `Your current subscription plan does not include access to this feature. Please upgrade to the Professional Store plan to unlock full capabilities.`,
      backUrl: '/admin/subscription'
    });
  };
};

// Check if user has specific role
const hasRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.session.userId, {
        include: [{ association: 'role', model: Role }]
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!roles.includes(user.role.name)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
};

// Attach user data and permissions helper to request and view locals
const attachUser = async (req, res, next) => {
  res.locals.currentPath = req.originalUrl || req.path || '';
  res.locals.user = null;
  res.locals.userPermissions = [];
  res.locals.isSuperAdmin = false;
  res.locals.subscriptionPlanCode = 'starter';
  res.locals.hasPermission = () => false;
  res.locals.canAccessFeature = () => false;

  if (req.session.userId) {
    try {
      const user = await User.findByPk(req.session.userId, {
        include: [
          { association: 'company', model: Company },
          { association: 'role', model: Role }
        ]
      });

      if (user) {
        req.user = user;
        res.locals.user = user;

        // Super Admin Identification:
        // Platform owner (Company 1 + admin role or user ID 1 or username admin)
        const isSuperAdminFlag = (user.company_id === 1 && user.role && user.role.name === 'admin') || (user.id === 1 && user.phone === '9999999999');
        req.isSuperAdmin = isSuperAdminFlag;
        res.locals.isSuperAdmin = isSuperAdminFlag;

        // Fetch company subscription
        let companySub = null;
        try {
          companySub = await CompanySubscription.findOne({
            where: { company_id: user.company_id },
            include: [{ model: SubscriptionPlan, as: 'plan' }]
          });
        } catch (subErr) {
          console.error('Subscription fetch error in attachUser:', subErr.message);
        }

        const planCode = isSuperAdminFlag ? 'enterprise' : (companySub && companySub.plan ? companySub.plan.code : 'starter');
        req.currentSubscription = companySub;
        res.locals.currentSubscription = companySub;
        req.subscriptionPlanCode = planCode;
        res.locals.subscriptionPlanCode = planCode;

        // Feature Entitlement Check (Billing privileges as per subscription)
        const canAccessFeature = (feature) => {
          if (isSuperAdminFlag) return true;
          if (planCode === 'enterprise' || planCode === 'pro') return true;
          // Starter tier: only billing-related privileges
          const starterAllowed = ['pos', 'sales', 'products', 'customers', 'profile', 'subscription', 'dashboard'];
          return starterAllowed.includes(feature);
        };
        req.canAccessFeature = canAccessFeature;
        res.locals.canAccessFeature = canAccessFeature;

        let permissions = [];
        if (isSuperAdminFlag || (user.role && user.role.name === 'admin')) {
          permissions = ['*'];
        } else if (user.role && user.role.permissions) {
          permissions = Array.isArray(user.role.permissions) ? user.role.permissions : [];
        }

        res.locals.userPermissions = permissions;
        res.locals.hasPermission = (permKey) => {
          if (isSuperAdminFlag) return true;
          return checkPermission(permissions, permKey);
        };
        req.hasPermission = res.locals.hasPermission;
      }
    } catch (error) {
      console.error('Error attaching user & permissions:', error);
    }
  }
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
  
  res.status(500).render('error', { error: err.message });
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isSuperAdmin,
  isAdminOrManager,
  requirePermission,
  requirePlanFeature,
  hasRole,
  attachUser,
  errorHandler
};

