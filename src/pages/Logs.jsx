import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableHead, TableRow, TableSortLabel, TablePagination,
    CircularProgress, IconButton, Alert, Chip,
    Tooltip, TextField, InputAdornment, Stack,
    FormControlLabel, Switch, Button, Menu, MenuItem, ListItemIcon, ListItemText, Checkbox,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Snackbar, Grid, Card
} from '@mui/material';
import { Refresh, Search, CheckCircle, Cancel, Download as DownloadIcon, Delete as DeleteIcon, Warning as WarningIcon } from '@mui/icons-material';
import { ChevronRight, ArrowLeft, Users, Server } from 'lucide-react';
import axios from 'axios';

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const JETSON_IP = '192.168.2.235';  // ← change if needed
const API_BASE = `http://${JETSON_IP}:8080`;

const api = axios.create({ baseURL: API_BASE, timeout: 30000 });

// ─── helpers ────────────────────────────────────────────────────────────────

// Normalize SQLite "YYYY-MM-DD HH:MM:SS" → ISO "YYYY-MM-DDTHH:MM:SS" so
// every browser (Safari, Firefox, Chrome) parses it correctly.
const normalizeTs = (v) => (v && typeof v === 'string' && v.includes(' ') && !v.includes('T'))
    ? v.replace(' ', 'T')
    : v;

const fmt = {
    date: (v) => { const d = new Date(normalizeTs(v)); return isNaN(d) ? (v ?? '—') : d.toLocaleDateString(); },
    time: (v) => { const d = new Date(normalizeTs(v)); return isNaN(d) ? (v ?? '—') : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); },
    ts: (v) => { const d = new Date(normalizeTs(v)); return isNaN(d) ? (v ?? '—') : d.toLocaleString(); },
    ms: (v) => v == null ? '—' : v,
    fps: (v) => v == null ? '—' : v,
};

function cmp(a, b, col) {
    // For date/time display columns, sort by the raw ISO timestamp string for
    // correct chronological order (avoids sorting on localised display strings).
    const rawCol = col === 'date' || col === 'time' ? '_raw' : col;
    const av = a[rawCol] ?? a[col] ?? '';
    const bv = b[rawCol] ?? b[col] ?? '';
    return bv < av ? -1 : bv > av ? 1 : 0;
}
const comparator = (order, col) => (a, b) => order === 'desc' ? cmp(a, b, col) : -cmp(a, b, col);

const ROWS_OPTS = [10, 25, 50, 100];

