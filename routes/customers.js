const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const ALLOWED_SORT_FIELDS = ['name', 'phone', 'created_at'];

// GET /api/customers?search=&page=&limit=&sortBy=&order=
router.get('/', (req, res) => {
  const { search = '', page = 1, limit = 10, sortBy = 'created_at', order = 'desc' } = req.query;

  const sortField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'created_at';
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.max(parseInt(limit) || 10, 1);
  const offset = (pageNum - 1) * limitNum;

  const searchTerm = `%${search}%`;

  db.get(
    'SELECT COUNT(*) as total FROM customers WHERE user_id = ? AND (name LIKE ? OR phone LIKE ?)',
    [req.userId, searchTerm, searchTerm],
    (err, countRow) => {
      if (err) return res.status(500).json({ message: 'Database error' });

      db.all(
        `SELECT * FROM customers WHERE user_id = ? AND (name LIKE ? OR phone LIKE ?)
         ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`,
        [req.userId, searchTerm, searchTerm, limitNum, offset],
        (err, rows) => {
          if (err) return res.status(500).json({ message: 'Database error' });
          res.json({
            data: rows,
            pagination: {
              total: countRow.total,
              page: pageNum,
              limit: limitNum,
              totalPages: Math.ceil(countRow.total / limitNum),
            },
          });
        }
      );
    }
  );
});

// GET /api/customers/:id
router.get('/:id', (req, res) => {
  db.get(
    'SELECT * FROM customers WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId],
    (err, row) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (!row) return res.status(404).json({ message: 'Customer not found' });
      res.json(row);
    }
  );
});

// POST /api/customers
router.post('/', (req, res) => {
  const { name, phone } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });

  db.run(
    'INSERT INTO customers (user_id, name, phone) VALUES (?, ?, ?)',
    [req.userId, name, phone || null],
    function (err) {
      if (err) return res.status(500).json({ message: 'Could not create customer' });
      res.status(201).json({ id: this.lastID, name, phone });
    }
  );
});

// PUT /api/customers/:id
router.put('/:id', (req, res) => {
  const { name, phone } = req.body;
  db.run(
    'UPDATE customers SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ? AND user_id = ?',
    [name, phone, req.params.id, req.userId],
    function (err) {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (this.changes === 0) return res.status(404).json({ message: 'Customer not found' });
      res.json({ message: 'Customer updated' });
    }
  );
});

// DELETE /api/customers/:id
router.delete('/:id', (req, res) => {
  db.run(
    'DELETE FROM customers WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId],
    function (err) {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (this.changes === 0) return res.status(404).json({ message: 'Customer not found' });
      res.json({ message: 'Customer deleted' });
    }
  );
});

module.exports = router;
