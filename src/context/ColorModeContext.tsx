import * as React from 'react';

type ColorMode = 'light' | 'dark';

interface ColorModeContextValue {
    mode: ColorMode;
    toggleColorMode: () => void;
}

export const ColorModeContext = React.createContext<ColorModeContextValue>({
    mode: 'light',
    toggleColorMode: () => {},
});

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = React.useState<ColorMode>('light');

    React.useEffect(() => {
        const stored = localStorage.getItem('colorMode') as ColorMode | null;
        if (stored === 'dark' || stored === 'light') {
            setMode(stored);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setMode(prefersDark ? 'dark' : 'light');
        }
    }, []);

    const toggleColorMode = React.useCallback(() => {
        setMode((prev) => {
            const next = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('colorMode', next);
            return next;
        });
    }, []);

    const value = React.useMemo(() => ({ mode, toggleColorMode }), [mode, toggleColorMode]);

    return (
        <ColorModeContext.Provider value={value}>
            {children}
        </ColorModeContext.Provider>
    );
}

export function useColorMode() {
    return React.useContext(ColorModeContext);
}