const exportToCSV = (data, filename, columns) => {
    if (!data || !data.length) return;
    const header = columns.map(c => `"${String(c.label).replace(/"/g, '""')}"`).join(',');
    const csvRows = data.map(row => columns.map(c => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(','));
    const csvStr = [header, ...csvRows].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
};

// ─── reusable sub-components ────────────────────────────────────────────────

const SectionHeader = ({ title, count, color, onRefresh, loading }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>{title}</Typography>
        <Chip
            label={`${count} record${count !== 1 ? 's' : ''}`}
            size="small"
            sx={{ bgcolor: `${color}.light`, color: `${color}.dark`, fontWeight: 700, fontSize: '0.7rem' }}
        />
        <Box flex={1} />
        <Tooltip title={`Refresh ${title}`}>
            <span>
                <IconButton size="small" onClick={onRefresh} disabled={loading} color={color}>
                    <Refresh fontSize="small" />
                </IconButton>
            </span>
        </Tooltip>
    </Box>
);

const SortHead = ({ cols, order, orderBy, onSort, bg, renderFirstCol }) => (
    <TableHead sx={{ bgcolor: bg ?? 'rgba(0,0,0,0.04)' }}>
        <TableRow>
            {renderFirstCol && renderFirstCol()}
            {cols.map(c => (
                <TableCell
                    key={c.key}
                    align={c.align ?? 'left'}
                    sortDirection={orderBy === c.key ? order : false}
                    sx={{ fontWeight: 700, whiteSpace: 'nowrap', py: 1.5 }}
                >
                    {c.sort !== false
                        ? <TableSortLabel active={orderBy === c.key} direction={orderBy === c.key ? order : 'asc'} onClick={() => onSort(c.key)}>{c.label}</TableSortLabel>
                        : c.label}
                </TableCell>
            ))}
        </TableRow>
    </TableHead>
);

const ScoreChip = ({ score }) => {
    const pct = Math.round((score ?? 0) * 100);
    const color = pct >= 80 ? 'success' : pct >= 60 ? 'warning' : 'error';
    return <Chip label={`${pct}%`} size="small" color={color} variant="outlined" sx={{ fontWeight: 700, minWidth: 54 }} />;
};

const Bool = ({ v }) => v
    ? <CheckCircle fontSize="small" color="success" />
    : <Cancel fontSize="small" sx={{ color: 'text.disabled' }} />;

const paperSx = {
    borderRadius: 2,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid',
    borderColor: 'divider',
    overflow: 'hidden',
    mb: 1,
};

// ════════════════════════════════════════════════════════════════════════════
//  1. ATTENDANCE LOGS
// ════════════════════════════════════════════════════════════════════════════

const ATT_COLS = [
    { key: 'empNo', label: 'Employee No' },
    { key: 'name', label: 'Employee Name' },
    { key: 'score', label: 'Confidence (%)', sort: false },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time', sort: false },
];

const AttendanceTable = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('date');
    const [page, setPage] = useState(0);
    const [rpp, setRpp] = useState(25);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [deleting, setDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/logs', { params: { limit: 10000 } });
            setRows(
                (Array.isArray(res.data) ? res.data : []).map(l => ({
                    id: l.id,
                    empNo: l.employee_id ?? '—',
                    name: l.employee_name || 'Unknown',
                    score: l.score,
                    date: fmt.date(l.timestamp),
                    time: fmt.time(l.timestamp),
                    _raw: l.timestamp,
                }))
            );
            setError('');
        } catch (e) {
            setError(`Failed to load attendance logs. (${e?.response?.status ?? e.message})`);
            setRows([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSort = key => {
        setOrder(orderBy === key && order === 'asc' ? 'desc' : 'asc');
        setOrderBy(key); setPage(0);
    };

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        const filtered = q
            ? rows.filter(r => String(r.empNo).toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.date.includes(q))
            : rows;
        return [...filtered].sort(comparator(order, orderBy));
    }, [rows, search, order, orderBy]);

    const page_rows = visible.slice(page * rpp, page * rpp + rpp);
    const allPageIds = page_rows.map(r => r.id);
    const allPageSel = allPageIds.length > 0 && allPageIds.every(id => selectedIds.has(id));
    const somePageSel = allPageIds.some(id => selectedIds.has(id));

    // For Select All Visible (across all pages)
    const allVisibleIds = visible.map(r => r.id);
    const allVisibleSel = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.has(id));

    const toggleAll = () => setSelectedIds(prev => {
        const next = new Set(prev);
        allPageSel ? allPageIds.forEach(id => next.delete(id)) : allPageIds.forEach(id => next.add(id));
        return next;
    });

    const toggleSelectAllVisible = () => {
        if (allVisibleSel) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allVisibleIds));
        }
    };

    const toggleOne = (id) => setSelectedIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const handleDeleteSelected = async () => {
        setConfirmOpen(false);
        setDeleting(true);
        const ids = Array.from(selectedIds);
        try {
            await api.delete('/logs/bulk', { data: { ids } });
            setSelectedIds(new Set());
            await load();
            setSnack({ open: true, message: `Deleted ${ids.length} attendance log${ids.length !== 1 ? 's' : ''}.`, severity: 'success' });
        } catch (e) {
            console.error('Delete failed:', e?.response?.data ?? e.message);
            const detail = e?.response?.data?.detail ?? e.message ?? 'Unknown error';
            setSnack({ open: true, message: `Delete failed: ${detail}`, severity: 'error' });
        } finally { setDeleting(false); }
    };

    return (
        <>
            <SectionHeader title="Attendance Logs" count={visible.length} color="primary" onRefresh={load} loading={loading} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: { xs: '100%', sm: 340 } }}>
                    <TextField
                        size="small" placeholder="Search by ID, name or date…"
                        value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                        sx={{ flex: 1 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                    />
                    <Button
                        size="small" variant="outlined" color="primary"
                        onClick={toggleSelectAllVisible}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, height: 38, whiteSpace: 'nowrap' }}
                    >
                        {allVisibleSel ? 'Deselect All' : `Select All (${visible.length})`}
                    </Button>
                </Stack>
                {selectedIds.size > 0 && (
                    <Button
                        variant="contained" color="error" size="small"
                        startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                        onClick={() => setConfirmOpen(true)} disabled={deleting}
                        sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
                    >
                        Delete Selected ({selectedIds.size})
                    </Button>
                )}
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Paper sx={paperSx}>
                {loading
                    ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress size={28} /></Box>
                    : (
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 560 }}>
                                <SortHead
                                    cols={ATT_COLS} order={order} orderBy={orderBy} onSort={handleSort}
                                    renderFirstCol={() => (
                                        <TableCell padding="checkbox">
                                            <Checkbox size="small" color="primary" checked={allPageSel} indeterminate={somePageSel && !allPageSel} onChange={toggleAll} />
                                        </TableCell>
                                    )}
                                />
                                <TableBody>
                                    {page_rows.length === 0
                                        ? <TableRow><TableCell colSpan={ATT_COLS.length + 1} align="center" sx={{ py: 5, color: 'text.secondary' }}>{search ? 'No matching records.' : 'No attendance logs found.'}</TableCell></TableRow>
                                        : page_rows.map(r => (
                                            <TableRow key={r.id} hover selected={selectedIds.has(r.id)}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox size="small" color="primary" checked={selectedIds.has(r.id)} onChange={() => toggleOne(r.id)} />
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{r.empNo}</TableCell>
                                                <TableCell>{r.name}</TableCell>
                                                <TableCell><ScoreChip score={r.score} /></TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>{r.date}</TableCell>
                                                <TableCell sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{r.time}</TableCell>
                                            </TableRow>
                                        ))
                                    }
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                <TablePagination
                    component="div" count={visible.length} page={page} rowsPerPage={rpp}
                    rowsPerPageOptions={ROWS_OPTS}
                    onPageChange={(_, p) => setPage(p)}
                    onRowsPerPageChange={e => { setRpp(+e.target.value); setPage(0); }}
                />
            </Paper>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                    <WarningIcon color="error" /> Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Permanently delete <strong>{selectedIds.size} attendance log{selectedIds.size !== 1 ? 's' : ''}</strong>? This cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setConfirmOpen(false)} variant="outlined" size="small" sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleDeleteSelected} variant="contained" color="error" size="small" autoFocus
                        startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                        sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>
                        Delete {selectedIds.size} Record{selectedIds.size !== 1 ? 's' : ''}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ borderRadius: 2 }}>{snack.message}</Alert>
            </Snackbar>
        </>
    );
};

