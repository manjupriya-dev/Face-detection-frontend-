import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import './Delete.css';

const Delete = () => {
    const [empNo, setEmpNo] = useState('');
    const [foundUser, setFoundUser] = useState(null);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [success, setSuccess] = useState(false);

    const searchEmployee = async (employeeId) => {
        if (!employeeId) return;
        setSearching(true);
        setError('');
        setFoundUser(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/employee/${employeeId}`, { timeout: 10000 });
            if (res.data) {
                setFoundUser({ empNo: res.data.employee_id, name: res.data.name });
            }
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError(`Employee with ID "${employeeId}" was not found in the database.`);
            } else {
                setError('Could not reach the backend. Please check your connection.');
            }
        } finally {
            setSearching(false);
        }
    };

    const deleteEmployee = async () => {
        if (!foundUser) return;
        setDeleting(true);
        setError('');
        try {
            const res = await axios.delete(`${API_BASE_URL}/employee/${foundUser.empNo}`, { timeout: 15000 });
            if (res.data && res.data.deleted === foundUser.empNo) {
                setSuccess(true);
                setFoundUser(null);
                setEmpNo('');
                setShowDialog(false);
                setTimeout(() => setSuccess(false), 5000);
            } else {
                throw new Error('Deletion failed');
            }
        } catch (err) {
            setError(`Failed to delete: ${err.message}`);
            setShowDialog(false);
        } finally {
            setDeleting(false);
        }
    };

    const handleSearch = () => {
        if (!empNo.trim()) { setError('Please enter an Employee ID.'); return; }
        searchEmployee(empNo.trim());
    };

    return (
        <div className="delete-page-wrapper">

            {/* ── Header ── */}
            <div className="delete-page-header">
                <div className="delete-page-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                    </svg>
                </div>
                <div>
                    <h1 className="delete-page-title">Delete Employee</h1>
                    <p className="delete-page-subtitle">Search and permanently remove a personnel record from the database</p>
                </div>
            </div>

            {/* ── Success Banner ── */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="delete-success-banner"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>Employee record successfully deleted from the database.</span>
                        <button className="delete-banner-close" onClick={() => setSuccess(false)}>✕</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main Card ── */}
            <div className="delete-card">
                <h2 className="delete-card-title">
                    <span className="delete-card-title-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#025F67" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </span>
                    Search Employee
                </h2>

                {/* Search Row */}
                <div className="delete-search-row">
                    <div className="delete-input-wrap">
                        <span className="delete-input-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                        </span>
                        <input
                            className={`delete-input${error ? ' delete-input--error' : ''}`}
                            type="text"
                            placeholder="Enter Employee ID (e.g. 1001)"
                            value={empNo}
                            onChange={(e) => { setEmpNo(e.target.value); setError(''); }}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        {empNo && (
                            <button className="delete-input-clear" onClick={() => { setEmpNo(''); setFoundUser(null); setError(''); }}>✕</button>
                        )}
                    </div>
                    <button
                        className="delete-search-btn"
                        onClick={handleSearch}
                        disabled={searching || !empNo.trim()}
                    >
                        {searching
                            ? <><span className="delete-spinner" /> Searching…</>
                            : <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                Search
                            </>
                        }
                    </button>
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="delete-error"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{error}</span>
                            <button className="delete-error-close" onClick={() => setError('')}>✕</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Found Employee Card ── */}
            <AnimatePresence>
                {foundUser && (
                    <motion.div
                        className="delete-result-card"
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                    >
                        {/* Red top accent */}
                        <div className="delete-result-accent" />

                        <div className="delete-result-body">
                            {/* Employee info */}
                            <div className="delete-result-info">
                                <div className="delete-result-avatar">
                                    {foundUser.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <span className="delete-found-chip">
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Record Found
                                    </span>
                                    <div className="delete-result-name">{foundUser.name}</div>
                                    <div className="delete-result-id">Employee ID: {foundUser.empNo}</div>
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="delete-warning">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <div>
                                    <div className="delete-warning-title">Irreversible Action</div>
                                    <div className="delete-warning-text">
                                        Deleting this record will permanently remove <strong>{foundUser.name}</strong>'s face data and all associated records.
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="delete-actions">
                                <button className="delete-cancel-btn" onClick={() => { setFoundUser(null); setEmpNo(''); }}>
                                    Cancel
                                </button>
                                <button className="delete-confirm-btn" onClick={() => setShowDialog(true)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14H6L5 6" />
                                        <path d="M10 11v6M14 11v6" />
                                        <path d="M9 6V4h6v2" />
                                    </svg>
                                    Delete Record
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Empty state ── */}
            {!foundUser && !searching && !error && !success && (
                <div className="delete-empty">
                    <div className="delete-empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </div>
                    <p className="delete-empty-text">Enter an Employee ID above to search</p>
                    <p className="delete-empty-sub">The employee's record will appear here for review before deletion</p>
                </div>
            )}

            {/* ── Confirmation Dialog ── */}
            <AnimatePresence>
                {showDialog && (
                    <motion.div
                        className="delete-dialog-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="delete-dialog"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                        >
                            <div className="delete-dialog-header">
                                <div className="delete-dialog-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                </div>
                                <h3 className="delete-dialog-title">Confirm Deletion</h3>
                            </div>

                            <p className="delete-dialog-text">
                                Are you sure you want to permanently delete <strong>{foundUser?.name}</strong>?
                            </p>

                            <div className="delete-dialog-preview">
                                <div className="delete-dialog-avatar">{foundUser?.name?.charAt(0).toUpperCase()}</div>
                                <div>
                                    <div className="delete-dialog-emp-name">{foundUser?.name}</div>
                                    <div className="delete-dialog-emp-id">ID: {foundUser?.empNo}</div>
                                </div>
                            </div>

                            <div className="delete-dialog-alert">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span>This action <strong>cannot be undone</strong>. All face recognition data will be permanently removed.</span>
                            </div>

                            <div className="delete-dialog-actions">
                                <button
                                    className="delete-dialog-cancel"
                                    onClick={() => setShowDialog(false)}
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="delete-dialog-delete"
                                    onClick={deleteEmployee}
                                    disabled={deleting}
                                >
                                    {deleting
                                        ? <><span className="delete-spinner delete-spinner--white" /> Deleting…</>
                                        : <>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                                            </svg>
                                            Delete Record
                                        </>
                                    }
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Delete;