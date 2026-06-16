import React, { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, RefreshCw, ReceiptText,
  TrendingUp, TrendingDown, X, Loader2, AlertCircle
} from 'lucide-react';
import SalaryChangeForm from './SalaryChangeForm.jsx';
import { useDeleteSalaryChangeMutation, useGetSalaryChangeByMemberIdQuery } from '../api/member.rtk.api.js';

const SalaryHistory = ({ memberId, onClose, setVisibility }) => {
  let [deleteSalaryChange] = useDeleteSalaryChangeMutation()
  let { data: salaryDataQuery, isLoading, isError: salaryDataError, error: queryError, refetch } = useGetSalaryChangeByMemberIdQuery(memberId, {
    skip: !memberId
  })


  const [salaryData, setSalaryData]= useState([])
  const [error, setError] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [formConfig, setFormConfig] = useState({ type: 'create', toUpdateData: null });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // record to confirm

  const loading = isLoading;

  useEffect(() => {
    if (salaryDataQuery) {
      setSalaryData(salaryDataQuery.data || []);
    }
  }, [salaryDataQuery]);

  useEffect(() => {
    if (salaryDataError) {
      setError(queryError?.message || 'Failed to fetch salary history');
    }
  }, [salaryDataError, queryError]);

  // ─── Create ───────────────────────────────────────────────────────────────
  // const handleCreate = async (formData) => {
  //   setSaving(true);
  //   try {
  //     await api.post(`/memberRoute/salaryCreate`, { memberId, ...formData });
  //     fetchSalaryHistory();
  //   } catch (err) {
  //     setError(err.message || 'Failed to create salary record');
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  // ─── Update ───────────────────────────────────────────────────────────────
  // const handleUpdate = async (formData) => {
  //   setSaving(true);
  //   try {
  //     await api.put(`/memberRoute/salaryUpdate/${formData._id}`, formData);
  //     fetchSalaryHistory();
  //   } catch (err) {
  //     setError(err.message || 'Failed to update salary record');
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (record) => {
    setDeletingId(record._id);
    setConfirmDelete(null);
    try {
      // await api.delete(`/memberRoute/salaryDelete/${record._id}`);
      // fetchSalaryHistory();
      await deleteSalaryChange({ id: record._id, memberId })
    } catch (err) {
      setError(err.message || 'Failed to delete salary record');
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Form helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setFormConfig({ type: 'create', toUpdateData: null });
    setFormVisible(true);
  };
  const openUpdate = (record) => {
    setFormConfig({ type: 'update', toUpdateData: record });
    setFormVisible(true);
  };
  const handleFormClose = (didSave) => {
    setFormVisible(false);
    if (didSave) refetch();
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Overlay ── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 app-backdrop px-4"
        onClick={(e) => e.target === e.currentTarget && setVisibility(false)}
      >
        {/* ── Popup: 80% wide ── */}
        <div className="w-[80%] max-h-[88vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-edge bg-surface">

          {/* Top accent bar */}
          <div className="h-[3px] w-full flex-shrink-0 app-gradient" />

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-edge bg-surface flex-shrink-0">
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight text-ink">
                Salary{' '}
                <span className="text-primary">History</span>
              </h2>
              {salaryData && (
                <p className="text-[12px] text-ink-subtle mt-0.5 font-normal">
                  {salaryData.length} record{salaryData.length !== 1 ? 's' : ''} on file
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {(salaryData?.length>0) && (
                <button
                  onClick={openCreate}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground text-[13px] font-medium transition-colors"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  {salaryData?.length ? "Change": "Start"} Salary
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg border border-edge hover:bg-surface-muted text-ink-subtle hover:text-ink-muted transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="overflow-y-auto flex-1 bg-surface-muted/40">

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 size={28} className="text-primary animate-spin" />
                <p className="text-[13px] text-ink-subtle font-medium">Loading salary history…</p>
              </div>
            )}

            {/* Error */}
            {loading && error && (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="flex items-start gap-3 p-4 bg-danger-muted border border-danger rounded-xl max-w-sm">
                  <AlertCircle size={16} className="text-danger mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] text-danger font-medium">{error}</p>
                    <button
                      onClick={fetchSalaryHistory}
                      className="mt-2 flex items-center gap-1.5 text-[12px] text-danger hover:text-danger font-medium transition-colors"
                    >
                      <RefreshCw size={11} /> Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Table ── */}
            {(!loading && !error && (salaryData?.length>0)) && (
              <div>
                {/* Column headers */}
                <div className="grid grid-cols-[1.3fr_1fr_1fr_1.8fr_auto] gap-x-4 px-7 py-3 bg-surface border-b border-edge sticky top-0 z-10">
                  {['Amount', 'Date', 'Type', 'Reason', 'Actions'].map((col) => (
                    <div key={col} className="text-[11px] font-semibold text-ink-subtle uppercase tracking-widest">
                      {col}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                <div className="divide-y divide-edge">
                  {salaryData.map((record) => {
                    const isDeleting = deletingId === record._id;
                    const isIncrease = record.changeType === 'increase';

                    return (
                      <div
                        key={record._id}
                        className={`grid grid-cols-[1.3fr_1fr_1fr_1.8fr_auto] gap-x-4 px-7 py-4 items-center transition-colors group
                          ${isDeleting ? 'opacity-40 pointer-events-none' : 'hover:bg-surface'}`}
                      >
                        {/* Amount */}
                        <div className="text-[14px] font-semibold text-ink tabular-nums">
                          {Number(record.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>

                        {/* Date */}
                        <div className="text-[13px] text-ink-muted">
                          {new Date(record.date).toLocaleDateString(undefined, {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </div>

                        {/* Change type badge */}
                        <div>
                          {isIncrease ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-muted border border-success-muted text-success text-[11px] font-semibold">
                              <TrendingUp size={11} strokeWidth={2.5} />
                              Increase
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-muted border border-danger/30 text-danger text-[11px] font-semibold">
                              <TrendingDown size={11} strokeWidth={2.5} />
                              Decrease
                            </span>
                          )}
                        </div>

                        {/* Reason */}
                        <div
                          className="text-[13px] text-ink-muted truncate"
                          title={record.reason}
                        >
                          {record.reason || '—'}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Edit */}
                          <button
                            onClick={() => openUpdate(record)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-edge bg-surface hover:border-primary hover:text-primary text-ink-muted text-[12px] font-medium transition-colors"
                            title="Edit record"
                          >
                            <Pencil size={12} strokeWidth={2} />
                            Edit
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setConfirmDelete(record)}
                            disabled={isDeleting}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-edge bg-surface hover:border-danger hover:text-danger text-ink-muted text-[12px] font-medium transition-colors disabled:opacity-50"
                            title="Delete record"
                          >
                            {isDeleting
                              ? <Loader2 size={12} className="animate-spin" />
                              : <Trash2 size={12} strokeWidth={2} />
                            }
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && !salaryData.length && (
              <div className="flex flex-col items-center justify-center py-24 gap-5">
                <div className="w-16 h-16 rounded-2xl bg-primary-muted border border-edge-brand flex items-center justify-center">
                  <ReceiptText size={30} className="text-primary" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <h3 className="text-[15px] font-semibold text-ink">No salary records yet</h3>
                  <p className="text-[13px] text-ink-subtle mt-1">No salary is stated so please start the salary.</p>
                </div>
                <button
                  onClick={openCreate}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground text-[13px] font-medium transition-colors"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  Start Salary
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Delete Confirm Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 app-backdrop">
          <div className="w-[380px] bg-surface rounded-2xl shadow-2xl border border-edge overflow-hidden">
            <div className="h-[3px] app-gradient" />
            <div className="p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-9 h-9 rounded-full bg-danger-muted border border-danger/20 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={15} className="text-danger" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">Delete record?</h3>
                  <p className="text-[13px] text-ink-muted mt-1 leading-relaxed">
                    This will permanently remove the salary entry of{' '}
                    <span className="font-semibold text-ink">
                      {Number(confirmDelete.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>{' '}
                    dated{' '}
                    <span className="font-semibold text-ink">
                      {new Date(confirmDelete.date).toLocaleDateString(undefined, {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>.
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 rounded-lg border border-edge hover:bg-surface-muted text-ink-muted text-[13px] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger hover:opacity-90 text-primary-foreground text-[13px] font-medium transition-colors"
                >
                  <Trash2 size={13} />
                  Yes, delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SalaryChangeForm ── */}
      {formVisible && (
        <SalaryChangeForm
          // fetchSalaryHistory={fetchSalaryHistory}
          type={formConfig.type}
          toUpdateData={formConfig.toUpdateData}
          memberId={memberId}
          // onSave={formConfig.type === 'create' ? handleCreate : handleUpdate}
          setVisibility={handleFormClose}
          // saving={saving}
        />
      )}
    </>
  );
};

export default SalaryHistory;













































