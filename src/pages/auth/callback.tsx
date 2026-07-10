import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { supabase } from '../../lib/supabaseClient';

export default function AuthCallback() {
    const router = useRouter();
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!router.isReady) return;

        const { code, error: oauthError, error_description } = router.query;

        if (oauthError) {
            setError((error_description as string) ?? 'Authentication failed. Please try again.');
            return;
        }

        if (code) {
            supabase.auth
                .exchangeCodeForSession(code as string)
                .then(({ error }) => {
                    if (error) {
                        setError(error.message);
                    } else {
                        router.replace('/dashboard');
                    }
                });
        } else {
            // Fallback: check if a session already exists (implicit flow)
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    router.replace('/dashboard');
                } else {
                    router.replace('/signin');
                }
            });
        }
    }, [router.isReady, router.query]);

    if (error) {
        return (
            <>
                <Head>
                    <title>Auth Error — LabelManager</title>
                </Head>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        gap: 2
                    }}
                >
                    <Typography variant="h6" color="error">
                        Authentication Error
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400}>
                        {error}
                    </Typography>
                    <Button variant="contained" onClick={() => router.push('/signin')}>
                        Back to Sign In
                    </Button>
                </Box>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Signing in... — LabelManager</title>
            </Head>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: 2
                }}
            >
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                    Completing sign in...
                </Typography>
            </Box>
        </>
    );
}
