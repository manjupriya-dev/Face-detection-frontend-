import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Typography, Box } from '@mui/material';
import { ChevronRight, Home } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const routeConfig = {
    '/': 'Dashboard',
    '/live': 'Live Streaming',
    '/enroll': 'Enroll',
    '/employees': 'Employee List',
    '/delete': 'Delete',
    '/status': 'Status',
    '/captured-images': 'Captured Images',
    '/live-stream': 'Live Stream Detail',
};

// Plain clickable text — avoids MUI Link's `button` DOM prop warning
const CrumbLink = ({ onClick, children }) => (
    <Typography
        variant="body2"
        onClick={onClick}
        sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            cursor: 'pointer',
            userSelect: 'none',
            '&:hover': { color: 'primary.main' },
        }}
    >
        {children}
    </Typography>
);

const Breadcrumbs = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const pathnames = location.pathname.split('/').filter((x) => x);

    const getBreadcrumbLabel = (path, index) => {
        if (pathnames[index - 1] === 'live-stream') return 'Detail';
        const fullPath = `/${path}`;
        return routeConfig[fullPath] || path.charAt(0).toUpperCase() + path.slice(1);
    };

    return (
        <Box sx={{ mb: 3 }}>
            <MuiBreadcrumbs
                separator={<ChevronRight size={16} />}
                aria-label="breadcrumb"
                sx={{ '& .MuiBreadcrumbs-separator': { mx: 1, color: 'text.disabled' } }}
            >
                <CrumbLink onClick={() => navigate('/')}>
                    <Home size={16} style={{ marginRight: 4 }} />
                    Dashboard
                </CrumbLink>

                {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;

                    return last ? (
                        <Typography
                            key={to}
                            variant="body2"
                            sx={{ color: 'text.primary', fontWeight: 600 }}
                        >
                            {getBreadcrumbLabel(value, index)}
                        </Typography>
                    ) : (
                        <CrumbLink key={to} onClick={() => navigate(to)}>
                            {getBreadcrumbLabel(value, index)}
                        </CrumbLink>
                    );
                })}
            </MuiBreadcrumbs>
        </Box>
    );
};

export default Breadcrumbs;