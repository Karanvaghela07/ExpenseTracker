// ── Currency & Number ──────────────────────────────────
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

// ── Date Helpers ──────────────────────────────────────
export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateShort = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

export const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

export const isToday = (dateStr) => {
  return dateStr === getToday();
};

export const isThisMonth = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

export const isLastMonth = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
};

export const getLast30Days = () => {
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

export const getDaysInCurrentMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
};

export const getDayOfMonth = () => {
  return new Date().getDate();
};

// ── Category Helpers ──────────────────────────────────
export const CATEGORIES = [
  'Food', 'Travel', 'Groceries', 'Rent/Bills', 'Shopping',
  'Entertainment', 'Health', 'Education', 'Other'
];

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Debit Card', 'Credit Card'];

export const getCategoryColor = (category) => {
  const colors = {
    'Food': '#f97316',
    'Travel': '#3b82f6',
    'Groceries': '#10b981',
    'Rent/Bills': '#8b5cf6',
    'Shopping': '#ec4899',
    'Entertainment': '#f59e0b',
    'Health': '#ef4444',
    'Education': '#06b6d4',
    'Other': '#64748b',
  };
  return colors[category] || '#64748b';
};

export const getCategoryClass = (category) => {
  const classes = {
    'Food': 'badge-food',
    'Travel': 'badge-travel',
    'Groceries': 'badge-groceries',
    'Rent/Bills': 'badge-rent',
    'Shopping': 'badge-shopping',
    'Entertainment': 'badge-entertainment',
    'Health': 'badge-health',
    'Education': 'badge-education',
    'Other': 'badge-other',
  };
  return classes[category] || 'badge-other';
};

// ── Calculation Helpers ───────────────────────────────
export const sumExpenses = (expenses) => {
  return expenses.reduce((sum, e) => sum + Number(e.amount), 0);
};

export const getTodaysSpend = (expenses) => {
  return sumExpenses(expenses.filter(e => isToday(e.date)));
};

export const getMonthSpend = (expenses) => {
  return sumExpenses(expenses.filter(e => isThisMonth(e.date)));
};

export const getLastMonthSpend = (expenses) => {
  return sumExpenses(expenses.filter(e => isLastMonth(e.date)));
};

export const getSpendingByCategory = (expenses) => {
  const map = {};
  expenses.filter(e => isThisMonth(e.date)).forEach(e => {
    map[e.category] = (map[e.category] || 0) + Number(e.amount);
  });
  return Object.entries(map).map(([name, value]) => ({
    name,
    value,
    color: getCategoryColor(name),
  })).sort((a, b) => b.value - a.value);
};

export const getLast30DaysTrend = (expenses) => {
  const days = getLast30Days();
  return days.map(date => {
    const dayTotal = sumExpenses(expenses.filter(e => e.date === date));
    return {
      date: formatDateShort(date),
      amount: dayTotal,
    };
  });
};

export const getTopCategories = (expenses, count = 5) => {
  return getSpendingByCategory(expenses).slice(0, count);
};

export const getHighestExpense = (expenses) => {
  const thisMonth = expenses.filter(e => isThisMonth(e.date));
  if (thisMonth.length === 0) return null;
  return thisMonth.reduce((max, e) => Number(e.amount) > Number(max.amount) ? e : max, thisMonth[0]);
};

export const getAverageDailySpend = (expenses) => {
  const dayOfMonth = getDayOfMonth();
  const monthSpend = getMonthSpend(expenses);
  return dayOfMonth > 0 ? Math.round(monthSpend / dayOfMonth) : 0;
};

export const getSpendingPrediction = (expenses) => {
  const avgDaily = getAverageDailySpend(expenses);
  const daysInMonth = getDaysInCurrentMonth();
  return avgDaily * daysInMonth;
};

export const getMonthlyComparison = (expenses) => {
  const categories = CATEGORIES;
  return categories.map(cat => {
    const thisMonth = sumExpenses(expenses.filter(e => isThisMonth(e.date) && e.category === cat));
    const lastMonth = sumExpenses(expenses.filter(e => isLastMonth(e.date) && e.category === cat));
    return { category: cat, thisMonth, lastMonth };
  }).filter(c => c.thisMonth > 0 || c.lastMonth > 0);
};

// ── People / Balance Helpers ──────────────────────────
export const calculateBalances = (people, expenses) => {
  return people.map(person => {
    const sharedExpenses = expenses.filter(e => e.isShared && e.sharedWith === person.name);
    let balance = 0;
    sharedExpenses.forEach(e => {
      if (e.settledUp) return;
      const splitAmount = e.splitAmount || Number(e.amount);
      if (e.whoPaid === 'I paid for them') {
        balance += splitAmount;
      } else {
        balance -= splitAmount;
      }
    });
    return { ...person, balance, transactionCount: sharedExpenses.length };
  });
};

// ── ID Generator ──────────────────────────────────────
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// ── CSV Export ─────────────────────────────────────────
export const exportToCSV = (expenses) => {
  const headers = ['Date', 'Category', 'Amount', 'Payment Method', 'Note', 'Shared', 'Shared With'];
  const rows = expenses.map(e => [
    e.date,
    e.category,
    e.amount,
    e.paymentMethod,
    `"${(e.note || '').replace(/"/g, '""')}"`,
    e.isShared ? 'Yes' : 'No',
    e.sharedWith || '',
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `expenses_${getToday()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};