// ════════════════════════════════════════════════════════════════════════════
//  2. PERFORMANCE LOGS
// ════════════════════════════════════════════════════════════════════════════

const PERF_COLS = [
    { key: 'id', label: '#', align: 'right' },
    { key: 'timestamp', label: 'Timestamp', sort: false },
    { key: 'fps', label: 'FPS', align: 'right' },
    { key: 'total_ms', label: 'Total (ms)', align: 'right' },
    { key: 'capture_ms', label: 'Capture (ms)', align: 'right' },
    { key: 'detect_ms', label: 'Detect (ms)', align: 'right' },
    { key: 'embed_ms', label: 'Embed (ms)', align: 'right' },
    { key: 'match_ms', label: 'Match (ms)', align: 'right' },
    { key: 'face_detected', label: 'Face', sort: false, align: 'center' },
    { key: 'faces_identified', label: "ID'd", align: 'right' },
    { key: 'last_identified_name', label: 'Last Match', sort: false },
];

const PerformanceTable = () => {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('id');
    const [page, setPage] = useState(0);
    const [rpp, setRpp] = useState(25);
    const [faceOnly, setFaceOnly] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [deleting, setDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isGlobalSel, setIsGlobalSel] = useState(false);
    const [fetchingIds, setFetchingIds] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { limit: rpp, offset: page * rpp, order };
            if (faceOnly) params.face_only = 1;
            const res = await api.get('/performance-logs', { params });
            const data = res.data;
            if (Array.isArray(data)) {
                setRows(data); setTotal(data.length);
            } else if (data && Array.isArray(data.data)) {
                setRows(data.data); setTotal(data.total ?? data.data.length);
            } else {
                setRows([]); setTotal(0);
            }
            setError('');
        } catch (e) {
            const status = e?.response?.status;
            setError(status === 404
                ? 'Endpoint /performance-logs not found. Add it to main.py and restart backend.'
                : `Failed to load performance logs. (${status ?? e.message})`
            );
            setRows([]); setTotal(0);
        } finally { setLoading(false); }
    }, [rpp, page, order, faceOnly]);

    useEffect(() => { load(); }, [load]);

    const handleSort = key => {
        setOrder(orderBy === key && order === 'asc' ? 'desc' : 'asc');
        setOrderBy(key); setPage(0);
    };

    const sorted = useMemo(() => [...rows].sort(comparator(order, orderBy)), [rows, order, orderBy]);
    const allPageIds = sorted.map(r => r.id);
    const allPageSel = allPageIds.length > 0 && (isGlobalSel || allPageIds.every(id => selectedIds.has(id)));
    const somePageSel = isGlobalSel || allPageIds.some(id => selectedIds.has(id));

    const toggleAllOnPage = () => {
        setIsGlobalSel(false);
        setSelectedIds(prev => {
            const next = new Set(prev);
            const pSel = allPageIds.length > 0 && allPageIds.every(id => prev.has(id));
            pSel ? allPageIds.forEach(id => next.delete(id)) : allPageIds.forEach(id => next.add(id));
            return next;
        });
    };

    const toggleGlobalSelection = () => {
        if (isGlobalSel) {
            setIsGlobalSel(false);
            setSelectedIds(new Set());
        } else {
            setIsGlobalSel(true);
            setSelectedIds(new Set());
        }
    };

    const toggleOne = (id) => {
        setIsGlobalSel(false);
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleDeleteSelected = async () => {
        setConfirmOpen(false);
        setDeleting(true);

        let ids = Array.from(selectedIds);
        if (isGlobalSel) {
            setFetchingIds(true);
            try {
                // Fetch ALL matching IDs from the backend
                const params = { limit: 100000, offset: 0, order: 'desc' };
                if (faceOnly) params.face_only = 1;
                const res = await api.get('/performance-logs', { params });
                const data = res.data;
                const allRows = Array.isArray(data) ? data : (data?.data ?? []);
                ids = allRows.map(r => r.id);
                if (!ids.length) { setDeleting(false); setFetchingIds(false); return; }
            } catch (e) {
                setSnack({ open: true, message: `Failed to fetch record IDs: ${e.message}`, severity: 'error' });
                setDeleting(false); setFetchingIds(false); return;
            } finally { setFetchingIds(false); }
        }

        try {
            await api.delete('/performance-logs/bulk', { data: { ids } });
            setSelectedIds(new Set());
            setIsGlobalSel(false);
            await load();
            setSnack({ open: true, message: `Deleted ${ids.length} performance log${ids.length !== 1 ? 's' : ''}.`, severity: 'success' });
        } catch (e) {
            console.error('Delete failed:', e?.response?.data ?? e.message);
            const detail = e?.response?.data?.detail ?? e.message ?? 'Unknown error';
            setSnack({ open: true, message: `Delete failed: ${detail}`, severity: 'error' });
        } finally { setDeleting(false); }
    };

    return (
        <>
            <SectionHeader title="Performance Logs" count={total} color="success" onRefresh={load} loading={loading} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <FormControlLabel
                        control={<Switch size="small" checked={faceOnly} onChange={e => { setFaceOnly(e.target.checked); setPage(0); }} color="success" />}
                        label={<Typography variant="body2" color="text.secondary">Faces only</Typography>}
                    />
                    <Button
                        size="small" variant="outlined" color="success"
                        onClick={allPageSel && !isGlobalSel ? toggleGlobalSelection : toggleAllOnPage}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, height: 30 }}
                    >
                        {isGlobalSel ? 'Deselect All'
                            : allPageSel ? `Select ALL (${total}) Records`
                                : `Select Page (${allPageIds.length})`}
                    </Button>
                </Stack>
                {(selectedIds.size > 0 || isGlobalSel) && (
                    <Button
                        variant="contained" color="error" size="small"
                        startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                        onClick={() => setConfirmOpen(true)} disabled={deleting}
                        sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
                    >
                        {fetchingIds ? 'Fetching IDs...' : `Delete Selected (${isGlobalSel ? total : selectedIds.size})`}
                    </Button>
                )}
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Paper sx={paperSx}>
                {loading
                    ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress size={28} color="success" /></Box>
                    : (
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 860 }}>
                                <SortHead
                                    cols={PERF_COLS} order={order} orderBy={orderBy} onSort={handleSort} bg="rgba(46,125,50,0.05)"
                                    renderFirstCol={() => (
                                        <TableCell padding="checkbox">
                                            <Checkbox size="small" color="success" checked={allPageSel} indeterminate={somePageSel && !allPageSel} onChange={toggleAllOnPage} />
                                        </TableCell>
                                    )}
                                />
                                <TableBody>
                                    {sorted.length === 0
                                        ? <TableRow><TableCell colSpan={PERF_COLS.length + 1} align="center" sx={{ py: 5, color: 'text.secondary' }}>No performance logs found.</TableCell></TableRow>
                                        : sorted.map((r, i) => {
                                            const sel = isGlobalSel || selectedIds.has(r.id);
                                            return (
                                                <TableRow key={r.id ?? i} hover selected={sel}>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox size="small" color="success" checked={sel} onChange={() => toggleOne(r.id)} />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>{r.id}</TableCell>
                                                    <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{fmt.ts(r.timestamp)}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600, color: (r.fps ?? 0) < 10 ? 'error.main' : 'success.main', fontVariantNumeric: 'tabular-nums' }}>{fmt.fps(r.fps)}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>{fmt.ms(r.total_ms)}</TableCell>
                                                    <TableCell align="right" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{fmt.ms(r.capture_ms)}</TableCell>
                                                    <TableCell align="right" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{fmt.ms(r.detect_ms)}</TableCell>
                                                    <TableCell align="right" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{fmt.ms(r.embed_ms)}</TableCell>
                                                    <TableCell align="right" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{fmt.ms(r.match_ms)}</TableCell>
                                                    <TableCell align="center"><Bool v={r.face_detected} /></TableCell>
                                                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{r.faces_identified ?? 0}</TableCell>
                                                    <TableCell sx={{ color: r.last_identified_name && r.last_identified_name !== '—' ? 'success.dark' : 'text.disabled' }}>{r.last_identified_name || '—'}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    }
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                <TablePagination
                    component="div" count={total} page={page} rowsPerPage={rpp}
                    rowsPerPageOptions={ROWS_OPTS}
                    onPageChange={(_, p) => setPage(p)}
                    onRowsPerPageChange={e => { setRpp(+e.target.value); setPage(0); }}
                />
            </Paper>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                    <WarningIcon color="error" /> Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Permanently delete <strong>{isGlobalSel ? total : selectedIds.size} performance log{(isGlobalSel ? total : selectedIds.size) !== 1 ? 's' : ''}</strong>? This cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setConfirmOpen(false)} variant="outlined" size="small" sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleDeleteSelected} variant="contained" color="error" size="small" autoFocus
                        startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                        sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>
                        Delete {isGlobalSel ? total : selectedIds.size} Record{(isGlobalSel ? total : selectedIds.size) !== 1 ? 's' : ''}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ borderRadius: 2 }}>{snack.message}</Alert>
            </Snackbar>
        </>
    );
};

