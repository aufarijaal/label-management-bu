import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LabelIcon from '@mui/icons-material/Label';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

// Google "G" logo SVG
const GoogleIcon = () => (
    <Box
        component="svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        sx={{ width: 20, height: 20, mr: 1.5 }}
    >
        <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
    </Box>
);

export default function HomePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [signingIn, setSigningIn] = React.useState(false);
    const [error, setError] = React.useState(null);

    // Redirect to dashboard if already authenticated
    React.useEffect(() => {
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);

    const handleGoogleSignIn = async () => {
        setError(null);
        setSigningIn(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (error) {
            setError(error.message);
            setSigningIn(false);
        }
    };

    if (loading) return null;

    return (
        <>
            <Head>
                <title>Label Manager</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <Box
                sx={{
                    background: '#121212',
                    color: '#fff',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <Container maxWidth="md">
                    <Box sx={{ textAlign: 'center' }}>
                        <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            justifyContent="center"
                            sx={{ mb: 5 }}
                        >
                            <LabelIcon sx={{ fontSize: { xs: 40, md: 56 }, color: '#fff' }} />
                            <Typography
                                component="h1"
                                variant="h2"
                                fontWeight={700}
                                sx={{ color: '#fff' }}
                            >
                                Label Manager
                            </Typography>
                        </Stack>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3, maxWidth: 420, mx: 'auto' }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleGoogleSignIn}
                            disabled={signingIn}
                            startIcon={<GoogleIcon />}
                            sx={{
                                bgcolor: '#fff',
                                color: '#000',
                                fontWeight: 600,
                                px: 4,
                                py: 1.5,
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                            }}
                        >
                            {signingIn ? 'Redirecting...' : 'Sign in with Google'}
                        </Button>
                    </Box>
                </Container>
            </Box>
        </>
    );
}