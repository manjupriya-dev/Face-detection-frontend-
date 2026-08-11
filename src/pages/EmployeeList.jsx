import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { API_BASE_URL, apiService } from '../services/api';
import "./EmployeeList.css";

// ─── Constants ───────────────────────────────────────────────
const ROWS_OPTIONS = [10, 25, 50, 100];

// ─── Inline SVG icons ─────────────────────────────────────────
const Icon = {
    Users: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#025F67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Search: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    Download: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    Calendar: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    Clock: () => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    Eye: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
    ),
    Trash: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
    ),
    ChevronLeft: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    ),
    ChevronRight: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    ),
    X: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    SortAsc: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
        </svg>
    ),
    SortDesc: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),
    Check: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    AlertCircle: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    RefreshCw: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
    ),
    Image: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    ),
    Edit: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    Camera: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
        </svg>
    ),
    Upload: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    ),
    CheckCircle: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    History: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
        </svg>
    ),
};

// ─── Helpers ─────────────────────────────────────────────────
function getInitials(name = "") {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0] || "")
        .join("")
        .toUpperCase();
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return dateStr; }
}

function formatTime(timeStr) {
    if (!timeStr) return "—";
    try {
        // Handle "HH:MM:SS" strings or full ISO
        if (timeStr.includes("T")) {
            const d = new Date(timeStr);
            return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
        }
        const [hh, mm, ss] = timeStr.split(":");
        const d = new Date();
        d.setHours(+hh, +mm, +ss || 0);
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    } catch { return timeStr; }
}

