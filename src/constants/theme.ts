import { Dimensions, Platform, useColorScheme } from "react-native";

// ==========================================
// 1. RESPONSIVE DIMENSIONS & SCALING SYSTEM
// ==========================================
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const scale = (size: number): number => {
  const currentWidth = Dimensions.get("window").width;
  return Math.round((currentWidth / BASE_WIDTH) * size);
};

export const verticalScale = (size: number): number => {
  const currentHeight = Dimensions.get("window").height;
  return Math.round((currentHeight / BASE_HEIGHT) * size);
};

export const moderateScale = (size: number, factor = 0.5): number => {
  const currentWidth = Dimensions.get("window").width;
  return Math.round(size + (scale(size) - size) * factor);
};

export const wp = (percentage: number): number => {
  const currentWidth = Dimensions.get("window").width;
  return Math.round((currentWidth * percentage) / 100);
};

export const hp = (percentage: number): number => {
  const currentHeight = Dimensions.get("window").height;
  return Math.round((currentHeight * percentage) / 100);
};

export const isSmallDevice = SCREEN_WIDTH < 375;
export const isTablet = SCREEN_WIDTH >= 768;
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";

// ==========================================
// 2. BRAND COLOR PALETTE (From GroFast UI)
// ==========================================
export const BrandColors = {
  primary: "#004d5d",
  primaryHover: "#16a34a",
  primaryLight: "rgba(34, 197, 94, 0.12)",
  primaryUltraLight: "#e9f7ee",

  // Vendor Brand Colors
  vendorPrimary: "#016073",
  vendorPrimaryHover: "#014c5c",
  vendorPrimaryLight: "rgba(1, 96, 115, 0.12)",
  vendorPrimaryUltraLight: "#e6f2f5",
  vendorSecondary: "#86C4CB",
  vendorDark: "#003844",

  brandDark: "#0c422b",
  brandDeep: "#0a3723",
  brandMint: "#a1e3ce",
  brandSage: "#d5e9df",
  brandSplashBg: "#ebf4ee",

  accentOrange: "#f5a623",
  accentAmber: "#f39c12",
  accentYellow: "#facc15",
  accentRed: "#ef4444",
  accentBlue: "#3b82f6",

  categories: {
    vegetables: { bg: "#e2f6ec", text: "#15803d", border: "#bcf0d5" },
    fruits: { bg: "#ffefe5", text: "#ea580c", border: "#ffd4be" },
    bakery: { bg: "#fff7df", text: "#b45309", border: "#fde8aa" },
    meat: { bg: "#ffe8ec", text: "#be123c", border: "#fecdd6" },
    dairy: { bg: "#e8f4fd", text: "#0369a1", border: "#bae0fd" },
    spices: { bg: "#f3e8ff", text: "#7e22ce", border: "#e9d5ff" },
  },
};

export const VENDOR_PRIMARY = "#016073";

export const VendorColors = {
  primary: "#016073",
  primaryHover: "#014c5c",
  primaryLight: "rgba(1, 96, 115, 0.12)",
  primaryUltraLight: "#e6f2f5",
  secondary: "#86C4CB",
  dark: "#003844",
};

// ==========================================
// 3. SPACING, RADIUS, TYPOGRAPHY & SIZES
// ==========================================
export const Spacing = {
  xxs: scale(2),
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(40),
  screenHorizontal: scale(20),
  cardPadding: scale(18),
};

export const Radius = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(18),
  xl: scale(24),
  cardTop: scale(38),
  circle: 9999,
  full: 9999,
};

export const Typography = {
  size: {
    xs: moderateScale(11),
    sm: moderateScale(13),
    md: moderateScale(15),
    lg: moderateScale(18),
    xl: moderateScale(22),
    xxl: moderateScale(26),
    hero: moderateScale(32),
    display: moderateScale(38),
  },
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    heavy: "800" as const,
    black: "900" as const,
  },
  lineHeight: {
    xs: moderateScale(16),
    sm: moderateScale(18),
    md: moderateScale(22),
    lg: moderateScale(26),
    xl: moderateScale(30),
    xxl: moderateScale(34),
    hero: moderateScale(40),
  },
};

export const ComponentSizes = {
  bottomTabHeight: Platform.OS === "ios" ? scale(78) : scale(66),
  headerHeight: Platform.OS === "ios" ? scale(56) : scale(52),
  buttonHeight: scale(52),
  buttonHeightSm: scale(40),
  inputHeight: scale(50),
  cardMinHeight: scale(110),
  avatarSm: scale(36),
  avatarMd: scale(48),
  avatarLg: scale(64),
};

