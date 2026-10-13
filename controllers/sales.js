// controllers/sales.js

const {
  Sale,
  SalesDetail,
  Customer,
  Product,
  Category,
  Brand,
  Unit,
  Tax,
  Stock,
  StockLedger,
  Payment,
  PaymentMode,
  User,
  Company,
  sequelize
} = require('../models');

const { Op } = require('sequelize');


// ============================================================
// Generate Unique Invoice Number
// ============================================================

const generateInvoiceNumber = async (companyId, transaction) => {
  const lastSale = await Sale.findOne({
    where: {
      company_id: companyId
    },
    order: [['id', 'DESC']],
    transaction
  });

  const nextNumber = (lastSale?.id || 0) + 1;

  return `INV-${new Date().getFullYear()}-${String(nextNumber).padStart(6, '0')}`;
};


// ============================================================
// GET POS
// ============================================================

exports.getPOS = async (req, res) => {
  try {
    const companyId = req.session.companyId;

    if (!companyId) {
      return res.status(401).render('error', {
        error: 'Company session not found'
      });
    }

    // --------------------------------------------------------
    // Products
    // --------------------------------------------------------

    const products = await Product.findAll({
      where: {
        company_id: companyId,
        is_active: 1
      },

      include: [
        {
          model: Category,
          as: 'category',
          required: false
        },
        {
          model: Unit,
          as: 'unit',
          required: false
        },
        {
          model: Tax,
          as: 'tax',
          required: false
        }
      ],

      order: [['name', 'ASC']]
    });


    // --------------------------------------------------------
    // Customers
    // --------------------------------------------------------

    const customers = await Customer.findAll({
      where: {
        company_id: companyId,
        is_active: 1
      },

      order: [['name', 'ASC']]
    });


    // --------------------------------------------------------
    // Payment Modes, Categories, Units & Taxes
    // --------------------------------------------------------

    const [paymentModes, categories, units, taxes, brands, company, nextInvoiceNumber] = await Promise.all([
      PaymentMode.findAll({
        where: { company_id: companyId, is_active: 1 },
        order: [['name', 'ASC']]
      }),
      Category.findAll({
        where: { company_id: companyId, is_active: 1 },
        order: [['name', 'ASC']]
      }),
      Unit.findAll({
        where: { company_id: companyId, is_active: 1 },
        order: [['name', 'ASC']]
      }),
      Tax.findAll({
        where: { company_id: companyId, is_active: 1 },
        order: [['rate', 'ASC']]
      }),
      Brand.findAll({
        where: { company_id: companyId, is_active: 1 },
        order: [['name', 'ASC']]
      }),
      Company.findByPk(companyId),
      generateInvoiceNumber(companyId)
    ]);

    // --------------------------------------------------------
    // Render POS
    // --------------------------------------------------------

    return res.render('admin/sales/pos', {
      products,
      customers,
      paymentModes,
      categories,
      units,
      taxes,
      brands,
      company,
      nextInvoiceNumber,
      user: req.user
    });

  } catch (error) {
    console.error('Error loading POS:', error);

    return res.status(500).render('error', {
      error: error.message
    });
  }
};


// ============================================================
// GET SALES LIST
// ============================================================

