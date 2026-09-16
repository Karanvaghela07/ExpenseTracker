import { useState, useMemo } from 'react';
import { Search, Edit2, Trash2, Check, X } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useToast } from '../../components/Toast/Toast';
import EmptyState from '../../components/EmptyState/EmptyState';
import Modal from '../../components/Modal/Modal';
import {
  formatCurrency,
  formatDate,
  CATEGORIES,
  PAYMENT_METHODS,
  getCategoryClass,
  getToday,
} from '../../utils/helpers';
import './History.css';

const History = () => {
  const { state, deleteExpense, editExpense } = useExpense();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});

  const filteredExpenses = useMemo(() => {
    return state.expenses.filter(expense => {
      const matchSearch =
        (expense.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory ? expense.category === filterCategory : true;
      const matchMethod = filterMethod ? expense.paymentMethod === filterMethod : true;
      const matchDateFrom = dateFrom ? new Date(expense.date) >= new Date(dateFrom) : true;
      const matchDateTo = dateTo ? new Date(expense.date) <= new Date(dateTo) : true;
      return matchSearch && matchCategory && matchMethod && matchDateFrom && matchDateTo;
    });
  }, [state.expenses, searchTerm, filterCategory, filterMethod, dateFrom, dateTo]);

  // ── Delete ──────────────────────────────────────────────────────────────
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

  // ── Inline Edit ──────────────────────────────────────────────────────────
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
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">All Transactions</h1>
        <p className="page-subtitle">View and manage your complete spending history</p>
      </div>

      <div className="history-filters">
        <div className="history-search">
          <Search size={18} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by note or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="form-group">
          <select
            className="form-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <select
            className="form-select"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
          >
            <option value="">All Payment Methods</option>
            {PAYMENT_METHODS.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ display: 'flex', gap: '8px' }}>
          <input
            type="date"
            className="form-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: '12px 8px' }}
            title="From Date"
          />
          <input
            type="date"
            className="form-input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: '12px 8px' }}
            title="To Date"
          />
        </div>
      </div>

      <div className="table-container">
        {filteredExpenses.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Note</th>
                <th>Payment Method</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(expense => {
                const isEditing = editingId === expense.id;
                return (
                  <tr key={expense.id}>
                    <td>
                      {isEditing ? (
                        <input
                          type="date"
                          className="form-input"
                          style={{ padding: '6px 8px', fontSize: '13px' }}
                          value={editFields.date}
                          onChange={(e) => setEditFields(f => ({ ...f, date: e.target.value }))}
                        />
                      ) : (
                        formatDate(expense.date)
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          className="form-select"
                          style={{ padding: '6px 8px', fontSize: '13px' }}
                          value={editFields.category}
                          onChange={(e) => setEditFields(f => ({ ...f, category: e.target.value }))}
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`badge ${getCategoryClass(expense.category)}`}>
                          {expense.category}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '6px 8px', fontSize: '13px' }}
                          value={editFields.note}
                          onChange={(e) => setEditFields(f => ({ ...f, note: e.target.value }))}
                          placeholder="Note"
                        />
                      ) : (
                        <>
                          <div style={{ fontWeight: 500 }}>{expense.note || '-'}</div>
                          {expense.isShared && (
                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                              Shared with {expense.sharedWith}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          className="form-select"
                          style={{ padding: '6px 8px', fontSize: '13px' }}
                          value={editFields.paymentMethod}
                          onChange={(e) => setEditFields(f => ({ ...f, paymentMethod: e.target.value }))}
                        >
                          {PAYMENT_METHODS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      ) : (
                        expense.paymentMethod
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '6px 8px', fontSize: '13px', textAlign: 'right', width: '100px' }}
                          value={editFields.amount}
                          onChange={(e) => setEditFields(f => ({ ...f, amount: e.target.value }))}
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        formatCurrency(expense.amount)
                      )}
                    </td>
                    <td>
                      <div className="action-btns" style={{ justifyContent: 'center' }}>
                        {isEditing ? (
                          <>
                            <button
                              className="action-btn"
                              title="Save"
                              onClick={() => saveEdit(expense.id)}
                              style={{ color: 'var(--color-success)' }}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="action-btn"
                              title="Cancel"
                              onClick={cancelEdit}
                              style={{ color: 'var(--color-danger)' }}
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="action-btn"
                              title="Edit"
                              onClick={() => startEdit(expense)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="action-btn delete"
                              title="Delete"
                              onClick={() => handleDeleteClick(expense)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState message="No expenses found matching your filters. Try adjusting your search criteria." />
        )}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Expense"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        Are you sure you want to delete this expense? This action cannot be undone.
      </Modal>
    </div>
  );
};

export default History;
