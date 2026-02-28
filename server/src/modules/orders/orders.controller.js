const ordersService = require('./orders.service');

class OrdersController {
  async list(req, res, next) {
    try {
      const result = await ordersService.list(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await ordersService.findById(req.params.id);
      res.json({ data: order });
    } catch (error) {
      next(error);
    }
  }

  async myOrders(req, res, next) {
    try {
      const result = await ordersService.list({
        ...req.query,
        customerId: req.user.id,
        archived: 'false',
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async myOrderDetail(req, res, next) {
    try {
      const order = await ordersService.findById(req.params.id);
      // Verify ownership
      if (order.customer_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      res.json({ data: order });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const order = await ordersService.create(req.body);
      res.status(201).json({ data: order });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const order = await ordersService.updateStatus(
        req.params.id,
        req.body.status,
        req.body.note,
        req.user?.id
      );
      res.json({ data: order });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await ordersService.getStats();
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  }

  async adminCreate(req, res, next) {
    try {
      const order = await ordersService.adminCreate(req.body);
      res.status(201).json({ data: order });
    } catch (error) {
      next(error);
    }
  }

  async exportOrders(req, res, next) {
    try {
      const { range, from, to } = req.query;
      const rows = await ordersService.getExportData(range, from, to);

      const headers = [
        'Name', 'Product', 'Qty', 'Price', 'Total',
        'Address', 'Phone 1', 'Phone 2', 'Courier',
        'Payment Type', 'Cost Price', 'Profit', 'Date',
      ];

      const escCsv = (val) => {
        if (val == null) return '';
        const s = String(val);
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"` : s;
      };

      const csvRows = [headers.join(',')];
      for (const r of rows) {
        const total = parseFloat(r.item_total) || 0;
        const shipping = parseFloat(r.shipping_amount) || 0;
        const cost = parseFloat(r.cost_price) || 0;
        let profit = '';
        if (r.cost_price != null) {
          profit = r.payment_type === 'on_delivery'
            ? ((total + shipping) * 0.98 - cost).toFixed(2)
            : (total + shipping - cost).toFixed(2);
        }
        csvRows.push([
          escCsv(r.customer_name),
          escCsv(r.product_name),
          r.quantity,
          r.price,
          total,
          escCsv(r.address),
          escCsv(r.phone),
          escCsv(r.phone2),
          shipping,
          escCsv(r.payment_type),
          cost || '',
          profit,
          new Date(r.created_at).toLocaleDateString('ka-GE'),
        ].join(','));
      }

      const bom = '\uFEFF';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=orders-export.csv');
      res.send(bom + csvRows.join('\n'));
    } catch (error) {
      next(error);
    }
  }

  async archive(req, res, next) {
    try {
      const order = await ordersService.archive(req.params.id);
      res.json({ data: order });
    } catch (error) {
      next(error);
    }
  }

  async unarchive(req, res, next) {
    try {
      const order = await ordersService.unarchive(req.params.id);
      res.json({ data: order });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrdersController();