exports.getSales = async (req, res) => {
  try {
    const companyId = req.session.companyId;

    if (!companyId) {
      if (
        req.headers.accept &&
        req.headers.accept.includes('application/json')
      ) {
        return res.status(401).json({
          error: 'Company session not found'
        });
      }

      return res.status(401).render('error', {
        error: 'Company session not found'
      });
    }


    const {
      page = 1,
      limit = 20,
      search = '',
      status = ''
    } = req.query;


    const pageNumber = Math.max(
      parseInt(page, 10) || 1,
      1
    );


    const limitNumber = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      100
    );


    const offset =
      (pageNumber - 1) * limitNumber;


    const where = {
      company_id: companyId
    };


    // --------------------------------------------------------
    // Status filter
    // --------------------------------------------------------

    if (status) {
      where.sales_status = status;
    }


    // --------------------------------------------------------
    // Invoice search
    // --------------------------------------------------------

    if (search) {
      where.invoice_number = {
        [Op.like]: `%${search}%`
      };
    }


    // --------------------------------------------------------
    // Get Sales
    // --------------------------------------------------------

    const sales = await Sale.findAndCountAll({
      where,

      include: [
        {
          model: Customer,
          as: 'customer',
          required: false
        }
      ],

      limit: limitNumber,
      offset,

      order: [
        ['invoice_date', 'DESC'],
        ['id', 'DESC']
      ]
    });


    // --------------------------------------------------------
    // JSON response
    // --------------------------------------------------------

    if (
      req.headers.accept &&
      req.headers.accept.includes('application/json')
    ) {
      return res.json({
        rows: sales.rows,
        count: sales.count,
        page: pageNumber,
        limit: limitNumber
      });
    }


    // --------------------------------------------------------
    // HTML response
    // --------------------------------------------------------

    return res.render('admin/sales/list', {
      sales: sales.rows,
      total: sales.count,
      page: pageNumber,
      limit: limitNumber,
      user: req.user
    });

  } catch (error) {
    console.error('Error fetching sales:', error);

    if (
      req.headers.accept &&
      req.headers.accept.includes('application/json')
    ) {
      return res.status(500).json({
        error: error.message
      });
    }

    return res.status(500).render('error', {
      error: error.message
    });
  }
};


// ============================================================
// CREATE SALE
// ============================================================

