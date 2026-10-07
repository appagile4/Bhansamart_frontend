import { moderateScale, scale, useTheme } from "@/theme";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

export interface PromoCardItem {
  id: string;
  tag?: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonColor: string;
  buttonTextColor: string;
  gradientColors: [string, string];
  imageUrl: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(Math.round(SCREEN_WIDTH * 0.76), 320);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 0.58);
const CARD_SPACING = scale(14);
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;
const AUTO_SCROLL_DELAY = 3200; // 3.2 seconds interval

// Modern asymmetric organic container path (viewBox: 0 0 320 185)
const MODERN_CARD_PATH =
  "M 24 0 " +
  "H 296 C 309.25 0 320 10.75 320 24 " +
  "V 161 C 320 174.25 309.25 185 296 185 " +
  "H 24 C 10.75 185 0 174.25 0 161 " +
  "V 24 C 0 10.75 10.75 0 24 0 Z";

const BASE_PROMO_CARDS: PromoCardItem[] = [
  {
    id: "promo-1",
    tag: "FEATURED",
    title: "Rich Artisan\nChocolates",
    subtitle: "Handcrafted single-origin bars & truffles",
    buttonText: "Shop Now",
    buttonColor: "#FFFFFF",
    buttonTextColor: "#4A1E11",
    gradientColors: ["#7C3E26", "#421C11"],
    imageUrl:
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "promo-2",
    tag: "LIMITED",
    title: "Glow & Tone\nEssentials",
    subtitle: "Up to 40% OFF on high-end beauty brands",
    buttonText: "Claim Deal",
    buttonColor: "#18181B",
    buttonTextColor: "#FFFFFF",
    gradientColors: ["#FDE2E8", "#F6C1D0"],
    imageUrl:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "promo-3",
    tag: "ORGANIC",
    title: "Farm Fresh\nDaily Greens",
    subtitle: "Locally sourced harvest straight to your table",
    buttonText: "Explore",
    buttonColor: "#FFFFFF",
    buttonTextColor: "#1B4332",
    gradientColors: ["#2D6A4F", "#1B4332"],
    imageUrl:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "promo-4",
    tag: "POPULAR",
    title: "Spiced & Glazed\nCrunch Party",
    subtitle: "Crispy munchies curated for late-night cravings",
    buttonText: "Grab Snack",
    buttonColor: "#FFFFFF",
    buttonTextColor: "#9A3412",
    gradientColors: ["#F97316", "#C2410C"],
    imageUrl:
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "promo-5",
    tag: "COLD PRESSED",
    title: "Citrus Punch\nPure Juices",
    subtitle: "Raw fruit elixirs packed with electrolytes",
    buttonText: "Order Cold",
    buttonColor: "#FFFFFF",
    buttonTextColor: "#075985",
    gradientColors: ["#0284C7", "#03456C"],
    imageUrl:
      "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&auto=format&fit=crop&q=80",
  },
];

// Replicate array to create a seamless infinite circular scroll (loop: 1 2 3 4 5 1 2 3 4 5 ...)
const LOOP_MULTIPLIER = 20;
const INFINITE_PROMO_CARDS: (PromoCardItem & { uniqueKey: string })[] = [];
for (let loop = 0; loop < LOOP_MULTIPLIER; loop++) {
  BASE_PROMO_CARDS.forEach((item, idx) => {
    INFINITE_PROMO_CARDS.push({
      ...item,
      uniqueKey: `promo-loop-${loop}-${item.id}-${idx}`,
    });
  });
}

const TOTAL_BASE_ITEMS = BASE_PROMO_CARDS.length;
const INITIAL_INDEX = Math.floor(LOOP_MULTIPLIER / 2) * TOTAL_BASE_ITEMS;

interface CurvedPromoScrollerProps {
  onPromoPress?: (promo: PromoCardItem) => void;
}

