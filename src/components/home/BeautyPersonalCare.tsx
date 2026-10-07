import CategoryCard, {
  CategoryGridItem,
} from "@/components/home/category-card";
import { useAppSelector } from "@/store/hooks";
import { moderateScale, scale, useTheme } from "@/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface BeautyPersonalCareProps {
  onItemPress?: (item: CategoryGridItem) => void;
}

const BEAUTY_ITEMS: CategoryGridItem[] = [
  {
    id: "bath-body",
    name: "Bath & body",
    imageUrl: require("@/assets/images/Home/himalaya-baby-wash.png"),
  },
  {
    id: "hair",
    name: "Hair & Scalp",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "skin-faces",
    name: "Skin & Faces",
    imageUrl: require("@/assets/images/Home/skincare-cream-jars-bottles.png"),
  },
  {
    id: "beauty-cosmetics",
    name: "Beauty &\nCosmetics",
    imageUrl: require("@/assets/images/Home/makeup-blush-compact.png"),
  },
  {
    id: "fragrances",
    name: "Luxury\nFragrances",
    imageUrl: require("@/assets/images/Home/luxury-purple-perfume.png"),
  },
  {
    id: "oral-care",
    name: "Oral Care",
    imageUrl: require("@/assets/images/Home/toothpaste-colgate.png"),
  },
  {
    id: "health-pharma",
    name: "Health &\nCare",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "beauty-kits",
    name: "Gift Kits &\nCombos",
    imageUrl: require("@/assets/images/Home/cosmetics-skincare-set.png"),
  },
];

export default function BeautyPersonalCare({
  onItemPress,
}: BeautyPersonalCareProps) {
  const theme = useTheme();
  const router = useRouter();
  const { publicProducts, publicLoading } = useAppSelector(
    (state) => state.product
  );

  // Pulse animation for skeleton state
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  const handlePress = (item: CategoryGridItem) => {
    if (onItemPress) {
      onItemPress(item);
    } else {
      router.push({
        pathname: "/Screens/Product/seeAllProductScreen" as any,
        params: {
          title: item.name.replace("\n", " "),
          category: item.id,
        },
      });
    }
  };

  // Skeleton loading view while backend products are loading
  if (publicLoading && (!publicProducts || publicProducts.length === 0)) {
    return (
      <View style={styles.container}>
        {/* Title skeleton */}
        <Animated.View
          style={[
            styles.skeletonBlock,
            {
              width: scale(190),
              height: scale(22),
              borderRadius: scale(6),
              marginBottom: moderateScale(14),
              opacity: pulseAnim,
            },
          ]}
        />

        {/* 4x2 Grid Skeleton */}
        <View style={styles.gridContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <View key={`b-skel-${i}`} style={styles.skeletonCard}>
              <Animated.View
                style={[
                  styles.skeletonBlock,
                  styles.skeletonImageBox,
                  { opacity: pulseAnim },
                ]}
              />
              <Animated.View
                style={[
                  styles.skeletonBlock,
                  {
                    width: "80%",
                    height: scale(11),
                    marginTop: scale(6),
                    borderRadius: scale(3),
                    opacity: pulseAnim,
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <Text
        style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
      >
        Beauty & Personal Care
      </Text>

      {/* 4x2 Grid */}
      <View style={styles.gridContainer}>
        {BEAUTY_ITEMS.map((item) => (
          <CategoryCard key={item.id} item={item} onPress={handlePress} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: scale(16),
    marginTop: moderateScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    marginBottom: moderateScale(12),
    letterSpacing: 0.2,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  skeletonCard: {
    width: "22.5%",
    alignItems: "center",
    marginBottom: moderateScale(14),
  },
  skeletonImageBox: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: scale(14),
  },
  skeletonBlock: {
    backgroundColor: "#E2E8F0",
  },
});
