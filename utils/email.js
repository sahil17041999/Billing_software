const nodemailer = require('nodemailer');

/**
 * Initialize Transporter with company database credentials or environment fallback
 */
async function createTransporter(companyId) {
  try {
    if (companyId) {
      const { SmtpSetting } = require('../models');
      const smtp = await SmtpSetting.findOne({ where: { company_id: companyId } });

      if (smtp && smtp.is_enabled && smtp.host) {
        const port = smtp.port ? parseInt(smtp.port, 10) : 587;
        const opts = {
          host: smtp.host,
          port: port,
          secure: smtp.use_ssl || port === 465
        };

        if (smtp.require_auth && smtp.password) {
          opts.auth = {
            user: smtp.username || smtp.from_email,
            pass: smtp.password
          };
        }

        return {
          transporter: nodemailer.createTransport(opts),
          smtpConfig: smtp
        };
      }
    }
  } catch (err) {
    console.warn('Could not load company SMTP setting from DB, using fallback:', err.message);
  }

  // Fallback to environment variables
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      }),
      smtpConfig: null
    };
  }

  // Fallback test/logger transport when SMTP credentials not provided
  return {
    transporter: {
      sendMail: async (mailOptions) => {
        console.log('----------------------------------------------------');
        console.log('📧 [MOCK EMAIL DISPATCH - SMTP GATEWAY NOT ENABLED]');
        console.log(`To: ${mailOptions.to}`);
        console.log(`From: ${mailOptions.from}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log('----------------------------------------------------');
        return { messageId: 'mock-msg-' + Date.now() };
      }
    },
    smtpConfig: null
  };
}

/**
 * Generate formatted HTML Invoice Template for email with Company Logo support
 */
function buildInvoiceHtml({ sale, company, customer, items, payment }) {
  const companyName = company?.name || 'Grocery Billing Store';
  const companyAddress = company?.address || '';
  const companyPhone = company?.phone || '';
  const companyGstin = company?.gstin || '';
  const companyLogo = company?.logo_path || '';
  
  const customerName = customer?.name || 'Walk-in Customer';
  const invoiceNum = sale.invoice_number;
  const invoiceDate = new Date(sale.invoice_date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  const paymentMode = payment?.paymentMode?.name || 'Cash / POS';

  let itemsRows = '';
  (items || []).forEach((item, idx) => {
    const pName = item.product?.name || `Product #${item.product_id}`;
    const qty = item.quantity;
    const price = Number(item.unit_price).toFixed(2);
    const lineTotal = Number(item.line_total).toFixed(2);

    itemsRows += `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 8px; font-size: 13px; color: #64748b;">${idx + 1}</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #1e293b; font-weight: 600;">${pName}</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #1e293b; text-align: center;">${qty}</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #1e293b; text-align: right;">₹${price}</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #1e293b; text-align: right; font-weight: 700;">₹${lineTotal}</td>
      </tr>
    `;
  });

  const logoMarkup = companyLogo
    ? `<div style="margin-bottom: 12px;"><img src="${companyLogo.startsWith('http') ? companyLogo : ((process.env.APP_URL || 'http://localhost:3000') + companyLogo)}" alt="${companyName}" style="max-height: 48px; max-width: 180px; object-fit: contain; background: white; padding: 4px 8px; border-radius: 6px;" /></div>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice #${invoiceNum}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        
        <!-- Header Banner with Logo -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); color: #ffffff; padding: 28px 32px;">
          ${logoMarkup}
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">${companyName}</h1>
              <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.85; color: #e2e8f0;">${companyAddress} ${companyPhone ? '• Tel: ' + companyPhone : ''}</p>
              ${companyGstin ? `<p style="margin: 2px 0 0; font-size: 11px; opacity: 0.85; color: #cbd5e1;">GSTIN: ${companyGstin}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">TAX INVOICE</span>
              <div style="font-size: 16px; font-weight: 800; margin-top: 6px; font-family: monospace; color: #93c5fd;">#${invoiceNum}</div>
            </div>
          </div>
        </div>

        <!-- Details Info -->
        <div style="padding: 20px 32px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Billed To</div>
            <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 2px;">${customerName}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Invoice Date</div>
            <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 2px;">${invoiceDate}</div>
          </div>
        </div>

        <!-- Items Table -->
        <div style="padding: 24px 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left;">
                <th style="padding: 8px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; width: 30px;">#</th>
                <th style="padding: 8px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Item</th>
                <th style="padding: 8px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: center; width: 50px;">Qty</th>
                <th style="padding: 8px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: right; width: 80px;">Rate</th>
                <th style="padding: 8px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: right; width: 90px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- Totals Breakdown -->
          <div style="margin-top: 20px; padding-top: 16px; border-top: 2px solid #e2e8f0; display: flex; justify-content: flex-end;">
            <div style="width: 240px;">
              <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #64748b;">
                <span>Subtotal:</span>
                <span style="font-weight: 600; color: #1e293b;">₹${Number(sale.total_amount || 0).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #64748b;">
                <span>Tax (GST):</span>
                <span style="font-weight: 600; color: #1e293b;">₹${Number(sale.tax_amount || 0).toFixed(2)}</span>
              </div>
              ${Number(sale.discount_amount) > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #ef4444;">
                <span>Discount:</span>
                <span style="font-weight: 600;">-₹${Number(sale.discount_amount).toFixed(2)}</span>
              </div>` : ''}
              <div style="display: flex; justify-content: space-between; padding: 10px 0 0; font-size: 16px; font-weight: 800; color: #1e3a8a; border-top: 1px dashed #cbd5e1; margin-top: 6px;">
                <span>Grand Total:</span>
                <span>₹${Number(sale.grand_total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Info Banner -->
        <div style="background: #f1f5f9; padding: 12px 32px; font-size: 12px; color: #475569; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
          <span>Payment Method: <strong>${paymentMode}</strong></span>
          <span style="color: #10b981; font-weight: 700;">✓ PAID</span>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0 0 6px;">Thank you for shopping with <strong>${companyName}</strong>!</p>
          <p style="margin: 0; font-size: 11px;">This is a computer-generated tax receipt.</p>
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Send invoice email using company settings
 */
async function sendInvoiceEmail({ to, sale, company, customer, items, payment }) {
  if (!to) throw new Error('Recipient email address is required');

  const companyId = company?.id || sale?.company_id;
  const { transporter, smtpConfig } = await createTransporter(companyId);
  const htmlContent = buildInvoiceHtml({ sale, company, customer, items, payment });

  const senderName = smtpConfig?.from_name || company?.name || 'Cloud Point of Sale';
  const senderEmail = smtpConfig?.from_email || process.env.SMTP_FROM || 'invoices@grocerybilling.com';

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: to.trim(),
    subject: `Tax Invoice #${sale.invoice_number} from ${senderName}`,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = {
  createTransporter,
  sendInvoiceEmail,
  buildInvoiceHtml
};
