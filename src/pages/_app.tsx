import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '../context/AuthContext';
import { ColorModeProvider, ColorModeContext } from '../context/ColorModeContext';

function ThemedApp({ Component, pageProps }: any) {
    const { mode } = React.useContext(ColorModeContext);
    const theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    primary: {
                        main: '#0097A7',    // Cyan-teal 700 — strong contrast on both light & dark
                        light: '#4DD0E1',   // Cyan 300 — readable on dark backgrounds
                        dark: '#006978',    // Cyan 900
                        contrastText: '#ffffff',
                    },
                },
                typography: {
                    fontFamily: '"Google Sans", "Google Sans Display", sans-serif',
                },
            }),
        [mode]
    );
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <Component {...pageProps} />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default function App({ Component, pageProps }: any) {
    return (
        <ColorModeProvider>
            <ThemedApp Component={Component} pageProps={pageProps} />
        </ColorModeProvider>
    );
}
