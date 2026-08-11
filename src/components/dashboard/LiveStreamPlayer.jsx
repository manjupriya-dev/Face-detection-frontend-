import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Box,
    Paper,
    IconButton,
    CircularProgress,
    Typography,
    Button
} from '@mui/material';

import {
    VolumeUp,
    VolumeOff,
    Fullscreen,
    FullscreenExit,
    Refresh
} from '@mui/icons-material';

import { Cctv } from 'lucide-react';
import Hls from 'hls.js';
import { API_BASE_URL } from '../../services/api';

const PLAYLIST_URL = `${API_BASE_URL}/stream/hls/playlist.m3u8`;
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20;

const LiveStreamPlayer = ({
    isMuted,
    setIsMuted,
    height = 500,
    activeCamera = null   // { id, name, streamUrl } | null
}) => {

    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const containerRef = useRef(null);
    const pollTimerRef = useRef(null);
    // Track current poll attempt in a ref so initHls can read it without stale closure
    const pollAttemptRef = useRef(0);

    const [status, setStatus] = useState('idle'); // idle | waiting | loading | playing | error
    const [errorMsg, setErrorMsg] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [pollAttempt, setPollAttempt] = useState(0);

    // -------------------------------------------
    // CLEANUP
    // -------------------------------------------
    const destroyHls = useCallback(() => {
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.removeAttribute('src');
            videoRef.current.load();
        }
    }, []);

    // -------------------------------------------
    // PLAY MP4 (non-HLS cameras)
    // -------------------------------------------
    const playMp4 = useCallback((url) => {
        destroyHls();
        const video = videoRef.current;
        if (!video) return;
        setStatus('loading');
        video.src = url;
        video.load();
        video.play()
            .then(() => setStatus('playing'))
            .catch(() => {
                setStatus('error');
                setErrorMsg('Could not play this stream. Try clicking Retry.');
            });
    }, [destroyHls]);

    // -------------------------------------------
    // POLL PLAYLIST (Pi only) — forward-declared via ref so initHls can call it
    // -------------------------------------------
    const pollPlaylistRef = useRef(null);

    const pollPlaylist = useCallback(async (attempt = 0) => {
        if (attempt >= MAX_POLL_ATTEMPTS) {
            setStatus('error');
            setErrorMsg(
                `Could not reach stream after ${MAX_POLL_ATTEMPTS * (POLL_INTERVAL_MS / 1000)}s. ` +
                `Check that the backend is running at ${API_BASE_URL}.`
            );
            return;
        }

        pollAttemptRef.current = attempt + 1;
        setPollAttempt(attempt + 1);

        try {
            const res = await fetch(PLAYLIST_URL, { method: 'HEAD', cache: 'no-store' });
            if (res.ok) {
                // Playlist exists — hand off to HLS player
                initHlsInternal();
                return;
            }
            // 404 or other non-ok: server up but stream not ready yet — keep polling silently
        } catch {
            // ERR_CONNECTION_REFUSED: server not up yet — keep polling
        }

        pollTimerRef.current = setTimeout(() => pollPlaylist(attempt + 1), POLL_INTERVAL_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep ref in sync so initHls can call it
    useEffect(() => {
        pollPlaylistRef.current = pollPlaylist;
    }, [pollPlaylist]);

    // -------------------------------------------
    // INIT HLS PLAYER (Pi camera) — internal, called only after playlist confirmed
    // -------------------------------------------
    const initHlsInternal = useCallback(() => {
        destroyHls();
        const video = videoRef.current;
        if (!video) return;

        setStatus('loading');

        if (Hls.isSupported()) {
            const hls = new Hls({
                lowLatencyMode: false,
                liveSyncDurationCount: 4,
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                backBufferLength: 10,
                enableWorker: true,
                // Disable hls.js's own manifest-not-found retries — we own the retry loop
                manifestLoadingMaxRetry: 0,
                levelLoadingMaxRetry: 2,
                fragLoadingMaxRetry: 3,
            });

            hlsRef.current = hls;
            hls.loadSource(PLAYLIST_URL);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => { });
                setStatus('playing');
                setErrorMsg('');
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                // Non-fatal stall: just nudge the loader
                if (data.details === 'bufferStalledError') {
                    hls.startLoad();
                    return;
                }

                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            // Manifest gone (404) or connection dropped mid-stream.
                            // Destroy hls and fall back to polling instead of
                            // hammering the server with rapid retries.
                            hls.destroy();
                            hlsRef.current = null;
                            setStatus('waiting');
                            const currentAttempt = pollAttemptRef.current;
                            if (currentAttempt < MAX_POLL_ATTEMPTS) {
                                pollTimerRef.current = setTimeout(
                                    () => pollPlaylistRef.current?.(currentAttempt),
                                    POLL_INTERVAL_MS
                                );
                            } else {
                                setStatus('error');
                                setErrorMsg('Stream disconnected. Click Retry to reconnect.');
                            }
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            hlsRef.current = null;
                            setStatus('error');
                            setErrorMsg('Stream disconnected. Click Retry.');
                            break;
                    }
                }
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            video.src = PLAYLIST_URL;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(() => { });
                setStatus('playing');
            });
            video.addEventListener('error', () => {
                setStatus('error');
                setErrorMsg('Stream disconnected. Click Retry.');
            });
        } else {
            setStatus('error');
            setErrorMsg('HLS playback is not supported in this browser. Try Chrome or Firefox.');
        }
    }, [destroyHls]);

    // -------------------------------------------
    // RETRY
    // -------------------------------------------
    const handleRetry = useCallback(() => {
        if (!activeCamera) return;
        setErrorMsg('');
        setPollAttempt(0);
        pollAttemptRef.current = 0;

        if (activeCamera.streamUrl === 'hls') {
            setStatus('waiting');
            pollPlaylist(0);
        } else {
            playMp4(activeCamera.streamUrl);
        }
    }, [activeCamera, pollPlaylist, playMp4]);

    // -------------------------------------------
    // REACT TO activeCamera CHANGES
    // -------------------------------------------
    useEffect(() => {
        if (!activeCamera) {
            destroyHls();
            setStatus('idle');
            setErrorMsg('');
            setPollAttempt(0);
            pollAttemptRef.current = 0;
            return;
        }

        setErrorMsg('');
        setPollAttempt(0);
        pollAttemptRef.current = 0;

        if (activeCamera.streamUrl === 'hls') {
            setStatus('waiting');
            pollPlaylist(0);
        } else {
            playMp4(activeCamera.streamUrl);
        }

        return () => {
            destroyHls();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCamera?.id]);

    // -------------------------------------------
    // MUTE SYNC
    // -------------------------------------------
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    // -------------------------------------------
    // FULLSCREEN
    // -------------------------------------------
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // -------------------------------------------
    // RENDER
    // -------------------------------------------
    return (
        <Paper
            ref={containerRef}
            elevation={0}
            sx={{
                position: 'relative',
                width: '100%',
                height,
                bgcolor: '#050810',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* ── IDLE STATE ── */}
            {status === 'idle' && (
                <Box sx={{
                    position: 'absolute', inset: 0, display: 'flex',
                    flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', zIndex: 10, gap: 2.5,
                    background: 'radial-gradient(ellipse at center, #0d1117 0%, #050810 100%)'
                }}>
                    {/* Subtle grid */}
                    <Box sx={{
                        position: 'absolute', inset: 0, opacity: 0.4,
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                    }} />
                    <Box sx={{
                        width: 80, height: 80, borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(229,57,53,0.15), rgba(229,57,53,0.05))',
                        border: '1px solid rgba(229,57,53,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Cctv size={36} color="rgba(229,57,53,0.5)" />
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: '#e2e8f0', fontWeight: 600, mb: 0.5 }}>
                            No Camera Selected
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                            Click "Stream Now" on a camera below to begin
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* ── WAITING / POLLING OVERLAY ── */}
            {status === 'waiting' && (
                <Box sx={{
                    position: 'absolute', inset: 0, display: 'flex',
                    flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', zIndex: 10, gap: 2.5,
                    background: 'radial-gradient(ellipse at center, #0d1117 0%, #050810 100%)'
                }}>
                    <Box sx={{ position: 'relative' }}>
                        <CircularProgress
                            size={56}
                            thickness={2}
                            sx={{ color: 'rgba(229,57,53,0.8)' }}
                        />
                        <Box sx={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Cctv size={20} color="rgba(229,57,53,0.6)" />
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: '#e2e8f0', fontWeight: 600, mb: 0.5 }}>
                            Connecting to {activeCamera?.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 1 }}>
                            Attempt {pollAttempt} of {MAX_POLL_ATTEMPTS}
                        </Typography>
                        <Box sx={{
                            px: 2, py: 0.5, borderRadius: 1,
                            bgcolor: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            display: 'inline-block'
                        }}>
                            <Typography variant="caption" sx={{ color: '#334155', fontFamily: 'monospace', fontSize: '0.65rem' }}>
                                {PLAYLIST_URL}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ── LOADING OVERLAY ── */}
            {status === 'loading' && (
                <Box sx={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'rgba(5,8,16,0.7)', zIndex: 10,
                    backdropFilter: 'blur(4px)'
                }}>
                    <CircularProgress size={40} thickness={2} sx={{ color: 'rgba(229,57,53,0.8)' }} />
                </Box>
            )}

            {/* ── ERROR OVERLAY ── */}
            {status === 'error' && (
                <Box sx={{
                    position: 'absolute', inset: 0, display: 'flex',
                    flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', zIndex: 10, gap: 2.5, p: 3,
                    background: 'radial-gradient(ellipse at center, #0d1117 0%, #050810 100%)'
                }}>
                    <Box sx={{
                        p: 3, borderRadius: 3, maxWidth: 440, width: '100%',
                        background: 'rgba(229,57,53,0.08)',
                        border: '1px solid rgba(229,57,53,0.2)',
                        textAlign: 'center'
                    }}>
                        <Typography variant="body2" sx={{ color: '#fca5a5', mb: 2 }}>
                            {errorMsg}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Refresh />}
                            onClick={handleRetry}
                            sx={{
                                background: 'linear-gradient(135deg, #e53935, #c62828)',
                                boxShadow: '0 4px 12px rgba(229,57,53,0.4)',
                                textTransform: 'none',
                                fontWeight: 700,
                                '&:hover': { background: 'linear-gradient(135deg, #ef5350, #e53935)' }
                            }}
                        >
                            Retry Connection
                        </Button>
                    </Box>
                </Box>
            )}

            {/* ── VIDEO ELEMENT ── */}
            <video
                ref={videoRef}
                playsInline
                muted={isMuted}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: status === 'playing' || status === 'loading' ? 'block' : 'none',
                }}
                onClick={() => videoRef.current?.play()}
            />

            {/* ── TOP INFO BAR (when playing) ── */}
            {status === 'playing' && (
                <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    px: 2, py: 1.25,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
                    display: 'flex', alignItems: 'center', gap: 1.5
                }}>
                    {/* LIVE chip */}
                    {activeCamera?.streamUrl === 'hls' && (
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.75,
                            bgcolor: 'rgba(229,57,53,0.9)', px: 1.2, py: 0.4,
                            borderRadius: 1, backdropFilter: 'blur(8px)'
                        }}>
                            <Box sx={{
                                width: 6, height: 6, bgcolor: '#fff',
                                borderRadius: '50%', animation: 'pulse 1.4s infinite'
                            }} />
                            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.62rem', letterSpacing: '0.1em' }}>
                                LIVE
                            </Typography>
                        </Box>
                    )}
                    <Typography variant="caption" sx={{
                        color: 'rgba(255,255,255,0.8)', fontWeight: 600,
                        textShadow: '0 1px 4px rgba(0,0,0,0.8)'
                    }}>
                        {activeCamera?.name}
                    </Typography>
                </Box>
            )}

            {/* ── BOTTOM CONTROLS BAR ── */}
            {(status === 'playing' || status === 'loading' || status === 'waiting') && (
                <Box sx={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    px: 2, py: 1.25,
                    background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5
                }}>
                    <IconButton
                        onClick={() => setIsMuted(!isMuted)}
                        size="small"
                        sx={{
                            color: 'rgba(255,255,255,0.8)',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(8px)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }
                        }}
                    >
                        {isMuted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
                    </IconButton>
                    <IconButton
                        onClick={toggleFullscreen}
                        size="small"
                        sx={{
                            color: 'rgba(255,255,255,0.8)',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(8px)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }
                        }}
                    >
                        {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
                    </IconButton>
                </Box>
            )}
        </Paper>
    );
};

export default LiveStreamPlayer;
