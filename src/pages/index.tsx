import * as React from 'react';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LabelIcon from '@mui/icons-material/Label';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { useAuth } from '../context/AuthContext';

const features = [
    {
        icon: <LabelIcon fontSize="large" color="primary" />,
        title: 'Label Management',
        description: 'Create, organize, and manage all your labels in one centralized place with ease.'
    },
    {
        icon: <SpeedIcon fontSize="large" color="primary" />,
        title: 'Fast & Efficient',
        description: 'Built on Next.js and MUI for a blazing-fast experience across all devices.'
    },
    {
        icon: <SecurityIcon fontSize="large" color="primary" />,
        title: 'Secure by Default',
        description: 'Powered by Supabase authentication so your data stays safe and private.'
    },
    {
        icon: <AutorenewIcon fontSize="large" color="primary" />,
        title: 'Real-time Sync',
        description: 'Changes sync instantly across your team thanks to Supabase real-time features.'
    }
];

export default function HomePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const handleGetStarted = () => {
        if (user) {
            router.push('/dashboard');
        } else {
            router.push('/signin');
        }
    };

    return (
        <>
            <Head>
                <title>Label Management</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content="Simple and powerful label management for your team" />
            </Head>

            {/* Navigation */}
            <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'background.paper' }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters>
                        <LabelIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" component="p" sx={{ flexGrow: 1, fontWeight: 700, color: 'primary.main' }}>
                            LabelManager
                        </Typography>
                        {!loading && (
                            <>
                                {user ? (
                                    <Button
                                        variant="contained"
                                        component={NextLink}
                                        href="/dashboard"
                                    >
                                        Dashboard
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        component={NextLink}
                                        href="/signin"
                                    >
                                        Sign In
                                    </Button>
                                )}
                            </>
                        )}
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Hero Section */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #4C57C5 0%, #6B74D6 50%, #F65458 100%)',
                    color: '#fff',
                    py: { xs: 10, md: 16 }
                }}
            >
                <Container maxWidth="md">
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography
                            component="h1"
                            variant="h2"
                            fontWeight={700}
                            gutterBottom
                            sx={{ color: '#fff' }}
                        >
                            Manage Your Labels with Confidence
                        </Typography>
                        <Typography
                            variant="h5"
                            sx={{ color: 'rgba(255,255,255,0.85)', mb: 5, maxWidth: 600, mx: 'auto' }}
                        >
                            A simple, powerful platform to organize and track all your labels — built for teams of every size.
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleGetStarted}
                                sx={{
                                    bgcolor: '#fff',
                                    color: 'primary.main',
                                    fontWeight: 700,
                                    px: 4,
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                                }}
                            >
                                {user ? 'Go to Dashboard' : 'Get Started Free'}
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                sx={{
                                    borderColor: 'rgba(255,255,255,0.7)',
                                    color: '#fff',
                                    px: 4,
                                    '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }
                                }}
                                href="#features"
                                component="a"
                            >
                                Learn More
                            </Button>
                        </Stack>
                    </Box>
                </Container>
            </Box>

            {/* Features Section */}
            <Box id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
                <Container maxWidth="lg">
                    <Typography
                        variant="h3"
                        component="h2"
                        textAlign="center"
                        fontWeight={700}
                        gutterBottom
                    >
                        Everything you need
                    </Typography>
                    <Typography
                        variant="h6"
                        color="text.secondary"
                        textAlign="center"
                        sx={{ mb: 8, maxWidth: 500, mx: 'auto' }}
                    >
                        All the tools to manage your labels efficiently, in one place.
                    </Typography>
                    <Grid container spacing={4}>
                        {features.map((feature) => (
                            <Grid item xs={12} sm={6} md={3} key={feature.title}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: '100%',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 3,
                                        p: 1,
                                        transition: 'box-shadow 0.2s',
                                        '&:hover': { boxShadow: 4 }
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                                        <Typography variant="h6" fontWeight={700} gutterBottom>
                                            {feature.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {feature.description}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* CTA Section */}
            <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'primary.main', color: '#fff', textAlign: 'center' }}>
                <Container maxWidth="md">
                    <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#fff' }}>
                        Ready to get started?
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
                        Sign in with your Google account and start managing labels in seconds.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleGetStarted}
                        sx={{
                            bgcolor: '#fff',
                            color: 'primary.main',
                            fontWeight: 700,
                            px: 5,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                        }}
                    >
                        {user ? 'Go to Dashboard' : 'Sign in with Google'}
                    </Button>
                </Container>
            </Box>

            {/* Footer */}
            <Box component="footer" sx={{ py: 4, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
                <Container maxWidth="lg">
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        © {new Date().getFullYear()} LabelManager. Built with Next.js, MUI & Supabase.
                    </Typography>
                </Container>
            </Box>
        </>
    );
}
