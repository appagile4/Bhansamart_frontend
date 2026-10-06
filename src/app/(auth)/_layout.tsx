import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        gestureEnabled: false,
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen name="login" options={{ gestureEnabled: false }} />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="register" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="new-password" />
    </Stack>
  );
}
