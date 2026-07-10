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
                palette: { mode },
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