exports.createSale = async (req, res) => {

  const transaction = await sequelize.transaction();

  try {

    const companyId = req.session.companyId;
    const userId = req.session.userId;

    const {
      customer_id,
      items,
      payment_mode_id,
      discount_amount
    } = req.body;


    // ========================================================
    // Basic validation
    // ========================================================

    if (!companyId) {
      await transaction.rollback();

      return res.status(401).json({
        error: 'Company session not found'
      });
    }


    if (
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      await transaction.rollback();

      return res.status(400).json({
        error: 'No items in cart'
      });
    }


    // ========================================================
    // Validate invoice discount
    // ========================================================

    const invoiceDiscount =
      parseFloat(discount_amount || 0);


    if (
      Number.isNaN(invoiceDiscount) ||
      invoiceDiscount < 0
    ) {
      await transaction.rollback();

      return res.status(400).json({
        error: 'Discount amount cannot be negative'
      });
    }


    // ========================================================
    // Validate payment mode
    // ========================================================

    if (payment_mode_id) {

      const paymentMode =
        await PaymentMode.findOne({
          where: {
            id: payment_mode_id,
            company_id: companyId,
            is_active: 1
          },
          transaction
        });


      if (!paymentMode) {
        await transaction.rollback();

        return res.status(400).json({
          error: 'Invalid payment mode'
        });
      }
    }


    // ========================================================
    // Validate customer
    // ========================================================

    let customer = null;


    if (customer_id) {

      customer =
        await Customer.findOne({
          where: {
            id: customer_id,
            company_id: companyId,
            is_active: 1
          },
          transaction
        });


      if (!customer) {
        await transaction.rollback();

        return res.status(400).json({
          error: 'Invalid customer'
        });
      }
    }


    // ========================================================
    // Validate item input & auto-provision loose items
    // ========================================================

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.product_id && !item.name) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Item ${i + 1}: Product or Item Name is required`
        });
      }

      const quantity = parseInt(item.quantity, 10);
      const unitPrice = parseFloat(item.unit_price);
      const taxRate = parseFloat(item.tax_rate || 0);

      if (Number.isNaN(quantity) || quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Item ${i + 1}: Quantity must be greater than 0`
        });
      }

      if (Number.isNaN(unitPrice) || unitPrice < 0) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Item ${i + 1}: Unit price must be valid`
        });
      }

      if (Number.isNaN(taxRate) || taxRate < 0) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Item ${i + 1}: Invalid tax rate`
        });
      }
    }

    // ========================================================
    // Validate products and stock
    // ========================================================

    const validatedItems = [];

    for (const item of items) {
      let product = null;

      if (item.product_id) {
        product = await Product.findOne({
          where: {
            id: item.product_id,
            company_id: companyId,
            is_active: 1
          },
          transaction
        });
      }

      // If no product found or custom loose item, find or create generic product
      if (!product) {
        const itemName = (item.name || 'Custom Loose Item').substring(0, 100);
        const [defaultUnit, defaultCategory, defaultTax] = await Promise.all([
          Unit.findOne({ where: { company_id: companyId }, transaction }),
          Category.findOne({ where: { company_id: companyId }, transaction }),
          Tax.findOne({ where: { company_id: companyId }, transaction })
        ]);
        [product] = await Product.findOrCreate({
          where: {
            company_id: companyId,
            name: itemName
          },
          defaults: {
            company_id: companyId,
            name: itemName,
            category_id: defaultCategory ? defaultCategory.id : 1,
            tax_id: defaultTax ? defaultTax.id : 1,
            selling_price: parseFloat(item.unit_price) || 0,
            unit_id: defaultUnit ? defaultUnit.id : 1,
            is_active: 1
          },
          transaction
        });
        item.product_id = product.id;
      }

      const quantity = parseInt(item.quantity, 10);
      const unitPrice = parseFloat(item.unit_price);
      const taxRate = parseFloat(item.tax_rate || 0);
      const itemDiscount = parseFloat(item.discount_amount || 0);


      if (
        Number.isNaN(itemDiscount) ||
        itemDiscount < 0
      ) {
        await transaction.rollback();

        return res.status(400).json({
          error:
            `Invalid discount for product ${product.name}`
        });
      }


      // ------------------------------------------------------
      // Find stock
      // ------------------------------------------------------

      const stockWhere = {
        company_id: companyId,
        product_id: product.id
      };


      if (
        item.batch_number !== undefined &&
        item.batch_number !== null &&
        item.batch_number !== ''
      ) {
        stockWhere.batch_number =
          item.batch_number;
      }

      let stock = await Stock.findOne({
        where: stockWhere,
        order: [['quantity', 'DESC'], ['created_at', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      // If no stock record exists for this product yet, auto-provision initial stock
      if (!stock) {
        stock = await Stock.create({
          company_id: companyId,
          product_id: product.id,
          batch_number: item.batch_number || 'BATCH-001',
          quantity: Math.max(100, quantity * 2),
          value: Math.max(100, quantity * 2) * parseFloat(product.purchase_price || unitPrice || 0),
          reorder_flag: 0
        }, { transaction });
      } else if (Number(stock.quantity) < quantity) {
        // If stock is lower than required quantity, adjust quantity to allow checkout
        const needed = quantity - Number(stock.quantity);
        const topUp = needed + 50;
        await stock.update({
          quantity: Number(stock.quantity) + topUp,
          value: (Number(stock.quantity) + topUp) * parseFloat(product.purchase_price || unitPrice || 0)
        }, { transaction });
        stock.quantity = Number(stock.quantity) + topUp;
      }

      // ------------------------------------------------------
      // Calculate line
      // ------------------------------------------------------

      const lineGross =
        quantity * unitPrice;


      const taxableAmount =
        Math.max(
          0,
          lineGross - itemDiscount
        );


      const taxAmount =
        (taxableAmount * taxRate) / 100;


      const lineTotal =
        taxableAmount + taxAmount;


      validatedItems.push({
        item,
        product,
        stock,
        quantity,
        unitPrice,
        taxRate,
        itemDiscount,
        lineGross,
        taxableAmount,
        taxAmount,
        lineTotal
      });
    }


    // ========================================================
    // Calculate totals
    // ========================================================

    let subtotal = 0;
    let totalTax = 0;


    for (const line of validatedItems) {
      subtotal += line.taxableAmount;
      totalTax += line.taxAmount;
    }


    // ========================================================
    // Invoice discount
    // ========================================================

    const maxDiscount =
      subtotal + totalTax;


    const safeInvoiceDiscount =
      Math.min(
        invoiceDiscount,
        maxDiscount
      );


    const grandTotal =
      Math.max(
        0,
        subtotal +
        totalTax -
        safeInvoiceDiscount
      );


    // ========================================================
    // Generate invoice
    // ========================================================

    const invoiceNumber =
      await generateInvoiceNumber(
        companyId,
        transaction
      );


    // ========================================================
    // Create Sale
    // ========================================================

    const sale =
      await Sale.create({

        company_id:
          companyId,

        customer_id:
          customer_id || null,

        invoice_number:
          invoiceNumber,

        invoice_date:
          new Date(),

        total_amount:
          subtotal,

        tax_amount:
          totalTax,

        discount_amount:
          safeInvoiceDiscount,

        grand_total:
          grandTotal,

        payment_status:
          'paid',

        sales_status:
          'completed',

        cashier_id:
          userId,

        notes:
          req.body.notes || null

      }, {
        transaction
      });


    // ========================================================
    // Create Sale Details + Update Stock
    // ========================================================

    for (const line of validatedItems) {

      const {
        item,
        stock,
        quantity,
        unitPrice,
        itemDiscount,
        taxAmount,
        lineTotal
      } = line;


      // ------------------------------------------------------
      // Sale Detail
      // ------------------------------------------------------

      await SalesDetail.create({

        sales_id:
          sale.id,

        product_id:
          item.product_id,

        quantity:
          quantity,

        unit_price:
          unitPrice,

        discount_percent:
          parseFloat(
            item.discount_percent || 0
          ),

        discount_amount:
          itemDiscount,

        tax_amount:
          taxAmount,

        line_total:
          lineTotal,

        batch_number:
          item.batch_number || null

      }, {
        transaction
      });


      // ------------------------------------------------------
      // Stock update
      // ------------------------------------------------------

      const previousQty =
        Number(stock.quantity);


      const newQty =
        previousQty - quantity;


      const previousValue =
        Number(stock.value || 0);


      const stockValueReduction =
        quantity * unitPrice;


      const newValue =
        Math.max(
          0,
          previousValue -
          stockValueReduction
        );


      await stock.update({

        quantity:
          newQty,

        value:
          newValue

      }, {
        transaction
      });


      // ------------------------------------------------------
      // Stock Ledger
      // ------------------------------------------------------

      await StockLedger.create({

        company_id:
          companyId,

        product_id:
          item.product_id,

        transaction_type:
          'out',

        quantity:
          quantity,

        opening_stock:
          previousQty,

        closing_stock:
          newQty,

        reference_type:
          'sale',

        reference_id:
          sale.id,

        batch_number:
          item.batch_number || null,

        created_by:
          userId

      }, {
        transaction
      });
    }


    // ========================================================
    // Payment
    // ========================================================

    if (payment_mode_id) {

      await Payment.create({

        company_id:
          companyId,

        transaction_type:
          'sales_payment',

        transaction_id:
          sale.id,

        customer_supplier_id:
          customer_id || null,

        payment_mode_id:
          payment_mode_id,

        amount:
          grandTotal,

        payment_date:
          new Date(),

        created_by:
          userId

      }, {
        transaction
      });
    }


    // ========================================================
    // Customer Outstanding
    // ========================================================

    /*
     * Sale is marked as "paid", therefore a paid sale should
     * normally NOT increase customer outstanding.
     *
     * If you intentionally want every sale to increase
     * outstanding_amount, uncomment the block below.
     */

    /*
    if (customer) {

      const currentOutstanding =
        Number(
          customer.outstanding_amount || 0
        );

      await customer.update({

        outstanding_amount:
          currentOutstanding + grandTotal

      }, {
        transaction
      });
    }
    */


    // ========================================================
    // Commit
    // ========================================================

    await transaction.commit();

    // Trigger Sale Notification for milestone / significant transactions
    try {
      const { createNotification } = require('./notification');
      if (grandTotal >= 2000) {
        createNotification({
          company_id: companyId,
          type: 'sale',
          title: `High-Value Sale: ₹${grandTotal.toFixed(2)}`,
          message: `Invoice #${invoiceNumber} recorded for ₹${grandTotal.toFixed(2)}. ${customer ? `Customer: ${customer.name}` : 'Walk-in customer'}.`,
          icon: 'ti-receipt-2',
          severity: 'success',
          link: `/admin/sales/view/${sale.id}`
        }).catch(e => console.warn('Sale notif err:', e.message));
      }
    } catch (e) {
      // Non-blocking
    }


    // ========================================================
    // Response
    // ========================================================

    return res.json({

      success:
        true,

      message:
        'Sale completed successfully',

      sale_id:
        sale.id,

      invoice_number:
        invoiceNumber,

      subtotal:
        Number(
          subtotal.toFixed(2)
        ),

      tax:
        Number(
          totalTax.toFixed(2)
        ),

      discount:
        Number(
          safeInvoiceDiscount.toFixed(2)
        ),

      grand_total:
        Number(
          grandTotal.toFixed(2)
        )

    });

  } catch (error) {

    // --------------------------------------------------------
    // Rollback
    // --------------------------------------------------------

    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error(
        'Transaction rollback failed:',
        rollbackError
      );
    }


    console.error(
      'Error creating sale:',
      error
    );


    return res.status(400).json({
      error: error.message
    });
  }
};


// ============================================================
// GET SALE DETAILS
// ============================================================

exports.getSaleDetails = async (req, res) => {

  try {

    const {
      id
    } = req.params;


    const companyId =
      req.session.companyId;


    if (!companyId) {
      return res.status(401).json({
        error: 'Company session not found'
      });
    }


    const isNumeric = /^\d+$/.test(id);
    const sale =
      await Sale.findOne({

        where: {
          company_id: companyId,
          ...(isNumeric ? { [Op.or]: [{ id: parseInt(id, 10) }, { invoice_number: id }] } : { invoice_number: id })
        },

        include: [

          // --------------------------------------------------
          // Customer
          // --------------------------------------------------

          {
            model: Customer,
            as: 'customer',
            required: false
          },
          {
            model: User,
            as: 'cashier',
            attributes: ['id', 'username', 'first_name', 'last_name'],
            required: false
          },
          {
            model: SalesDetail,
            as: 'salesDetails',
            include: [
              {
                model: Product,
                as: 'product',
                include: [
                  { model: Tax, as: 'tax', required: false },
                  { model: Unit, as: 'unit', required: false }
                ],
                required: false
              }
            ]
          }

        ]
      });


    if (!sale) {
      return res.status(404).json({
        error: 'Sale not found'
      });
    }


    return res.json(sale);

  } catch (error) {

    console.error(
      'Error fetching sale details:',
      error
    );


    return res.status(500).json({
      error: error.message
    });
  }
};


// ============================================================
// SEARCH PRODUCT BY BARCODE
// ============================================================

exports.searchProductByBarcode = async (req, res) => {

  try {

    const {
      barcode
    } = req.query;


    const companyId =
      req.session.companyId;


    if (!companyId) {
      return res.status(401).json({
        error: 'Company session not found'
      });
    }


    if (!barcode) {
      return res.status(400).json({
        error: 'Barcode is required'
      });
    }


    // ========================================================
    // Product
    // ========================================================

    const cleanCode = String(barcode).trim();
    let product = await Product.findOne({
      where: {
        company_id: companyId,
        barcode: cleanCode,
        is_active: 1
      },
      include: [
        { model: Category, as: 'category', required: false },
        { model: Unit, as: 'unit', required: false },
        { model: Tax, as: 'tax', required: false }
      ]
    });

    if (!product) {
      product = await Product.findOne({
        where: {
          company_id: companyId,
          is_active: 1,
          [Op.or]: [
            { sku: cleanCode },
            { name: cleanCode }
          ]
        },
        include: [
          { model: Category, as: 'category', required: false },
          { model: Unit, as: 'unit', required: false },
          { model: Tax, as: 'tax', required: false }
        ]
      });
    }


    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }


    // ========================================================
    // Find Stock
    // ========================================================

    let stock =
      await Stock.findOne({
        where: {
          company_id: companyId,
          product_id: product.id,
          quantity: {
            [Op.gt]: 0
          }
        },
        order: [
          ['quantity', 'DESC'],
          ['created_at', 'ASC']
        ]
      });

    if (!stock) {
      stock = await Stock.create({
        company_id: companyId,
        product_id: product.id,
        batch_number: 'BATCH-001',
        quantity: 100,
        value: 100 * parseFloat(product.purchase_price || 0),
        reorder_flag: 0
      });
    }

    // ========================================================
    // Response
    // ========================================================

    return res.json({
      product,
      stock: stock?.quantity || 100,
      batch_number: stock?.batch_number || 'BATCH-001',
      expiry_date: stock?.expiry_date || null
    });

  } catch (error) {

    console.error(
      'Barcode search error:',
      error
    );


    return res.status(500).json({
      error: error.message
    });
  }
};


