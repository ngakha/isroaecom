const { v4: uuid } = require('uuid');
const { getDatabase } = require('../../core/database');
const { AppError } = require('../../core/middleware/error-handler');
const { sendMail } = require('../../utils/mailer');
const settingsService = require('../settings/settings.service');
const config = require('../../../config/default');
const eventBus = require('../../core/events');

class CallRequestsService {
  constructor() {
    this.db = () => getDatabase();
  }

  async list({ page = 1, limit = 25, status, search, sortBy = 'created_at', sortOrder = 'desc' }) {
    const db = this.db();
    let query = db('call_requests');

    if (status) query = query.where('status', status);
    if (search) {
      query = query.where((b) => {
        b.whereILike('customer_name', `%${search}%`)
          .orWhereILike('phone', `%${search}%`)
          .orWhereILike('product_name', `%${search}%`);
      });
    }

    const [{ count }] = await query.clone().count('id as count');
    const offset = (page - 1) * limit;

    const data = await query
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async findById(id) {
    const db = this.db();
    const request = await db('call_requests').where({ id }).first();
    if (!request) throw new AppError('Call request not found', 404);
    return request;
  }

  async create(data) {
    const db = this.db();
    const id = uuid();

    const [request] = await db('call_requests')
      .insert({
        id,
        customer_name: data.customerName,
        phone: data.phone,
        product_id: data.productId || null,
        product_name: data.productName || null,
        message: data.message || null,
        status: 'new',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    // Send email notification (non-blocking)
    this.sendNotificationEmail(request).catch(() => {});

    // Real-time notification to admin
    eventBus.emit('notification', {
      type: 'new_call_request',
      customerName: request.customer_name,
      phone: request.phone,
      productName: request.product_name,
    });

    return request;
  }

  async updateStatus(id, status) {
    const db = this.db();
    const request = await db('call_requests').where({ id }).first();
    if (!request) throw new AppError('Call request not found', 404);

    const [updated] = await db('call_requests')
      .where({ id })
      .update({ status, updated_at: new Date() })
      .returning('*');

    return updated;
  }

  async delete(id) {
    const db = this.db();
    const deleted = await db('call_requests').where({ id }).del();
    if (!deleted) throw new AppError('Call request not found', 404);
  }

  async getStats() {
    const db = this.db();
    const counts = await db('call_requests')
      .select('status')
      .count('id as count')
      .groupBy('status');

    return counts.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});
  }

  async sendNotificationEmail(request) {
    let storeEmail;
    try {
      storeEmail = await settingsService.get('store_email');
    } catch {
      // ignore
    }
    const to = storeEmail || config.mail.from;
    if (!to) return;

    const productLine = request.product_name
      ? `<tr><td style="padding:6px 0;color:#666;">Product:</td><td style="padding:6px 0;font-weight:600;">${request.product_name}</td></tr>`
      : '';
    const messageLine = request.message
      ? `<tr><td style="padding:6px 0;color:#666;">Message:</td><td style="padding:6px 0;">${request.message}</td></tr>`
      : '';

    await sendMail({
      to,
      subject: `New Call Request — ${request.customer_name}`,
      html: `
        <div style="font-family:Helvetica,Arial,sans-serif;max-width:500px;margin:0 auto;">
          <h2 style="color:#1a1a2e;margin-bottom:16px;">New Call Request</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#666;">Name:</td><td style="padding:6px 0;font-weight:600;">${request.customer_name}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Phone:</td><td style="padding:6px 0;font-weight:600;">${request.phone}</td></tr>
            ${productLine}
            ${messageLine}
            <tr><td style="padding:6px 0;color:#666;">Date:</td><td style="padding:6px 0;">${new Date(request.created_at).toLocaleString()}</td></tr>
          </table>
        </div>
      `,
    });
  }
}

module.exports = new CallRequestsService();
