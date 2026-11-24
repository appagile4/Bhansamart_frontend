import { useAppSelector } from "@/store/hooks";
import { scale } from "@/theme";
import storage from "@/utils/storage";
import { Buffer } from "buffer";
import { Image, ImageBackground } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BLOB_COLOR = "#86C4CB";

// SVG Blob
const SVG_RAW = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 100 176 152">
  <path
    d="M 146 108
    C 135 103, 118 102, 100 105
    C 78 108, 55 107, 33 106
    C 20 106, 10 113, 5 122
    C 0 132, 1 149, 3 158
    C 6 176, 17 190, 30 202
    C 40 212, 48 226, 55 238
    C 61 247, 70 251, 78 250
    C 88 249, 96 242, 104 233
    C 114 222, 122 212, 133 203
    C 145 194, 159 188, 168 177
    C 174 169, 176 159, 173 149
    C 172 137, 166 126, 160 120
    C 156 115, 151 111, 146 108 Z"
    fill="${BLOB_COLOR}"
  />
</svg>`;

const SVG_BASE64_URI = `data:image/svg+xml;base64,${Buffer.from(
  SVG_RAW,
  "utf-8",
).toString("base64")}`;

const Index = () => {
  const router = useRouter();
  const { isAuthenticated: isCustomerAuthenticated, user: customerUser } =
    useAppSelector((state) => state.auth);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndRoute = async () => {
      try {
        const customerToken = await storage.getItem("bhansa_token");
        const deliveryToken = await storage.getItem("bhansa_delivery_token");

        let currentCustomerUser = customerUser;

        if (customerToken && !currentCustomerUser) {
          try {
            const rawCU = await storage.getItem("bhansa_user");
            if (rawCU) currentCustomerUser = JSON.parse(rawCU);
          } catch (e) {
            console.warn("[Splash] Error reading customer storage cache", e);
          }
        }

        const timer = setTimeout(() => {
          if (!isMounted) return;

          // 1. Delivery Partner check
          if (deliveryToken) {
            router.replace("/DeliveryMain" as any);
            return;
          }

          // 2. Customer & Guest Access:
          // Directly enter Customer Storefront (supports full guest browsing)
          router.replace("/customerMain" as any);
        }, 2200);

        return () => clearTimeout(timer);
      } catch (err) {
        console.warn("[Splash] checkAuthAndRoute error:", err);
        const timer = setTimeout(() => {
          if (!isMounted) return;
          router.replace("/customerMain" as any);
        }, 2200);
        return () => clearTimeout(timer);
      }
    };

    checkAuthAndRoute();

    return () => {
      isMounted = false;
    };
  }, [
    isCustomerAuthenticated,
    customerUser,
    router,
  ]);

  return (
    <ImageBackground
      source={require("@/assets/images/Home/floral-lace-pattern.png")}
      style={styles.container}
      contentFit="cover"
    >
      <StatusBar style="dark" />

      <View style={styles.centerContainer}>
        {/* Static SVG Blob */}
        <View style={styles.blobWrapper} pointerEvents="none">
          <Image
            source={{ uri: SVG_BASE64_URI }}
            style={styles.blobSvg}
            tintColor={BLOB_COLOR}
            contentFit="fill"
          />
        </View>

        {/* Static Logo */}
        <View style={styles.logoWrapper}>
          <Image
            source={require("@/assets/images/Home/bhansa-mart-cart-badge.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
      </View>
    </ImageBackground>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  centerContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  blobWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  blobSvg: {
    width: SCREEN_WIDTH * 0.95,
    height: scale(280),
  },

  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: scale(250),
    height: scale(250),
  },
});