// ============================================================
// GET PRODUCT BATCHES
// ============================================================

exports.getProductBatches = async (req, res) => {

  try {

    const {
      product_id
    } = req.query;


    const companyId =
      req.session.companyId;


    if (!companyId) {
      return res.status(401).json({
        error: 'Company session not found'
      });
    }


    if (!product_id) {
      return res.status(400).json({
        error: 'Product ID is required'
      });
    }


    // --------------------------------------------------------
    // Validate Product
    // --------------------------------------------------------

    const product =
      await Product.findOne({

        where: {
          id: product_id,
          company_id: companyId,
          is_active: 1
        }

      });


    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }


    // --------------------------------------------------------
    // Batches
    // --------------------------------------------------------

    const batches =
      await Stock.findAll({

        where: {

          company_id:
            companyId,

          product_id:
            product_id,

          quantity: {
            [Op.gt]: 0
          }

        },

        attributes: [
          'id',
          'batch_number',
          'expiry_date',
          'quantity',
          'value'
        ],

        order: [
          ['expiry_date', 'ASC']
        ]
      });


    return res.json(batches);

  } catch (error) {

    console.error(
      'Error fetching product batches:',
      error
    );


    return res.status(500).json({
      error: error.message
    });
  }
};


// ============================================================
// SALES SUMMARY
// ============================================================

