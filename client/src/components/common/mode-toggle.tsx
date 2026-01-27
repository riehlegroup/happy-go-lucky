import { useEffect, useState } from 'react';
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/common/theme-provider";
import Button from "@/components/common/Button";

export function ModeToggle() {
    const { theme, setTheme } = useTheme();
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark" | undefined>();

    useEffect(() => {
        const updateResolvedTheme = () => {
            if (theme === "system") {
                if (typeof window !== 'undefined') {
                    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                    setResolvedTheme(isDark ? "dark" : "light");
                }
            } else {
                setResolvedTheme(theme);
            }
        };

        updateResolvedTheme();

        if (theme === "system" && typeof window !== 'undefined') {
            const media = window.matchMedia("(prefers-color-scheme: dark)");
            const listener = (e: MediaQueryListEvent) => {
                setResolvedTheme(e.matches ? "dark" : "light");
            };
            media.addEventListener("change", listener);
            return () => media.removeEventListener("change", listener);
        }
    }, [theme]);

    const toggleTheme = () => {
        if (theme === "system") {
            setTheme("light");
        } else if (theme === "light") {
            setTheme("dark");
        } else {
            setTheme("system");
        }
    };

    if (!resolvedTheme) return null;

    return (
        <Button
            variant="primary"
            onClick={toggleTheme}
            className="p-2 flex items-center justify-center min-w-[40px]"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {resolvedTheme === "dark" ? (
                <Moon className="h-5 w-5" />
            ) : (
                <Sun className="h-5 w-5" />
            )}
        </Button>
    );
}
