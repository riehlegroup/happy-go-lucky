# Dark/Light Mode Feature

## Overview
This feature introduces a dynamic theme switching capability to the Happy-Go-Lucky application, allowing users to toggle between **Dark Mode** and **Light Mode**. This enhances user experience by providing visual accessibility options and adaptation to user preferences.

## Components

### 1. `ThemeProvider`
- **Location**: `client/src/components/common/theme-provider.tsx`
- **Description**: A React Context provider that manages the active theme state.
- **Functionality**:
    - Persists the selected theme in `localStorage` key `vite-ui-theme`.
    - Supports `dark`, `light`, and `system` preferences.
    - Dynamically updates the HTML root element with the appropriate class (`dark` or `light`) for Tailwind CSS to react to.

### 2. `ModeToggle`
- **Location**: `client/src/components/common/mode-toggle.tsx`
- **Description**: A UI component button for users to switch themes.
- **Functionality**:
    - Displays a **Sun** icon in light mode and a **Moon** icon in dark mode.
    - Uses the `useTheme` hook to toggle the state.
    - Integrated with the generic `Button` component for consistent styling.

## Usage
The `ModeToggle` component is integrated into the application's navigation (e.g., `TopNavBar`) to ensure it is always accessible.

## Styling
- **Tailwind CSS**: The application uses Tailwind's `dark:` modifier to style components differently depending on the active mode.
- **Root Classes**: The `ThemeProvider` adds or removes the `dark` class from the `<html>` element.

## How to Test
1. Click the toggle button (Sun/Moon icon) in the UI.
2. Observe the application colors switch immediately.
3. Reload the page to verify that the preference is persisted via LocalStorage.