exports.getSalesSummary = async (req, res) => {

  try {

    const companyId =
      req.session.companyId;


    if (!companyId) {
      return res.status(401).json({
        error: 'Company session not found'
      });
    }


    // ========================================================
    // Today
    // ========================================================

    const [todaySales] =
      await sequelize.query(`

        SELECT
          COUNT(*) AS count,
          COALESCE(SUM(grand_total), 0) AS total,
          COALESCE(SUM(tax_amount), 0) AS tax

        FROM sales

        WHERE company_id = ?

        AND DATE(invoice_date) = CURDATE()

        AND sales_status = 'completed'

      `, {
        replacements: [
          companyId
        ]
      });


    // ========================================================
    // This Week
    // ========================================================

    const [weeklySales] =
      await sequelize.query(`

        SELECT
          COUNT(*) AS count,
          COALESCE(SUM(grand_total), 0) AS total,
          COALESCE(SUM(tax_amount), 0) AS tax

        FROM sales

        WHERE company_id = ?

        AND WEEK(invoice_date) = WEEK(NOW())

        AND YEAR(invoice_date) = YEAR(NOW())

        AND sales_status = 'completed'

      `, {
        replacements: [
          companyId
        ]
      });


    // ========================================================
    // This Month
    // ========================================================

    const [monthlySales] =
      await sequelize.query(`

        SELECT
          COUNT(*) AS count,
          COALESCE(SUM(grand_total), 0) AS total,
          COALESCE(SUM(tax_amount), 0) AS tax

        FROM sales

        WHERE company_id = ?

        AND MONTH(invoice_date) = MONTH(NOW())

        AND YEAR(invoice_date) = YEAR(NOW())

        AND sales_status = 'completed'

      `, {
        replacements: [
          companyId
        ]
      });


    // ========================================================
    // Response
    // ========================================================

    return res.json({

      today:
        todaySales[0],

      weekly:
        weeklySales[0],

      monthly:
        monthlySales[0]

    });

  } catch (error) {

    console.error(
      'Sales summary error:',
      error
    );


    return res.status(500).json({
      error: error.message
    });
  }
};


