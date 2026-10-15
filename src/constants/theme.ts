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
    beauty: { bg: "#fce7f3", text: "#FF4F81", border: "#fbcfe8" },
    baby: { bg: "#ffedd5", text: "#FF8C32", border: "#fed7aa" },
    gifting: { bg: "#f3e8ff", text: "#AD70FF", border: "#e9d5ff" },
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

// ==========================================
// Customer Dark Mode Design System Palette
// ==========================================
export const CustomerDarkPalette = {
  mainBackground: "#080D0F", // Near Black
  cardsSurfaces: "#151D24", // Dark Charcoal
  searchBar: "#1B252E", // Blue-Gray
  primaryBrand: "#39D353", // Emerald Green
  secondaryGreen: "#5BB74A", // Fresh Green
  brandBanner: "#003C3A", // Deep Teal
  accentFlashSale: "#FFC928", // Golden Yellow
  discountBadges: "#FF2028", // Sale Red
  primaryText: "#F8FAFC", // White
  secondaryText: "#A8B2BE", // Cool Gray
  borders: "#303B45", // Slate Gray
  linksLocationIcon: "#19A9FF", // Sky Blue
  beautyCategory: "#FF4F81", // Pink
  babyCategory: "#FF8C32", // Orange
  giftingCategory: "#AD70FF", // Purple
};

export const darkColors = {
  primary: CustomerDarkPalette.primaryBrand, // #39D353 Emerald Green
  primaryHover: CustomerDarkPalette.secondaryGreen, // #5BB74A Fresh Green
  primaryLight: "rgba(57, 211, 83, 0.18)",
  primaryUltraLight: "#0B1E12",

  vendorPrimary: "#016073",
  vendorPrimaryHover: "#027b93",
  vendorPrimaryLight: "rgba(1, 96, 115, 0.25)",
  vendorPrimaryUltraLight: "#062228",
  vendorSecondary: "#86C4CB",
  vendorDark: "#003844",

  brandDark: CustomerDarkPalette.brandBanner, // #003C3A Deep Teal
  brandDeep: CustomerDarkPalette.brandBanner, // #003C3A Deep Teal
  brandMint: CustomerDarkPalette.primaryBrand,
  brandSage: CustomerDarkPalette.cardsSurfaces,
  accentOrange: CustomerDarkPalette.babyCategory, // #FF8C32
  accentYellow: CustomerDarkPalette.accentFlashSale, // #FFC928
  accentRed: CustomerDarkPalette.discountBadges, // #FF2028
  accentBlue: CustomerDarkPalette.linksLocationIcon, // #19A9FF

  background: CustomerDarkPalette.mainBackground, // #080D0F Near Black
  backgroundSecondary: CustomerDarkPalette.cardsSurfaces, // #151D24 Dark Charcoal
  surface: CustomerDarkPalette.cardsSurfaces, // #151D24 Dark Charcoal
  surfaceElevated: CustomerDarkPalette.searchBar, // #1B252E Blue-Gray
  card: CustomerDarkPalette.cardsSurfaces, // #151D24 Dark Charcoal
  modal: CustomerDarkPalette.cardsSurfaces, // #151D24 Dark Charcoal

  input: CustomerDarkPalette.searchBar, // #1B252E Blue-Gray
  inputBorder: CustomerDarkPalette.borders, // #303B45 Slate Gray
  inputPlaceholder: CustomerDarkPalette.secondaryText, // #A8B2BE Cool Gray

  textPrimary: CustomerDarkPalette.primaryText, // #F8FAFC White
  textSecondary: CustomerDarkPalette.secondaryText, // #A8B2BE Cool Gray
  textMuted: CustomerDarkPalette.secondaryText, // #A8B2BE Cool Gray
  textInverse: CustomerDarkPalette.mainBackground,
  textLink: CustomerDarkPalette.linksLocationIcon, // #19A9FF Sky Blue

  border: CustomerDarkPalette.borders, // #303B45 Slate Gray
  borderLight: CustomerDarkPalette.borders, // #303B45 Slate Gray
  divider: CustomerDarkPalette.borders, // #303B45 Slate Gray

  tabBar: CustomerDarkPalette.cardsSurfaces, // #151D24 Dark Charcoal
  tabBarBorder: CustomerDarkPalette.borders, // #303B45 Slate Gray
  tabBarActive: CustomerDarkPalette.primaryBrand, // #39D353 Emerald Green
  tabBarInactive: CustomerDarkPalette.secondaryText, // #A8B2BE Cool Gray
  statusBar: "light" as const,

  categories: {
    vegetables: { bg: "#102618", text: "#39D353", border: "#303B45" },
    fruits: { bg: "#2A1810", text: "#FF8C32", border: "#303B45" },
    bakery: { bg: "#282010", text: "#FFC928", border: "#303B45" },
    meat: { bg: "#2A1215", text: "#FF2028", border: "#303B45" },
    dairy: { bg: "#10202E", text: "#19A9FF", border: "#303B45" },
    spices: { bg: "#20122B", text: "#AD70FF", border: "#303B45" },
    beauty: { bg: "#2A1420", text: CustomerDarkPalette.beautyCategory, border: "#303B45" },
    baby: { bg: "#2A1810", text: CustomerDarkPalette.babyCategory, border: "#303B45" },
    gifting: { bg: "#20122B", text: CustomerDarkPalette.giftingCategory, border: "#303B45" },
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
