// Shared helper to call the API
async function apiRequest(url, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ---- Dashboard-only logic ----
if (document.getElementById('customerTableBody')) {
  const token = localStorage.getItem('token');
  if (!token) window.location.href = 'login.html';

  document.getElementById('welcomeMsg').textContent =
    'Hi, ' + (localStorage.getItem('userName') || 'there') + '!';

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
  });

  let currentPage = 1;
  let selectedCustomerId = null;

  async function loadCustomers() {
    const search = document.getElementById('searchInput').value;
    const sortBy = document.getElementById('sortBy').value;
    const order = document.getElementById('order').value;
    const params = new URLSearchParams({ search, sortBy, order, page: currentPage, limit: 5 });

    try {
      const { data, pagination } = await apiRequest(`/api/customers?${params.toString()}`);
      const tbody = document.getElementById('customerTableBody');
      tbody.innerHTML = '';
      data.forEach((c) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${c.name}</td>
          <td>${c.phone || '-'}</td>
          <td>
            <button onclick="openSubscribeModal(${c.id})">Subscribe</button>
            <button onclick="deleteCustomer(${c.id})">Delete</button>
          </td>`;
        tbody.appendChild(tr);
      });

      const paginationDiv = document.getElementById('pagination');
      paginationDiv.innerHTML = '';
      for (let i = 1; i <= pagination.totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === pagination.page) btn.classList.add('active-page');
        btn.addEventListener('click', () => {
          currentPage = i;
          loadCustomers();
        });
        paginationDiv.appendChild(btn);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  document.getElementById('addCustomerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    try {
      await apiRequest('/api/customers', 'POST', { name, phone });
      document.getElementById('custName').value = '';
      document.getElementById('custPhone').value = '';
      loadCustomers();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('searchInput').addEventListener('input', () => {
    currentPage = 1;
    loadCustomers();
  });
  document.getElementById('sortBy').addEventListener('change', loadCustomers);
  document.getElementById('order').addEventListener('change', loadCustomers);

  window.deleteCustomer = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await apiRequest(`/api/customers/${id}`, 'DELETE');
      loadCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  window.openSubscribeModal = async (customerId) => {
    selectedCustomerId = customerId;
    const plans = await apiRequest('/api/plans');
    const select = document.getElementById('planSelect');
    select.innerHTML = plans
      .map((p) => `<option value="${p.id}">${p.name} (${p.meals_per_day} meals/day, Rs.${p.price_per_meal}/meal)</option>`)
      .join('');
    document.getElementById('subscribeModal').classList.remove('hidden');
  };

  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('subscribeModal').classList.add('hidden');
    document.getElementById('subscribeResult').textContent = '';
  });

  document.getElementById('confirmSubscribe').addEventListener('click', async () => {
    const planId = document.getElementById('planSelect').value;
    const durationDays = document.getElementById('durationDays').value;
    try {
      const sub = await apiRequest('/api/subscriptions', 'POST', {
        customerId: selectedCustomerId,
        planId,
        durationDays: Number(durationDays),
      });
      document.getElementById('subscribeResult').textContent = `Subscribed! Total bill: Rs. ${sub.totalBill}`;
    } catch (err) {
      document.getElementById('subscribeResult').textContent = err.message;
    }
  });

  loadCustomers();
}
