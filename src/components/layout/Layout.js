import React, { useState, useMemo } from 'react';
import {
    Box,
    CssBaseline,
    ThemeProvider,
    Toolbar,
    Container,
    AppBar,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Typography,
    Tooltip
} from '@mui/material';
import { Settings, User, Bell, Menu as MenuIcon, Moon, Sun } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import getTheme from '../../theme/Theme';
import config from '../../config';

const Layout = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    
    // New states for Sidebar and Theme
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mode, setMode] = useState('light');

    const theme = useMemo(() => getTheme(mode), [mode]);

    const handleClick = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const toggleTheme = () => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleSidebarToggle = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const sidebarWidth = isSidebarCollapsed ? 80 : 250;

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                <CssBaseline />

                <AppBar
                    position="fixed"
                    sx={{
                        zIndex: (theme) => theme.zIndex.drawer + 1,
                        bgcolor: 'background.paper',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        boxShadow: 'none',
                        transition: theme.transitions.create(['width', 'margin'], {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                    }}
                >
                    <Toolbar sx={{ justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                edge="start"
                                onClick={handleDrawerToggle}
                                sx={{ mr: 2, display: { sm: 'none' }, color: 'text.primary' }}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
                                {config.APP_NAME}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
                                <IconButton onClick={toggleTheme} color="inherit" sx={{ color: 'text.primary' }}>
                                    {mode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Alerts">
                                <IconButton color="inherit" sx={{ color: 'text.primary' }}>
                                    <Bell size={20} />
                                </IconButton>
                            </Tooltip>

                            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'text.primary' }} onClick={handleClick}>
                                <Avatar
                                    sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem' }}
                                >
                                    A
                                </Avatar>
                                <Box sx={{ ml: 1, display: { xs: 'none', md: 'block' } }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Admin</Typography>
                                    <Typography variant="caption" color="text.secondary">System Administrator</Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            PaperProps={{
                                sx: { bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', mt: 1.5 }
                            }}
                        >
                            <MenuItem onClick={handleClose}>
                                <User size={16} style={{ marginRight: 8 }} /> Profile
                            </MenuItem>
                            <MenuItem onClick={handleClose}>
                                <Settings size={16} style={{ marginRight: 8 }} /> Settings
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>

                <Sidebar 
                    isCollapsed={isSidebarCollapsed} 
                    toggleCollapse={handleSidebarToggle}
                    mobileOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                    sidebarWidth={sidebarWidth}
                />

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        width: { sm: `calc(100% - ${sidebarWidth}px)` },
                        transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                >
                    <Toolbar /> {/* Spacer for AppBar */}
                    <Container maxWidth={false} sx={{ mt: 2, px: { xs: 2, sm: 3 } }}>
                        <Breadcrumbs />
                        <Outlet />
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default Layout;
