import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Edit2, Trash2, Check, X, ArrowLeft, Plus,
  ShoppingBag, Heart, ShoppingCart, Coffee, Train,
  Home, BookOpen, Utensils, Package, Calendar,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useToast } from '../../components/Toast/Toast';
import Modal from '../../components/Modal/Modal';
import {
  formatCurrency,
  formatDateShort,
  CATEGORIES,
  PAYMENT_METHODS,
} from '../../utils/helpers';
import './History.css';

const CAT_ICONS = {
  Food: Utensils,
  Travel: Train,
  Groceries: ShoppingCart,
  'Rent/Bills': Home,
  Shopping: ShoppingBag,
  Entertainment: Coffee,
  Health: Heart,
  Education: BookOpen,
  Other: Package,
};

const CAT_COLORS = {
  Food: { bg: 'rgba(249,115,22,0.13)', color: '#f97316' },
  Travel: { bg: 'rgba(56,189,248,0.13)', color: '#0ea5e9' },
  Groceries: { bg: 'rgba(16,185,129,0.13)', color: '#10b981' },
  'Rent/Bills': { bg: 'rgba(139,92,246,0.13)', color: '#8b5cf6' },
  Shopping: { bg: 'rgba(236,72,153,0.13)', color: '#ec4899' },
  Entertainment: { bg: 'rgba(245,158,11,0.13)', color: '#f59e0b' },
  Health: { bg: 'rgba(244,63,94,0.13)', color: '#f43f5e' },
  Education: { bg: 'rgba(6,182,212,0.13)', color: '#06b6d4' },
  Other: { bg: 'rgba(100,116,139,0.13)', color: '#64748b' },
};

const History = () => {
  const { state, deleteExpense, editExpense } = useExpense();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});

  const filteredExpenses = useMemo(() => {
    return state.expenses.filter((expense) => {
      const matchSearch =
        (expense.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory ? expense.category === filterCategory : true;
      const matchMethod = filterMethod ? expense.paymentMethod === filterMethod : true;
      return matchSearch && matchCategory && matchMethod;
    });
  }, [state.expenses, searchTerm, filterCategory, filterMethod]);

  const totalFiltered = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteExpense(expenseToDelete.id);
      addToast('Expense deleted', 'success');
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
    } catch (err) {
      console.error(err);
      addToast('Failed to delete expense', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = (expense) => {
    setEditingId(expense.id);
    setEditFields({
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      note: expense.note || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFields({});
  };

  const saveEdit = async (id) => {
    try {
      await editExpense(id, {
        amount: Number(editFields.amount),
        category: editFields.category,
        date: editFields.date,
        paymentMethod: editFields.paymentMethod,
        note: editFields.note,
      });
      addToast('Expense updated', 'success');
      setEditingId(null);
    } catch (err) {
      console.error(err);
      addToast('Failed to update expense', 'error');
    }
  };

  // Group by date
  const groupedExpenses = useMemo(() => {
    const sorted = [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    const groups = {};
    sorted.forEach((exp) => {
      const key = exp.date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(exp);
    });
    return Object.entries(groups);
  }, [filteredExpenses]);

  return (
    <div className="hist-root">
      {/* ── Hero ── */}
      <div className="bank-hero hist-hero">
        <div className="bank-topbar">
          <button type="button" className="bank-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <h1 className="hist-hero-title">Transactions</h1>
          <Link to="/add" className="bank-icon-btn" aria-label="Add expense">
            <Plus size={18} />
          </Link>
        </div>

        <div className="hist-hero-summary">
          <div className="hist-summary-item">
            <span className="hist-summary-value">{filteredExpenses.length}</span>
            <span className="hist-summary-label">entries</span>
          </div>
          <div className="hist-summary-divider" />
          <div className="hist-summary-item">
            <span className="hist-summary-value">{formatCurrency(totalFiltered)}</span>
            <span className="hist-summary-label">total</span>
          </div>
        </div>
      </div>

      {/* ── Luminous Sheet ── */}
      <div className="bank-sheet hist-sheet">
        {/* Search */}
        <div className="bank-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search note or category…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bank-filters">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
            <option value="">All methods</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        {/* Grouped Expense List */}
        {filteredExpenses.length === 0 ? (
          <div className="hist-empty">
            <Calendar size={40} strokeWidth={1.5} />
            <p>No expenses match your filters.</p>
          </div>
        ) : (
          <div className="hist-grouped-list">
            {groupedExpenses.map(([date, expenses]) => (
              <div key={date} className="hist-date-group">
                <div className="hist-date-label">
                  <span>{formatDateShort(date)}</span>
                  <span className="hist-date-total">
                    {formatCurrency(expenses.reduce((s, e) => s + Number(e.amount), 0))}
                  </span>
                </div>

                {expenses.map((expense) => {
                  const meta = CAT_COLORS[expense.category] || CAT_COLORS.Other;
                  const CatIcon = CAT_ICONS[expense.category] || Package;

                  if (editingId === expense.id) {
                    return (
                      <div key={expense.id} className="hist-edit-card">
                        <div className="hist-edit-grid">
                          <div className="form-group">
                            <label className="form-label">Amount (₹)</label>
                            <input
                              type="number"
                              className="form-input"
                              value={editFields.amount}
                              onChange={(e) => setEditFields((f) => ({ ...f, amount: e.target.value }))}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                              className="form-select"
                              value={editFields.category}
                              onChange={(e) => setEditFields((f) => ({ ...f, category: e.target.value }))}
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                              type="date"
                              className="form-input"
                              value={editFields.date}
                              onChange={(e) => setEditFields((f) => ({ ...f, date: e.target.value }))}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Payment</label>
                            <select
                              className="form-select"
                              value={editFields.paymentMethod}
                              onChange={(e) => setEditFields((f) => ({ ...f, paymentMethod: e.target.value }))}
                            >
                              {PAYMENT_METHODS.map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Note</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="What was this for?"
                            value={editFields.note}
                            onChange={(e) => setEditFields((f) => ({ ...f, note: e.target.value }))}
                          />
                        </div>
                        <div className="hist-edit-actions">
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => saveEdit(expense.id)}>
                            <Check size={14} /> Save
                          </button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={expense.id} className="hist-row">
                      <div className="hist-row-icon" style={{ background: meta.bg, color: meta.color }}>
                        <CatIcon size={18} />
                      </div>
                      <div className="hist-row-body">
                        <div className="hist-row-title">{expense.note || expense.category}</div>
                        <div className="hist-row-meta">
                          <span>{expense.category}</span>
                          <span>·</span>
                          <span>{expense.paymentMethod}</span>
                          {expense.isShared && (
                            <>
                              <span>·</span>
                              <span className="hist-shared-badge">Shared</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="hist-row-right">
                        <div className="hist-row-amt">-{formatCurrency(expense.amount)}</div>
                        <div className="hist-row-actions">
                          <button type="button" className="hist-icon-btn" onClick={() => startEdit(expense)} aria-label="Edit">
                            <Edit2 size={12} />
                          </button>
                          <button type="button" className="hist-icon-btn danger" onClick={() => handleDeleteClick(expense)} aria-label="Delete">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Expense"
      >
        <p style={{ color: '#475569', marginBottom: 20 }}>
          Are you sure you want to delete{' '}
          <strong style={{ color: '#0f172a' }}>
            {expenseToDelete?.note || expenseToDelete?.category}
          </strong>
          ? This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            className="btn btn-danger"
            style={{ flex: 1 }}
            onClick={confirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Yes, Delete'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={() => setDeleteModalOpen(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default History;
