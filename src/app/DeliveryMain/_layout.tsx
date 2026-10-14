import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  initializeDeliveryAuth,
  setIncomingOffer,
} from "@/store/slices/deliverySlice";
import socketService from "@/store/services/socketService";
import { useRouter } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useEffect } from "react";
import { Alert } from "react-native";

const DELIVERY_PRIMARY = "#0F766E";

export default function DeliveryTabLayout() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.delivery,
  );

  useEffect(() => {
    dispatch(initializeDeliveryAuth());
  }, [dispatch]);

  // Auth gate
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/(auth)/deliveryAuth/login" as any);
    }
  }, [isInitialized, isAuthenticated, router]);

  // Connect Delivery Socket & Listen for Incoming Orders (45s window)
  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect("delivery").then(() => {
        console.log("[Delivery Layout] Socket connected for delivery partner");
      });

      const unsubscribe = socketService.onDeliveryOrderRequest((offer) => {
        dispatch(setIncomingOffer(offer));
      });

      return () => {
        unsubscribe();
      };
    }
  }, [isAuthenticated, dispatch]);

  return (
    <NativeTabs tintColor={DELIVERY_PRIMARY} indicatorColor={DELIVERY_PRIMARY}>
      {/* 1. DASHBOARD & ACTIVE ORDERS */}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="bicycle" md="moped" />
        <NativeTabs.Trigger.Label>Deliveries</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* 2. EARNINGS & SECURITY DEPOSIT */}
      <NativeTabs.Trigger name="wallet">
        <NativeTabs.Trigger.Icon sf="banknote" md="account_balance_wallet" />
        <NativeTabs.Trigger.Label>Earnings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* 3. PROFILE & KYC DOCUMENTS */}
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
        <NativeTabs.Trigger.Label>Profile & KYC</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
