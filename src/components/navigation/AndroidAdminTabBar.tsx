import React from "react";
import ModernAndroidTabBar from "./ModernAndroidTabBar";
import type { BottomTabBarProps } from "expo-router/tabs";

export default function AndroidAdminTabBar(props: BottomTabBarProps) {
  return <ModernAndroidTabBar {...props} role="admin" />;
}
