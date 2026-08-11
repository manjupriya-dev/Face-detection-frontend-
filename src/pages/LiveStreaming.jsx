import React, { useState } from 'react';
import { Container, Grid } from '@mui/material';
import CameraCard from '../components/dashboard/CameraCard';
import LiveStreamPlayer from '../components/dashboard/LiveStreamPlayer';
import './LiveStreaming.css';

const sampleCameras = [
    { id: 'CAM-01', name: 'Pi Camera (Live AI)', streamUrl: 'hls' },
    { id: 'CAM-02', name: 'Reception', streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
    { id: 'CAM-03', name: 'Front Room', streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
    { id: 'CAM-04', name: 'Main Lobby 1', streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
    { id: 'CAM-05', name: 'Main Lobby 2', streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
    { id: 'CAM-06', name: 'Main Lobby 3', streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
    { id: 'CAM-07', name: 'Cafeteria', streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
    { id: 'CAM-08', name: 'Entrance', streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
];

const LiveStreaming = () => {
    const [isMuted, setIsMuted] = useState(true);
    const [activeCamera, setActiveCamera] = useState(null);

    const handleStreamClick = (camera) => {
        setActiveCamera((prev) => (prev?.id === camera.id ? null : camera));
    };

    return (
        <div className="live-page">
            {/* Header */}
            <div className="live-header">
                <div className="live-header-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#025F67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="2"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                        <path d="M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        <path d="M8.46 8.46a5 5 0 0 0 0 7.07"/>
                    </svg>
                </div>
                <div>
                    <h1 className="live-title">Live Monitoring Hub</h1>
                    <p className="live-subtitle">{sampleCameras.length} cameras connected — real-time face recognition active</p>
                </div>
                <div className="live-live-badge">
                    <span className="live-live-dot" />
                    LIVE
                </div>
            </div>

            {/* Main Stream */}
            <div className="live-main-player">
                <div className="live-player-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    {activeCamera ? activeCamera.name : 'Pi Camera — Primary Feed'}
                </div>
                <LiveStreamPlayer
                    isMuted={isMuted}
                    setIsMuted={setIsMuted}
                    height={480}
                    activeCamera={activeCamera}
                />
            </div>

            {/* Camera Grid Header */}
            <div className="live-grid-header">
                <div className="live-grid-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                    </svg>
                    All Cameras
                    <span className="live-cam-count">{sampleCameras.length}</span>
                </div>
                {activeCamera && (
                    <button className="live-clear-btn" onClick={() => setActiveCamera(null)}>
                        Clear Selection
                    </button>
                )}
            </div>

            {/* Camera Cards */}
            <Container maxWidth="xl" disableGutters>
                <Grid container spacing={2.5}>
                    {sampleCameras.map((cam) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={cam.id}>
                            <CameraCard
                                camera={cam}
                                isActive={cam.id === activeCamera?.id}
                                onStreamClick={handleStreamClick}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Container>

            <style>{`
                @keyframes pulse {
                    0%   { opacity: 1; transform: scale(1); }
                    50%  { opacity: 0.5; transform: scale(1.2); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes livePulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
                    50%       { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
                }
            `}</style>
        </div>
    );
};

export default LiveStreaming;
