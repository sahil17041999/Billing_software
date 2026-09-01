// controllers/notification.js
const { Notification, Product, Stock, CompanySubscription, Company, SubscriptionPlan, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Utility helper to create a Notification record
 */
async function createNotification({ company_id, user_id = null, type = 'system', title, message, icon = 'ti-bell', severity = 'info', link = null }) {
  try {
    return await Notification.create({
      company_id,
      user_id,
      type,
      title,
      message,
      icon,
      severity,
      link,
      is_read: false
    });
  } catch (err) {
    console.error('Error creating notification:', err.message);
    return null;
  }
}

/**
 * Dynamic Notification Generator
 * Checks for low stock, expiring subscriptions, and pending approvals
 */
async function syncDynamicNotifications(companyId, isSuperAdmin) {
  try {
    const now = new Date();

    // 1. Check Low Stock for this company
    const lowStockItems = await sequelize.query(`
      SELECT p.id, p.name, s.quantity, p.min_stock_level 
      FROM stock s
      JOIN products p ON s.product_id = p.id
      WHERE s.company_id = ? AND s.quantity <= p.min_stock_level
      LIMIT 5
    `, { replacements: [companyId], type: sequelize.QueryTypes.SELECT });

    if (lowStockItems && lowStockItems.length > 0) {
      // Check if a low stock notification was already posted within last 4 hours
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const existing = await Notification.findOne({
        where: {
          company_id: companyId,
          type: 'stock',
          created_at: { [Op.gte]: fourHoursAgo }
        }
      });

      if (!existing) {
        const count = lowStockItems.length;
        const itemNames = lowStockItems.map(i => i.name).slice(0, 2).join(', ');
        await createNotification({
          company_id: companyId,
          type: 'stock',
          title: `Low Stock Alert (${count} item${count > 1 ? 's' : ''})`,
          message: `${itemNames}${count > 2 ? ` and ${count - 2} other(s)` : ''} have fallen below reorder thresholds. Restock soon to prevent stockouts.`,
          icon: 'ti-alert-triangle',
          severity: 'warning',
          link: '/admin/inventory/stock/low'
        });
      }
    }

    // 2. Check Subscription Expiry for this store
    if (companyId > 1) {
      const sub = await CompanySubscription.findOne({
        where: { company_id: companyId, status: 'active' },
        include: [{ model: SubscriptionPlan, as: 'plan' }]
      });

      if (sub && sub.end_date) {
        const diffDays = Math.ceil((new Date(sub.end_date) - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7 && diffDays >= 0) {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const existingExpiryNotif = await Notification.findOne({
            where: {
              company_id: companyId,
              type: 'subscription',
              title: { [Op.like]: '%Subscription Expiring%' },
              created_at: { [Op.gte]: oneDayAgo }
            }
          });

          if (!existingExpiryNotif) {
            await createNotification({
              company_id: companyId,
              type: 'subscription',
              title: `Subscription Expiring in ${diffDays} Day${diffDays === 1 ? '' : 's'}`,
              message: `Your ${sub.plan ? sub.plan.name : 'Store'} subscription plan will expire on ${new Date(sub.end_date).toLocaleDateString()}. Renew today to keep billing uninterrupted.`,
              icon: 'ti-clock-hour-4',
              severity: diffDays <= 3 ? 'danger' : 'warning',
              link: '/subscriber/dashboard#subscription-tab'
            });
          }
        }
      }
    }

    // 3. For Super Admin: check pending client store orders awaiting approval
    if (isSuperAdmin) {
      const pendingStores = await Company.count({
        where: { id: { [Op.gt]: 1 }, is_active: 0 }
      });

      if (pendingStores > 0) {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const existingPendingNotif = await Notification.findOne({
          where: {
            company_id: 1,
            type: 'approval',
            created_at: { [Op.gte]: twoHoursAgo }
          }
        });

        if (!existingPendingNotif) {
          await createNotification({
            company_id: 1,
            type: 'approval',
            title: `${pendingStores} Store Subscription${pendingStores > 1 ? 's' : ''} Pending Approval`,
            message: `New client stores have registered and are waiting for your license review and verification.`,
            icon: 'ti-user-check',
            severity: 'info',
            link: '/admin/subscription#client-stores-section'
          });
        }
      }
    }
  } catch (err) {
    console.error('Error syncing dynamic notifications:', err.message);
  }
}

/**
 * GET /api/notifications
 * Returns unread count and latest notifications list
 */
exports.getNotificationsApi = async (req, res) => {
  try {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1) || 1;
    const isSuperAdmin = req.isSuperAdmin || (companyId === 1 && req.session.role === 'admin') || (req.session.userId === 1);

    // Sync any dynamic alerts
    await syncDynamicNotifications(companyId, isSuperAdmin);

    // Query notifications for this company / user / global broadcasts
    const whereClause = {
      [Op.or]: [
        { company_id: companyId },
        { company_id: null }
      ]
    };

    if (req.session.userId) {
      whereClause[Op.or].push({ user_id: req.session.userId });
    }

    const notifications = await Notification.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: 25
    });

    const unreadCount = await Notification.count({
      where: {
        ...whereClause,
        is_read: false
      }
    });

    return res.json({
      success: true,
      unread_count: unreadCount,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        icon: n.icon || 'ti-bell',
        severity: n.severity || 'info',
        link: n.link || '#',
        is_read: Boolean(n.is_read),
        created_at: n.created_at,
        time_ago: formatTimeAgo(n.created_at)
      }))
    });
  } catch (error) {
    console.error('Error fetching notifications API:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/notifications/:id/read
 * Mark a single notification as read
 */
exports.markAsReadApi = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1);

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    // Safety verify company ownership
    if (notification.company_id && notification.company_id !== companyId && !req.isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    await notification.update({ is_read: true });

    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for current company / user
 */
exports.markAllReadApi = async (req, res) => {
  try {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1);

    await Notification.update(
      { is_read: true },
      {
        where: {
          [Op.or]: [
            { company_id: companyId },
            { company_id: null }
          ],
          is_read: false
        }
      }
    );

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/notifications/clear
 * Clear read notifications for current company
 */
exports.clearNotificationsApi = async (req, res) => {
  try {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1);

    await Notification.destroy({
      where: {
        company_id: companyId,
        is_read: true
      }
    });

    return res.json({ success: true, message: 'Read notifications cleared successfully' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /admin/notifications or /subscriber/notifications
 * Full page Notification Center
 */
exports.getNotificationsPage = async (req, res) => {
  try {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1);
    const isSuperAdmin = req.isSuperAdmin || (companyId === 1 && req.session.role === 'admin') || (req.session.userId === 1);

    await syncDynamicNotifications(companyId, isSuperAdmin);

    const notifications = await Notification.findAll({
      where: {
        [Op.or]: [
          { company_id: companyId },
          { company_id: null }
        ]
      },
      order: [['created_at', 'DESC']],
      limit: 100
    });

    const isSubscriber = !isSuperAdmin && companyId > 1;

    res.render('admin/notifications', {
      notifications: notifications.map(n => ({
        ...n.toJSON(),
        time_ago: formatTimeAgo(n.created_at)
      })),
      isSubscriber,
      currentPage: 'notifications'
    });
  } catch (error) {
    console.error('Error rendering notifications page:', error);
    res.status(500).render('error', { error: 'Error loading notifications center' });
  }
};

/**
 * Time ago formatting helper
 */
function formatTimeAgo(dateInput) {
  if (!dateInput) return 'Just now';
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

exports.createNotification = createNotification;
