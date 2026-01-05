import { ref, watch } from 'vue'
import { useColorMode } from '@vueuse/core'

// Available primary colors from Tailwind
export const primaryColors = [
  { name: 'green', label: 'Green', value: '#22c55e' },
  { name: 'blue', label: 'Blue', value: '#3b82f6' },
  { name: 'purple', label: 'Purple', value: '#a855f7' },
  { name: 'pink', label: 'Pink', value: '#ec4899' },
  { name: 'red', label: 'Red', value: '#ef4444' },
  { name: 'orange', label: 'Orange', value: '#f97316' },
  { name: 'yellow', label: 'Yellow', value: '#eab308' },
  { name: 'cyan', label: 'Cyan', value: '#06b6d4' },
  { name: 'indigo', label: 'Indigo', value: '#6366f1' },
] as const

export type PrimaryColorName = typeof primaryColors[number]['name']

// Color shades for each color (Tailwind CSS color palette)
const colorShades: Record<string, Record<number, string>> = {
  green: {
    50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
    500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16'
  },
  blue: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
    500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554'
  },
  purple: {
    50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc',
    500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87', 950: '#3b0764'
  },
  pink: {
    50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6',
    500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843', 950: '#500724'
  },
  red: {
    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171',
    500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a'
  },
  orange: {
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
    500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407'
  },
  yellow: {
    50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047', 400: '#facc15',
    500: '#eab308', 600: '#ca8a04', 700: '#a16207', 800: '#854d0e', 900: '#713f12', 950: '#422006'
  },
  cyan: {
    50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee',
    500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63', 950: '#083344'
  },
  indigo: {
    50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8',
    500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4e'
  },
}

const STORAGE_KEY = '1remote-primary-color'

const primaryColor = ref<PrimaryColorName>('green')

function applyPrimaryColor(colorName: PrimaryColorName) {
  const shades = colorShades[colorName]
  if (!shades) return

  const root = document.documentElement

  // Set all color shades as CSS variables
  Object.entries(shades).forEach(([shade, value]) => {
    root.style.setProperty(`--ui-color-primary-${shade}`, value)
  })

  // Update the main primary color variable
  root.style.setProperty('--ui-primary', shades[500] || '#22c55e')

  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, colorName)
}

export function useTheme() {
  const colorMode = useColorMode()

  const isDark = ref(colorMode.value === 'dark')

  watch(() => colorMode.value, (val) => {
    isDark.value = val === 'dark'
  })

  const setDarkMode = (value: boolean) => {
    colorMode.value = value ? 'dark' : 'light'
    isDark.value = value
  }

  const setPrimaryColor = (colorName: PrimaryColorName) => {
    primaryColor.value = colorName
    applyPrimaryColor(colorName)
  }

  const initTheme = () => {
    // Load saved primary color
    const saved = localStorage.getItem(STORAGE_KEY) as PrimaryColorName | null
    if (saved && colorShades[saved]) {
      primaryColor.value = saved
      applyPrimaryColor(saved)
    } else {
      // Apply default
      applyPrimaryColor('green')
    }
  }

  return {
    isDark,
    setDarkMode,
    primaryColor,
    setPrimaryColor,
    primaryColors,
    initTheme,
  }
}
