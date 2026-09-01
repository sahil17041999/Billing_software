// Inventory Management Controller
const { Stock, StockLedger, Product, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get Stock Summary
exports.getStockSummary = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', lowStockOnly = false } = req.query;
    const offset = (page - 1) * limit;
    const companyId = req.session.companyId;

    const where = { company_id: companyId };
    
    if (search) {
      where[Op.or] = [
        { '$product.name$': { [Op.like]: `%${search}%` } },
        { '$product.sku$': { [Op.like]: `%${search}%` } },
        { '$product.barcode$': { [Op.like]: `%${search}%` } }
      ];
    }

    if (lowStockOnly === 'true' || lowStockOnly === true) {
      where[Op.and] = sequelize.where(
        sequelize.col('quantity'),
        Op.lte,
        sequelize.col('product.min_stock_level')
      );
    }

    const stocks = await Stock.findAndCountAll({
      where,
      include: [
        {
          association: 'product',
          model: Product,
          attributes: ['id', 'name', 'sku', 'barcode', 'min_stock_level', 'reorder_quantity']
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['quantity', 'ASC']]
    });

    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        data: stocks.rows,
        total: stocks.count,
        page: parseInt(page),
        totalPages: Math.ceil(stocks.count / limit)
      });
    }

    res.render('admin/inventory/stock-summary', {
      stocks: stocks.rows,
      total: stocks.count,
      page: parseInt(page),
      totalPages: Math.ceil(stocks.count / limit),
      user: req.user
    });
  } catch (error) {
    console.error('Get Stock Summary Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Adjust Stock
exports.adjustStock = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { product_id, adjustment_type, quantity, reason, reference_number } = req.body;
    const companyId = req.session.companyId;

    if (!product_id || !quantity || !adjustment_type) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Product, quantity, and adjustment type are required' });
    }

    const stock = await Stock.findOne({
      where: { product_id, company_id: companyId }
    });

    if (!stock) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Stock record not found' });
    }

    const oldQuantity = stock.quantity;
    const adjustmentQty = parseFloat(quantity);

    let newQuantity = oldQuantity;
    if (adjustment_type === 'add') {
      newQuantity = oldQuantity + adjustmentQty;
    } else if (adjustment_type === 'reduce') {
      newQuantity = oldQuantity - adjustmentQty;
    }

    if (newQuantity < 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Adjustment would result in negative stock' });
    }

    await stock.update({ quantity: newQuantity }, { transaction });

    // Create ledger entry
    await StockLedger.create({
      company_id: companyId,
      product_id,
      transaction_type: 'adjustment',
      reference_type: 'stock_adjustment',
      reference_number,
      opening_stock: oldQuantity,
      transaction_quantity: adjustment_type === 'add' ? adjustmentQty : -adjustmentQty,
      closing_stock: newQuantity,
      notes: reason,
      created_by: req.session.userId
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: stock
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Adjust Stock Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Transfer Stock
exports.transferStock = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { from_product_id, to_product_id, quantity } = req.body;
    const companyId = req.session.companyId;

    if (!from_product_id || !to_product_id || !quantity) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Source product, destination product, and quantity are required' });
    }

    const fromStock = await Stock.findOne({
      where: { product_id: from_product_id, company_id: companyId }
    });

    const toStock = await Stock.findOne({
      where: { product_id: to_product_id, company_id: companyId }
    });

    if (!fromStock || !toStock) {
      await transaction.rollback();
      return res.status(404).json({ error: 'One or both stock records not found' });
    }

    const transferQty = parseFloat(quantity);

    if (fromStock.quantity < transferQty) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Insufficient stock for transfer' });
    }

    // Update from stock
    await fromStock.update(
      { quantity: fromStock.quantity - transferQty },
      { transaction }
    );

    // Update to stock
    await toStock.update(
      { quantity: toStock.quantity + transferQty },
      { transaction }
    );

    // Create ledger entries
    await StockLedger.create({
      company_id: companyId,
      product_id: from_product_id,
      transaction_type: 'transfer',
      reference_type: 'stock_transfer',
      opening_stock: fromStock.quantity,
      transaction_quantity: -transferQty,
      closing_stock: fromStock.quantity - transferQty,
      notes: `Stock transfer to product ${to_product_id}`,
      created_by: req.session.userId
    }, { transaction });

    await StockLedger.create({
      company_id: companyId,
      product_id: to_product_id,
      transaction_type: 'transfer',
      reference_type: 'stock_transfer',
      opening_stock: toStock.quantity,
      transaction_quantity: transferQty,
      closing_stock: toStock.quantity + transferQty,
      notes: `Stock received from product ${from_product_id}`,
      created_by: req.session.userId
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Stock transferred successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Transfer Stock Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Stock Ledger
exports.getStockLedger = async (req, res) => {
  try {
    const { productId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const companyId = req.session.companyId;

    const where = { company_id: companyId };
    if (productId) where.product_id = productId;

    const ledgers = await StockLedger.findAndCountAll({
      where,
      include: [
        { association: 'product', model: Product, attributes: ['name', 'sku'] },
        { association: 'creator', model: User, attributes: ['username'] }
      ],
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        data: ledgers.rows,
        total: ledgers.count,
        page: parseInt(page),
        totalPages: Math.ceil(ledgers.count / limit)
      });
    }

    res.render('admin/inventory/stock-ledger', {
      ledgers: ledgers.rows,
      total: ledgers.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(ledgers.count / limit),
      productId,
      user: req.user
    });
  } catch (error) {
    console.error('Get Stock Ledger Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Low Stock Products
exports.getLowStockProducts = async (req, res) => {
  try {
    const companyId = req.session.companyId;

    const lowStockProducts = await Stock.findAll({
      where: {
        company_id: companyId,
        [Op.and]: sequelize.where(
          sequelize.col('quantity'),
          Op.lte,
          sequelize.col('product.min_stock_level')
        )
      },
      include: [
        {
          association: 'product',
          model: Product,
          attributes: ['id', 'name', 'sku', 'min_stock_level', 'reorder_quantity']
        }
      ],
      order: [['quantity', 'ASC']],
      limit: 50
    });

    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        data: lowStockProducts
      });
    }

    res.render('admin/inventory/low-stock', { products: lowStockProducts, user: req.user });
  } catch (error) {
    console.error('Get Low Stock Products Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Expiry Alert Products
exports.getExpiryAlerts = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const daysAhead = parseInt(req.query.days) || 30;

    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    const expiryProducts = await StockLedger.findAll({
      where: {
        company_id: companyId,
        batch_number: { [Op.not]: null },
        expiry_date: {
          [Op.lte]: expiryDate,
          [Op.gt]: today
        }
      },
      include: [
        {
          association: 'product',
          model: Product,
          attributes: ['id', 'name', 'sku']
        }
      ],
      group: ['batch_number'],
      order: [['expiry_date', 'ASC']],
      limit: 50
    });

    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        data: expiryProducts
      });
    }

    res.render('admin/inventory/expiry-alerts', { products: expiryProducts, user: req.user });
  } catch (error) {
    console.error('Get Expiry Alerts Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark Stock as Damaged
exports.markAsDamaged = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { product_id, quantity, batch_number, reason, reference_number } = req.body;
    const companyId = req.session.companyId;

    const stock = await Stock.findOne({
      where: { product_id, company_id: companyId }
    });

    if (!stock) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Stock record not found' });
    }

    const damageQty = parseFloat(quantity);
    const newQuantity = stock.quantity - damageQty;

    if (newQuantity < 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Insufficient stock for damage report' });
    }

    await stock.update({ quantity: newQuantity }, { transaction });

    await StockLedger.create({
      company_id: companyId,
      product_id,
      transaction_type: 'damage',
      reference_type: 'stock_damage',
      reference_number,
      opening_stock: stock.quantity,
      transaction_quantity: -damageQty,
      closing_stock: newQuantity,
      batch_number,
      notes: reason,
      created_by: req.session.userId
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Damage reported successfully',
      data: stock
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Mark as Damaged Error:', error);
    res.status(500).json({ error: error.message });
  }
};
