import { Image } from "expo-image";
import { moderateScale, scale } from "@/theme";
import React from "react";
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface PromoCardItem {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonColor: string;
  buttonTextColor: string;
  bgColor: string;
  curveColor1: string;
  curveColor2: string;
  imageUrl: string;
}

const PROMO_CARDS: PromoCardItem[] = [
  {
    id: "promo-1",
    title: "Chocolatey and\nrich bites",
    subtitle: "Pick from the\nbest collection",
    buttonText: "Shop now",
    buttonColor: "#ffffff",
    buttonTextColor: "#262626",
    bgColor: "#8D543B",
    curveColor1: "#7D4831",
    curveColor2: "#9C6146",
    imageUrl:
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "promo-2",
    title: "Upgrade Your\nBeauty Routine",
    subtitle: "Up to 40% OFF on\nbig beauty brands",
    buttonText: "Shop now",
    buttonColor: "#27272A",
    buttonTextColor: "#ffffff",
    bgColor: "#F5D9DF",
    curveColor1: "#E8C2CA",
    curveColor2: "#FDE8ED",
    imageUrl:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "promo-3",
    title: "Fresh Harvest\nDaily Greens",
    subtitle: "Straight from farm\nto your kitchen",
    buttonText: "Explore",
    buttonColor: "#ffffff",
    buttonTextColor: "#1E3A5F",
    bgColor: "#2D6A4F",
    curveColor1: "#1B4332",
    curveColor2: "#40916C",
    imageUrl:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "promo-4",
    title: "Crispy Crunch\nSnack Party",
    subtitle: "Munchies & sips for\nevery mood",
    buttonText: "Shop now",
    buttonColor: "#ffffff",
    buttonTextColor: "#C2410C",
    bgColor: "#EA580C",
    curveColor1: "#C2410C",
    curveColor2: "#FB923C",
    imageUrl:
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "promo-5",
    title: "Refreshing\nJuice Blends",
    subtitle: "Real fruit extracts\npacked with energy",
    buttonText: "Order now",
    buttonColor: "#ffffff",
    buttonTextColor: "#0369A1",
    bgColor: "#0284C7",
    curveColor1: "#0369A1",
    curveColor2: "#38BDF8",
    imageUrl:
      "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "promo-6",
    title: "Bakery Warmth\n& Fresh Bakes",
    subtitle: "Breads, cakes and\nall-time cookies",
    buttonText: "Shop now",
    buttonColor: "#27272A",
    buttonTextColor: "#ffffff",
    bgColor: "#F59E0B",
    curveColor1: "#D97706",
    curveColor2: "#FBBF24",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
  },
];

interface CurvedPromoScrollerProps {
  onPromoPress?: (promo: PromoCardItem) => void;
}

export default function CurvedPromoScroller({
  onPromoPress,
}: CurvedPromoScrollerProps) {
  const cardWidth = scale(280);
  const cardHeight = scale(175);

  const renderItem = ({ item }: { item: PromoCardItem }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onPromoPress?.(item)}
        style={[
          styles.cardContainer,
          {
            width: cardWidth,
            height: cardHeight,
            backgroundColor: item.bgColor,
          },
        ]}
      >
        {/* Native Fabric-Compatible Pure Curved Waves (Multi-layered organic arcs) */}
        <View style={styles.curveLayer1} pointerEvents="none">
          <View
            style={[
              styles.curveCircleTop,
              { backgroundColor: item.curveColor1 },
            ]}
          />
        </View>

        <View style={styles.curveLayer2} pointerEvents="none">
          <View
            style={[
              styles.curveCircleBottom,
              { backgroundColor: item.curveColor2 },
            ]}
          />
        </View>

        <View style={styles.curveLayer3} pointerEvents="none">
          <View
            style={[
              styles.curveCircleRight,
              { backgroundColor: item.curveColor1 },
            ]}
          />
        </View>

        {/* Content Column (Left Side) */}
        <View style={styles.leftContent}>
          <Text
            style={[
              styles.promoTitle,
              {
                color:
                  item.bgColor === "#F5D9DF" || item.bgColor === "#F59E0B"
                    ? "#27272A"
                    : "#ffffff",
              },
            ]}
          >
            {item.title}
          </Text>

          <Text
            style={[
              styles.promoSubtitle,
              {
                color:
                  item.bgColor === "#F5D9DF" || item.bgColor === "#F59E0B"
                    ? "#52525B"
                    : "rgba(255, 255, 255, 0.85)",
              },
            ]}
          >
            {item.subtitle}
          </Text>

          {/* Action Button Pill */}
          <View
            style={[
              styles.actionBtn,
              { backgroundColor: item.buttonColor },
            ]}
          >
            <Text
              style={[
                styles.actionBtnText,
                { color: item.buttonTextColor },
              ]}
            >
              {item.buttonText}
            </Text>
          </View>
        </View>

        {/* Image on the Right */}
        <View style={styles.imageRightWrapper}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.rightImage}
            contentFit="contain"
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={PROMO_CARDS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: scale(12) }} />}
        snapToInterval={cardWidth + scale(12)}
        decelerationRate="fast"
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
  },
  cardContainer: {
    borderRadius: scale(22),
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  // Smooth Pure-Native Organic Curved Wave Layers
  curveLayer1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  curveCircleTop: {
    position: "absolute",
    top: -scale(120),
    left: -scale(60),
    width: scale(320),
    height: scale(220),
    borderRadius: scale(160),
    opacity: 0.35,
    transform: [{ rotate: "-20deg" }],
  },
  curveLayer2: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  curveCircleBottom: {
    position: "absolute",
    bottom: -scale(140),
    left: scale(20),
    width: scale(340),
    height: scale(240),
    borderRadius: scale(170),
    opacity: 0.28,
    transform: [{ rotate: "15deg" }],
  },
  curveLayer3: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  curveCircleRight: {
    position: "absolute",
    bottom: -scale(70),
    right: -scale(70),
    width: scale(200),
    height: scale(200),
    borderRadius: scale(100),
    opacity: 0.2,
  },
  leftContent: {
    flex: 1.15,
    paddingLeft: scale(16),
    paddingRight: scale(6),
    paddingVertical: scale(16),
    justifyContent: "space-between",
    height: "100%",
    zIndex: 2,
  },
  promoTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    lineHeight: moderateScale(20),
    letterSpacing: 0.2,
  },
  promoSubtitle: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    lineHeight: moderateScale(15),
    marginTop: moderateScale(2),
  },
  actionBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(12),
    marginTop: moderateScale(8),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
  },
  imageRightWrapper: {
    width: scale(115),
    height: scale(115),
    marginRight: scale(10),
    borderRadius: scale(16),
    overflow: "hidden",
    zIndex: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  rightImage: {
    width: "100%",
    height: "100%",
  },
});
