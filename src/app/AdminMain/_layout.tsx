import { useAppSelector } from "@/store/hooks";
import { useTheme } from "@/theme";
import { useRouter } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useEffect } from "react";

export default function AdminTabLayout() {
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated, isInitialized, user } = useAppSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.replace("/(auth)/admin-login" as any);
      } else if (user?.role === "admin") {
        router.replace("/StaffAdminMain" as any);
      } else if (user?.role !== "superadmin") {
        router.replace("/(auth)/login" as any);
      }
    }
  }, [isInitialized, isAuthenticated, user, router]);

  const primaryColor = theme.colors.primary || "#0284C7";

  return (
    <NativeTabs tintColor={primaryColor} indicatorColor={primaryColor}>
      {/* DASHBOARD */}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* VENDORS */}
      <NativeTabs.Trigger name="vendors">
        <NativeTabs.Trigger.Icon sf="storefront.fill" md="storefront" />
        <NativeTabs.Trigger.Label>Vendors</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* CATALOG */}
      <NativeTabs.Trigger name="catalog">
        <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" md="grid_view" />
        <NativeTabs.Trigger.Label>Catalog</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* FINANCE (Platform Ledger & 1.5% Commission) */}
      <NativeTabs.Trigger name="finance">
        <NativeTabs.Trigger.Icon sf="creditcard.fill" md="payments" />
        <NativeTabs.Trigger.Label>Finance</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* PROFILE (Admin Info & Logout) */}
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
