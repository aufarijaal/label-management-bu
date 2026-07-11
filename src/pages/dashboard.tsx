import * as React from 'react';
import Head from 'next/head';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import LabelIcon from '@mui/icons-material/Label';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import GroupIcon from '@mui/icons-material/Group';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';

const stats = [
    { label: 'Total Labels', value: '128', icon: <LabelIcon fontSize="large" />, color: '#0097A7' },
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
    const { user } = useAuth();
    const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'User';

    return (
        <AppLayout>
            <Head>
                <title>Dashboard — LabelManager</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
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
        </AppLayout>
    );
}

