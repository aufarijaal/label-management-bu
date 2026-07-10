import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import GroupIcon from '@mui/icons-material/Group';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';

const DRAWER_WIDTH = 240;

const navItems = [
    { label: 'Overview', icon: <DashboardIcon />, href: '/dashboard', active: true },
    { label: 'Labels', icon: <LabelIcon />, href: '/dashboard' },
    { label: 'Avery Notes', icon: <NoteAltIcon />, href: '/avery-notes' },
    { label: 'Analytics', icon: <TrendingUpIcon />, href: '/dashboard' },
    { label: 'Team', icon: <GroupIcon />, href: '/dashboard' },
    { label: 'Settings', icon: <SettingsIcon />, href: '/dashboard' }
];

const stats = [
    { label: 'Total Labels', value: '128', icon: <LabelIcon fontSize="large" />, color: '#4C57C5' },
    { label: 'Active Labels', value: '94', icon: <CheckCircleOutlineIcon fontSize="large" />, color: '#34A853' },
    { label: 'Pending Review', value: '17', icon: <PendingActionsIcon fontSize="large" />, color: '#FBBC05' },
    { label: 'Team Members', value: '8', icon: <GroupIcon fontSize="large" />, color: '#EA4335' }
];

const recentActivity = [
    { action: 'Created label', name: 'product-v2.1', time: '2 minutes ago', status: 'created' },
    { action: 'Updated label', name: 'release-candidate', time: '1 hour ago', status: 'updated' },
    { action: 'Archived label', name: 'legacy-build', time: '3 hours ago', status: 'archived' },
    { action: 'Created label', name: 'hotfix-patch', time: 'Yesterday', status: 'created' },
    { action: 'Updated label', name: 'staging-env', time: 'Yesterday', status: 'updated' }
];

const statusColor: Record<string, 'success' | 'warning' | 'default'> = {
    created: 'success',
    updated: 'warning',
    archived: 'default'
};

export default function DashboardPage() {
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

    const DrawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Brand */}
            <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center' }}>
                <LabelIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" fontWeight={700} color="primary.main">
                    LabelManager
                </Typography>
            </Box>
            <Divider />

            {/* Nav */}
            <List sx={{ flex: 1, px: 1, py: 2 }}>
                {navItems.map((item) => (
                    <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                            selected={!!item.active}
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
                            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: item.active ? 600 : 400 }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            {/* User footer */}
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
        <>
            <Head>
                <title>Dashboard — LabelManager</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

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

                    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, md: 4 }, flex: 1 }}>
                        {/* Page header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                            <Box>
                                <Typography variant="h4" fontWeight={700}>
                                    Overview
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Welcome back, {displayName.split(' ')[0]}! Here&apos;s what&apos;s happening.
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<LabelIcon />}
                                sx={{ display: { xs: 'none', sm: 'flex' } }}
                            >
                                New Label
                            </Button>
                        </Box>

                        {/* Stats cards */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            {stats.map((stat) => (
                                <Grid item xs={12} sm={6} lg={3} key={stat.label}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 3,
                                            height: '100%'
                                        }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        {stat.label}
                                                    </Typography>
                                                    <Typography variant="h4" fontWeight={700}>
                                                        {stat.value}
                                                    </Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor: `${stat.color}18`,
                                                        color: stat.color
                                                    }}
                                                >
                                                    {stat.icon}
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Recent Activity */}
                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={700} gutterBottom>
                                    Recent Activity
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <List disablePadding>
                                    {recentActivity.map((item, index) => (
                                        <React.Fragment key={index}>
                                            <ListItem
                                                disablePadding
                                                sx={{ py: 1.5 }}
                                                secondaryAction={
                                                    <Typography variant="caption" color="text.secondary">
                                                        {item.time}
                                                    </Typography>
                                                }
                                            >
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    <LabelIcon fontSize="small" color="action" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="body2">{item.action}</Typography>
                                                            <Chip
                                                                label={item.name}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ fontSize: 11 }}
                                                            />
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                            {index < recentActivity.length - 1 && <Divider component="li" />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Container>
                </Box>
            </Box>
        </>
    );
}
