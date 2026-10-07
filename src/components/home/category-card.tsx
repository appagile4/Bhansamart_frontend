import { moderateScale, scale, useTheme } from "@/theme";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface CategoryGridItem {
  id: string;
  name: string;
  imageUrl: string | any;
}

export interface CategoryCardProps {
  item: CategoryGridItem;
  onPress?: (item: CategoryGridItem) => void;
}

export default function CategoryCard({ item, onPress }: CategoryCardProps) {
  const theme = useTheme();

  const imageSource =
    typeof item.imageUrl === "string" ? { uri: item.imageUrl } : item.imageUrl;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => onPress?.(item)}
      style={styles.container}
    >
      {/* Full-Size Edge-to-Edge Rounded Image Container */}
      <View style={styles.imageBox}>
        <Image
          source={imageSource}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
      </View>

      {/* Category Name Label */}
      <Text
        style={[styles.name, { color: theme.colors.textPrimary }]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "22.5%",
    alignItems: "center",
    marginBottom: moderateScale(14),
  },
  imageBox: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#DBF4F6",
    borderRadius: scale(14),
    padding: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    textAlign: "center",
    marginTop: moderateScale(5),
    lineHeight: moderateScale(14),
    minHeight: scale(28),
  },
});