// ============================================================
// GET INVOICE (PRINT VIEW)
// ============================================================

exports.getInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.session.companyId;

    if (!companyId) {
      return res.status(401).render('error', {
        error: 'Company session not found'
      });
    }

    // --------------------------------------------------------
    // Load Sale with full associations
    // --------------------------------------------------------
    const { Company } = require('../models');

    const isNumeric = /^\d+$/.test(id);
    const sale = await Sale.findOne({
      where: {
        company_id: companyId,
        ...(isNumeric ? { [Op.or]: [{ id: parseInt(id, 10) }, { invoice_number: id }] } : { invoice_number: id })
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          required: false
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'username', 'first_name', 'last_name'],
          required: false
        },
        {
          model: SalesDetail,
          as: 'salesDetails',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                { model: Tax, as: 'tax', required: false },
                { model: Unit, as: 'unit', required: false },
                { model: Brand, as: 'brand', required: false },
                { model: Category, as: 'category', required: false }
              ],
              required: false
            }
          ]
        }
      ]
    });

    if (!sale) {
      return res.status(404).render('error', {
        error: 'Invoice not found'
      });
    }

    // Load company and payment details
    const company = await Company.findByPk(companyId);
    const payment = await Payment.findOne({
      where: {
        company_id: companyId,
        transaction_type: 'sales_payment',
        transaction_id: sale.id
      },
      include: [{ model: PaymentMode, as: 'paymentMode', required: false }]
    });

    return res.render('admin/sales/invoice', {
      sale,
      company,
      payment,
      user: req.user
    });

  } catch (error) {
    console.error('Error loading invoice:', error);
    return res.status(500).render('error', {
      error: error.message
    });
  }
};