// ════════════════════════════════════════════════════════════════════════════
//  PAGE ROOT
// ════════════════════════════════════════════════════════════════════════════

// ── LogCategoryCard ────────────────────────────────────────────────────────
const LogCategoryCard = ({ label, subtitle, category, icon: Icon, onClick }) => {
    const isPerf = category === 'performance';
    const bg = isPerf ? '#fff3e0' : '#e8f5e9';
    const border = isPerf ? '#ffcc80' : '#a5d6a7';
    const text = isPerf ? '#e65100' : '#2e7d32';

    return (
        <Card
            onClick={onClick}
            sx={{
                cursor: 'pointer',
                border: `1px solid ${border}`,
                borderRadius: 2,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'transform 0.15s, box-shadow 0.15s',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
                    bgcolor: bg,
                },
            }}
        >
            <Box sx={{
                bgcolor: bg, border: `1px solid ${border}`, borderRadius: 1.5, p: 1.25,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <Icon size={26} color={text} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {subtitle}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <ChevronRight size={16} color="#90a4ae" />
            </Box>
        </Card>
    );
};

// ── Breadcrumb ─────────────────────────────────────────────────────────────
const Breadcrumb = ({ view, setView }) => {
    const crumbs = view === 'root' ? ['logs/'] : ['logs/', `${view}/`];
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
            {crumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <ChevronRight size={13} color="#90a4ae" />}
                    <Typography
                        variant="caption"
                        onClick={() => { if (i === 0 && view !== 'root') setView('root'); }}
                        sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            color: i < crumbs.length - 1 ? '#025f67' : 'text.secondary',
                            cursor: i < crumbs.length - 1 ? 'pointer' : 'default',
                            fontWeight: i === crumbs.length - 1 ? 600 : 400,
                            '&:hover': i < crumbs.length - 1 ? { textDecoration: 'underline' } : {},
                        }}
                    >
                        {crumb}
                    </Typography>
                </React.Fragment>
            ))}
        </Box>
    );
};

