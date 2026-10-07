import { Image } from "expo-image";
import { FloatingCartBar } from "@/components/cart";
import { SelectLocationModal } from "@/components/home";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export interface CategoryCardData {
  id: string;
  name: string;
  imageUrl: string;
}

export interface SectionCategoryData {
  id: string;
  title: string;
  items: CategoryCardData[];
}

const ALL_CATEGORY_SECTIONS: SectionCategoryData[] = [
  {
    id: "grocery-kitchen",
    title: "Grocery & Kitchen",
    items: [
      {
        id: "veg-fruits",
        name: "Vegetables &\nFruits",
        imageUrl:
          "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=80",
      },
      {
        id: "atta-rice-dal",
        name: "Atta, Rice &\nDal",
        imageUrl:
          "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80",
      },
      {
        id: "oil-ghee-masala",
        name: "Oil, Ghee &\nMasala",
        imageUrl:
          "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80",
      },
      {
        id: "dairy-bread-eggs",
        name: "Dairy, Bread &\nEggs",
        imageUrl:
          "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80",
      },
      {
        id: "bakery-biscuits",
        name: "Bakery &\nBiscuits",
        imageUrl:
          "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&q=80",
      },
      {
        id: "dry-fruits-cereals",
        name: "Dry Fruits &\nCereals",
        imageUrl:
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
      },
      {
        id: "chicken-meat-fish",
        name: "Chicken, Meat &\nFish",
        imageUrl:
          "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&q=80",
      },
      {
        id: "kitchenware-appliances",
        name: "Kitchenware &\nAppliances",
        imageUrl:
          "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&q=80",
      },
    ],
  },
  {
    id: "snacks-drinks",
    title: "Snacks & Drinks",
    items: [
      {
        id: "chips-namkeen",
        name: "Chips &\nNamkeen",
        imageUrl:
          "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80",
      },
      {
        id: "sweets-chocolates",
        name: "Sweets &\nChocolates",
        imageUrl:
          "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&q=80",
      },
      {
        id: "drinks-juices",
        name: "Drinks &\nJuices",
        imageUrl:
          "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&q=80",
      },
      {
        id: "tea-coffee-milk",
        name: "Tea, Coffee &\nMilk Drinks",
        imageUrl:
          "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&q=80",
      },
      {
        id: "instant-food",
        name: "Instant Food",
        imageUrl:
          "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
      },
      {
        id: "sauce-spreads",
        name: "Sauce &\nSpreads",
        imageUrl:
          "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=300&q=80",
      },
      {
        id: "paan-corner",
        name: "Paan corner",
        imageUrl:
          "https://images.unsplash.com/photo-1564834744159-ff0ea41ba4b9?w=300&q=80",
      },
      {
        id: "ice-cream-more",
        name: "Ice Cream &\nMore",
        imageUrl:
          "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=300&q=80",
      },
    ],
  },
  {
    id: "beauty-personal-care",
    title: "Beauty & Personal Care",
    items: [
      {
        id: "bath-body",
        name: "Bath & body",
        imageUrl:
          "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80",
      },
      {
        id: "hair",
        name: "Hair",
        imageUrl:
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&q=80",
      },
      {
        id: "skin-faces",
        name: "Skin & Faces",
        imageUrl:
          "https://images.unsplash.com/photo-1556228722-d0b5ed7cd88c?w=300&q=80",
      },
      {
        id: "beauty-cosmetics",
        name: "Beauty &\nCosmetics",
        imageUrl:
          "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&q=80",
      },
      {
        id: "feminine-hygiene",
        name: "Feminine\nHygiene",
        imageUrl:
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
      },
      {
        id: "fragrances-deodorants",
        name: "Fragrances &\nDeodorants",
        imageUrl:
          "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=300&q=80",
      },
      {
        id: "health-pharma",
        name: "Health &\nPharma",
        imageUrl:
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
      },
      {
        id: "sexual-wellness",
        name: "Sexual\nWellness",
        imageUrl:
          "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&q=80",
      },
    ],
  },
  {
    id: "baby",
    title: "Baby",
    items: [
      {
        id: "baby-food",
        name: "Baby Food",
        imageUrl:
          "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=300&q=80",
      },
      {
        id: "diapers-pants",
        name: "Diapers &\nPants",
        imageUrl:
          "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=300&q=80",
      },
      {
        id: "baby-care",
        name: "Baby Care",
        imageUrl:
          "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&q=80",
      },
      {
        id: "baby-bath",
        name: "Baby Bath",
        imageUrl:
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
      },
      {
        id: "baby-feeding",
        name: "Baby\nFeeding",
        imageUrl:
          "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=300&q=80",
      },
      {
        id: "baby-clothing",
        name: "Baby\nClothing",
        imageUrl:
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&q=80",
      },
      {
        id: "baby-accessories",
        name: "Baby\nAccessories",
        imageUrl:
          "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&q=80",
      },
    ],
  },
  {
    id: "school-office-stationery",
    title: "School, Office & Stationery",
    items: [
      {
        id: "writing-essentials",
        name: "Writing\nEssentials",
        imageUrl:
          "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300&q=80",
      },
      {
        id: "school-supplies",
        name: "School Supplies",
        imageUrl:
          "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&q=80",
      },
      {
        id: "office-supplies",
        name: "Office Supplies",
        imageUrl:
          "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&q=80",
      },
      {
        id: "art-craft-hobby",
        name: "Art, Craft &\nHobby",
        imageUrl:
          "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&q=80",
      },
    ],
  },
];

