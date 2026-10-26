import { useAppSelector } from "@/store/hooks";
import { useTheme, VENDOR_PRIMARY } from "@/theme";
import { useRouter } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { Tabs } from "expo-router/tabs";
import { useEffect } from "react";
import { Platform } from "react-native";
import ModernAndroidTabBar from "@/components/navigation/ModernAndroidTabBar";

export default function VendorTabLayout() {
  const theme = useTheme();
  const router = useRouter();
  const { isVendorAuthenticated, vendorUser, vendorDetails } = useAppSelector(
    (state) => state.vendorAuth
  );

  useEffect(() => {
    const status = (
      vendorDetails?.status ||
      vendorUser?.status ||
      ""
    ).toLowerCase();

    if (!isVendorAuthenticated) {
      router.replace("/(auth)/vendorAuth/login/vendorlogin" as any);
    } else if (status === "pending" || status === "draft") {
      router.replace({
        pathname: "/(auth)/vendorAuth/registrationProcess" as any,
        params: { step: "6" },
      });
    }
  }, [isVendorAuthenticated, vendorUser, vendorDetails, router]);

  // iOS: Keep existing native tab bar unchanged
  if (Platform.OS === "ios") {
    return (
      <NativeTabs
        tintColor={VENDOR_PRIMARY}
        indicatorColor={VENDOR_PRIMARY}
      >
        {/* DASHBOARD */}
        <NativeTabs.Trigger name="dashboard">
          <NativeTabs.Trigger.Icon sf="chart.bar.xaxis" md="dashboard" />
          <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        {/* ORDERS */}
        <NativeTabs.Trigger name="order">
          <NativeTabs.Trigger.Icon sf="bag.fill" md="shopping_bag" />
          <NativeTabs.Trigger.Label>Orders</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        {/* PRODUCTS */}
        <NativeTabs.Trigger name="product">
          <NativeTabs.Trigger.Icon sf="cube.box.fill" md="inventory_2" />
          <NativeTabs.Trigger.Label>Products</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        {/* DELIVERY */}
        <NativeTabs.Trigger name="delivery">
          <NativeTabs.Trigger.Icon sf="truck.box.fill" md="local_shipping" />
          <NativeTabs.Trigger.Label>Delivery</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        {/* TRANSACTIONS */}
        <NativeTabs.Trigger name="transaction">
          <NativeTabs.Trigger.Icon sf="creditcard.fill" md="payments" />
          <NativeTabs.Trigger.Label>Transactions</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // Android: Custom modern tab bar matching design
  return (
    <Tabs
      tabBar={(props) => (
        <ModernAndroidTabBar
          {...props}
          role="vendor"
          tintColor={VENDOR_PRIMARY}
        />
      )}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="order" />
      <Tabs.Screen name="product" />
      <Tabs.Screen name="delivery" />
      <Tabs.Screen name="transaction" />
    </Tabs>
  );
}
