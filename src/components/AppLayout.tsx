import * as React from 'react';
import { useRouter } from 'next/router';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LabelIcon from '@mui/icons-material/Label';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 64;

const navItems = [
    { label: 'Overview', icon: <DashboardIcon />, href: '/dashboard' },
    { label: 'ILA Avery Notes', icon: <NoteAltIcon />, href: '/avery-notes' },
    { label: 'Departments', icon: <GroupIcon />, href: '/departments' },
    { label: 'Input Types', icon: <SettingsIcon />, href: '/input-types' },
];

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const { user, loading, signOut } = useAuth();
    const { mode, toggleColorMode } = useColorMode();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    React.useEffect(() => {
        if (!loading && !user) {
            router.replace('/signin');
        }
    }, [user, loading, router]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (loading || !user) return null;

    const displayName = user.user_metadata?.full_name ?? user.email ?? 'User';
    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
    const initials = displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // Highlight the first nav item whose href matches the current pathname
    const activeIdx = navItems.findIndex((item) => item.href === router.pathname);

    const makeDrawerContent = (collapsed: boolean) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Brand — same height as top bar via Toolbar */}
            <Toolbar
                disableGutters
                sx={{
                    px: collapsed ? 0 : 3,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    minHeight: { xs: 56, sm: 64 }
                }}
            >
                <LabelIcon sx={{ color: 'primary.main', flexShrink: 0 }} />
                {!collapsed && (
                    <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ ml: 1 }} noWrap>
                        LabelManager
                    </Typography>
                )}
            </Toolbar>
            <Divider />
            <List sx={{ flex: 1, px: 1, py: 2 }}>
                {navItems.map((item, idx) => (
                    <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                        <Tooltip title={collapsed ? item.label : ''} placement="right">
                            <ListItemButton
                                selected={idx === activeIdx}
                                onClick={() => router.push(item.href)}
                                sx={{
                                    borderRadius: 2,
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    px: collapsed ? 1 : 2,
                                    '&.Mui-selected': {
                                        bgcolor: 'primary.main',
                                        color: '#fff',
                                        '& .MuiListItemIcon-root': { color: '#fff' },
                                        '&:hover': { bgcolor: 'primary.dark' }
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 36 }}>
                                    {item.icon}
                                </ListItemIcon>
                                {!collapsed && (
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{ fontWeight: idx === activeIdx ? 600 : 400 }}
                                    />
                                )}
                            </ListItemButton>
                        </Tooltip>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar — desktop */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    width: sidebarOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
                    flexShrink: 0,
                    transition: 'width 0.2s',
                    '& .MuiDrawer-paper': {
                        width: sidebarOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
                        boxSizing: 'border-box',
                        border: 'none',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        overflowX: 'hidden',
                        transition: 'width 0.2s'
                    }
                }}
            >
                {makeDrawerContent(!sidebarOpen)}
            </Drawer>

            {/* Sidebar — mobile */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { width: DRAWER_WIDTH }
                }}
            >
                {makeDrawerContent(false)}
            </Drawer>

            {/* Main content */}
            <Box
                component="main"
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                    bgcolor: 'background.default'
                }}
            >
                {/* Top bar — always visible */}
                <AppBar
                    position="static"
                    color="default"
                    elevation={0}
                    sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper'
                    }}
                >
                    <Toolbar sx={{ gap: 1 }}>
                        {/* Sidebar toggle — desktop */}
                        <IconButton
                            edge="start"
                            onClick={() => setSidebarOpen((v) => !v)}
                            sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }}
                        >
                            {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
                        </IconButton>

                        {/* Hamburger — mobile only */}
                        <IconButton
                            edge="start"
                            onClick={() => setMobileOpen(true)}
                            sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }}
                        >
                            <MenuIcon />
                        </IconButton>

                        {/* Spacer */}
                        <Box sx={{ flex: 1 }} />

                        {/* Profile */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={avatarUrl} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 12 }}>
                                {initials}
                            </Avatar>
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                <Typography variant="body2" fontWeight={600} noWrap>
                                    {displayName}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Theme toggle */}
                        <Tooltip title={mode === 'dark' ? 'Switch to light' : 'Switch to dark'}>
                            <IconButton size="small" onClick={toggleColorMode}>
                                {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
                            </IconButton>
                        </Tooltip>

                        {/* Sign out */}
                        <Tooltip title="Sign out">
                            <IconButton size="small" onClick={handleSignOut}>
                                <LogoutIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Toolbar>
                </AppBar>

                {children}
            </Box>
        </Box>
    );
}
