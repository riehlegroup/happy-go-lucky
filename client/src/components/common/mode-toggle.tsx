import React from 'react';
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/common/theme-provider";
import Button from "@/components/common/Button";

export function ModeToggle() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <Button
            variant="primary"
            onClick={toggleTheme}
            className="p-2 flex items-center justify-center min-w-[40px]"
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <Moon className="h-5 w-5" />
            ) : (
                <Sun className="h-5 w-5" />
            )}
        </Button>
    );
}
