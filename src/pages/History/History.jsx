import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Edit2, Trash2, Check, X, ArrowLeft, Plus,
  ShoppingBag, Heart, ShoppingCart, Coffee, Train,
  Home, BookOpen, Utensils, Package,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useToast } from '../../components/Toast/Toast';
import Modal from '../../components/Modal/Modal';
import {
  formatCurrency,
  formatDateShort,
  CATEGORIES,
  PAYMENT_METHODS,
  getCategoryColor,
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

  return (
    <div className="page-container bank-page">
      <div className="bank-hero">
        <div className="bank-topbar">
          <button type="button" className="bank-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <Link to="/add" className="bank-icon-btn" aria-label="Add expense">
            <Plus size={18} />
          </Link>
        </div>
        <h1 className="bank-hero-title">Transactions</h1>
        <p className="bank-hero-sub">{filteredExpenses.length} entries · {formatCurrency(totalFiltered)}</p>
      </div>

      <div className="bank-sheet hist-sheet">
        <div className="bank-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search note or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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

        <div className="hist-list">
          {filteredExpenses.length === 0 ? (
            <p className="bank-muted">No expenses match your filters.</p>
          ) : (
            filteredExpenses.map((expense) => {
              const Icon = CAT_ICONS[expense.category] || Package;
              const color = getCategoryColor(expense.category);
              const isEditing = editingId === expense.id;

              if (isEditing) {
                return (
                  <div key={expense.id} className="hist-edit-card">
                    <div className="form-group">
                      <label className="form-label">Amount</label>
                      <input
                        type="number"
                        className="form-input"
                        value={editFields.amount}
                        onChange={(e) => setEditFields((f) => ({ ...f, amount: e.target.value }))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="hist-edit-grid">
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
                    </div>
                    <div className="form-group">
                      <label className="form-label">Note</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editFields.note}
                        onChange={(e) => setEditFields((f) => ({ ...f, note: e.target.value }))}
                      />
                    </div>
                    <div className="hist-edit-actions">
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => saveEdit(expense.id)}>
                        <Check size={14} /> Save
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={expense.id} className="bank-row">
                  <div className="bank-row-icon" style={{ color }}>
                    <Icon size={18} strokeWidth={1.75} />
                  </div>
                  <div className="bank-row-body">
                    <div className="bank-row-title">{expense.note || expense.category}</div>
                    <div className="bank-row-meta">
                      {formatDateShort(expense.date)} · {expense.category}
                      {expense.isShared ? ` · ${expense.sharedWith}` : ''}
                    </div>
                  </div>
                  <div className="bank-row-right">
                    <div className="bank-row-amt">−{formatCurrency(expense.amount)}</div>
                    <div className="hist-row-actions">
                      <button type="button" className="hist-icon-btn" onClick={() => startEdit(expense)} aria-label="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button type="button" className="hist-icon-btn danger" onClick={() => handleDeleteClick(expense)} aria-label="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Expense"
        footer={(
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        )}
      >
        Are you sure you want to delete this expense? This action cannot be undone.
      </Modal>
    </div>
  );
};

export default History;
