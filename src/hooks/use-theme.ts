import { useColorScheme, useWindowDimensions } from "react-native";
import {
  Theme,
  darkTheme,
  lightTheme,
  scale,
  verticalScale,
  moderateScale,
  wp,
  hp,
} from "../constants/theme";

/**
 * Hook to access current active theme (Light/Dark)
 */
export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? darkTheme : lightTheme;
}

/**
 * Hook for dynamic responsive calculations reacting to screen orientation or resize
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    isSmallDevice: width < 375,
    isTablet: width >= 768,
    isLandscape: width > height,
    wp: (percentage: number) => Math.round((width * percentage) / 100),
    hp: (percentage: number) => Math.round((height * percentage) / 100),
    scale,
    verticalScale,
    moderateScale,
  };
}
