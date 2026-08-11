import { Box, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { Circle } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

import { apiService } from '../../services/api';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20;

const VideoStream = ({ cameraName = "Main Entrance" }) => {

    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const pollTimerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);

    const streamUrl = apiService.getCameraStreamUrl();

    const destroyHls = useCallback(() => {
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
    }, []);

    const startHls = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 30,
                // Disable hls.js internal retries — we own the retry loop
                manifestLoadingMaxRetry: 0,
                levelLoadingMaxRetry: 2,
                fragLoadingMaxRetry: 3,
            });
            hlsRef.current = hls;

            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => {});
                setLoading(false);
                setError(null);
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (!data.fatal) return;
                // On any fatal error, destroy and show error state — don't spam
                hls.destroy();
                hlsRef.current = null;
                setLoading(false);
                setError('Stream connection lost. Backend may be offline.');
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(() => {});
                setLoading(false);
            });
            video.addEventListener('error', () => {
                setLoading(false);
                setError('Stream connection lost.');
            });
        } else {
            setError('HLS not supported in this browser');
            setLoading(false);
        }
    }, [streamUrl]);

    // Poll until playlist.m3u8 exists, THEN start hls.js
    const pollForStream = useCallback(async (n = 0) => {
        if (n >= MAX_POLL_ATTEMPTS) {
            setLoading(false);
            setError(`Backend unreachable after ${MAX_POLL_ATTEMPTS * (POLL_INTERVAL_MS / 1000)}s. Check server at ${streamUrl}`);
            return;
        }
        setAttempt(n + 1);
        try {
            const res = await fetch(streamUrl, { method: 'HEAD', cache: 'no-store' });
            if (res.ok) {
                startHls();
                return;
            }
            // 404 = server up, FFmpeg not ready — keep polling silently
        } catch {
            // ERR_CONNECTION_REFUSED = server not running — keep polling silently
        }
        pollTimerRef.current = setTimeout(() => pollForStream(n + 1), POLL_INTERVAL_MS);
    }, [streamUrl, startHls]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        setAttempt(0);
        pollForStream(0);

        return () => {
            destroyHls();
        };
    }, [streamUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Paper
            elevation={4}
            sx={{
                position: 'relative',
                width: '100%',
                paddingTop: '56.25%',
                bgcolor: '#000',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid #30363d'
            }}
        >
            {/* Video Element */}
            <Box
                component="video"
                ref={videoRef}
                autoPlay
                muted
                playsInline
                controls={false}
                sx={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover'
                }}
            />

            {/* Loading / Error Overlay */}
            {(loading || error) && (
                <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.85)'
                }}>
                    {loading && (
                        <>
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{ color: '#8b949e', marginBottom: '1rem' }}
                            >
                                <Box component="span" sx={{ fontSize: '4rem' }}>📹</Box>
                            </motion.div>
                            <Typography variant="h6" color="white">
                                Connecting to Live Feed...
                            </Typography>
                            <Typography variant="caption" color="grey.500" sx={{ mt: 0.5 }}>
                                Attempt {attempt} of {MAX_POLL_ATTEMPTS}
                            </Typography>
                        </>
                    )}
                    {error && (
                        <Typography variant="body2" color="error" sx={{ textAlign: 'center', px: 2 }}>
                            {error}
                        </Typography>
                    )}
                </Box>
            )}

            {/* REC Indicator */}
            {!loading && !error && (
                <Box sx={{
                    position: 'absolute', top: 16, left: 16,
                    display: 'flex', alignItems: 'center', gap: 1,
                    bgcolor: 'rgba(0,0,0,0.6)', px: 1.5, py: 0.5, borderRadius: 1
                }}>
                    <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <Circle size={10} fill="#f44336" color="#f44336" />
                    </motion.div>
                    <Typography variant="caption" color="white" sx={{ fontWeight: 600 }}>LIVE</Typography>
                </Box>
            )}

            {/* Timestamp */}
            {!loading && !error && (
                <Box sx={{
                    position: 'absolute', bottom: 16, right: 16,
                    bgcolor: 'rgba(0,0,0,0.6)', px: 1, py: 0.5, borderRadius: 1
                }}>
                    <Typography variant="caption" color="white">
                        {new Date().toLocaleTimeString()}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default VideoStream;
