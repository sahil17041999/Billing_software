// controllers/inquiry.js
const { ContactInquiry } = require('../models');
const { Op } = require('sequelize');

/**
 * Super Admin Contact Inquiries Page
 */
exports.getInquiriesPage = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit) || 15));
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all';
    const search = (req.query.search || '').trim();

    // Base query conditions
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { store_name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: inquiries } = await ContactInquiry.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    // Compute live stats counters
    const [totalCount, newCount, contactedCount, resolvedCount] = await Promise.all([
      ContactInquiry.count(),
      ContactInquiry.count({ where: { status: 'new' } }),
      ContactInquiry.count({ where: { status: 'contacted' } }),
      ContactInquiry.count({ where: { status: 'resolved' } })
    ]);

    const totalPages = Math.ceil(count / limit) || 1;
    const startIndex = count === 0 ? 0 : (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, count);

    res.render('admin/inquiries', {
      currentPage: 'inquiries',
      user: req.user,
      inquiries: inquiries || [],
      stats: {
        total: totalCount,
        new: newCount,
        contacted: contactedCount,
        resolved: resolvedCount
      },
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        startIndex,
        endIndex,
        hasPrev: page > 1,
        hasNext: page < totalPages
      },
      filters: {
        status,
        search
      }
    });

  } catch (error) {
    console.error('Error loading contact inquiries:', error);
    res.status(500).render('error', { error: 'Failed to load contact inquiries: ' + error.message });
  }
};

/**
 * Get Single Inquiry Detail API
 */
exports.getInquiryDetailApi = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findByPk(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, error: 'Inquiry not found' });
    }

    // Auto mark as read if it was new
    if (inquiry.status === 'new') {
      inquiry.status = 'read';
      await inquiry.save();
    }

    res.json({ success: true, inquiry });
  } catch (error) {
    console.error('Error fetching inquiry detail:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update Inquiry Status & Notes API
 */
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    const inquiry = await ContactInquiry.findByPk(id);
    if (!inquiry) {
      return res.status(404).json({ success: false, error: 'Inquiry record not found' });
    }

    if (status && ['new', 'read', 'contacted', 'resolved'].includes(status)) {
      inquiry.status = status;
    }

    if (admin_notes !== undefined) {
      inquiry.admin_notes = admin_notes.trim();
    }

    await inquiry.save();

    res.json({
      success: true,
      message: 'Inquiry status updated successfully',
      inquiry
    });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete Inquiry API
 */
exports.deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const inquiry = await ContactInquiry.findByPk(id);
    if (!inquiry) {
      return res.status(404).json({ success: false, error: 'Inquiry record not found' });
    }

    await inquiry.destroy();
    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