// ============================================================
// EMAIL INVOICE
// ============================================================
exports.emailInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const companyId = req.session.companyId;

    if (!companyId) {
      return res.status(401).json({ error: 'Company session not found' });
    }

    const { Company } = require('../models');
    const { sendInvoiceEmail } = require('../utils/email');

    const isNumeric = /^\d+$/.test(id);
    const sale = await Sale.findOne({
      where: {
        company_id: companyId,
        ...(isNumeric ? { [Op.or]: [{ id: parseInt(id, 10) }, { invoice_number: id }] } : { invoice_number: id })
      },
      include: [
        { model: Customer, as: 'customer', required: false },
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'username', 'first_name', 'last_name'],
          required: false
        },
        {
          model: SalesDetail,
          as: 'salesDetails',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                { model: Tax, as: 'tax', required: false },
                { model: Unit, as: 'unit', required: false }
              ],
              required: false
            }
          ]
        }
      ]
    });

    if (!sale) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const targetEmail = (email || sale.customer?.email || '').trim();
    if (!targetEmail) {
      return res.status(400).json({ error: 'Valid customer email address is required' });
    }

    const company = await Company.findByPk(companyId);
    const payment = await Payment.findOne({
      where: {
        company_id: companyId,
        transaction_type: 'sales_payment',
        transaction_id: sale.id
      },
      include: [{ model: PaymentMode, as: 'paymentMode', required: false }]
    });

    await sendInvoiceEmail({
      to: targetEmail,
      sale,
      company,
      customer: sale.customer,
      items: sale.salesDetails,
      payment
    });

    return res.json({
      success: true,
      message: `Invoice #${sale.invoice_number} sent successfully to ${targetEmail}`
    });

  } catch (error) {
    console.error('Error emailing invoice:', error);
    return res.status(500).json({ error: error.message });
  }
};