export default function CategoryScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(
    "Baneshwor, Kathmandu, Bagmati, Nepal",
  );

  // Filter sections and their category items according to the in-page search query
  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return ALL_CATEGORY_SECTIONS;
    }

    return ALL_CATEGORY_SECTIONS.map((section) => {
      // If section title matches, include all items; otherwise filter items by name
      const sectionMatches = section.title.toLowerCase().includes(query);
      if (sectionMatches) {
        return section;
      }

      const matchingItems = section.items.filter((item) =>
        item.name.toLowerCase().replace("\n", " ").includes(query),
      );

      return {
        ...section,
        items: matchingItems,
      };
    }).filter((section) => section.items.length > 0);
  }, [searchQuery]);

  const handleCategoryPress = (item: CategoryCardData, sectionTitle: string) => {
    router.push({
      pathname: "/Screens/Category/categoryExpand" as any,
      params: {
        category: sectionTitle,
        subCategory: item.name.replace("\n", " "),
        title: item.name.replace("\n", " "),
      },
    });
  };

  const handleVoiceSearch = () => {
    Alert.alert(
      "Voice Search",
      "Say a category (e.g. 'Snacks', 'Vegetables', 'Cosmetics')",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Search 'Snacks'",
          onPress: () => setSearchQuery("Snacks"),
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Floating Cart Bar */}
      <FloatingCartBar />

      {/* 1. Sky Blue Gradient Top Header */}
      <LinearGradient
        colors={["#003844", "#004d5d", "#016073"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          {/* Top Location & Profile Row */}
          <View style={styles.headerTopRow}>
            {/* Store & Location */}
            <View style={styles.locationContainer}>
              <Text style={styles.storeName}>Bhansa Mart</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsLocationModalVisible(true)}
                style={styles.locationButton}
              >
                <Text numberOfLines={1} style={styles.locationText}>
                  {currentLocation}
                </Text>
                <Feather
                  name="chevron-down"
                  size={scale(14)}
                  color="#FFFFFF"
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>
            </View>

            {/* Profile Avatar Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/Screens/Profile/profile" as any)}
              style={styles.profileAvatar}
            >
              <Ionicons name="person" size={scale(18)} color="#003844" />
            </TouchableOpacity>
          </View>

          {/* Search Bar - In-Page Category Filter */}
          <View style={styles.searchBarWrapper}>
            <Feather
              name="search"
              size={scale(19)}
              color="#64748B"
              style={styles.searchIcon}
            />

            <TextInput
              style={styles.searchInput}
              placeholder='Search "Product"'
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />

            {searchQuery.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSearchQuery("")}
                style={styles.clearBtn}
              >
                <Feather name="x" size={scale(16)} color="#94A3B8" />
              </TouchableOpacity>
            )}

            <View style={styles.searchDivider} />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleVoiceSearch}
              style={styles.micBtn}
            >
              <Feather name="mic" size={scale(18)} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* 2. Scrollable Categories Grid Sections */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredSections.length > 0 ? (
          filteredSections.map((section) => (
            <View key={section.id} style={styles.sectionContainer}>
              {/* Section Heading */}
              <Text style={styles.sectionTitle}>{section.title}</Text>

              {/* 4-Column Subcategory Grid */}
              <View style={styles.categoryGrid}>
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.82}
                    onPress={() => handleCategoryPress(item, section.title)}
                    style={styles.cardWrapper}
                  >
                    {/* Soft Cyan/Mint Image Box */}
                    <View style={styles.imageBox}>
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.categoryImage}
                        contentFit="contain"
                      />
                    </View>

                    {/* Category Label */}
                    <Text numberOfLines={2} style={styles.categoryNameText}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Feather name="search" size={scale(48)} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No matching categories</Text>
            <Text style={styles.emptySubtitle}>
              Try searching with different keywords like "Fruits", "Drinks", or
              "Care".
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Select Location Bottom Sheet Modal */}
      <SelectLocationModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        onSelectLocation={(loc) =>
          setCurrentLocation(`${loc.title}, ${loc.address}`)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  gradientHeader: {
    paddingBottom: scale(14),
    borderBottomLeftRadius: scale(18),
    borderBottomRightRadius: scale(18),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  safeArea: {
    paddingHorizontal: scale(16),
    paddingTop: scale(4),
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(10),
  },
  locationContainer: {
    flex: 1,
    paddingRight: scale(10),
  },
  storeName: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
    marginBottom: scale(2),
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: moderateScale(12.5),
    color: "#E0F2FE",
    fontWeight: "500",
    maxWidth: "85%",
  },
  chevronIcon: {
    marginLeft: scale(3),
  },
  profileAvatar: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    height: scale(44),
    paddingHorizontal: scale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: scale(6),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: "#0F172A",
    paddingVertical: 0,
  },
  clearBtn: {
    padding: scale(4),
  },
  searchDivider: {
    width: 1,
    height: scale(20),
    backgroundColor: "#E2E8F0",
    marginHorizontal: scale(6),
  },
  micBtn: {
    padding: scale(4),
  },
  scrollContent: {
    paddingHorizontal: scale(14),
    paddingTop: scale(16),
    paddingBottom: scale(200),
    gap: scale(20),
  },
  sectionContainer: {
    gap: scale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: scale(12),
  },
  cardWrapper: {
    width: "23%",
    alignItems: "center",
  },
  imageBox: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#E6F7F8",
    borderRadius: scale(14),
    alignItems: "center",
    justifyContent: "center",
    padding: scale(6),
    marginBottom: scale(6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryImage: {
    width: "88%",
    height: "88%",
  },
  categoryNameText: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
    lineHeight: moderateScale(13),
    minHeight: scale(26),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(80),
    gap: scale(10),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#475569",
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: scale(32),
  },
});