function downloadCSV(data) {
    const headers = ["Emp No", "Employee Name", "Enrollment Date", "Enrollment Time", "Photo Count"];
    const rows = data.map((e) => [
        e.employee_id ?? e.emp_no ?? "",
        e.name ?? "",
        e.enrollment_date ?? "",
        e.enrollment_time ?? "",
        e.photo_count ?? 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(onDismiss, 3500);
        return () => clearTimeout(t);
    }, [toast, onDismiss]);

    if (!toast) return null;
    return (
        <div className={`toast toast-${toast.type}`} role="alert">
            {toast.type === "success" ? <Icon.Check /> : <Icon.AlertCircle />}
            {toast.message}
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────
export default function EmployeeList() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search & sort
    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState("desc"); // 'asc' | 'desc'

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Modals
    const [imageModal, setImageModal] = useState(null); // { employee }
    const [deleteModal, setDeleteModal] = useState(null); // { employee }
    const [deleting, setDeleting] = useState(false);
    const [editModal, setEditModal] = useState(null);   // { employee }
    const [editName, setEditName] = useState("");
    const [saving, setSaving] = useState(false);

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    // Update Modal (Add More Photos)
    const [updateModal, setUpdateModal] = useState(null); // { employee }


    // Toast
    const [toast, setToast] = useState(null);

    const searchRef = useRef(null);

    // ── Fetch employees ────────────────────────────────────
    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(`${API_BASE_URL}/employees`, { timeout: 15000 });
            // Support both array and { employees: [...] } response shapes
            const data = Array.isArray(res.data) ? res.data : (res.data?.employees ?? []);
            setEmployees(data);
        } catch (err) {
            console.error("Fetch employees error:", err);
            setError(
                err.response
                    ? `Server error (${err.response.status}): ${err.response.data?.detail || "Unknown"}`
                    : "Cannot reach backend. Is FastAPI running on port 8000?"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
    
    // ── Check for ?update=ID query param ──────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const updateId = params.get("update");
        if (updateId && employees.length > 0) {
            const emp = employees.find(e => (e.employee_id ?? e.emp_no) === updateId);
            if (emp) {
                setUpdateModal(emp);
                // Clear param after opening
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }, [employees]);

    // ── Filter & sort ──────────────────────────────────────
    const filtered = employees.filter((emp) => {
        const q = search.toLowerCase();
        const id = String(emp.employee_id ?? emp.emp_no ?? "").toLowerCase();
        const nm = String(emp.name ?? "").toLowerCase();
        return id.includes(q) || nm.includes(q);
    });

    const sorted = [...filtered].sort((a, b) => {
        const da = new Date(`${a.enrollment_date}T${a.enrollment_time || "00:00:00"}`);
        const db = new Date(`${b.enrollment_date}T${b.enrollment_time || "00:00:00"}`);
        return sortOrder === "desc" ? db - da : da - db;
    });

    // ── Pagination ─────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
    const safePage = Math.min(currentPage, totalPages);
    const paginated = sorted.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

    const gotoPage = (p) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

    // reset page on search change
    useEffect(() => { setCurrentPage(1); }, [search, sortOrder, rowsPerPage]);

    // ── Delete ─────────────────────────────────────────────
    const handleDeleteConfirm = async () => {
        if (!deleteModal) return;
        const emp = deleteModal.employee;
        try {
            setDeleting(true);
            await axios.delete(`${API_BASE_URL}/employee/${emp.employee_id ?? emp.emp_no}`, { timeout: 15000 });
            setEmployees((prev) => prev.filter((e) => (e.employee_id ?? e.emp_no) !== (emp.employee_id ?? emp.emp_no)));
            setDeleteModal(null);
            setToast({ type: "success", message: `Employee "${emp.name}" deleted successfully.` });
        } catch (err) {
            console.error("Delete error:", err);
            setToast({ type: "error", message: err.response?.data?.detail || "Delete failed. Try again." });
        } finally {
            setDeleting(false);
        }
    };

    // ── Edit (Update Name) ─────────────────────────────────
    const handleEditSave = async () => {
        if (!editModal) return;
        const trimmed = editName.trim();
        if (!trimmed) return;
        const emp = editModal.employee;
        const empId = emp.employee_id ?? emp.emp_no;
        try {
            setSaving(true);
            const form = new FormData();
            form.append("name", trimmed);
            await axios.put(`${API_BASE_URL}/employee/${empId}`, form, { timeout: 15000 });
            setEmployees((prev) =>
                prev.map((e) =>
                    (e.employee_id ?? e.emp_no) === empId ? { ...e, name: trimmed } : e
                )
            );
            setEditModal(null);
            setToast({ type: "success", message: `Employee "${trimmed}" updated successfully.` });
        } catch (err) {
            console.error("Update error:", err);
            setToast({ type: "error", message: err.response?.data?.detail || "Update failed. Try again." });
        } finally {
            setSaving(false);
        }
    };

    // ── Bulk selection helpers ─────────────────────────────
    const allPageIds = paginated.map((e) => e.employee_id ?? e.emp_no);
    const allPageSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
    const somePageSelected = allPageIds.some((id) => selectedIds.has(id));

    const toggleSelectAll = () => {
        if (allPageSelected) {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                allPageIds.forEach((id) => next.delete(id));
                return next;
            });
        } else {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                allPageIds.forEach((id) => next.add(id));
                return next;
            });
        }
    };

    const toggleSelectOne = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // ── Bulk delete ────────────────────────────────────────
    const handleBulkDeleteConfirm = async () => {
        setBulkDeleting(true);
        const ids = [...selectedIds];
        let successCount = 0;
        let failCount = 0;
        for (const id of ids) {
            try {
                await axios.delete(`${API_BASE_URL}/employee/${id}`, { timeout: 15000 });
                successCount++;
            } catch {
                failCount++;
            }
        }
        setEmployees((prev) => prev.filter((e) => !selectedIds.has(e.employee_id ?? e.emp_no)));
        setSelectedIds(new Set());
        setBulkDeleteModal(false);
        setBulkDeleting(false);
        if (failCount === 0) {
            setToast({ type: "success", message: `${successCount} employee${successCount !== 1 ? "s" : ""} deleted successfully.` });
        } else {
            setToast({ type: "error", message: `${successCount} deleted, ${failCount} failed. Please retry.` });
        }
    };

    // ── Stat values ────────────────────────────────────────
    const todayStr = new Date().toISOString().slice(0, 10);
    const enrolledToday = employees.filter((e) => (e.enrollment_date ?? "").startsWith(todayStr)).length;

    // ── Pagination page buttons ────────────────────────────────
    const pageButtons = getPaginationRange(safePage, totalPages);

    return (
        <div className="emplist-page">

            {/* ── Header ─────────────────────────────────────── */}
            <div className="emplist-header">
                <div className="emplist-header-left">
                    <div className="emplist-header-icon">
                        <Icon.Users />
                    </div>
                    <div>
                        <h1 className="emplist-title">Employee Directory</h1>
                        <p className="emplist-subtitle">View and manage all enrolled employees</p>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <button
                        type="button"
                        className="export-btn"
                        onClick={() => downloadCSV(sorted)}
                        disabled={sorted.length === 0}
                        title="Export to CSV"
                        id="export-csv-btn"
                    >
                        <Icon.Download />
                        Export CSV
                    </button>
                    <button
                        type="button"
                        className="icon-btn"
                        onClick={fetchEmployees}
                        title="Refresh"
                        style={{ width: 40, height: 40 }}
                        id="refresh-btn"
                    >
                        <Icon.RefreshCw />
                    </button>
                </div>
            </div>

            {/* ── Stats ──────────────────────────────────────── */}
            <div className="emplist-stats">
                <div className="stat-card">
                    <div className="stat-card-inner">
                        <div className="stat-card-icon" style={{ background: "linear-gradient(135deg,#e0f2f1,#b2dfdb)" }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#025F67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="stat-card-info">
                            <div className="stat-card-value">{employees.length}</div>
                            <div className="stat-card-label">Total Employees</div>
                        </div>
                    </div>
                    <div className="stat-card-bar" style={{ backgroundColor: "#025F67" }}></div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-inner">
                        <div className="stat-card-icon" style={{ background: "linear-gradient(135deg,#dcfce7,#d1fae5)" }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <div className="stat-card-info">
                            <div className="stat-card-value">{enrolledToday}</div>
                            <div className="stat-card-label">Enrolled Today</div>
                        </div>
                    </div>
                    <div className="stat-card-bar" style={{ backgroundColor: "#16a34a" }}></div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-inner">
                        <div className="stat-card-icon" style={{ background: "linear-gradient(135deg,#fef9c3,#fde68a)" }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <div className="stat-card-info">
                            <div className="stat-card-value">{filtered.length}</div>
                            <div className="stat-card-label">Search Results</div>
                        </div>
                    </div>
                    <div className="stat-card-bar" style={{ backgroundColor: "#ca8a04" }}></div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-inner">
                        <div className="stat-card-icon" style={{ background: "linear-gradient(135deg,#fee2e2,#fecaca)" }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                        </div>
                        <div className="stat-card-info">
                            <div className="stat-card-value">{totalPages}</div>
                            <div className="stat-card-label">Pages</div>
                        </div>
                    </div>
                    <div className="stat-card-bar" style={{ backgroundColor: "#dc2626" }}></div>
                </div>
            </div>

            {/* ── Toolbar ────────────────────────────────────── */}
            <div className="emplist-toolbar">
                <div className="search-wrapper">
                    <span className="search-icon"><Icon.Search /></span>
                    <input
                        ref={searchRef}
                        type="text"
                        className="search-input"
                        placeholder="Search by ID or Name…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        id="employee-search-input"
                    />
                </div>

                <select
                    className="sort-select"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    id="sort-select"
                    title="Sort by enrollment date"
                >
                    <option value="desc">Latest First</option>
                    <option value="asc">Oldest First</option>
                </select>
            </div>

            {/* ── Bulk Action Bar ─────────────────────────────── */}
            {selectedIds.size > 0 && (
                <div className="bulk-action-bar">
                    <span className="bulk-action-count">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {selectedIds.size} employee{selectedIds.size !== 1 ? "s" : ""} selected
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                            className="bulk-deselect-btn"
                            onClick={() => setSelectedIds(new Set())}
                            title="Clear selection"
                        >
                            Clear
                        </button>
                        <button
                            className="bulk-delete-btn"
                            onClick={() => setBulkDeleteModal(true)}
                            id="bulk-delete-btn"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {/* ── Table ──────────────────────────────────────── */}
            <div className="emplist-table-card">
                <div className="emplist-table-wrap">
                    <table className="emplist-table">
                        <thead>
                            <tr>
                                <th style={{ width: 42 }}>
                                    <input
                                        type="checkbox"
                                        className="bulk-checkbox"
                                        checked={allPageSelected}
                                        ref={(el) => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                                        onChange={toggleSelectAll}
                                        title="Select all on this page"
                                        id="select-all-checkbox"
                                    />
                                </th>
                                <th style={{ width: 50 }}>#</th>
                                <th>Emp No</th>
                                <th>Employee Name</th>
                                <th
                                    className="sortable"
                                    onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
                                >
                                    <div className="th-inner">
                                        Enrollment Date
                                        {sortOrder === "desc" ? <Icon.SortDesc /> : <Icon.SortAsc />}
                                    </div>
                                </th>
                                <th>Enrollment Time</th>
                                <th>Photo Count</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr className="table-state-row">
                                    <td colSpan={8}>
                                        <div className="state-inner">
                                            <div className="state-icon-wrap" style={{ background: "#e0f2f1" }}>
                                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#025F67" strokeWidth="2">
                                                    <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
                                                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                                                    <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
                                                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                                                </svg>
                                            </div>
                                            <div className="state-label">Loading employees…</div>
                                            <div className="state-sub">Fetching data from the server.</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr className="table-state-row">
                                    <td colSpan={8}>
                                        <div className="state-inner">
                                            <div className="state-icon-wrap" style={{ background: "#fee2e2" }}>
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                                </svg>
                                            </div>
                                            <div className="state-label">Failed to load</div>
                                            <div className="state-sub">{error}</div>
                                            <button className="export-btn" onClick={fetchEmployees} style={{ marginTop: 8 }}>
                                                <Icon.RefreshCw /> Retry
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr className="table-state-row">
                                    <td colSpan={7}>
                                        <div className="state-inner">
                                            <div className="state-icon-wrap" style={{ background: "#e0f2f1" }}>
                                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#025F67" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                                    <line x1="17" y1="11" x2="23" y2="11" />
                                                </svg>
                                            </div>
                                            <div className="state-label">
                                                {search ? "No employees match your search" : "No employees enrolled yet"}
                                            </div>
                                            <div className="state-sub">
                                                {search ? "Try a different search term." : "Go to the Enroll page to register employees."}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((emp, idx) => {
                                    const empId = emp.employee_id ?? emp.emp_no ?? "—";
                                    const globalIdx = (safePage - 1) * rowsPerPage + idx + 1;
                                    const isSelected = selectedIds.has(empId);
                                    return (
                                        <tr key={empId} className={isSelected ? "row-selected" : ""}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="bulk-checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectOne(empId)}
                                                    id={`checkbox-${empId}`}
                                                />
                                            </td>
                                            <td style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.8rem" }}>{globalIdx}</td>
                                            <td>
                                                <span className="emp-id-badge">{empId}</span>
                                            </td>
                                            <td>
                                                <div className="emp-name-cell">
                                                    <div className="emp-avatar">{getInitials(emp.name)}</div>
                                                    <span className="emp-name-text">{emp.name || "—"}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="date-cell">
                                                    <Icon.Calendar />
                                                    {formatDate(emp.enrollment_date)}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="time-chip">
                                                    <Icon.Clock />
                                                    {formatTime(emp.enrollment_time ?? emp.enrollment_date)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="photo-count-badge">
                                                    <Icon.Image />
                                                    {emp.photo_count ?? 0}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-btns">
                                                    <button
                                                        type="button"
                                                        className="icon-btn"
                                                        title="View enrolled images"
                                                        onClick={() => setImageModal({ employee: emp })}
                                                        id={`view-btn-${empId}`}
                                                    >
                                                        <Icon.Eye />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="icon-btn"
                                                        title="Edit employee name"
                                                        onClick={() => { setEditModal({ employee: emp }); setEditName(emp.name || ""); }}
                                                        id={`edit-btn-${empId}`}
                                                    >
                                                        <Icon.Edit />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="icon-btn"
                                                        title="Add more photos (Update)"
                                                        onClick={() => setUpdateModal(emp)}
                                                        id={`update-btn-${empId}`}
                                                        style={{ color: "#025F67" }}
                                                    >
                                                        <Icon.RefreshCw />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="icon-btn danger"
                                                        title="Delete employee"
                                                        onClick={() => setDeleteModal({ employee: emp })}
                                                        id={`delete-btn-${empId}`}
                                                    >
                                                        <Icon.Trash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })

                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && !error && sorted.length > 0 && (
                    <div className="emplist-pagination">
                        <div className="rows-select-wrap">
                            <span>Rows per page:</span>
                            <select
                                className="rows-select"
                                value={rowsPerPage}
                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                id="rows-per-page-select"
                            >
                                {ROWS_OPTIONS.map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pagination-info">
                            Showing {Math.min((safePage - 1) * rowsPerPage + 1, sorted.length)}–
                            {Math.min(safePage * rowsPerPage, sorted.length)} of {sorted.length}
                        </div>

                        <div className="pagination-controls">
                            <button
                                type="button"
                                className="page-btn"
                                disabled={safePage === 1}
                                onClick={() => gotoPage(safePage - 1)}
                                aria-label="Previous page"
                                id="prev-page-btn"
                            >
                                <Icon.ChevronLeft />
                            </button>

                            {pageButtons.map((p) =>
                                p === "…" ? (
                                    <span key={`ellipsis-${Math.random()}`} style={{ padding: "0 4px", color: "#94a3b8" }}>…</span>
                                ) : (
                                    <button
                                        type="button"
                                        key={p}
                                        className={`page-btn${safePage === p ? " active" : ""}`}
                                        onClick={() => gotoPage(p)}
                                        id={`page-btn-${p}`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}

                            <button
                                type="button"
                                className="page-btn"
                                disabled={safePage === totalPages}
                                onClick={() => gotoPage(safePage + 1)}
                                aria-label="Next page"
                                id="next-page-btn"
                            >
                                <Icon.ChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Image Modal ─────────────────────────────────── */}
            {imageModal && (
                <div className="modal-overlay" onClick={() => setImageModal(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                Images — {imageModal.employee.name} ({imageModal.employee.employee_id ?? imageModal.employee.emp_no})
                            </h2>
                            <button className="modal-close-btn" onClick={() => setImageModal(null)} aria-label="Close">
                                <Icon.X />
                            </button>
                        </div>
                        <ImageGrid employee={imageModal.employee} />
                    </div>
                </div>
            )}

            {/* ── Edit Modal ──────────────────────────────────── */}
            {editModal && (
                <div className="modal-overlay" onClick={() => !saving && setEditModal(null)}>
                    <div className="modal-card confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Edit Employee</h2>
                            <button className="modal-close-btn" onClick={() => setEditModal(null)} disabled={saving} aria-label="Close">
                                <Icon.X />
                            </button>
                        </div>
                        <p className="confirm-body" style={{ marginBottom: "0.75rem" }}>
                            Update the name for <strong>{editModal.employee.employee_id ?? editModal.employee.emp_no}</strong>:
                        </p>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
                            placeholder="Employee name"
                            autoFocus
                            style={{
                                width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px",
                                border: "1.5px solid #cbd5e1", fontSize: "0.95rem",
                                outline: "none", marginBottom: "1.25rem", boxSizing: "border-box"
                            }}
                        />
                        <div className="confirm-actions">
                            <button className="cancel-btn" onClick={() => setEditModal(null)} disabled={saving}>
                                Cancel
                            </button>
                            <button
                                className="export-btn"
                                onClick={handleEditSave}
                                disabled={saving || !editName.trim()}
                                style={{ background: "linear-gradient(135deg,#025F67,#014a51)", color: "#fff", border: "none" }}
                                id="confirm-edit-btn"
                            >
                                {saving ? "Saving…" : <><Icon.Check /> Save</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bulk Delete Confirm Modal ───────────────────── */}
            {bulkDeleteModal && (
                <div className="modal-overlay" onClick={() => !bulkDeleting && setBulkDeleteModal(false)}>
                    <div className="modal-card confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Delete {selectedIds.size} Employee{selectedIds.size !== 1 ? "s" : ""}</h2>
                            <button className="modal-close-btn" onClick={() => setBulkDeleteModal(false)} disabled={bulkDeleting} aria-label="Close">
                                <Icon.X />
                            </button>
                        </div>
                        <p className="confirm-body">
                            Are you sure you want to permanently delete{" "}
                            <strong>{selectedIds.size} employee{selectedIds.size !== 1 ? "s" : ""}</strong>?
                            <br />
                            This will remove all associated images and cannot be undone.
                        </p>
                        {bulkDeleting && (
                            <div className="bulk-progress-bar">
                                <div className="bulk-progress-fill" />
                            </div>
                        )}
                        <div className="confirm-actions">
                            <button className="cancel-btn" onClick={() => setBulkDeleteModal(false)} disabled={bulkDeleting}>
                                Cancel
                            </button>
                            <button
                                className="delete-confirm-btn"
                                onClick={handleBulkDeleteConfirm}
                                disabled={bulkDeleting}
                                id="confirm-bulk-delete-btn"
                            >
                                {bulkDeleting ? (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                            <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
                                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                                        </svg>
                                        Deleting…
                                    </>
                                ) : (
                                    <><Icon.Trash /> Delete All</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm Modal ────────────────────────── */}
            {deleteModal && (
                <div className="modal-overlay" onClick={() => !deleting && setDeleteModal(null)}>
                    <div className="modal-card confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Delete Employee</h2>
                            <button className="modal-close-btn" onClick={() => setDeleteModal(null)} disabled={deleting} aria-label="Close">
                                <Icon.X />
                            </button>
                        </div>
                        <p className="confirm-body">
                            Are you sure you want to delete{" "}
                            <strong>{deleteModal.employee.name}</strong> (
                            {deleteModal.employee.employee_id ?? deleteModal.employee.emp_no})?
                            <br />
                            This will permanently remove the employee and all associated images.
                        </p>
                        <div className="confirm-actions">
                            <button className="cancel-btn" onClick={() => setDeleteModal(null)} disabled={deleting}>
                                Cancel
                            </button>
                            <button
                                className="delete-confirm-btn"
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                                id="confirm-delete-btn"
                            >
                                {deleting ? (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                            <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
                                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                                        </svg>
                                        Deleting…
                                    </>
                                ) : (
                                    <>
                                        <Icon.Trash />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Update Modal (Add More Photos) ─────────────────── */}
            {updateModal && (
                <UpdateModal 
                    employee={updateModal} 
                    onClose={() => {
                        setUpdateModal(null);
                    }}
                    onSuccess={() => {
                        setUpdateModal(null);
                        fetchEmployees();
                        setToast({ type: "success", message: "Employee profile updated successfully!" });
                    }}
                />
            )}

            {/* ── Toast ──────────────────────────────────────── */}
            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
    );
}

// ─── Image Grid Sub-component ─────────────────────────────────
function ImageGrid({ employee }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                setLoading(true);
                const empId = employee.employee_id ?? employee.emp_no;
                const res = await axios.get(`${API_BASE_URL}/employees/${empId}/images`, { timeout: 10000 });
                if (!cancelled) {
                    const imgs = Array.isArray(res.data) ? res.data : (res.data?.images ?? []);
                    setImages(imgs);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.detail || "Could not load images.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [employee]);

    const handleDeleteImage = async (path) => {
        if (!window.confirm("Are you sure you want to delete this specific image? This will recalculate the employee's average profile.")) return;
        
        try {
            const empId = employee.employee_id ?? employee.emp_no;
            await axios.delete(`${API_BASE_URL}/employees/${empId}/images`, { params: { path } });
            
            // Refresh local images
            setImages(prev => prev.filter(img => (typeof img === "string" ? img : img.path) !== path));
            
            // Optional: If we want the parent list to update its photo_count, we'd need a callback.
            // But for now, just refreshing the modal grid is good.
        } catch (err) {
            alert("Failed to delete image: " + (err.response?.data?.detail || err.message));
        }
    };

    if (loading)
        return <div className="modal-empty house-spinner">Loading images…</div>;
    if (error)
        return <div className="modal-empty" style={{ color: "#dc2626" }}>{error}</div>;
    if (images.length === 0)
        return <div className="modal-empty">No images found for this employee.</div>;

    return (
        <div className="modal-image-grid">
            {images.map((img, i) => {
                const path = typeof img === "string" ? img : img.url ?? img.path ?? "";
                const src = path.startsWith("http") ? path : `${API_BASE_URL}/${path}`;
                return (
                    <div className="modal-img-thumb" key={i}>
                        <img src={src} alt={`img-${i}`} loading="lazy" />
                        <button className="img-delete-btn" onClick={() => handleDeleteImage(path)} title="Delete Image">
                            <Icon.Trash />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}


// ─── Update Modal Component ───────────────────────────────────
function UpdateModal({ employee, onClose, onSuccess }) {
    const [phase, setPhase] = useState("select"); // 'select' | 'preview'
    const [newImages, setNewImages] = useState([]); // { id, b64/file, type }
    const [oldImages, setOldImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [previews, setPreviews] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [message, setMessage] = useState(null);
    const [lightbox, setLightbox] = useState(null);

    // Track which historical images are kept
    const [keptPaths, setKeptPaths] = useState([]);

    const fileInputRef = useRef(null);

    useEffect(() => {
        async function fetchOld() {
            try {
                const empId = employee.employee_id ?? employee.emp_no;
                const res = await axios.get(`${API_BASE_URL}/employees/${empId}/images`);
                const imgs = Array.isArray(res.data) ? res.data : (res.data?.images ?? []);
                setOldImages(imgs);
                // Initially keep all
                setKeptPaths(imgs.map(img => typeof img === "string" ? img : img.path));
            } catch (err) { console.error("Error fetching old images:", err); }
        }
        fetchOld();
    }, [employee]);

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const mapped = files.map(f => ({ id: Math.random(), data: f, type: 'upload', preview: URL.createObjectURL(f) }));
        setNewImages(prev => [...prev, ...mapped]);
        e.target.value = "";
    };

    const handleCapture = async () => {
        setLoading(true);
        try {
            const data = await apiService.captureSnapshot();
            if (data.image_b64) {
                setNewImages(prev => [
                    ...prev, 
                    { id: Math.random(), data: data.image_b64, type: 'capture', preview: `data:image/jpeg;base64,${data.image_b64}` }
                ]);
            }
        } catch (err) { alert("Capture failed: " + err.message); }
        finally { setLoading(false); }
    };

    const handleProceedToPreview = async () => {
        if (newImages.length === 0) return;
        setLoading(true);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append("employee_id", employee.employee_id ?? employee.emp_no);
            formData.append("name", employee.name);
            
            newImages.forEach(img => {
                if (img.type === 'upload') {
                    formData.append("files", img.data);
                } else {
                    const byteStr = atob(img.data);
                    const arr = new Uint8Array(byteStr.length);
                    for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
                    const blob = new Blob([arr], { type: "image/jpeg" });
                    const file = new File([blob], `capture_${img.id}.jpg`, { type: "image/jpeg" });
                    formData.append("files", file);
                }
            });

            const res = await axios.post(`${API_BASE_URL}/enroll/preview`, formData);
            setPreviews(res.data.previews);
            setSessionId(res.data.session_id);
            setPhase("preview");
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || "Preview failed" });
        } finally { setLoading(false); }
    };

    const handleRemovePreview = (token, index) => {
        // If it's a new preview with a token, we remove it from the previews list
        if (token) {
            setPreviews(prev => prev.filter(p => p.token !== token));
        } else {
            // If it's an error item without a token, remove by index
            setPreviews(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleRemoveOld = (path) => {
        setKeptPaths(prev => prev.filter(p => p !== path));
    };

    const handleConfirmUpdate = async () => {

        const approvedTokens = previews.filter(f => f.status === "ok").map(f => f.token);
        
        // At least one image must remain (either old or new)
        if (approvedTokens.length === 0 && keptPaths.length === 0) {
            setMessage({ type: 'error', text: "Profile cannot be empty. Keep at least one image." });
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("session_id", sessionId);
            formData.append("approved_tokens", JSON.stringify(approvedTokens));
            formData.append("kept_paths", JSON.stringify(keptPaths));
            await axios.post(`${API_BASE_URL}/enroll/confirm`, formData);
            onSuccess();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || "Update failed" });
        } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card wide" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-wrap">
                        <div className="modal-icon-small"><Icon.RefreshCw /></div>
                        <h2 className="modal-title">Update Profile: {employee.name}</h2>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}><Icon.X /></button>
                </div>

                <div className="update-modal-stepper">
                    <div className={`step-item ${phase === 'select' ? 'active' : 'done'}`}>
                        <div className="step-num">{phase === 'select' ? '1' : '✓'}</div>
                        <div className="step-label">Add Photos</div>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step-item ${phase === 'preview' ? 'active' : ''}`}>
                        <div className="step-num">2</div>
                        <div className="step-label">Review & Sync</div>
                    </div>
                </div>

                <div className="modal-body">
                    {loading && phase === 'select' && (
                        <div className="modal-loading-overlay">
                            <div className="modal-loading-content">
                                <div className="loading-spinner-large"></div>
                                <p>Extracting faces and preparing preview...</p>
                            </div>
                        </div>
                    )}

                    {phase === "select" ? (
                        <div className="update-flow-select">
                            <div className="update-actions">
                                <button className="capture-btn" onClick={handleCapture} disabled={loading}>
                                    <Icon.Camera /> {loading ? "Capturing..." : "Capture from Jetson"}
                                </button>
                                <button className="export-btn" onClick={() => fileInputRef.current?.click()}>
                                    <Icon.Upload /> Upload Files
                                </button>
                                <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileUpload} />
                            </div>

                            {newImages.length > 0 && (
                                <div className="update-selection-grid">
                                    <h4 className="selection-title">New Photos ({newImages.length})</h4>
                                    <div className="selection-thumbs">
                                        {newImages.map(img => (
                                            <div key={img.id} className="selection-thumb">
                                                <img src={img.preview} alt="new" />
                                                <button className="thumb-remove" onClick={() => setNewImages(prev => prev.filter(i => i.id !== img.id))}><Icon.X /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="update-footer">
                                <button className="modal-btn-cancel" onClick={onClose}>Cancel</button>
                                <button className="modal-btn-confirm" disabled={newImages.length === 0 || loading} onClick={handleProceedToPreview}>
                                    Next: Preview {newImages.length > 0 ? `(${newImages.length} images)` : ""}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="update-flow-preview">
                            {message && <div className={`update-status-msg ${message.type}`}>{message.text}</div>}
                            
                            <div className="preview-sections">
                                <div className="preview-section">
                                    <h4 className="section-title">Profile Preview (New + Existing)</h4>
                                    <div className="preview-grid">
                                        {/* New Images */}
                                        {previews.map((f, i) => (
                                            <div key={`new-${i}`} className={`preview-item ${f.status}`}>
                                                {f.face_b64 ? (
                                                    <img src={`data:image/jpeg;base64,${f.face_b64}`} alt="face" onClick={() => setLightbox(f)} />
                                                ) : (
                                                    <div className="preview-error-box"><Icon.AlertCircle /></div>
                                                )}
                                                <div className="preview-status-chip">{'Ready'}</div>
                                                <button className="thumb-remove" onClick={() => handleRemovePreview(f.token, i)} title="Remove">
                                                    <Icon.X />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Existing Images (Kept) */}
                                        {oldImages.filter(img => keptPaths.includes(typeof img === "string" ? img : img.path)).map((img, i) => {
                                            const path = typeof img === "string" ? img : img.url ?? img.path ?? "";
                                            const fullSrc = path.startsWith("http") ? path : `${API_BASE_URL}/${path}`;
                                            return (
                                                <div key={`old-${i}`} className="preview-item old">
                                                    <img src={fullSrc} alt="old" onClick={() => setLightbox({ face_b64: null, url: fullSrc, filename: `Existing Photo #${i+1}` })} />
                                                    <div className="preview-status-chip old">Existing</div>
                                                    <button className="thumb-remove" onClick={() => handleRemoveOld(path)} title="Remove from list">
                                                        <Icon.X />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {previews.length === 0 && keptPaths.length === 0 && (
                                        <div className="preview-empty-state">
                                            No images selected for this profile.
                                        </div>
                                    )}
                                </div>

                                {oldImages.length > keptPaths.length && (
                                     <div className="preview-section rejected-section">
                                        <h4 className="section-title">Removed from Profile</h4>
                                        <p className="section-subtitle">These images will be deleted upon confirmation.</p>
                                        <div className="preview-grid">
                                            {oldImages.filter(img => !keptPaths.includes(typeof img === "string" ? img : img.path)).map((img, i) => {
                                                const path = typeof img === "string" ? img : img.url ?? img.path ?? "";
                                                const fullSrc = path.startsWith("http") ? path : `${API_BASE_URL}/${path}`;
                                                return (
                                                    <div key={`rej-${i}`} className="preview-item rejected">
                                                        <img src={fullSrc} alt="rejected" />
                                                        <div className="preview-status-chip rejected">Will Delete</div>
                                                        <button className="thumb-remove undo" onClick={() => setKeptPaths(prev => [...prev, path])} title="Undo removal">
                                                            <Icon.Check />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                     </div>
                                )}
                            </div>

                            <div className="update-footer">
                                <button className="modal-btn-cancel" onClick={() => setPhase("select")}>Back</button>
                                <button className="modal-btn-confirm" disabled={loading || previews.filter(f => f.status === 'ok').length === 0} onClick={handleConfirmUpdate}>
                                    {loading ? "Updating..." : `Confirm & Update Profile`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {lightbox && <Lightbox data={lightbox} onClose={() => setLightbox(null)} />}
        </div>
    );
}

function Lightbox({ data, onClose }) {
    const src = data.face_b64 ? `data:image/jpeg;base64,${data.face_b64}` : data.url;
    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                <button className="lightbox-close" onClick={onClose}><Icon.X /></button>
                <img src={src} alt="Zoom" className="lightbox-img" />
                <div className="lightbox-caption">{data.filename || "Face Preview"}</div>
            </div>
        </div>
    );
}

// ─── Pagination range helper ──────────────────────────────────
function getPaginationRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
    if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "…", current - 1, current, current + 1, "…", total];
}