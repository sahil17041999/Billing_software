// controllers/notification.js
const { Notification, Product, Stock, CompanySubscription, Company, SubscriptionPlan, DayEnd, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Utility helper to create a Notification record
 */
async function createNotification({
  company_id,
  user_id = null,
  type = 'system',
  title,
  message,
  icon = 'ti-bell',
  severity = 'info',
  link = null
}) {
  try {
    return await Notification.create({
      company_id: company_id !== undefined ? company_id : null,
      user_id: user_id || null,
      type: ['stock', 'subscription', 'sale', 'approval', 'system', 'alert'].includes(type) ? type : 'system',
      title,
      message,
      icon,
      severity: ['info', 'warning', 'success', 'danger'].includes(severity) ? severity : 'info',
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
 * Checks for:
 * 1. Out of stock items (quantity <= 0) [CRITICAL]
 * 2. Low stock threshold warnings [WARNING]
 * 3. Expiring batches within 30 days [WARNING]
 * 4. Expiring subscriptions for tenant stores [WARNING/DANGER]
 * 5. Pending client store registrations for Super Admin [INFO]
 */
async function syncDynamicNotifications(companyId, isSuperAdmin) {
  try {
    const now = new Date();

    // 1. Check Out of Stock (zero quantity) for this company
    try {
      const outOfStockItems = await sequelize.query(`
        SELECT p.id, p.name, COALESCE(SUM(s.quantity), 0) AS total_qty
        FROM products p
        LEFT JOIN stock s ON s.product_id = p.id AND s.company_id = ?
        WHERE p.company_id = ? AND p.is_active = 1
        GROUP BY p.id, p.name
        HAVING total_qty <= 0
        LIMIT 5
      `, { replacements: [companyId, companyId], type: sequelize.QueryTypes.SELECT });

      if (outOfStockItems && outOfStockItems.length > 0) {
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const existingOos = await Notification.findOne({
          where: {
            company_id: companyId,
            type: 'stock',
            title: { [Op.like]: '%Out of Stock%' },
            created_at: { [Op.gte]: sixHoursAgo }
          }
        });

        if (!existingOos) {
          const count = outOfStockItems.length;
          const names = outOfStockItems.map(i => i.name).slice(0, 2).join(', ');
          await createNotification({
            company_id: companyId,
            type: 'stock',
            title: `Out of Stock Alert (${count} product${count > 1 ? 's' : ''})`,
            message: `${names}${count > 2 ? ` and ${count - 2} other(s)` : ''} have reached 0 inventory. Replenish immediately to resume sales.`,
            icon: 'ti-alert-octagon',
            severity: 'danger',
            link: '/admin/inventory/stock/low'
          });
        }
      }
    } catch (e) {
      console.warn('OOS dynamic check error:', e.message);
    }

    // 2. Check Low Stock (below reorder threshold) for this company
    try {
      const lowStockItems = await sequelize.query(`
        SELECT p.id, p.name, s.quantity, p.min_stock_level 
        FROM stock s
        JOIN products p ON s.product_id = p.id
        WHERE s.company_id = ? AND s.quantity > 0 AND s.quantity <= p.min_stock_level
        LIMIT 5
      `, { replacements: [companyId], type: sequelize.QueryTypes.SELECT });

      if (lowStockItems && lowStockItems.length > 0) {
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
        const existingLowStock = await Notification.findOne({
          where: {
            company_id: companyId,
            type: 'stock',
            title: { [Op.like]: '%Low Stock%' },
            created_at: { [Op.gte]: fourHoursAgo }
          }
        });

        if (!existingLowStock) {
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
    } catch (e) {
      console.warn('Low stock dynamic check error:', e.message);
    }

    // 3. Check Expiring Batches within 30 days
    try {
      const expiringBatches = await sequelize.query(`
        SELECT s.id, p.name, s.batch_number AS batch_no, s.expiry_date, s.quantity
        FROM stock s
        JOIN products p ON s.product_id = p.id
        WHERE s.company_id = ? 
          AND s.quantity > 0 
          AND s.expiry_date IS NOT NULL 
          AND s.expiry_date >= CURDATE()
          AND s.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        ORDER BY s.expiry_date ASC
        LIMIT 5
      `, { replacements: [companyId], type: sequelize.QueryTypes.SELECT });

      if (expiringBatches && expiringBatches.length > 0) {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        const existingExpiry = await Notification.findOne({
          where: {
            company_id: companyId,
            type: 'stock',
            title: { [Op.like]: '%Expiry Alert%' },
            created_at: { [Op.gte]: twelveHoursAgo }
          }
        });

        if (!existingExpiry) {
          const count = expiringBatches.length;
          const batchNames = expiringBatches.map(b => `${b.name} (Batch: ${b.batch_no || 'N/A'})`).slice(0, 2).join(', ');
          await createNotification({
            company_id: companyId,
            type: 'stock',
            title: `Product Expiry Alert (${count} batch${count > 1 ? 'es' : ''})`,
            message: `${batchNames}${count > 2 ? ` and ${count - 2} more` : ''} will expire within 30 days. Review inventory and apply clearance discounts if necessary.`,
            icon: 'ti-calendar-time',
            severity: 'warning',
            link: '/admin/inventory/stock'
          });
        }
      }
    } catch (e) {
      console.warn('Batch expiry dynamic check error:', e.message);
    }

    // 4. Check Subscription Expiry for tenant stores
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

    // 5. For Super Admin: check pending client store registrations awaiting approval
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
            title: `${pendingStores} Store Registration${pendingStores > 1 ? 's' : ''} Pending Review`,
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
 * Supports rich query parameters:
 *  - type: 'stock' | 'subscription' | 'sale' | 'approval' | 'system' | 'alert'
 *  - severity: 'info' | 'warning' | 'danger' | 'success'
 *  - unread_only: 'true' / '1'
 *  - search: string
 *  - limit: number (default 30)
 *  - page: number (default 1)
 */
exports.getNotificationsApi = async (req, res) => {
  try {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1) || 1;
    const isSuperAdmin = Boolean(req.isSuperAdmin || (companyId === 1 && req.session.role === 'admin') || (req.session.userId === 1));

    // Dynamic checks
    await syncDynamicNotifications(companyId, isSuperAdmin);

    const { type, severity, unread_only, status, search, limit = 15, page = 1 } = req.query;

    const baseWhere = {
      [Op.or]: [
        { company_id: companyId },
        { company_id: null }
      ]
    };

    if (req.session.userId) {
      baseWhere[Op.or].push({ user_id: req.session.userId });
    }

    const filterWhere = { ...baseWhere };

    if (type && type !== 'all') {
      filterWhere.type = type;
    }

    if (severity && severity !== 'all') {
      filterWhere.severity = severity;
    }

    if (status === 'unread' || unread_only === 'true' || unread_only === '1') {
      filterWhere.is_read = false;
    } else if (status === 'read') {
      filterWhere.is_read = true;
    }

    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      filterWhere[Op.and] = [
        {
          [Op.or]: [
            { title: { [Op.like]: q } },
            { message: { [Op.like]: q } }
          ]
        }
      ];
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 15, 1), 100);
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const { rows: notifications, count: totalFiltered } = await Notification.findAndCountAll({
      where: filterWhere,
      order: [['created_at', 'DESC']],
      limit: parsedLimit,
      offset: offset
    });

    // Real-time statistical counts for quick dashboard tabs
    const [totalAll, unreadCount, dangerCount, warningCount, stockCount, saleCount] = await Promise.all([
      Notification.count({ where: baseWhere }),
      Notification.count({ where: { ...baseWhere, is_read: false } }),
      Notification.count({ where: { ...baseWhere, severity: 'danger' } }),
      Notification.count({ where: { ...baseWhere, severity: 'warning' } }),
      Notification.count({ where: { ...baseWhere, type: 'stock' } }),
      Notification.count({ where: { ...baseWhere, type: 'sale' } })
    ]);

    const totalPages = Math.ceil(totalFiltered / parsedLimit) || 1;
    const startIndex = totalFiltered > 0 ? offset + 1 : 0;
    const endIndex = Math.min(offset + parsedLimit, totalFiltered);

    return res.json({
      success: true,
      unread_count: unreadCount,
      stats: {
        total: totalAll,
        unread: unreadCount,
        danger: dangerCount,
        warning: warningCount,
        stock: stockCount,
        sale: saleCount
      },
      pagination: {
        total: totalFiltered,
        page: parsedPage,
        limit: parsedLimit,
        pages: totalPages,
        totalPages: totalPages,
        hasPrev: parsedPage > 1,
        hasNext: parsedPage < totalPages,
        startIndex,
        endIndex
      },
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        icon: n.icon || 'ti-bell',
        severity: n.severity || 'info',
        link: n.link || null,
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
 * GET /api/notifications/stats
 * Quick real-time statistical breakdown
 */
exports.getNotificationStatsApi = async (req, res) => {
  try {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1) || 1;

    const baseWhere = {
      [Op.or]: [
        { company_id: companyId },
        { company_id: null }
      ]
    };

    if (req.session.userId) {
      baseWhere[Op.or].push({ user_id: req.session.userId });
    }

    const [total, unread, danger, warning, stock, sale, subscription] = await Promise.all([
      Notification.count({ where: baseWhere }),
      Notification.count({ where: { ...baseWhere, is_read: false } }),
      Notification.count({ where: { ...baseWhere, severity: 'danger' } }),
      Notification.count({ where: { ...baseWhere, severity: 'warning' } }),
      Notification.count({ where: { ...baseWhere, type: 'stock' } }),
      Notification.count({ where: { ...baseWhere, type: 'sale' } }),
      Notification.count({ where: { ...baseWhere, type: 'subscription' } })
    ]);

    return res.json({
      success: true,
      stats: {
        total,
        unread,
        danger,
        warning,
        stock,
        sale,
        subscription
      }
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
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
 * POST /api/notifications/:id/unread
 * Mark a single notification back as unread
 */
exports.markAsUnreadApi = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1);

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    if (notification.company_id && notification.company_id !== companyId && !req.isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    await notification.update({ is_read: false });

    return res.json({ success: true, message: 'Notification marked as unread' });
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
exports.deleteNotificationApi = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1);

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    if (notification.company_id && notification.company_id !== companyId && !req.isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    await notification.destroy();

    return res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/notifications/bulk-action
 * Perform bulk operations: 'mark_read', 'mark_unread', 'delete'
 */
exports.bulkActionApi = async (req, res) => {
  try {
    const { action, ids } = req.body;
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1);

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No notification IDs specified' });
    }

    const whereClause = {
      id: { [Op.in]: ids }
    };

    if (!req.isSuperAdmin) {
      whereClause[Op.or] = [
        { company_id: companyId },
        { company_id: null }
      ];
    }

    if (action === 'mark_read') {
      await Notification.update({ is_read: true }, { where: whereClause });
      return res.json({ success: true, message: `Marked ${ids.length} notifications as read` });
    } else if (action === 'mark_unread') {
      await Notification.update({ is_read: false }, { where: whereClause });
      return res.json({ success: true, message: `Marked ${ids.length} notifications as unread` });
    } else if (action === 'delete') {
      await Notification.destroy({ where: whereClause });
      return res.json({ success: true, message: `Deleted ${ids.length} notifications successfully` });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action specified' });
    }
  } catch (error) {
    console.error('Error executing bulk action on notifications:', error);
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
 * POST /api/notifications/broadcast
 * Send a broadcast announcement across store(s) or user(s) (Admin / Super Admin privilege)
 */
exports.broadcastNotificationApi = async (req, res) => {
  try {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1);
    const isSuperAdmin = Boolean(req.isSuperAdmin || (companyId === 1 && req.session.role === 'admin') || (req.session.userId === 1));

    if (!isSuperAdmin && req.session.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin privileges required' });
    }

    const {
      target_type = 'all', // 'all', 'current_company', 'specific_company'
      target_company_id,
      title,
      message,
      type = 'system',
      severity = 'info',
      icon = 'ti-speakerphone',
      link = null
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required' });
    }

    let targetCompany = null;
    if (target_type === 'current_company') {
      targetCompany = companyId;
    } else if (target_type === 'specific_company') {
      targetCompany = target_company_id ? parseInt(target_company_id) : null;
    } else {
      // 'all' = broadcast to everyone (company_id: null)
      targetCompany = null;
    }

    const created = await createNotification({
      company_id: targetCompany,
      type: ['stock', 'subscription', 'sale', 'approval', 'system', 'alert'].includes(type) ? type : 'system',
      title: title.trim(),
      message: message.trim(),
      icon: icon || 'ti-speakerphone',
      severity: ['info', 'warning', 'success', 'danger'].includes(severity) ? severity : 'info',
      link: link && link.trim() !== '' ? link.trim() : null
    });

    return res.json({
      success: true,
      message: 'Broadcast announcement dispatched successfully',
      notification: created
    });
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/notifications/test
 * Quick test endpoint to trigger a demo notification to test sound, toast, and desktop notifications
 */
exports.sendTestNotificationApi = async (req, res) => {
  try {
    const companyId = req.session.companyId || (req.user ? req.user.company_id : 1);
    const userId = req.session.userId || null;
    const { severity = 'info' } = req.body;

    const sampleTypes = {
      info: { title: 'Notification System Online', message: 'Audio chimes, toast alerts, and real-time syncing are fully operational.', icon: 'ti-bell-ringing' },
      warning: { title: 'Inventory Warning Test', message: 'Test alert: 3 batches are reaching minimum threshold stock.', icon: 'ti-alert-triangle' },
      danger: { title: 'Critical System Alert Test', message: 'Test critical alert: Instant emergency notification dispatched.', icon: 'ti-alert-octagon' },
      success: { title: 'Payment Received Test', message: 'Test sale: Invoice #INV-TEST-001 completed for ₹4,850.', icon: 'ti-circle-check' }
    };

    const sample = sampleTypes[severity] || sampleTypes.info;

    const notif = await createNotification({
      company_id: companyId,
      user_id: userId,
      type: severity === 'danger' || severity === 'warning' ? 'stock' : (severity === 'success' ? 'sale' : 'system'),
      title: sample.title,
      message: sample.message,
      icon: sample.icon,
      severity: severity,
      link: '/admin/notifications'
    });

    return res.json({
      success: true,
      message: 'Test notification triggered successfully',
      notification: notif
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
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
    const isSuperAdmin = Boolean(req.isSuperAdmin || (companyId === 1 && req.session.role === 'admin') || (req.session.userId === 1));

    await syncDynamicNotifications(companyId, isSuperAdmin);

    const baseWhere = {
      [Op.or]: [
        { company_id: companyId },
        { company_id: null }
      ]
    };

    if (req.session.userId) {
      baseWhere[Op.or].push({ user_id: req.session.userId });
    }

    const { page = 1, limit = 15, type = 'all', severity = 'all', status = 'all', search = '' } = req.query;

    const filterWhere = { ...baseWhere };

    if (type && type !== 'all') {
      filterWhere.type = type;
    }

    if (severity && severity !== 'all') {
      filterWhere.severity = severity;
    }

    if (status === 'unread') {
      filterWhere.is_read = false;
    } else if (status === 'read') {
      filterWhere.is_read = true;
    }

    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      filterWhere[Op.and] = [
        {
          [Op.or]: [
            { title: { [Op.like]: q } },
            { message: { [Op.like]: q } }
          ]
        }
      ];
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 15, 1), 100);
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const [
      { rows: notifications, count: totalFiltered },
      totalAll,
      unreadCount,
      dangerCount,
      warningCount,
      stockCount,
      saleCount
    ] = await Promise.all([
      Notification.findAndCountAll({
        where: filterWhere,
        order: [['created_at', 'DESC']],
        limit: parsedLimit,
        offset: offset
      }),
      Notification.count({ where: baseWhere }),
      Notification.count({ where: { ...baseWhere, is_read: false } }),
      Notification.count({ where: { ...baseWhere, severity: 'danger' } }),
      Notification.count({ where: { ...baseWhere, severity: 'warning' } }),
      Notification.count({ where: { ...baseWhere, type: 'stock' } }),
      Notification.count({ where: { ...baseWhere, type: 'sale' } })
    ]);

    const isSubscriber = !isSuperAdmin && companyId > 1;

    // If super admin, fetch companies list for broadcast modal dropdown
    let companies = [];
    if (isSuperAdmin) {
      companies = await Company.findAll({
        attributes: ['id', 'name'],
        where: { is_active: 1 },
        order: [['name', 'ASC']]
      });
    }

    const totalPages = Math.ceil(totalFiltered / parsedLimit) || 1;
    const startIndex = totalFiltered > 0 ? offset + 1 : 0;
    const endIndex = Math.min(offset + parsedLimit, totalFiltered);

    const pagination = {
      total: totalFiltered,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: totalPages,
      hasPrev: parsedPage > 1,
      hasNext: parsedPage < totalPages,
      startIndex,
      endIndex
    };

    res.render('admin/notifications', {
      notifications: notifications.map(n => ({
        ...n.toJSON(),
        time_ago: formatTimeAgo(n.created_at)
      })),
      stats: {
        total: totalAll,
        unread: unreadCount,
        danger: dangerCount,
        warning: warningCount,
        stock: stockCount,
        sale: saleCount
      },
      pagination,
      filters: {
        type: type || 'all',
        severity: severity || 'all',
        status: status || 'all',
        search: search || ''
      },
      companies,
      isSuperAdmin,
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
exports.sendNotification = createNotification;
