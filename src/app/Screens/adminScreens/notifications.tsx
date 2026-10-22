import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { sendAdminTargetedNotification } from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import AdminHeader from "@/components/AdminHeader";

export default function AdminNotificationsScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const { actionLoading } = useAppSelector((state) => state.admin);

  const [audience, setAudience] = useState<"ALL" | "CUSTOMERS" | "VENDORS" | "DELIVERY_BOYS">("ALL");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [screenTarget, setScreenTarget] = useState("");

  const audiences = [
    { label: "Everyone (All Users)", value: "ALL", icon: "bullhorn-outline" },
    { label: "Customers Only", value: "CUSTOMERS", icon: "account-group-outline" },
    { label: "Vendors Only", value: "VENDORS", icon: "store-outline" },
    { label: "Delivery Boys Only", value: "DELIVERY_BOYS", icon: "moped" },
  ];

  const handleSendBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Validation Error", "Please provide both title and notification message body.");
      return;
    }

    Alert.alert(
      "Confirm Targeted Notification",
      `Are you sure you want to broadcast this message to "${audience}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Broadcast Now",
          onPress: async () => {
            try {
              const res = await dispatch(
                sendAdminTargetedNotification({
                  targetAudience: audience,
                  title: title.trim(),
                  body: body.trim(),
                  data: screenTarget.trim() ? { screen: screenTarget.trim() } : {},
                })
              ).unwrap();

              Alert.alert(
                "Broadcast Sent Successfully!",
                `Delivered notification to ${res?.recipientCount || "all active"} accounts via push & socket.`
              );
              setTitle("");
              setBody("");
              setScreenTarget("");
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to broadcast notification");
            }
          },
        },
      ]
    );
  };

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader title="Broadcasts" subtitle="Targeted Push & Socket Campaigns" showBack />
      <ScrollView
        style={[styles.container, { backgroundColor: bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Audience Selector Card */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.cardHeader}>
          <Feather name="users" size={scale(18)} color="#10B981" />
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Select Target Audience</Text>
        </View>

        <View style={styles.audienceGrid}>
          {audiences.map((item) => {
            const isSelected = audience === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.audiencePill,
                  { borderColor: isSelected ? "#10B981" : border },
                  isSelected && { backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "#E6F4EA" },
                ]}
                onPress={() => setAudience(item.value as any)}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={scale(18)}
                  color={isSelected ? "#10B981" : textSecondary}
                />
                <Text
                  style={[
                    styles.audienceLabel,
                    { color: isSelected ? "#10B981" : textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Message Composer Card */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.cardHeader}>
          <Feather name="edit-3" size={scale(18)} color="#10B981" />
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Compose Notification</Text>
        </View>

        <Text style={[styles.label, { color: textSecondary }]}>Notification Title *</Text>
        <TextInput
          style={[styles.input, { color: textPrimary, borderColor: border }]}
          placeholder="e.g. Flash Sale Alert! Flat 20% Off"
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: textSecondary }]}>Notification Message *</Text>
        <TextInput
          style={[styles.textArea, { color: textPrimary, borderColor: border }]}
          placeholder="Type your notification message content..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          value={body}
          onChangeText={setBody}
        />

        <Text style={[styles.label, { color: textSecondary }]}>Deep Link Screen Route (Optional)</Text>
        <TextInput
          style={[styles.input, { color: textPrimary, borderColor: border }]}
          placeholder="e.g. /(tabs)/orders or /(tabs)/cart"
          placeholderTextColor="#94A3B8"
          value={screenTarget}
          onChangeText={setScreenTarget}
        />
      </View>

      {/* Live Preview Card */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.cardHeader}>
          <Feather name="smartphone" size={scale(18)} color="#10B981" />
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Live User Push Preview</Text>
        </View>

        <View style={[styles.previewBubble, { backgroundColor: isDark ? "#10161C" : "#F1F5F9" }]}>
          <View style={styles.previewTop}>
            <View style={styles.appIconBadge}>
              <MaterialCommunityIcons name="shopping" size={scale(14)} color="#FFFFFF" />
            </View>
            <Text style={[styles.appName, { color: textSecondary }]}>BhansaMart • Now</Text>
          </View>
          <Text style={[styles.previewTitle, { color: textPrimary }]}>
            {title || "Notification Title Here"}
          </Text>
          <Text style={[styles.previewBody, { color: textSecondary }]}>
            {body || "Your broadcast announcement body will appear here in real time."}
          </Text>
        </View>
      </View>

      {/* Broadcast Action Button */}
      <TouchableOpacity
        style={[styles.sendBtn, actionLoading && { opacity: 0.6 }]}
        onPress={handleSendBroadcast}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Feather name="send" size={scale(18)} color="#FFFFFF" />
            <Text style={styles.sendBtnText}>Dispatch Broadcast Campaign</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(16),
    gap: scale(14),
    paddingBottom: scale(40),
  },
  card: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(16),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: scale(12),
  },
  cardTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
  },
  audienceGrid: {
    gap: scale(8),
  },
  audiencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  audienceLabel: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  label: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginBottom: scale(4),
    marginTop: scale(10),
  },
  input: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: moderateScale(13),
  },
  textArea: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: moderateScale(13),
    height: scale(80),
    textAlignVertical: "top",
  },
  previewBubble: {
    borderRadius: scale(10),
    padding: scale(12),
  },
  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: scale(6),
  },
  appIconBadge: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(4),
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  previewTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    marginBottom: scale(2),
  },
  previewBody: {
    fontSize: moderateScale(12),
    lineHeight: scale(16),
  },
  sendBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    paddingVertical: scale(14),
    borderRadius: scale(10),
    marginTop: scale(6),
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
});
