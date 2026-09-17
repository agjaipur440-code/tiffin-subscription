const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// POST /api/subscriptions  { customerId, planId, durationDays }
router.post('/', (req, res) => {
  const { customerId, planId, durationDays } = req.body;
  if (!customerId || !planId || !durationDays) {
    return res.status(400).json({ message: 'customerId, planId and durationDays are required' });
  }

  db.get(
    'SELECT * FROM customers WHERE id = ? AND user_id = ?',
    [customerId, req.userId],
    (err, customer) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      db.get('SELECT * FROM plans WHERE id = ?', [planId], (err, plan) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        const totalBill = plan.meals_per_day * plan.price_per_meal * durationDays;
        const startDate = new Date().toISOString().slice(0, 10);

        db.run(
          `INSERT INTO subscriptions (customer_id, plan_id, start_date, duration_days, status, total_bill)
           VALUES (?, ?, ?, ?, 'active', ?)`,
          [customerId, planId, startDate, durationDays, totalBill],
          function (err) {
            if (err) return res.status(500).json({ message: 'Could not create subscription' });
            res.status(201).json({
              id: this.lastID,
              customerId,
              planId,
              startDate,
              durationDays,
              status: 'active',
              totalBill,
            });
          }
        );
      });
    }
  );
});

// PUT /api/subscriptions/:id/cancel
router.put('/:id/cancel', (req, res) => {
  db.run(
    `UPDATE subscriptions SET status = 'cancelled'
     WHERE id = ? AND customer_id IN (SELECT id FROM customers WHERE user_id = ?)`,
    [req.params.id, req.userId],
    function (err) {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (this.changes === 0) return res.status(404).json({ message: 'Subscription not found' });
      res.json({ message: 'Subscription cancelled' });
    }
  );
});

// GET /api/subscriptions/:id/bill
router.get('/:id/bill', (req, res) => {
  db.get(
    `SELECT s.*, c.name as customer_name, p.name as plan_name
     FROM subscriptions s
     JOIN customers c ON s.customer_id = c.id
     JOIN plans p ON s.plan_id = p.id
     WHERE s.id = ? AND c.user_id = ?`,
    [req.params.id, req.userId],
    (err, row) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (!row) return res.status(404).json({ message: 'Subscription not found' });
      res.json(row);
    }
  );
});

// GET /api/subscriptions?customerId=  (list subscriptions, optionally for one customer)
router.get('/', (req, res) => {
  const { customerId } = req.query;
  let query = `SELECT s.*, c.name as customer_name, p.name as plan_name
               FROM subscriptions s
               JOIN customers c ON s.customer_id = c.id
               JOIN plans p ON s.plan_id = p.id
               WHERE c.user_id = ?`;
  const params = [req.userId];
  if (customerId) {
    query += ' AND s.customer_id = ?';
    params.push(customerId);
  }
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

module.exports = router;
