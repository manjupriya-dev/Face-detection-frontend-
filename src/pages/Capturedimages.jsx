import React, { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import {
    Box, Typography, Grid, Card, CardMedia, CardContent,
    TextField, InputAdornment, Chip, CircularProgress,
    IconButton, Tooltip, Dialog, DialogContent,
    DialogTitle, DialogActions, Button, Skeleton, Snackbar, Alert,
} from '@mui/material';
import {
    Search, RefreshCw, X, ZoomIn, ChevronRight,
    Image as ImageIcon,
    Folder, FolderOpen, ArrowLeft, Trash2, FolderX, Download,
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';

// ──────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────
const CATEGORY_STYLES = {
    known:   { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
    unknown: { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
};

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────

/** Build full URL for an image. */
const imgUrl = (relativePath) => `${API_BASE_URL}/captured-images_static/${relativePath}`;

/** Extract filename from a relative path. */
const basename = (path) => path.split('/').pop();

// ──────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ──────────────────────────────────────────────────────────────

/** ── Folder Card ──────────────────────────────────────────── */
const FolderCard = ({ label, subtitle, count, category, onClick, onDelete, selected, onSelect }) => {
    const cat = CATEGORY_STYLES[category] || CATEGORY_STYLES.unknown;
    return (
        <Card
            onClick={onClick}
            sx={{
                cursor: 'pointer',
                border: selected ? '2px solid #025F67' : `1px solid ${cat.border}`,
                borderRadius: 2,
                p: selected ? '15px' : 2,  // compensate 1px border diff
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                bgcolor: selected ? '#e0f4f5' : undefined,
                boxShadow: selected ? '0 0 0 3px rgba(2,95,103,0.15)' : undefined,
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: selected
                        ? '0 6px 18px rgba(2,95,103,0.2)'
                        : '0 6px 18px rgba(0,0,0,0.1)',
                    bgcolor: selected ? '#cce9ec' : cat.bg,
                },
            }}
        >
            {/* Select toggle button */}
            {onSelect && (
                <Tooltip title={selected ? 'Deselect' : 'Select for export'} placement="top">
                    <Box
                        onClick={(e) => { e.stopPropagation(); onSelect(); }}
                        sx={{
                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: selected ? '2px solid #025F67' : '2px solid #cfd8dc',
                            bgcolor: selected ? '#025F67' : '#fff',
                            transition: 'all 0.18s ease',
                            '&:hover': {
                                border: '2px solid #025F67',
                                bgcolor: selected ? '#014a51' : 'rgba(25,118,210,0.08)',
                            },
                        }}
                    >
                        {selected && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </Box>
                </Tooltip>
            )}

            <Box sx={{
                bgcolor: selected ? 'rgba(2,95,103,0.1)' : cat.bg,
                border: `1px solid ${selected ? '#7dbfc4' : cat.border}`,
                borderRadius: 1.5,
                p: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s',
            }}>
                <Folder size={26} color={selected ? '#025F67' : cat.text} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body1" sx={{
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: selected ? '#014a51' : undefined,
                }}>
                    {label}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                {count !== undefined && (
                    <Chip
                        label={`${count} img${count !== 1 ? 's' : ''}`}
                        size="small"
                        sx={{
                            height: 20, fontSize: '0.65rem', fontWeight: 700,
                            bgcolor: selected ? 'rgba(25,118,210,0.12)' : cat.bg,
                            color: selected ? '#014a51' : cat.text,
                            border: `1px solid ${selected ? '#7dbfc4' : cat.border}`,
                        }}
                    />
                )}

                {/* Delete folder button */}
                {onDelete && (
                    <Tooltip title="Delete folder" placement="top">
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            sx={{
                                color: '#ef5350',
                                '&:hover': { bgcolor: '#ffebee' },
                                p: '4px',
                            }}
                        >
                            <FolderX size={16} />
                        </IconButton>
                    </Tooltip>
                )}
                <ChevronRight size={16} color={selected ? '#025F67' : '#90a4ae'} />
            </Box>
        </Card>
    );
};


/** ── Image Card ───────────────────────────────────────────── */
const ImageCard = React.memo(({ image, onClick, onDelete }) => {
    const [loaded,   setLoaded]   = useState(false);
    const [imgError, setImgError] = useState(false);
    const cat     = CATEGORY_STYLES[image.category] || CATEGORY_STYLES.unknown;
    const full    = imgUrl(image.path);

    return (
        <Card
            sx={{
                border: `1px solid ${cat.border}`,
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'transform 0.15s, box-shadow 0.15s',
                '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                },
                '&:hover .img-actions': { opacity: 1 },
            }}
        >
            {/* Image area */}
            <Box
                onClick={() => onClick(image)}
                sx={{ position: 'relative', aspectRatio: '1/1', bgcolor: '#f5f5f5', cursor: 'pointer' }}
            >
                {!loaded && !imgError && (
                    <Skeleton variant="rectangular" width="100%" height="100%" />
                )}
                {imgError ? (
                    <Box sx={{
                        width: '100%', height: '100%', display: 'flex',
                        flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', color: '#bdbdbd', gap: 1,
                    }}>
                        <ImageIcon size={28} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Load error</Typography>
                    </Box>
                ) : (
                    <CardMedia
                        component="img"
                        image={full}
                        alt={image.filename}
                        onLoad={() => setLoaded(true)}
                        onError={() => setImgError(true)}
                        sx={{
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                            display: loaded ? 'block' : 'none',
                        }}
                    />
                )}

                {/* Hover overlay: zoom + delete */}
                <Box
                    className="img-actions"
                    sx={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                        p: '6px',
                        opacity: 0,
                        transition: 'opacity 0.15s',
                        background: 'linear-gradient(160deg, rgba(0,0,0,0.45) 0%, transparent 60%)',
                    }}
                >
                    <Box sx={{
                        bgcolor: 'rgba(0,0,0,0.55)', borderRadius: '50%',
                        p: '4px', display: 'flex',
                    }}>
                        <ZoomIn size={13} color="#fff" />
                    </Box>

                    {onDelete && (
                        <Tooltip title="Delete image" placement="top">
                            <Box
                                onClick={(e) => { e.stopPropagation(); onDelete(image); }}
                                sx={{
                                    bgcolor: 'rgba(220,38,38,0.8)', borderRadius: '50%',
                                    p: '4px', display: 'flex', cursor: 'pointer',
                                    '&:hover': { bgcolor: 'rgba(220,38,38,1)' },
                                }}
                            >
                                <Trash2 size={13} color="#fff" />
                            </Box>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* Footer */}
            <CardContent sx={{ py: 0.75, px: 1, '&:last-child': { pb: 0.75 } }}>
                <Chip
                    label={image.category}
                    size="small"
                    sx={{
                        height: 17, fontSize: '0.6rem', fontWeight: 700, mb: 0.25,
                        bgcolor: cat.bg, color: cat.text,
                        border: `1px solid ${cat.border}`,
                    }}
                />
                <Typography variant="caption" sx={{
                    display: 'block', color: 'text.secondary',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', fontSize: '0.65rem',
                }}>
                    {image.filename}
                </Typography>
            </CardContent>
        </Card>
    );
});


/** ── Lightbox ─────────────────────────────────────────────── */
const Lightbox = ({ image, onClose, onDelete }) => {
    useEffect(() => {
        if (!image) return;
        const h = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [image, onClose]);

    if (!image) return null;
    const cat  = CATEGORY_STYLES[image.category] || CATEGORY_STYLES.unknown;
    const full = imgUrl(image.path);

    return (
        <Dialog
            open
            maxWidth="lg"
            onClose={onClose}
            PaperProps={{ sx: { bgcolor: '#111', borderRadius: 2, overflow: 'hidden' } }}
        >
            <DialogContent sx={{ p: 0, position: 'relative' }}>
                {/* Close */}
                <IconButton onClick={onClose} size="small" sx={{
                    position: 'absolute', top: 8, right: 8, zIndex: 10,
                    bgcolor: 'rgba(0,0,0,0.6)', color: '#fff',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
                }}>
                    <X size={16} />
                </IconButton>

                <img
                    src={full}
                    alt={image.filename}
                    style={{ display: 'block', maxWidth: '88vw', maxHeight: '78vh', objectFit: 'contain' }}
                />

                <Box sx={{
                    px: 2, py: 1,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    bgcolor: '#1a1a1a',
                }}>
                    <Chip label={image.category} size="small" sx={{
                        bgcolor: cat.bg, color: cat.text, fontWeight: 700, fontSize: '0.7rem',
                    }} />
                    <Typography variant="caption" sx={{
                        color: '#bbb', flex: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {image.filename}
                    </Typography>

                    {onDelete && (
                        <Tooltip title="Delete this image">
                            <IconButton
                                size="small"
                                onClick={() => { onClose(); onDelete(image); }}
                                sx={{
                                    color: '#ef9a9a',
                                    '&:hover': { bgcolor: 'rgba(239,83,80,0.15)', color: '#ef5350' },
                                }}
                            >
                                <Trash2 size={15} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};


/** ── Confirm Dialog ───────────────────────────────────────── */
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, loading }) => (
    <Dialog open={open} maxWidth="xs" fullWidth onClose={onCancel}>
        <DialogTitle sx={{ fontWeight: 700, color: '#d32f2f', pb: 0.5 }}>
            {title}
        </DialogTitle>
        <DialogContent>
            <Typography variant="body2" color="text.secondary">{message}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={onCancel} variant="outlined" size="small" disabled={loading}>
                Cancel
            </Button>
            <Button
                onClick={onConfirm}
                variant="contained"
                color="error"
                size="small"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Trash2 size={14} />}
            >
                {loading ? 'Deleting…' : 'Delete'}
            </Button>
        </DialogActions>
    </Dialog>
);


/** ── Breadcrumb ───────────────────────────────────────────── */
const Breadcrumb = ({ crumbs, onNavigate }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
        {crumbs.map((crumb, i) => (
            <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={13} color="#90a4ae" />}
                <Typography
                    variant="caption"
                    onClick={() => i < crumbs.length - 1 && onNavigate(i)}
                    sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: i < crumbs.length - 1 ? '#025F67' : 'text.secondary',
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


// ──────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────

const CapturedImages = () => {
    // ── Navigation state ──────────────────────────────────────
    // view: 'root' | 'known' | 'unknown' | 'images'
    const [view,         setView]         = useState('root');
    const [knownFolders, setKnownFolders] = useState([]);   // [{ folder_name, count, images }]
    const [activeFolder, setActiveFolder] = useState(null); // { folder_name, images }
    const [images,       setImages]       = useState([]);   // [{ path, filename, category }]
    const [loading,      setLoading]      = useState(false);
    const [error,        setError]        = useState(null);

    // ── Filter ────────────────────────────────────────────────
    const [search, setSearch] = useState('');

    // ── Lightbox ──────────────────────────────────────────────
    const [lightbox, setLightbox] = useState(null);

    // ── Delete dialog ─────────────────────────────────────────
    const [delTarget,  setDelTarget]  = useState(null);   // { type: 'image'|'folder', ...data }
    const [delLoading, setDelLoading] = useState(false);

    // ── Export state ──────────────────────────────────────────
    const [selectedFolders, setSelectedFolders] = useState(new Set()); // for known view multi-select
    const [exporting,       setExporting]       = useState(false);

    // ── Toast ─────────────────────────────────────────────────
    const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
    const showToast = useCallback((msg, severity = 'success') => {
        setToast({ open: true, msg, severity });
    }, []);

    // ──────────────────────────────────────────────────────────
    // NAVIGATION HELPERS
    // ──────────────────────────────────────────────────────────

    const goRoot = useCallback(() => {
        setView('root');
        setActiveFolder(null);
        setImages([]);
        setError(null);
        setSearch('');
        setSelectedFolders(new Set());
    }, []);

    /** Fetch known/ sub-folder list from unified endpoint */
    const goKnown = useCallback(async () => {
        setView('known');
        setActiveFolder(null);
        setImages([]);
        setSearch('');
        setSelectedFolders(new Set());
        setLoading(true);
        setError(null);
        try {
            const res  = await fetch(`${API_BASE_URL}/captured-images`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            const folders = Object.entries(data.known || {}).map(([folderName, paths]) => ({
                folder_name: folderName,
                count:       paths.length,
                images:      paths,
            }));
            setKnownFolders(folders);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    /** Fetch unknown/ images from unified endpoint */
    const goUnknown = useCallback(async () => {
        setView('unknown');
        setActiveFolder(null);
        setSearch('');
        setLoading(true);
        setError(null);
        try {
            const res  = await fetch(`${API_BASE_URL}/captured-images`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            const imgs = (data.unknown || []).map((path) => ({
                path,
                filename: basename(path),
                category: 'unknown',
            }));
            setImages(imgs);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    /** Navigate into a specific known employee sub-folder */
    const goEmployeeFolder = useCallback((folder) => {
        setActiveFolder(folder);
        setView('images');
        setSearch('');
        setError(null);
        const imgs = (folder.images || []).map((path) => ({
            path,
            filename: basename(path),
            category: 'known',
        }));
        setImages(imgs);
    }, []);

    /** Refresh the current view */
    const refresh = useCallback(() => {
        if (view === 'root')    return;
        if (view === 'known')   goKnown();
        if (view === 'unknown') goUnknown();
        if (view === 'images' && activeFolder) {
            // Re-fetch the whole known list, then re-enter the folder
            (async () => {
                setLoading(true);
                try {
                    const res  = await fetch(`${API_BASE_URL}/captured-images`);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    const paths = data.known?.[activeFolder.folder_name] || [];
                    const updated = { ...activeFolder, images: paths, count: paths.length };
                    goEmployeeFolder(updated);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [view, activeFolder, goKnown, goUnknown, goEmployeeFolder]);

    // ──────────────────────────────────────────────────────────
    // EXPORT HELPERS
    // ──────────────────────────────────────────────────────────

    /**
     * Download an array of { path, filename } as a ZIP.
     * @param {Array}  items      Array of image objects with .path and .filename
     * @param {string} zipName   Output zip filename
     * @param {string} [subdir]  Optional sub-directory inside zip
     */
    const exportImagesToZip = useCallback(async (items, zipName, subdir = '') => {
        if (!items.length) { showToast('No images to export', 'warning'); return; }
        setExporting(true);
        try {
            const zip = new JSZip();
            const folder = subdir ? zip.folder(subdir) : zip;
            await Promise.all(items.map(async (img) => {
                try {
                    const res = await fetch(imgUrl(img.path));
                    const blob = await res.blob();
                    folder.file(img.filename, blob);
                } catch {
                    // skip images that fail to fetch
                }
            }));
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = zipName;
            a.click();
            URL.revokeObjectURL(url);
            showToast(`Exported ${items.length} image(s) to ${zipName}`);
        } catch (err) {
            showToast(`Export failed: ${err.message}`, 'error');
        } finally {
            setExporting(false);
        }
    }, [showToast]);

    /** Export selected known sub-folders */
    const handleExportKnownSelected = useCallback(async () => {
        if (!selectedFolders.size) { showToast('Select at least one folder to export', 'warning'); return; }
        setExporting(true);
        try {
            const zip = new JSZip();
            const foldersToExport = knownFolders.filter(f => selectedFolders.has(f.folder_name));
            await Promise.all(foldersToExport.map(async (f) => {
                const sub = zip.folder(f.folder_name);
                await Promise.all((f.images || []).map(async (path) => {
                    try {
                        const res = await fetch(imgUrl(path));
                        const blob = await res.blob();
                        sub.file(path.split('/').pop(), blob);
                    } catch { /* skip */ }
                }));
            }));
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'known_export.zip';
            a.click();
            URL.revokeObjectURL(url);
            const totalImgs = foldersToExport.reduce((s, f) => s + (f.images?.length || 0), 0);
            showToast(`Exported ${totalImgs} image(s) from ${foldersToExport.length} folder(s)`);
            setSelectedFolders(new Set());
        } catch (err) {
            showToast(`Export failed: ${err.message}`, 'error');
        } finally {
            setExporting(false);
        }
    }, [selectedFolders, knownFolders, showToast]);

    /** Toggle a folder's selection in the Known view */
    const toggleFolderSelect = useCallback((folderName) => {
        setSelectedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderName)) next.delete(folderName);
            else next.add(folderName);
            return next;
        });
    }, []);

    /** Select / deselect all known folders */
    const toggleSelectAll = useCallback(() => {
        setSelectedFolders(prev =>
            prev.size === knownFolders.length
                ? new Set()
                : new Set(knownFolders.map(f => f.folder_name))
        );
    }, [knownFolders]);

    // ──────────────────────────────────────────────────────────
    // DELETE HANDLERS
    // ──────────────────────────────────────────────────────────

    /** Called when user clicks the trash icon on an image card */
    const requestDeleteImage = useCallback((image) => {
        setDelTarget({ type: 'image', image });
    }, []);

    /** Called when user clicks the folder-delete icon */
    const requestDeleteFolder = useCallback((folder) => {
        setDelTarget({ type: 'folder', folder });
    }, []);

    /** Called when user clicks delete inside the unknown section header */
    const requestClearUnknown = useCallback(() => {
        setDelTarget({ type: 'folder', folder: { folder_name: 'unknown', count: images.length } });
    }, [images.length]);

    const handleConfirmDelete = useCallback(async () => {
        if (!delTarget) return;
        setDelLoading(true);
        try {
            if (delTarget.type === 'image') {
                const { image } = delTarget;
                const res = await fetch(
                    `${API_BASE_URL}/captured-images/image?path=${encodeURIComponent(image.path)}`,
                    { method: 'DELETE' }
                );
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.detail || `HTTP ${res.status}`);
                }
                // Remove from local state
                setImages(prev => prev.filter(img => img.path !== image.path));
                // Also close lightbox if the deleted image was open
                setLightbox(prev => (prev?.path === image.path ? null : prev));
                showToast(`Deleted: ${image.filename}`);
            } else {
                // Folder delete
                const { folder } = delTarget;
                const res = await fetch(
                    `${API_BASE_URL}/captured-images/folder/${encodeURIComponent(folder.folder_name)}`,
                    { method: 'DELETE' }
                );
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.detail || `HTTP ${res.status}`);
                }
                showToast(
                    folder.folder_name === 'unknown'
                        ? 'Unknown folder cleared'
                        : `Folder "${folder.folder_name}" deleted`
                );

                // Navigate back appropriately
                if (folder.folder_name === 'unknown') {
                    setImages([]);
                } else if (view === 'images') {
                    goKnown();
                } else {
                    setKnownFolders(prev => prev.filter(f => f.folder_name !== folder.folder_name));
                }
            }
        } catch (err) {
            showToast(`Delete failed: ${err.message}`, 'error');
        } finally {
            setDelLoading(false);
            setDelTarget(null);
        }
    }, [delTarget, view, goKnown, showToast]);

    // ──────────────────────────────────────────────────────────
    // DERIVED STATE
    // ──────────────────────────────────────────────────────────

    const filtered = images.filter(img =>
        !search || img.filename.toLowerCase().includes(search.toLowerCase())
    );

    const crumbs = (() => {
        if (view === 'root')    return ['captured-images/'];
        if (view === 'known')   return ['captured-images/', 'known/'];
        if (view === 'unknown') return ['captured-images/', 'unknown/'];
        if (view === 'images' && activeFolder)
            return ['captured-images/', 'known/', activeFolder.folder_name + '/'];
        return ['captured-images/'];
    })();

    const handleBreadcrumb = (index) => {
        if (index === 0) goRoot();
        if (index === 1 && view === 'images') goKnown();
    };

    const headerTitle =
        view === 'root'    ? 'Captured Images' :
        view === 'known'   ? 'Known — Employee Folders' :
        view === 'unknown' ? 'Unknown Images' :
        activeFolder?.folder_name || 'Images';

    const headerSub =
        view === 'root'    ? 'Browse captured image folders from the AI pipeline' :
        view === 'known'   ? `${knownFolders.length} employee folder${knownFolders.length !== 1 ? 's' : ''}` :
        view === 'unknown' ? `${images.length} unknown image${images.length !== 1 ? 's' : ''}` :
        `${images.length} image${images.length !== 1 ? 's' : ''} · ${activeFolder?.folder_name}`;

    // ──────────────────────────────────────────────────────────
    // RENDER
    // ──────────────────────────────────────────────────────────

    return (
        <Box sx={{ fontFamily: "'Inter', sans-serif", animation: 'ciEnter 0.45s cubic-bezier(0.16,1,0.3,1) both' }}>

            {/* ── Header ──────────────────────────────────────────── */}
            <Box sx={{
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {view !== 'root' && (
                        <Tooltip title="Back">
                            <IconButton
                                size="small"
                                onClick={() => view === 'images' ? goKnown() : goRoot()}
                                sx={{
                                    border: '1.5px solid #e2e8f0', borderRadius: 1.5, bgcolor: '#f8fafc',
                                    '&:hover': { bgcolor: '#e6f4f5', borderColor: '#025F67' }, flexShrink: 0, mt: 0.5,
                                }}
                            >
                                <ArrowLeft size={15} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {view === 'root' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#025F67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    )}

                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={
                            view === 'root'
                                ? { color: '#025F67', letterSpacing: '-0.03em', lineHeight: 1.2 }
                                : { fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }
                        }>
                            {headerTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            {headerSub}
                        </Typography>
                    </Box>
                </Box>

                {/* Action buttons (refresh + optional clear + export) */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {/* Export selected known folders */}
                    {view === 'known' && knownFolders.length > 0 && (
                        <Tooltip title={selectedFolders.size ? `Export ${selectedFolders.size} selected folder(s)` : 'Select folders below then click Export'}>
                            <span>
                                <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={exporting ? <CircularProgress size={13} color="inherit" /> : <Download size={14} />}
                                    onClick={handleExportKnownSelected}
                                    disabled={exporting || selectedFolders.size === 0}
                                    sx={{
                                        fontSize: '0.72rem', py: '3px',
                                        bgcolor: '#025F67', '&:hover': { bgcolor: '#014a51' },
                                    }}
                                >
                                    {exporting ? 'Exporting…' : `Export${selectedFolders.size ? ` (${selectedFolders.size})` : ''}`}
                                </Button>
                            </span>
                        </Tooltip>
                    )}

                    {/* Export all unknown images */}
                    {view === 'unknown' && images.length > 0 && (
                        <>
                            <Tooltip title="Export all unknown images as ZIP">
                                <span>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={exporting ? <CircularProgress size={13} color="inherit" /> : <Download size={14} />}
                                        onClick={() => exportImagesToZip(images, 'unknown_images.zip', 'unknown')}
                                        disabled={exporting}
                                        sx={{
                                            fontSize: '0.72rem', py: '3px',
                                            bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' },
                                        }}
                                    >
                                        {exporting ? 'Exporting…' : 'Export All'}
                                    </Button>
                                </span>
                            </Tooltip>
                            <Tooltip title="Clear all unknown images">
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<FolderX size={14} />}
                                    onClick={requestClearUnknown}
                                    sx={{ fontSize: '0.72rem', py: '3px' }}
                                >
                                    Clear all
                                </Button>
                            </Tooltip>
                        </>
                    )}

                    {/* Export current employee folder */}
                    {view === 'images' && activeFolder && images.length > 0 && (
                        <Tooltip title={`Export all images in "${activeFolder.folder_name}" as ZIP`}>
                            <span>
                                <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={exporting ? <CircularProgress size={13} color="inherit" /> : <Download size={14} />}
                                    onClick={() => exportImagesToZip(images, `${activeFolder.folder_name}_images.zip`, activeFolder.folder_name)}
                                    disabled={exporting}
                                    sx={{
                                        fontSize: '0.72rem', py: '3px',
                                        bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' },
                                    }}
                                >
                                    {exporting ? 'Exporting…' : 'Export'}
                                </Button>
                            </span>
                        </Tooltip>
                    )}

                    {/* Delete folder button (inside images view) */}
                    {view === 'images' && activeFolder && (
                        <Tooltip title={`Delete folder "${activeFolder.folder_name}"`}>
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<FolderX size={14} />}
                                onClick={() => requestDeleteFolder(activeFolder)}
                                sx={{ fontSize: '0.72rem', py: '3px' }}
                            >
                                Delete folder
                            </Button>
                        </Tooltip>
                    )}

                    {view !== 'root' && (
                        <Tooltip title="Refresh">
                            <span>
                                <IconButton
                                    onClick={refresh}
                                    disabled={loading}
                                    size="small"
                                    sx={{
                                        border: '1.5px solid #e2e8f0', borderRadius: 1.5, mt: 0.5,
                                        bgcolor: '#f8fafc', '&:hover': { bgcolor: '#eff6ff', borderColor: '#025F67' },
                                    }}
                                >
                                    <RefreshCw
                                        size={15}
                                        style={loading ? { animation: 'ci-spin 0.8s linear infinite' } : {}}
                                    />
                                </IconButton>
                            </span>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* ── Breadcrumb ──────────────────────────────────────── */}
            <Breadcrumb crumbs={crumbs} onNavigate={handleBreadcrumb} />

            {/* ── Loading ─────────────────────────────────────────── */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={36} />
                </Box>
            )}

            {/* ── Error ───────────────────────────────────────────── */}
            {!loading && error && (
                <Box sx={{
                    textAlign: 'center', py: 5, px: 3,
                    border: '1px dashed #ef9a9a',
                    borderRadius: 2, bgcolor: '#fff8f8',
                }}>
                    <Typography variant="body1" color="error" sx={{ mb: 0.5, fontWeight: 600 }}>
                        Could not load from Jetson.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{error}</Typography>
                </Box>
            )}

            {/* ════════════════════════════════════════════════════
                VIEW: ROOT — two top-level folder cards
            ════════════════════════════════════════════════════ */}
            {!loading && !error && view === 'root' && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FolderCard
                            label="known"
                            subtitle="Employee identified captures"
                            category="known"
                            onClick={goKnown}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FolderCard
                            label="unknown"
                            subtitle="Unidentified face captures"
                            category="unknown"
                            onClick={goUnknown}
                        />
                    </Grid>
                </Grid>
            )}

            {/* ════════════════════════════════════════════════════
                VIEW: KNOWN — list of employee sub-folders
            ════════════════════════════════════════════════════ */}
            {!loading && !error && view === 'known' && (
                <>
                    {knownFolders.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                            <FolderOpen size={52} style={{ opacity: 0.2, marginBottom: 14 }} />
                            <Typography variant="h6" sx={{ opacity: 0.45 }}>No employee folders found</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.3, mt: 0.5 }}>
                                Known faces will appear here once the AI pipeline identifies someone.
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {/* Select-all toolbar */}
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5,
                                px: 1.5, py: 0.75,
                                bgcolor: selectedFolders.size > 0 ? '#e0f4f5' : '#f8fafc',
                                border: selectedFolders.size > 0 ? '1px solid #7dbfc4' : '1px solid #e2e8f0',
                                borderRadius: 2,
                                transition: 'all 0.2s',
                            }}>
                                {/* Select-all toggle circle */}
                                <Tooltip title={selectedFolders.size === knownFolders.length ? 'Deselect all' : 'Select all'}>
                                    <Box
                                        onClick={toggleSelectAll}
                                        sx={{
                                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer',
                                            border: selectedFolders.size > 0 ? '2px solid #025F67' : '2px solid #b0bec5',
                                            bgcolor: selectedFolders.size === knownFolders.length && knownFolders.length > 0
                                                ? '#025F67' : selectedFolders.size > 0 ? 'rgba(2,95,103,0.15)' : '#fff',
                                            transition: 'all 0.18s ease',
                                            '&:hover': { border: '2px solid #025F67', bgcolor: 'rgba(2,95,103,0.1)' },
                                        }}
                                    >
                                        {selectedFolders.size === knownFolders.length && knownFolders.length > 0 && (
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                        {selectedFolders.size > 0 && selectedFolders.size < knownFolders.length && (
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                <line x1="2" y1="5" x2="8" y2="5" stroke="#025F67" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        )}
                                    </Box>
                                </Tooltip>

                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#546e7a', userSelect: 'none' }}>
                                    {selectedFolders.size > 0
                                        ? `${selectedFolders.size} of ${knownFolders.length} folder${knownFolders.length !== 1 ? 's' : ''} selected`
                                        : `Select folders to export (${knownFolders.length} total)`}
                                </Typography>

                                {selectedFolders.size > 0 && (
                                    <Typography
                                        variant="caption"
                                        onClick={() => setSelectedFolders(new Set())}
                                        sx={{
                                            ml: 'auto', color: '#025F67', cursor: 'pointer', fontWeight: 600,
                                            '&:hover': { textDecoration: 'underline' },
                                        }}
                                    >
                                        Clear selection
                                    </Typography>
                                )}
                            </Box>

                            <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                                {knownFolders.map((folder) => (
                                    <Grid key={folder.folder_name} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <FolderCard
                                            label={folder.folder_name}
                                            count={folder.count}
                                            category="known"
                                            selected={selectedFolders.has(folder.folder_name)}
                                            onSelect={() => toggleFolderSelect(folder.folder_name)}
                                            onClick={() => goEmployeeFolder(folder)}
                                            onDelete={() => requestDeleteFolder(folder)}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </>
                    )}
                </>
            )}

            {/* ════════════════════════════════════════════════════
                VIEW: UNKNOWN / IMAGES — search bar + image grid
            ════════════════════════════════════════════════════ */}
            {!loading && !error && (view === 'unknown' || view === 'images') && (
                <>
                    {/* Search bar */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
                        <TextField
                            placeholder="Search by filename…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            size="small"
                            sx={{ minWidth: 260 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={15} color="#90a4ae" />
                                    </InputAdornment>
                                ),
                                endAdornment: search ? (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearch('')}>
                                            <X size={13} />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            }}
                        />
                        <Chip
                            label={`${filtered.length} / ${images.length} images`}
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 600 }}
                        />
                    </Box>

                    {/* Empty state */}
                    {filtered.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                            <ImageIcon size={52} style={{ opacity: 0.2, marginBottom: 14 }} />
                            <Typography variant="h6" sx={{ opacity: 0.45 }}>
                                {search ? 'No images match your search' : 'No images found'}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.3, mt: 0.5 }}>
                                {search
                                    ? 'Try clearing the search.'
                                    : 'Images will appear here once the AI pipeline saves them.'}
                            </Typography>
                        </Box>
                    )}

                    {/* Image grid */}
                    {filtered.length > 0 && (
                        <Grid container spacing={1.5}>
                            {filtered.map((img, idx) => (
                                <Grid
                                    key={`${img.category}-${img.filename}-${idx}`}
                                    size={{ xs: 6, sm: 4, md: 3, lg: 2 }}
                                >
                                    <ImageCard
                                        image={img}
                                        onClick={setLightbox}
                                        onDelete={requestDeleteImage}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </>
            )}

            {/* ── Lightbox ────────────────────────────────────────── */}
            <Lightbox
                image={lightbox}
                onClose={() => setLightbox(null)}
                onDelete={requestDeleteImage}
            />

            {/* ── Confirm Delete Dialog ───────────────────────────── */}
            <ConfirmDialog
                open={Boolean(delTarget)}
                loading={delLoading}
                title={
                    delTarget?.type === 'image'
                        ? 'Delete Image?'
                        : delTarget?.folder?.folder_name === 'unknown'
                        ? 'Clear Unknown Folder?'
                        : 'Delete Folder?'
                }
                message={
                    delTarget?.type === 'image'
                        ? `"${delTarget?.image?.filename}" will be permanently deleted.`
                        : delTarget?.folder?.folder_name === 'unknown'
                        ? `All ${delTarget?.folder?.count} unknown images will be permanently deleted.`
                        : `All images inside "${delTarget?.folder?.folder_name}" will be permanently deleted and the folder removed.`
                }
                onConfirm={handleConfirmDelete}
                onCancel={() => !delLoading && setDelTarget(null)}
            />

            {/* ── Success / Error Toast ───────────────────────────── */}
            <Snackbar
                open={toast.open}
                autoHideDuration={3500}
                onClose={() => setToast(t => ({ ...t, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={toast.severity}
                    variant="filled"
                    onClose={() => setToast(t => ({ ...t, open: false }))}
                    sx={{ fontWeight: 600 }}
                >
                    {toast.msg}
                </Alert>
            </Snackbar>

            {/* ── Keyframe styles ─────────────────────────────────── */}
            <style>{`
                @keyframes ci-spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes ciEnter {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </Box>
    );
};

export default CapturedImages;