export const Shadows = {
  light: {
    small: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 5,
    },
    large: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 10,
    },
    cardSheet: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 16,
    },
    primaryGlow: {
      shadowColor: "#22c55e",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  dark: {
    small: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 5,
    },
    large: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
    cardSheet: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 16,
    },
    primaryGlow: {
      shadowColor: "#22c55e",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

// ==========================================
// 4. LIGHT & DARK THEME FULL DEFINITIONS
// ==========================================
export const lightColors = {
  primary: BrandColors.primary,
  primaryHover: BrandColors.primaryHover,
  primaryLight: BrandColors.primaryLight,
  primaryUltraLight: BrandColors.primaryUltraLight,

  vendorPrimary: BrandColors.vendorPrimary,
  vendorPrimaryHover: BrandColors.vendorPrimaryHover,
  vendorPrimaryLight: BrandColors.vendorPrimaryLight,
  vendorPrimaryUltraLight: BrandColors.vendorPrimaryUltraLight,
  vendorSecondary: BrandColors.vendorSecondary,
  vendorDark: BrandColors.vendorDark,

  brandDark: BrandColors.brandDark,
  brandMint: BrandColors.brandMint,
  brandSage: BrandColors.brandSage,
  accentOrange: BrandColors.accentOrange,
  accentRed: BrandColors.accentRed,

  background: "#f8faf9",
  backgroundSecondary: "#ebf4ee",
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  card: "#ffffff",
  modal: "#ffffff",

  input: "#f2f6f4",
  inputBorder: "#e2ede6",
  inputPlaceholder: "#8fa89b",

  textPrimary: "#0e3e2b",
  textSecondary: "#4f6e60",
  textMuted: "#87a294",
  textInverse: "#ffffff",
  textLink: "#22c55e",

  border: "#e6efe9",
  borderLight: "#f0f5f2",
  divider: "#e9f2ec",

  tabBar: "#ffffff",
  tabBarBorder: "#eef4f0",
  tabBarActive: "#22c55e",
  tabBarInactive: "#94a89e",
  statusBar: "dark" as const,

  categories: BrandColors.categories,
  shadowColor: "#000000",
};

export const darkColors = {
  primary: "#22c55e",
  primaryHover: "#2ecc71",
  primaryLight: "rgba(34, 197, 94, 0.2)",
  primaryUltraLight: "#16281e",

  vendorPrimary: "#016073",
  vendorPrimaryHover: "#027b93",
  vendorPrimaryLight: "rgba(1, 96, 115, 0.25)",
  vendorPrimaryUltraLight: "#062228",
  vendorSecondary: "#86C4CB",
  vendorDark: "#003844",

  brandDark: "#f0faf4",
  brandMint: "#3d7360",
  brandSage: "#1b2c23",
  accentOrange: "#f5a623",
  accentRed: "#f87171",

  background: "#0c1511",
  backgroundSecondary: "#111c16",
  surface: "#14221b",
  surfaceElevated: "#1c2e25",
  card: "#14221b",
  modal: "#18271f",

  input: "#1b2b22",
  inputBorder: "#273f32",
  inputPlaceholder: "#5f7e6e",

  textPrimary: "#f0faf4",
  textSecondary: "#a4c5b5",
  textMuted: "#668877",
  textInverse: "#0c1511",
  textLink: "#22c55e",

  border: "#23372c",
  borderLight: "#1c2d24",
  divider: "#1e3026",

  tabBar: "#14221b",
  tabBarBorder: "#1f3328",
  tabBarActive: "#22c55e",
  tabBarInactive: "#668877",
  statusBar: "light" as const,

  categories: {
    vegetables: { bg: "#162d21", text: "#4ade80", border: "#234934" },
    fruits: { bg: "#2d1d16", text: "#fb923c", border: "#4a2d20" },
    bakery: { bg: "#2d2616", text: "#fbbf24", border: "#4a3c1f" },
    meat: { bg: "#2d161c", text: "#fb7185", border: "#4a1f28" },
    dairy: { bg: "#162633", text: "#38bdf8", border: "#1f3d52" },
    spices: { bg: "#271633", text: "#c084fc", border: "#3e2054" },
  },
  shadowColor: "#000000",
};

export const lightTheme = {
  mode: "light" as const,
  colors: lightColors,
  typography: Typography,
  componentSizes: ComponentSizes,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows.light,
};

export const darkTheme = {
  mode: "dark" as const,
  colors: darkColors,
  typography: Typography,
  componentSizes: ComponentSizes,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows.dark,
};

export type ThemeColors = Omit<typeof lightColors, "statusBar"> & {
  statusBar: "dark" | "light";
};

export interface Theme {
  mode: "light" | "dark";
  colors: ThemeColors;
  typography: typeof Typography;
  componentSizes: typeof ComponentSizes;
  spacing: typeof Spacing;
  radius: typeof Radius;
  shadows: typeof Shadows.light;
}

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

export const useAppTheme = (): Theme => {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
};
