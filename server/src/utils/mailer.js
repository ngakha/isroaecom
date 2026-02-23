const nodemailer = require('nodemailer');
const config = require('../../config/default');

let transporter = null;

function getTransporter() {
  if (!transporter && config.mail.host) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port === 465,
      auth: {
        user: config.mail.user,
        pass: config.mail.pass,
      },
    });
  }
  return transporter;
}

/**
 * Send an email (non-blocking - logs errors but doesn't throw)
 */
async function sendMail({ to, subject, html }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('[Mailer] SMTP not configured, skipping email:', subject);
    return;
  }

  try {
    await transport.sendMail({
      from: config.mail.from,
      to,
      subject,
      html,
    });
    console.log(`[Mailer] Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`[Mailer] Failed to send email to ${to}:`, error.message);
  }
}

/**
 * Welcome email after registration
 */
async function sendWelcomeEmail({ email, firstName }) {
  await sendMail({
    to: email,
    subject: 'Welcome to PRSHARK!',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #111; margin-bottom: 16px;">
          Welcome, ${firstName}!
        </h1>
        <p style="font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 24px;">
          Your account has been created successfully. You can now enjoy a seamless shopping experience
          with order tracking, wishlists, and more.
        </p>
        <a href="${config.app.url}" style="display: inline-block; background: #111; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
          Start Shopping
        </a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    `,
  });
}

/**
 * Order confirmation email
 */
async function sendOrderConfirmationEmail({ email, customerName, order, items, shippingAddress }) {
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
          <strong style="color: #111; font-size: 14px;">${item.name}</strong>
          ${item.sku ? `<br><span style="color: #999; font-size: 12px;">SKU: ${item.sku}</span>` : ''}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; color: #555; font-size: 14px;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; color: #111; font-size: 14px; font-weight: 500;">
          ${parseFloat(item.total).toFixed(2)} ${order.currency}
        </td>
      </tr>`
    )
    .join('');

  const addressHtml = shippingAddress
    ? `
      <div style="margin-top: 24px; padding: 16px; background: #f9f9f9; border-radius: 8px;">
        <h3 style="font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Shipping Address</h3>
        <p style="font-size: 14px; color: #333; line-height: 1.5; margin: 0;">
          ${shippingAddress.first_name} ${shippingAddress.last_name}<br>
          ${shippingAddress.address_line1}<br>
          ${shippingAddress.address_line2 ? shippingAddress.address_line2 + '<br>' : ''}
          ${shippingAddress.city}${shippingAddress.state ? ', ' + shippingAddress.state : ''}
          ${shippingAddress.postal_code ? ' ' + shippingAddress.postal_code : ''}<br>
          ${shippingAddress.country}
          ${shippingAddress.phone ? '<br>Phone: ' + shippingAddress.phone : ''}
        </p>
      </div>`
    : '';

  await sendMail({
    to: email,
    subject: `Order Confirmed - ${order.order_number}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #111; margin-bottom: 8px;">
          Order Confirmed
        </h1>
        <p style="font-size: 15px; color: #555; margin-bottom: 24px;">
          Thank you, ${customerName}! Your order has been received and is being processed.
        </p>

        <div style="padding: 16px; background: #f9f9f9; border-radius: 8px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 14px; color: #555;">
            <tr>
              <td>Order Number</td>
              <td style="text-align: right; font-weight: 600; color: #111;">${order.order_number}</td>
            </tr>
            <tr>
              <td>Date</td>
              <td style="text-align: right;">${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td>Payment Method</td>
              <td style="text-align: right;">${order.payment_method || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #111;">
              <th style="text-align: left; padding: 8px 0; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Item</th>
              <th style="text-align: center; padding: 8px 0; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
              <th style="text-align: right; padding: 8px 0; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <table style="width: 100%; margin-top: 16px; font-size: 14px;">
          <tr>
            <td style="color: #555; padding: 4px 0;">Subtotal</td>
            <td style="text-align: right; color: #111;">${parseFloat(order.subtotal).toFixed(2)} ${order.currency}</td>
          </tr>
          ${parseFloat(order.shipping_amount) > 0 ? `
          <tr>
            <td style="color: #555; padding: 4px 0;">Shipping</td>
            <td style="text-align: right; color: #111;">${parseFloat(order.shipping_amount).toFixed(2)} ${order.currency}</td>
          </tr>` : ''}
          ${parseFloat(order.discount_amount) > 0 ? `
          <tr>
            <td style="color: #555; padding: 4px 0;">Discount</td>
            <td style="text-align: right; color: #22c55e;">-${parseFloat(order.discount_amount).toFixed(2)} ${order.currency}</td>
          </tr>` : ''}
          ${parseFloat(order.tax_amount) > 0 ? `
          <tr>
            <td style="color: #555; padding: 4px 0;">Tax</td>
            <td style="text-align: right; color: #111;">${parseFloat(order.tax_amount).toFixed(2)} ${order.currency}</td>
          </tr>` : ''}
          <tr style="border-top: 2px solid #111;">
            <td style="color: #111; font-weight: 600; padding: 12px 0; font-size: 16px;">Total</td>
            <td style="text-align: right; color: #111; font-weight: 600; font-size: 16px;">${parseFloat(order.total).toFixed(2)} ${order.currency}</td>
          </tr>
        </table>

        ${addressHtml}

        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          PRSHARK &mdash; Premium products curated for modern living.
        </p>
      </div>
    `,
  });
}

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
};
