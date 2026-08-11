import React, { useState } from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Tooltip,
    useTheme,
    alpha
} from '@mui/material';
import {
    LayoutDashboard,
    UserPlus,
    Users,
    UserMinus,
    Video,
    ClipboardList,
    Images,
    ChevronLeft,
    ChevronRight,
    ChevronDown
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import config from '../../config';

// Animation variants
const textVariants = {
    expanded: { opacity: 1, width: "auto", display: "block", transition: { duration: 0.2, delay: 0.1 } },
    collapsed: { opacity: 0, width: 0, transition: { duration: 0.2 }, transitionEnd: { display: "none" } }
};

const menuDropdownVariants = {
    open: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
    closed: { opacity: 0, height: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }
};

const Sidebar = ({ isCollapsed, toggleCollapse, mobileOpen, handleDrawerToggle, sidebarWidth }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    const [openMenus, setOpenMenus] = useState({});

    const toggleNestedMenu = (menuName) => {
        if (isCollapsed) toggleCollapse(); // Expand if a nested menu is clicked while collapsed
        setOpenMenus((prev) => ({ ...prev, [menuName]: !prev[menuName] }));
    };

    const menuItems = [
        { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
        { 
            text: 'Cameras', 
            icon: <Video size={20} />, 
            children: [
                { text: 'Live Streaming', icon: <Video size={18} />, path: '/live' },
                { text: 'Captured Images', icon: <Images size={18} />, path: '/captured-images' },
            ]
        },
        {
            text: 'Users',
            icon: <Users size={20} />,
            children: [
                { text: 'Enroll', icon: <UserPlus size={18} />, path: '/enroll' },
                { text: 'Employee List', icon: <Users size={18} />, path: '/employees' },
                { text: 'Delete', icon: <UserMinus size={18} />, path: '/delete' },
            ]
        },
        { text: 'Logs', icon: <ClipboardList size={20} />, path: '/logs' },
    ];

    const isItemActive = (path) => location.pathname === path;

    const renderMenuItem = (item, isNested = false) => {
        const active = isItemActive(item.path);
        const hasChildren = !!item.children;
        const isOpen = openMenus[item.text];

        const content = (
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    if (hasChildren) {
                        toggleNestedMenu(item.text);
                    } else if (item.path) {
                        navigate(item.path);
                        if (mobileOpen) handleDrawerToggle();
                    }
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: isCollapsed ? '10px 0' : '10px 16px',
                    margin: '4px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: active ? theme.palette.background.active : 'transparent',
                    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'background-color 0.2s',
                    width: isCollapsed ? 'auto' : 'calc(100% - 24px)', // Force fill container minus margin
                    ...(isNested && !isCollapsed && { marginLeft: '32px', width: 'calc(100% - 44px)' })
                }}
                onMouseEnter={(e) => {
                    if (!active) {
                        e.currentTarget.style.backgroundColor = theme.palette.background.sidebarHover;
                    }
                }}
                onMouseLeave={(e) => {
                    if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }
                }}
            >
                {/* Active left border indicator */}
                {active && !isCollapsed && (
                    <motion.div
                        layoutId="activeIndicator"
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: '10%',
                            bottom: '10%',
                            width: '4px',
                            backgroundColor: theme.palette.primary.main,
                            borderRadius: '0 4px 4px 0',
                            boxShadow: `0 0 10px ${theme.palette.primary.main}`,
                        }}
                    />
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: isCollapsed ? 'auto' : '40px' }}>
                    {item.icon}
                </Box>
                
                <motion.div
                    variants={textVariants}
                    initial={isCollapsed ? "collapsed" : "expanded"}
                    animate={isCollapsed ? "collapsed" : "expanded"}
                    style={{ whiteSpace: 'nowrap', flexGrow: 1, overflow: 'hidden', fontSize: isNested ? '0.85rem' : '0.9rem', fontWeight: active ? 600 : 500 }}
                >
                    {item.text}
                </motion.div>

                {hasChildren && !isCollapsed && (
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <ChevronDown size={16} />
                    </motion.div>
                )}
            </motion.div>
        );

        return (
            <React.Fragment key={item.text}>
                {isCollapsed ? (
                    <Tooltip title={item.text} placement="right" arrow>
                        <Box>{content}</Box>
                    </Tooltip>
                ) : (
                    content
                )}

                {/* Nested Menu Items */}
                {hasChildren && (
                    <AnimatePresence>
                        {isOpen && !isCollapsed && (
                            <motion.div
                                variants={menuDropdownVariants}
                                initial="closed"
                                animate="open"
                                exit="closed"
                                style={{ overflow: 'hidden' }}
                            >
                                {item.children.map(child => renderMenuItem(child, true))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </React.Fragment>
        );
    };

    const sidebarContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.sidebar',
                backdropFilter: 'blur(10px)',
            }}
        >
            {/* Header / Logo */}
            <Box 
                sx={{ 
                    height: 64, // Matches AppBar height
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    padding: isCollapsed ? '0' : '0 20px',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? 0 : 2, overflow: 'hidden' }}>
                    <Video color={theme.palette.primary.main} size={isCollapsed ? 28 : 24} />
                    <motion.div
                        variants={textVariants}
                        initial={isCollapsed ? "collapsed" : "expanded"}
                        animate={isCollapsed ? "collapsed" : "expanded"}
                    >
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap' }}>
                            {config.APP_NAME}
                        </Typography>
                    </motion.div>
                </Box>
                
                {!isCollapsed && (
                    <IconButton onClick={toggleCollapse} size="small" sx={{ display: { xs: 'none', sm: 'flex' } }}>
                        <ChevronLeft size={20} />
                    </IconButton>
                )}
            </Box>

            {/* Menu Items */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 2, overflowX: 'hidden' }}>
                {isCollapsed && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <IconButton onClick={toggleCollapse} size="small">
                            <ChevronRight size={20} />
                        </IconButton>
                    </Box>
                )}
                {menuItems.map(item => renderMenuItem(item))}
            </Box>

        </Box>
    );

    return (
        <Box component="nav" sx={{ width: { sm: sidebarWidth }, flexShrink: { sm: 0 }, transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)" }}>
            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }} // Better open performance on mobile.
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { 
                        boxSizing: 'border-box', 
                        width: 260,
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(10px)',
                        transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)"
                    },
                }}
            >
                {sidebarContent}
            </Drawer>

            {/* Desktop Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: sidebarWidth,
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1) !important",
                        overflowX: 'hidden'
                    },
                }}
                open
            >
                {sidebarContent}
            </Drawer>
        </Box>
    );
};

export default Sidebar;