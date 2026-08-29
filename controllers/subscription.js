// controllers/subscription.js
// Enterprise Subscription & Licensing Manager

const { SubscriptionPlan, CompanySubscription, Company, User, Product, Sale } = require('../models');
const { Op } = require('sequelize');

/**
 * Public B2C Pricing Storefront
 */
exports.getPublicPricing = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['price_monthly', 'ASC']]
    });

    res.render('public/pricing', {
      plans,
      user: req.user || null
    });
  } catch (error) {
    console.error('Error loading public pricing:', error);
    res.status(500).send('Error loading pricing page: ' + error.message);
  }
};

/**
 * Public Client Subscription Order & Store Registration
 */
exports.orderSubscription = async (req, res) => {
  try {
    const {
      plan_id,
      billing_cycle = 'monthly',
      store_name,
      owner_name,
      phone,
      email,
      city,
      payment_method = 'UPI'
    } = req.body;

    // 1. Sanitize & Validate 10-digit Indian Mobile Number
    let cleanPhone = (phone || '').toString().trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.substring(2);
    else if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).' });
    }

    if (!store_name || !store_name.trim()) {
      return res.status(400).json({ success: false, error: 'Store Name is required.' });
    }

    // 2. Check if mobile number is already in use
    const existingUser = await User.findOne({ where: { phone: cleanPhone } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: `Mobile number +91 ${cleanPhone} is already registered. Please sign in or use a different mobile number.`
      });
    }

    // 3. Find target plan
    const targetPlan = await SubscriptionPlan.findByPk(plan_id) || await SubscriptionPlan.findOne({ where: { code: 'pro' } });
    if (!targetPlan) {
      return res.status(404).json({ success: false, error: 'Selected subscription plan not found.' });
    }

    const isYearly = billing_cycle === 'yearly';
    const amount = isYearly ? targetPlan.price_yearly : targetPlan.price_monthly;
    const now = new Date();
    const expiryDate = new Date(now);
    if (isYearly) {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setDate(expiryDate.getDate() + 30);
    }

    const orderId = `ORD-${Date.now().toString().slice(-8)}`;

    // 4. Create Company (Store) in Pending Approval state (is_active = 0)
    const company = await Company.create({
      name: store_name.trim(),
      email: (email || '').trim() || null,
      phone: cleanPhone,
      city: (city || '').trim() || null,
      is_active: 0 // Pending Admin Verification
    });

    // 5. Create Owner User in Pending Approval state (is_active = 0)
    await User.create({
      company_id: company.id,
      username: cleanPhone,
      first_name: (owner_name || '').trim() || store_name.trim(),
      email: (email || '').trim() || null,
      phone: cleanPhone,
      role_id: 1, // Admin / Owner role
      is_active: 0 // Pending Admin Verification
    });

    // 6. Create Company Subscription Record
    await CompanySubscription.create({
      company_id: company.id,
      plan_id: targetPlan.id,
      billing_cycle,
      status: 'pending_approval',
      start_date: now,
      end_date: expiryDate,
      next_billing_date: expiryDate,
      amount_paid: amount,
      payment_method,
      transaction_id: orderId,
      auto_renew: true
    });

    return res.status(201).json({
      success: true,
      order_id: orderId,
      store_id: company.id,
      message: 'Subscription order placed successfully! Admin will verify and activate your store dashboard.'
    });

  } catch (error) {
    console.error('Error placing subscription order:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get Subscription Dashboard
 */
exports.getSubscription = async (req, res) => {
  try {
    const companyId = req.session.companyId || 1;

    // Fetch all available subscription plans
    const plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['price_monthly', 'ASC']]
    });

    // Find or initialize active company subscription
    let subscription = await CompanySubscription.findOne({
      where: { company_id: companyId },
      include: [{ model: SubscriptionPlan, as: 'plan' }]
    });

    // Default to Professional Plan (30-day active license) if newly provisioned
    if (!subscription) {
      const proPlan = plans.find(p => p.code === 'pro') || plans[0];
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setDate(nextMonth.getDate() + 30);

      subscription = await CompanySubscription.create({
        company_id: companyId,
        plan_id: proPlan.id,
        billing_cycle: 'monthly',
        status: 'active',
        start_date: now,
        end_date: nextMonth,
        next_billing_date: nextMonth,
        amount_paid: proPlan.price_monthly,
        payment_method: 'UPI',
        transaction_id: `TXN-${Date.now().toString().slice(-8)}`,
        auto_renew: true
      });

      subscription = await CompanySubscription.findOne({
        where: { id: subscription.id },
        include: [{ model: SubscriptionPlan, as: 'plan' }]
      });
    }

    // Usage Statistics
    const userCount = await User.count({ where: { company_id: companyId } });
    const productCount = await Product.count({ where: { company_id: companyId } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyInvoiceCount = await Sale.count({
      where: {
        company_id: companyId,
        created_at: { [Op.gte]: startOfMonth }
      }
    });

    // Remaining Days calculation
    const today = new Date();
    const endDate = new Date(subscription.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const usage = {
      users: {
        current: userCount,
        max: subscription.plan ? subscription.plan.max_users : 6,
        percentage: Math.min(100, Math.round((userCount / (subscription.plan?.max_users || 6)) * 100))
      },
      products: {
        current: productCount,
        max: subscription.plan ? subscription.plan.max_products : 10000,
        percentage: Math.min(100, Math.round((productCount / (subscription.plan?.max_products || 10000)) * 100))
      },
      invoices: {
        current: monthlyInvoiceCount,
        max: subscription.plan ? subscription.plan.max_invoices_per_month : 15000,
        percentage: Math.min(100, Math.round((monthlyInvoiceCount / (subscription.plan?.max_invoices_per_month || 15000)) * 100))
      }
    };

    // Super Admin check
    const isSuperAdmin = req.isSuperAdmin || (req.user && req.user.company_id === 1 && req.session.role === 'admin') || (req.session.userId === 1);

    // Client Stores for Administrator Approval & License Management (Super Admin ONLY!)
    let clientStores = [];
    if (isSuperAdmin) {
      clientStores = await Company.findAll({
        include: [
          { model: CompanySubscription, as: 'subscription', include: [{ model: SubscriptionPlan, as: 'plan' }] },
          { model: User, as: 'users' }
        ],
        order: [['created_at', 'DESC']]
      });
    }

    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.json({
        success: true,
        subscription,
        plans,
        usage,
        daysRemaining,
        isSuperAdmin,
        clientStores
      });
    }

    res.render('admin/subscription/index', {
      subscription,
      plans,
      usage,
      daysRemaining,
      isSuperAdmin,
      clientStores,
      user: req.user,
      currentPage: 'subscription'
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.status(500).render('error', { error: 'Failed to load subscription: ' + error.message });
  }
};

/**
 * Upgrade or Renew Subscription Plan
 */
exports.upgradePlan = async (req, res) => {
  try {
    const companyId = req.session.companyId || 1;
    const { plan_id, plan_code, billing_cycle = 'monthly', payment_method = 'UPI' } = req.body;

    let targetPlan = null;
    if (plan_id) {
      targetPlan = await SubscriptionPlan.findByPk(plan_id);
    } else if (plan_code) {
      targetPlan = await SubscriptionPlan.findOne({ where: { code: plan_code } });
    }

    if (!targetPlan) {
      return res.status(404).json({ success: false, error: 'Selected subscription plan not found.' });
    }

    const now = new Date();
    const isYearly = billing_cycle === 'yearly';
    const amount = isYearly ? targetPlan.price_yearly : targetPlan.price_monthly;

    const expiryDate = new Date(now);
    if (isYearly) {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setDate(expiryDate.getDate() + 30);
    }

    const txId = `TXN-${Date.now().toString().slice(-8)}`;

    let [subscription] = await CompanySubscription.findOrCreate({
      where: { company_id: companyId },
      defaults: {
        plan_id: targetPlan.id,
        billing_cycle,
        status: 'active',
        start_date: now,
        end_date: expiryDate,
        next_billing_date: expiryDate,
        amount_paid: amount,
        payment_method,
        transaction_id: txId,
        auto_renew: true
      }
    });

    await subscription.update({
      plan_id: targetPlan.id,
      billing_cycle,
      status: 'active',
      start_date: now,
      end_date: expiryDate,
      next_billing_date: expiryDate,
      amount_paid: amount,
      payment_method,
      transaction_id: txId,
      auto_renew: true
    });

    return res.json({
      success: true,
      message: `Successfully activated ${targetPlan.name} (${isYearly ? 'Annual' : 'Monthly'})!`,
      subscription: {
        plan_name: targetPlan.name,
        billing_cycle,
        amount_paid: amount,
        end_date: expiryDate,
        transaction_id: txId
      }
    });

  } catch (error) {
    console.error('Error upgrading plan:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Cancel Auto-Renew
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const companyId = req.session.companyId || 1;
    const subscription = await CompanySubscription.findOne({ where: { company_id: companyId } });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Active subscription not found.' });
    }

    await subscription.update({ auto_renew: false });

    return res.json({
      success: true,
      message: 'Automatic renewal has been disabled.'
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ADMIN: Approve and Activate Client Store & Grant Login Access
 */
exports.approveClientStore = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findByPk(companyId);

    if (!company) {
      return res.status(404).json({ success: false, error: 'Client store not found.' });
    }

    // 1. Activate Company
    await company.update({ is_active: 1 });

    // 2. Activate Users belonging to company
    await User.update({ is_active: 1 }, { where: { company_id: companyId } });

    // 3. Activate Subscription
    const subscription = await CompanySubscription.findOne({ where: { company_id: companyId } });
    if (subscription) {
      const now = new Date();
      const newExpiry = new Date(now);
      newExpiry.setDate(newExpiry.getDate() + (subscription.billing_cycle === 'yearly' ? 365 : 30));

      await subscription.update({
        status: 'active',
        start_date: now,
        end_date: newExpiry,
        next_billing_date: newExpiry
      });
    }

    return res.json({
      success: true,
      message: `Store "${company.name}" has been approved! Login access is now active.`
    });

  } catch (error) {
    console.error('Error approving store:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ADMIN: Toggle Store Active / Suspended Status
 */
exports.toggleClientStore = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findByPk(companyId);

    if (!company) {
      return res.status(404).json({ success: false, error: 'Client store not found.' });
    }

    const newStatus = (company.is_active === 1 || company.is_active === true) ? 0 : 1;
    await company.update({ is_active: newStatus });
    await User.update({ is_active: newStatus }, { where: { company_id: companyId } });

    const subscription = await CompanySubscription.findOne({ where: { company_id: companyId } });
    if (subscription) {
      await subscription.update({ status: newStatus ? 'active' : 'suspended' });
    }

    return res.json({
      success: true,
      is_active: newStatus,
      message: `Store "${company.name}" is now ${newStatus ? 'Active & Licensed' : 'Suspended'}.`
    });

  } catch (error) {
    console.error('Error toggling store:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ADMIN: Extend Store Subscription (+30 Days)
 */
exports.extendClientStore = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { days = 30 } = req.body;

    const subscription = await CompanySubscription.findOne({ where: { company_id: companyId } });
    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Store subscription not found.' });
    }

    const currentEnd = new Date(subscription.end_date > new Date() ? subscription.end_date : new Date());
    currentEnd.setDate(currentEnd.getDate() + parseInt(days, 10));

    await subscription.update({
      status: 'active',
      end_date: currentEnd,
      next_billing_date: currentEnd
    });

    return res.json({
      success: true,
      message: `Extended validity by +${days} days! New expiry: ${currentEnd.toLocaleDateString('en-IN')}`,
      new_end_date: currentEnd
    });

  } catch (error) {
    console.error('Error extending store validity:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
