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
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';

const DRAWER_WIDTH = 240;

const navItems = [
    { label: 'Overview', icon: <DashboardIcon />, href: '/dashboard' },
    { label: 'ILA Avery Notes', icon: <NoteAltIcon />, href: '/avery-notes' },
];

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const { user, loading, signOut } = useAuth();
    const { mode, toggleColorMode } = useColorMode();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = React.useState(false);

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

    const DrawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center' }}>
                <LabelIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" fontWeight={700} color="primary.main">
                    LabelManager
                </Typography>
            </Box>
            <Divider />
            <List sx={{ flex: 1, px: 1, py: 2 }}>
                {navItems.map((item, idx) => (
                    <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                            selected={idx === activeIdx}
                            onClick={() => router.push(item.href)}
                            sx={{
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: '#fff',
                                    '& .MuiListItemIcon-root': { color: '#fff' },
                                    '&:hover': { bgcolor: 'primary.dark' }
                                }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{ fontWeight: idx === activeIdx ? 600 : 400 }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar src={avatarUrl} sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                    {initials}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                        {displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {user.email}
                    </Typography>
                </Box>
                <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
                    <IconButton size="small" onClick={toggleColorMode}>
                        {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
                    </IconButton>
                </Tooltip>
                <Tooltip title="Sign out">
                    <IconButton size="small" onClick={handleSignOut}>
                        <LogoutIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar — desktop */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        border: 'none',
                        borderRight: '1px solid',
                        borderColor: 'divider'
                    }
                }}
            >
                {DrawerContent}
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
                {DrawerContent}
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
                {/* Top App Bar (mobile only) */}
                <AppBar
                    position="static"
                    color="default"
                    elevation={0}
                    sx={{
                        display: { xs: 'flex', md: 'none' },
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper'
                    }}
                >
                    <Toolbar>
                        <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ flexGrow: 1 }}>
                            LabelManager
                        </Typography>
                        <Avatar src={avatarUrl} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 12 }}>
                            {initials}
                        </Avatar>
                    </Toolbar>
                </AppBar>

                {children}
            </Box>
        </Box>
    );
}
