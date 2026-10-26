import React, { useEffect } from "react";
import { Platform } from "react-native";
import { useAppSelector } from "@/store/hooks";
import { useTheme } from "@/theme";
import { useRouter } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { Tabs } from "expo-router/tabs";
import ModernAndroidTabBar from "@/components/navigation/ModernAndroidTabBar";

export default function StaffAdminTabLayout() {
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated, isInitialized, user } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.replace("/(auth)/admin-login" as any);
      } else if (user?.role !== "admin" && user?.role !== "superadmin") {
        router.replace("/(auth)/login" as any);
      }
    }
  }, [isInitialized, isAuthenticated, user, router]);

  const primaryColor = "#0284C7";

  // iOS: Keep existing native tab bar unchanged
  if (Platform.OS === "ios") {
    return (
      <NativeTabs tintColor={primaryColor} indicatorColor={primaryColor}>
        {/* 1. DASHBOARD */}
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" md="dashboard" />
          <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        {/* 2. ASSIGNED VENDORS */}
        <NativeTabs.Trigger name="vendors">
          <NativeTabs.Trigger.Icon sf="storefront.fill" md="storefront" />
          <NativeTabs.Trigger.Label>Vendors</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        {/* 3. OPERATIONS HUB (Refunds, Brands, Withdrawals, Tickets) */}
        <NativeTabs.Trigger name="operations">
          <NativeTabs.Trigger.Icon sf="tray.2.fill" md="assignment" />
          <NativeTabs.Trigger.Label>Operations</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        {/* 4. DELIVERIES & COD */}
        <NativeTabs.Trigger name="deliveries">
          <NativeTabs.Trigger.Icon sf="shippingbox.fill" md="local_shipping" />
          <NativeTabs.Trigger.Label>Fleet & COD</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        {/* 5. PROFILE & ACCESS */}
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="person" />
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
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
          role="staff"
          tintColor={primaryColor}
        />
      )}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="vendors" />
      <Tabs.Screen name="operations" />
      <Tabs.Screen name="deliveries" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
