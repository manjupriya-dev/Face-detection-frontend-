import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    IconButton,
    Paper,
    Breadcrumbs,
    Link as MuiLink,
    Alert,
    Chip
} from '@mui/material';
import { ArrowLeft, ChevronRight, Home, RefreshCw } from 'lucide-react';
import LiveStreamPlayer from '../components/dashboard/LiveStreamPlayer';
import { apiService } from '../services/api';

const sampleCameras = [
    { id: 'CAM-01', name: 'Main Lobby', channel: 6, status: 'active' },
    { id: 'CAM-02', name: 'Parking Entrance', channel: 4, status: 'active' },
    { id: 'CAM-03', name: 'Server Room', channel: 1, status: 'active' },
    { id: 'CAM-04', name: 'Back Yard', channel: 5, status: 'active' },
    { id: 'CAM-05', name: 'Cafeteria', channel: 7, status: 'active' },
    { id: 'CAM-06', name: 'Loading Dock', channel: 8, status: 'active' },
    { id: 'CAM-07', name: 'Emergency Exit', channel: 2, status: 'active' },
    { id: 'WEBCAM', name: 'Webcam Feed', type: 'webcam', status: 'active' },
];

const LiveStreamDetail = () => {
    const { cameraId } = useParams();
    const navigate = useNavigate();
    const [camera, setCamera] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [streamStatus, setStreamStatus] = useState(null);
    const [recentEvents, setRecentEvents] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const found = sampleCameras.find(c => c.id === cameraId);
        if (found) {
            const cameraWithStream = {
                ...found,
                streamUrl: 'hls'
            };
            setCamera(cameraWithStream);

            // Check stream status
            checkStreamStatus();
            fetchRecentEvents();

            // Simulate connection
            setTimeout(() => setLoading(false), 1000);
        } else {
            navigate('/live');
        }
    }, [cameraId, navigate]);

    const checkStreamStatus = async () => {
        try {
            const status = await apiService.getStreamStatus();
            setStreamStatus(status);
            if (!status.connected) {
                setError('Camera stream is currently unavailable');
            }
        } catch (err) {
            setError('Failed to check stream status');
            console.error('Stream status error:', err);
        }
    };

    const fetchRecentEvents = async () => {
        try {
            const data = await apiService.getStreamLogs(10);
            setRecentEvents(data.logs || []);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        }
    };

    const handleRefresh = () => {
        setLoading(true);
        checkStreamStatus();
        fetchRecentEvents();
        setTimeout(() => setLoading(false), 500);
    };

    if (!camera) return null;

    // Filter events for this specific camera
    const cameraEvents = recentEvents.filter(event =>
        event.details && JSON.parse(event.details).camera_id === cameraId
    );

    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Breadcrumbs separator={<ChevronRight size={16} />} aria-label="breadcrumb">
                    <MuiLink
                        color="inherit"
                        href="#"
                        onClick={(e) => { e.preventDefault(); navigate('/'); }}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                        <Home size={16} />
                        Dashboard
                    </MuiLink>
                    <MuiLink
                        color="inherit"
                        href="#"
                        onClick={(e) => { e.preventDefault(); navigate('/live'); }}
                    >
                        Live Streaming
                    </MuiLink>
                    <Typography color="text.primary">{camera.name}</Typography>
                </Breadcrumbs>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {streamStatus && (
                        <Chip
                            label={streamStatus.connected ? "LIVE" : "OFFLINE"}
                            color={streamStatus.connected ? "success" : "error"}
                            size="small"
                        />
                    )}
                    <IconButton onClick={handleRefresh} size="small">
                        <RefreshCw size={18} />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate('/live')} sx={{ bgcolor: 'action.hover' }}>
                    <ArrowLeft size={20} />
                </IconButton>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#025F67' }}>
                    {camera.name}
                    <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 1 }}>
                        ({camera.id})
                    </Typography>
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Paper elevation={0} sx={{ p: 0, borderRadius: 4, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                <LiveStreamPlayer
                    activeCamera={camera}
                    isStreaming={!loading && streamStatus?.connected}
                    loading={loading}
                    isMuted={isMuted}
                    setIsMuted={setIsMuted}
                    onStop={() => navigate('/live')}
                    onToggleFullscreen={() => {
                        const elem = document.querySelector('video');
                        if (elem) elem.requestFullscreen();
                    }}
                />
            </Paper>

            {/* Camera Events Section */}
            {cameraEvents.length > 0 && (
                <Paper sx={{ mt: 3, p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                        Recent Activity
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {cameraEvents.slice(0, 8).map((event, index) => (
                            <Chip
                                key={index}
                                label={`${event.event_type.replace('_', ' ')}: ${new Date(event.frame_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                color={
                                    event.event_type === 'person_recognized' ? 'success' :
                                        event.event_type === 'face_detected' ? 'info' : 'default'
                                }
                                size="small"
                                variant="outlined"
                            />
                        ))}
                    </Box>
                </Paper>
            )}

            <Box sx={{ mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>Camera Information</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Status: <Box component="span" sx={{
                        color: streamStatus?.connected ? 'success.main' : 'error.main',
                        fontWeight: 600
                    }}>
                        {streamStatus?.connected ? 'Active' : 'Inactive'}
                    </Box>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Resolution: 1920x1080 (HD)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Location: North Wing - Sector 4
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Type: {camera.type === 'webcam' ? 'Webcam' : 'RTSP Camera'}
                </Typography>

                {camera.channel && (
                    <Typography variant="body2" color="text.secondary">
                        Channel: {camera.channel}
                    </Typography>
                )}
            </Box>
        </Container>
    );
};

export default LiveStreamDetail;
