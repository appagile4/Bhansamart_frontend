import { moderateScale, scale } from "@/theme";
import { Image } from "expo-image";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

// ── Static Image Assets ─────────────────────────────────────────────────────────────
const BANNER_LEFT_IMG = require("@/assets/images/Home/fresh-cauliflower.png");
const BANNER_CENTER_LOGO = require("@/assets/images/Home/bhansa-mart-banner-logo.png");
const BANNER_RIGHT_IMG = require("@/assets/images/Home/swiss-cheese-wedge.png");

// ── Memoized Static Promotional Banner Component ──────────────────────────────────
// Pure visual decoration: cached in memory, zero layout recalculations on scroll
const HeaderBanner = memo(function HeaderBanner() {
  return (
    <View style={styles.bannerRow} pointerEvents="none">
      {/* Left Vegetable / Food Graphic (Independent Style) */}
      <Image
        source={BANNER_LEFT_IMG}
        style={styles.bannerLeftImg}
        contentFit="contain"
        cachePolicy="memory-disk"
        priority="high"
        recyclingKey="home-header-cauliflower"
        transition={null}
      />

      {/* Center Brand Logo + Tagline */}
      <View style={styles.bannerCenterContent}>
        <Image
          source={BANNER_CENTER_LOGO}
          style={styles.bannerCenterLogo}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          recyclingKey="home-header-logo"
          transition={null}
        />
        <Text style={styles.bannerTagline}>
          Simplifying Your Kitchen Needs.
        </Text>
      </View>

      {/* Right Cheese / Food Graphic (Independent Style) */}
      <Image
        source={BANNER_RIGHT_IMG}
        style={styles.bannerRightImg}
        contentFit="contain"
        cachePolicy="memory-disk"
        priority="high"
        recyclingKey="home-header-cheese"
        transition={null}
      />
    </View>
  );
});

export default HeaderBanner;

const styles = StyleSheet.create({
  bannerRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(8),
    marginTop: moderateScale(4),
    minHeight: scale(88),
    position: "relative",
    overflow: "hidden",
  },
  bannerLeftImg: {
    position: "absolute",
    left: -scale(70),
    bottom: -scale(70),
    width: scale(222),
    height: scale(222),
    opacity: 0.1,
    transform: [{ rotate: "45deg" }],
  },
  bannerCenterContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(4),
    zIndex: 2,
  },
  bannerCenterLogo: {
    width: scale(190),
    height: scale(60),
  },
  bannerTagline: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#ffffff",
    marginTop: moderateScale(-8),
    textAlign: "center",
    letterSpacing: 0.3,
  },
  bannerRightImg: {
    position: "absolute",
    right: -scale(40),
    top: -scale(36),
    width: scale(162),
    height: scale(162),
    opacity: 0.1,
  },
});
