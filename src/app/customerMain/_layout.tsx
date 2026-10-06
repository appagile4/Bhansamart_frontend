import { useAppSelector } from "@/store/hooks";
import { useTheme } from "@/theme";
import { useRouter } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useEffect } from "react";

export default function TabLayout() {
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/(auth)/login" as any);
    }
  }, [isInitialized, isAuthenticated, router]);

  return (
    <NativeTabs
      tintColor={theme.colors.primary}
      indicatorColor={theme.colors.primary}
    >
      {/* HOME */}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* CATEGORY */}
      <NativeTabs.Trigger name="category">
        <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" md="grid_view" />
        <NativeTabs.Trigger.Label>Category</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* ORDER AGAIN */}
      <NativeTabs.Trigger name="order-again">
        <NativeTabs.Trigger.Icon
          sf="arrow.clockwise.circle.fill"
          md="refresh"
        />
        <NativeTabs.Trigger.Label>Order Again</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* CART */}
      <NativeTabs.Trigger name="cart" role="search">
        <NativeTabs.Trigger.Icon sf="cart.fill" md="shopping_cart" />
        <NativeTabs.Trigger.Label>Cart</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