export default function CurvedPromoScroller({
  onPromoPress,
}: CurvedPromoScrollerProps) {
  const theme = useTheme?.() ?? {};
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<Animated.FlatList<any>>(null);

  const currentIndexRef = useRef(INITIAL_INDEX);
  const isInteractingRef = useRef(false);

  // Initialize scroll position to center of loop on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: INITIAL_INDEX * SNAP_INTERVAL,
        animated: false,
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Continuous Auto-Scroll Interval Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (isInteractingRef.current) return;

      currentIndexRef.current += 1;
      flatListRef.current?.scrollToOffset({
        offset: currentIndexRef.current * SNAP_INTERVAL,
        animated: true,
      });
    }, AUTO_SCROLL_DELAY);

    return () => clearInterval(interval);
  }, []);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    currentIndexRef.current = index;

    // Reposition to center if near start or end to maintain truly infinite loop
    if (
      index < TOTAL_BASE_ITEMS * 2 ||
      index > TOTAL_BASE_ITEMS * (LOOP_MULTIPLIER - 2)
    ) {
      const normalizedIndex = (index % TOTAL_BASE_ITEMS) + INITIAL_INDEX;
      currentIndexRef.current = normalizedIndex;
      flatListRef.current?.scrollToOffset({
        offset: normalizedIndex * SNAP_INTERVAL,
        animated: false,
      });
    }
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: PromoCardItem & { uniqueKey: string };
    index: number;
  }) => {
    const inputRange = [
      (index - 1) * SNAP_INTERVAL,
      index * SNAP_INTERVAL,
      (index + 1) * SNAP_INTERVAL,
    ];

    const scaleAnim = scrollX.interpolate({
      inputRange,
      outputRange: [0.93, 1, 0.93],
      extrapolate: "clamp",
    });

    const opacityAnim = scrollX.interpolate({
      inputRange,
      outputRange: [0.75, 1, 0.75],
      extrapolate: "clamp",
    });

    const isLightCard = item.gradientColors[0].toLowerCase().startsWith("#f");
    const textColor = isLightCard ? "#18181B" : "#FFFFFF";
    const subtextColor = isLightCard ? "#52525B" : "rgba(255, 255, 255, 0.85)";
    const tagBg = isLightCard ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.18)";

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Pressable
          style={styles.pressableContainer}
          onPress={() => onPromoPress?.(item)}
          android_ripple={{
            color: "rgba(255,255,255,0.12)",
            borderless: false,
          }}
        >
          {/* Layer 1: High Fidelity Gradient SVG Canvas */}
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 320 185"
            preserveAspectRatio="none"
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <LinearGradient
                id={`grad-${item.uniqueKey}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <Stop offset="0%" stopColor={item.gradientColors[0]} />
                <Stop offset="100%" stopColor={item.gradientColors[1]} />
              </LinearGradient>
            </Defs>
            <Path d={MODERN_CARD_PATH} fill={`url(#grad-${item.uniqueKey})`} />
          </Svg>

          {/* Layer 2: Text & Interactive CTA Area */}
          <View style={styles.contentColumn}>
            {item.tag ? (
              <View style={[styles.tagBadge, { backgroundColor: tagBg }]}>
                <Text style={[styles.tagText, { color: textColor }]}>
                  {item.tag}
                </Text>
              </View>
            ) : null}

            <Text
              style={[styles.title, { color: textColor }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>

            <Text
              style={[styles.subtitle, { color: subtextColor }]}
              numberOfLines={2}
            >
              {item.subtitle}
            </Text>

            <View
              style={[styles.actionBtn, { backgroundColor: item.buttonColor }]}
            >
              <Text
                style={[styles.actionBtnText, { color: item.buttonTextColor }]}
              >
                {item.buttonText}
              </Text>
            </View>
          </View>

          {/* Layer 3: Overhanging Floating Image Element */}
          <View style={styles.imageRightWrapper}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.floatingImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={INFINITE_PROMO_CARDS}
        keyExtractor={(item) => item.uniqueKey}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        bounces={false}
        onScrollBeginDrag={() => {
          isInteractingRef.current = true;
        }}
        onScrollEndDrag={() => {
          setTimeout(() => {
            isInteractingRef.current = false;
          }, 1500);
        }}
        onMomentumScrollEnd={(e) => {
          handleScrollEnd(e);
          isInteractingRef.current = false;
        }}
        getItemLayout={(_, index) => ({
          length: SNAP_INTERVAL,
          offset: SNAP_INTERVAL * index,
          index,
        })}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: moderateScale(14),
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(6),
  },
  cardWrapper: {
    marginRight: CARD_SPACING,
    borderRadius: moderateScale(24),
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  pressableContainer: {
    flex: 1,
    borderRadius: moderateScale(24),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  contentColumn: {
    flex: 1.15,
    paddingLeft: scale(20),
    paddingRight: scale(6),
    paddingVertical: moderateScale(16),
    justifyContent: "space-between",
    height: "100%",
    zIndex: 2,
  },
  tagBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: scale(8),
    paddingVertical: scale(2.5),
    borderRadius: scale(6),
    marginBottom: moderateScale(4),
  },
  tagText: {
    fontSize: moderateScale(8.5),
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    lineHeight: moderateScale(21),
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    lineHeight: moderateScale(15),
    marginVertical: moderateScale(3),
  },
  actionBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: scale(14),
    paddingVertical: scale(7),
    borderRadius: scale(100),
    marginTop: moderateScale(4),
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  imageRightWrapper: {
    width: scale(104),
    height: scale(104),
    marginRight: scale(16),
    borderRadius: scale(18),
    overflow: "hidden",
    zIndex: 3,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  floatingImage: {
    width: "100%",
    height: "100%",
  },
});
