import React from 'react';
import { Card, CardContent, Typography, Button, Box, IconButton } from '@mui/material';
import { Play, Cctv, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CameraCard = ({ camera, isActive, onStreamClick }) => {
    const navigate = useNavigate();

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                border: isActive ? '2px solid #025F67' : '1px solid #e0e0e0',
                boxShadow: isActive ? '0 8px 24px rgba(2, 95, 103, 0.20)' : '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                position: 'relative',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                    '& .expand-btn': { opacity: 1 }
                }
            }}
        >
            <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: '#000' }} onClick={() => onStreamClick(camera)}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.2)'
                    }}
                >
                    <Cctv size={48} />
                </Box>
                {isActive && (
                    <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(0,0,0,0.5)', px: 1, py: 0.5, borderRadius: 1, backdropFilter: 'blur(4px)' }}>
                        <Box sx={{ width: 6, height: 6, bgcolor: '#4caf50', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>LIVE</Typography>
                    </Box>
                )}
                <IconButton
                    className="expand-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/live-stream/${camera.id}`);
                    }}
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        color: '#fff',
                        bgcolor: 'rgba(0,0,0,0.4)',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
                    }}
                    size="small"
                >
                    <Maximize2 size={18} />
                </IconButton>
            </Box>
            <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {camera.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    ID: {camera.id}
                </Typography>
                <Button
                    fullWidth
                    variant={isActive ? "contained" : "outlined"}
                    startIcon={isActive ? null : <Play size={16} />}
                    onClick={(e) => {
                        e.stopPropagation();
                        onStreamClick(camera);
                    }}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1
                    }}
                >
                    {isActive ? "Stop Stream" : "Stream Now"}
                </Button>
            </CardContent>
        </Card>
    );
};

export default CameraCard;
