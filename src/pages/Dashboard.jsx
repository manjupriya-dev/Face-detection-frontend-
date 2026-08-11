import React, { useState, useEffect, useCallback } from 'react';
import { Grid } from '@mui/material';
import { Camera, Shield, Bell, Users, Server, Wifi, TrendingUp, RefreshCw, Eye } from 'lucide-react';
import VideoStream from '../components/dashboard/VideoStream';
import axios from 'axios';
import { API_BASE_URL, apiService } from '../services/api';
import './Dashboard.css';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, gradient, shadowColor, accent }) => (
    <div className="dash-stat-card">
        <div className="dash-stat-card-inner">
            <div>
                <div className="dash-stat-label">{title}</div>
                <div className="dash-stat-value">{value}</div>
            </div>
            <div className="dash-stat-icon" style={{ background: gradient, boxShadow: `0 8px 20px ${shadowColor}` }}>
                <Icon size={22} color="#fff" />
            </div>
        </div>
        <div className="dash-stat-bar" style={{ background: gradient }} />
    </div>
);


// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const [testingConnection, setTestingConnection] = useState(false);
    const [backendStatus, setBackendStatus] = useState(null); // null | 'ok' | 'error'
    const [gallerySize, setGallerySize] = useState(null);
    const [lastPing, setLastPing] = useState(null);
    const [enrolledCount, setEnrolledCount] = useState('...');
    const [alertsToday, setAlertsToday] = useState('...');

    const testBackendConnection = useCallback(async () => {
        setTestingConnection(true);
        setBackendStatus(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/status`, { timeout: 5000 });
            setBackendStatus('ok');
            setGallerySize(response.data.gallery_size ?? '—');
            setLastPing(new Date().toLocaleTimeString());
            return true; // backend is up
        } catch {
            // Intentionally silent — backend offline is expected and shown in UI
            setBackendStatus('error');
            setLastPing(new Date().toLocaleTimeString());
            return false;
        } finally {
            setTestingConnection(false);
        }
    }, []);

    const fetchDashboardStats = useCallback(async (backendUp) => {
        // Skip all stat fetches if we already know the backend is down.
        // This prevents a flood of ERR_CONNECTION_REFUSED errors in the console.
        if (!backendUp) {
            setEnrolledCount('—');
            setAlertsToday('—');
            return;
        }

        try {
            const employeesRes = await axios.get(`${API_BASE_URL}/employees`, { timeout: 10000 });
            const employeesData = Array.isArray(employeesRes.data)
                ? employeesRes.data
                : (employeesRes.data?.employees ?? []);
            setEnrolledCount(employeesData.length);
        } catch {
            // Silently fail — backend went offline between checks
            setEnrolledCount('—');
        }

        try {
            const logs = await apiService.getLogs(1000);
            const todayStr = new Date().toISOString().split('T')[0];
            const todayLogs = (Array.isArray(logs) ? logs : []).filter(log => {
                if (!log.timestamp) return false;
                try {
                    return new Date(log.timestamp).toISOString().split('T')[0] === todayStr;
                } catch { return false; }
            });
            setAlertsToday(todayLogs.length);
        } catch {
            // Silently fail — shown in UI
            setAlertsToday('—');
        }
    }, []);

    useEffect(() => {
        // Check backend first, then only fetch stats if it's up
        testBackendConnection().then(isUp => {
            fetchDashboardStats(isUp);
        });
    }, [testBackendConnection, fetchDashboardStats]);


    return (
        <div className="dash-page">

            {/* ── Page Header */}
            <div className="dash-header">
                <div className="dash-header-left">
                    <div className="dash-header-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#025F67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                        </svg>
                    </div>
                    <div>
                        <h1 className="dash-title">System Dashboard</h1>
                        <p className="dash-subtitle">Real-time overview of the AI face recognition system</p>
                    </div>
                </div>
                <div className="dash-header-right">
                    <div className={`dash-backend-pill ${backendStatus === 'ok' ? 'dash-backend-pill--ok' : backendStatus === 'error' ? 'dash-backend-pill--err' : 'dash-backend-pill--pending'}`}>
                        <span className="dash-backend-dot" />
                        {backendStatus === 'ok' ? 'Backend Online' : backendStatus === 'error' ? 'Backend Offline' : 'Checking…'}
                    </div>
                    <button
                        className="dash-ping-btn"
                        onClick={() => testBackendConnection().then(isUp => fetchDashboardStats(isUp))}
                        disabled={testingConnection}
                    >
                        <RefreshCw size={14} style={testingConnection ? { animation: 'dashSpin 0.7s linear infinite' } : {}} />
                        {testingConnection ? 'Pinging…' : 'Ping'}
                    </button>
                </div>
            </div>

            {/* ── Stat Cards */}
            <div className="dash-stats">
                <StatCard title="Cameras Online" value="12 / 14" icon={Camera}
                    gradient="linear-gradient(135deg,#025F67,#025F67)" shadowColor="rgba(37,99,235,0.3)" />
                <StatCard title="AI Model" value="Active" icon={Shield}
                    gradient="linear-gradient(135deg,#16a34a,#22c55e)" shadowColor="rgba(22,163,74,0.3)" />
                <StatCard title="Alerts Today" value={alertsToday} icon={Bell}
                    gradient="linear-gradient(135deg,#ef4444,#f97316)" shadowColor="rgba(239,68,68,0.3)" />
                <StatCard title="Enrolled Persons" value={enrolledCount} icon={Users}
                    gradient="linear-gradient(135deg,#7c3aed,#a78bfa)" shadowColor="rgba(124,58,237,0.3)" />
            </div>

            {/* ── Main content grid */}
            <Grid container spacing={3}>

                {/* Video Stream */}
                <Grid item xs={12} lg={8}>
                    <div className="dash-card dash-video-card">
                        <div className="dash-card-header">
                            <div className="dash-card-title">
                                <Eye size={16} />
                                Live Feed
                            </div>
                            <span className="dash-live-badge">
                                <span className="dash-live-dot" />
                                LIVE
                            </span>
                        </div>
                        <div className="dash-video-body">
                            <VideoStream />
                        </div>
                    </div>
                </Grid>

                {/* Right panel */}
                <Grid item xs={12} lg={4}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>

                        {/* Backend Status Card */}
                        <div className="dash-card">
                            <div className="dash-card-header">
                                <div className="dash-card-title">
                                    <Server size={16} />
                                    Backend Status
                                </div>
                                {lastPing && <span className="dash-last-ping">Last ping: {lastPing}</span>}
                            </div>
                            <div className="dash-backend-body">
                                <div className={`dash-status-row ${backendStatus === 'ok' ? 'dash-status-row--ok' : backendStatus === 'error' ? 'dash-status-row--err' : ''}`}>
                                    <div className="dash-status-row-left">
                                        <Wifi size={16} />
                                        <span>Backend API</span>
                                    </div>
                                    <span className={`dash-status-chip ${backendStatus === 'ok' ? 'dash-status-chip--ok' : backendStatus === 'error' ? 'dash-status-chip--err' : 'dash-status-chip--pending'}`}>
                                        {backendStatus === 'ok' ? 'Connected' : backendStatus === 'error' ? 'Offline' : '…'}
                                    </span>
                                </div>
                                {gallerySize !== null && backendStatus === 'ok' && (
                                    <div className="dash-gallery-row">
                                        <TrendingUp size={14} />
                                        Gallery size: <strong>{gallerySize}</strong> faces
                                    </div>
                                )}
                                {backendStatus === 'error' && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#ef4444' }}>
                                        Cannot reach <code>{API_BASE_URL}</code>. Make sure the FastAPI server is running on your Jetson device.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </Grid>
            </Grid>

            <style>{`
                @keyframes dashSpin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Dashboard;