const Logs = () => {
    const [view, setView] = useState('root');
    const [key, setKey] = useState(0);
    const [exportAnchor, setExportAnchor] = useState(null);
    const [exporting, setExporting] = useState(false);

    const doExport = async (type) => {
        setExportAnchor(null);
        setExporting(true);
        try {
            if (type === 'attendance' || type === 'both') {
                const res = await api.get('/logs', { params: { limit: 50000 } });
                const data = (Array.isArray(res.data) ? res.data : []).map(l => ({
                    id: l.id, empNo: l.employee_id ?? '—', name: l.employee_name || 'Unknown',
                    score: l.score, date: fmt.date(l.timestamp), time: fmt.time(l.timestamp),
                }));
                exportToCSV(data, 'Attendance_Logs.csv', ATT_COLS);
            }
            if (type === 'performance' || type === 'both') {
                let allRows = [], offset = 0;
                while (true) {
                    const res = await api.get('/performance-logs', { params: { limit: 5000, offset, order: 'desc' } });
                    const chunk = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
                    if (!chunk.length) break;
                    allRows = allRows.concat(chunk);
                    if (chunk.length < 5000 || allRows.length >= 100000) break;
                    offset += 5000;
                }
                const data = allRows.map(r => ({
                    id: r.id, timestamp: fmt.ts(r.timestamp), fps: fmt.fps(r.fps),
                    total_ms: fmt.ms(r.total_ms), capture_ms: fmt.ms(r.capture_ms),
                    detect_ms: fmt.ms(r.detect_ms), embed_ms: fmt.ms(r.embed_ms),
                    match_ms: fmt.ms(r.match_ms), face_detected: r.face_detected ? 'Yes' : 'No',
                    faces_identified: r.faces_identified ?? 0, last_identified_name: r.last_identified_name || '—',
                }));
                exportToCSV(data, 'Performance_Logs.csv', PERF_COLS);
            }
        } catch (e) {
            console.error('Export failed', e);
            alert('Export failed. Check console for details.');
        } finally { setExporting(false); }
    };

    return (
        <Box sx={{ p: { xs: 1, md: 2 }, fontFamily: "'Inter', sans-serif", animation: 'ciEnter 0.45s cubic-bezier(0.16,1,0.3,1) both' }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {view !== 'root' && (
                        <Tooltip title="Back">
                            <IconButton
                                size="small" onClick={() => setView('root')}
                                sx={{
                                    border: '1.5px solid #e2e8f0', borderRadius: 1.5, bgcolor: '#f8fafc',
                                    '&:hover': { bgcolor: '#e6f4f5', borderColor: '#025F67' }, flexShrink: 0, mt: 0.5
                                }}
                            >
                                <ArrowLeft size={15} />
                            </IconButton>
                        </Tooltip>
                    )}
                    {view === 'root' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#025F67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="16" x2="16" y2="16" />
                            </svg>
                        </Box>
                    )}
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={view === 'root' ? {
                            color: '#025F67', letterSpacing: '-0.03em', lineHeight: 1.2,
                        } : { fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
                            {view === 'root' ? 'System Logs'
                                : view === 'attendance' ? 'Attendance Logs'
                                    : 'Performance Logs'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            {view === 'root'
                                ? 'Attendance and performance records from the AI pipeline'
                                : `Detailed ${view} tracking records`}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mt: { xs: 1, sm: 0 }, alignItems: 'center' }}>
                    <Button
                        variant="outlined" size="small"
                        startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
                        onClick={e => setExportAnchor(e.currentTarget)} disabled={exporting}
                        sx={{ borderRadius: 2, fontWeight: 600, borderColor: '#e2e8f0', color: '#475569', height: 32 }}
                    >
                        {exporting ? 'Exporting...' : 'Export'}
                    </Button>
                    <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
                        {(view === 'root' || view === 'attendance') && (
                            <MenuItem onClick={() => doExport('attendance')}>
                                <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                                <ListItemText>Export Attendance Logs</ListItemText>
                            </MenuItem>
                        )}
                        {(view === 'root' || view === 'performance') && (
                            <MenuItem onClick={() => doExport('performance')}>
                                <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                                <ListItemText>Export Performance Logs</ListItemText>
                            </MenuItem>
                        )}
                        {view === 'root' && (
                            <MenuItem onClick={() => doExport('both')}>
                                <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                                <ListItemText>Export All Logs</ListItemText>
                            </MenuItem>
                        )}
                    </Menu>
                    {view !== 'root' && (
                        <Button
                            variant="outlined" size="small" startIcon={<Refresh />}
                            onClick={() => setKey(k => k + 1)}
                            sx={{ borderRadius: 2, fontWeight: 600, borderColor: '#e2e8f0', color: '#475569', height: 32 }}
                        >
                            Refresh
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Breadcrumb */}
            <Breadcrumb view={view} setView={setView} />

            {/* View Switching */}
            {view === 'root' && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <LogCategoryCard
                            label="Attendance Logs"
                            subtitle="Employee recognition & check-in events"
                            category="attendance"
                            icon={Users}
                            onClick={() => setView('attendance')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <LogCategoryCard
                            label="Performance Logs"
                            subtitle="System latency & pipeline metrics"
                            category="performance"
                            icon={Server}
                            onClick={() => setView('performance')}
                        />
                    </Grid>
                </Grid>
            )}

            {view === 'attendance' && (
                <Box sx={{ mt: 3, animation: 'ciEnter 0.3s' }}>
                    <AttendanceTable key={`att-${key}`} />
                </Box>
            )}

            {view === 'performance' && (
                <Box sx={{ mt: 3, animation: 'ciEnter 0.3s' }}>
                    <PerformanceTable key={`perf-${key}`} />
                </Box>
            )}

            <style>{`
                @keyframes ciEnter {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </Box>
    );
};

export default Logs;
