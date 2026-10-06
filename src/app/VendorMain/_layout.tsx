import { useAppSelector } from "@/store/hooks";
import { useTheme, VENDOR_PRIMARY } from "@/theme";
import { useRouter } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useEffect } from "react";

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
