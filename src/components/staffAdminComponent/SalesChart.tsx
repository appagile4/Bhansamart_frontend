import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { moderateScale, scale, useTheme } from "@/theme";

interface TimelineDay {
  _id: string; // YYYY-MM-DD
  sales: number;
  ordersCount: number;
}

interface SalesChartProps {
  data: TimelineDay[];
  title?: string;
}

export default function SalesChart({
  data = [],
  title = "7-Day Sales & Orders Trend",
}: SalesChartProps) {
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const [activeMetric, setActiveMetric] = useState<"sales" | "orders">("sales");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default today

  // Build full 7-day array
  const timeline = useMemo(() => {
    const list = [];
    const trends = data || [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel =
        i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();

      const found = trends.find((t) => t._id === dateStr);

      list.push({
        date: dateStr,
        day: dayLabel,
        dayNum: dayNum.toString(),
        sales: found ? Number(found.sales || 0) : 0,
        orders: found ? Number(found.ordersCount || 0) : 0,
      });
    }
    return list;
  }, [data]);

  const maxVal = useMemo(() => {
    if (activeMetric === "sales") {
      const max = Math.max(...timeline.map((item) => item.sales), 500);
      return max;
    } else {
      const max = Math.max(...timeline.map((item) => item.orders), 5);
      return max;
    }
  }, [timeline, activeMetric]);

  const selectedItem = timeline[selectedDayIndex] || timeline[timeline.length - 1];

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
      {/* Header with Title and Toggle */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Assigned stores scoped performance
          </Text>
        </View>

        <View style={[styles.toggleContainer, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              activeMetric === "sales" && styles.toggleBtnActive,
            ]}
            onPress={() => setActiveMetric("sales")}
          >
            <Text
              style={[
                styles.toggleText,
                { color: activeMetric === "sales" ? "#0284C7" : textSecondary },
              ]}
            >
              Sales
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              activeMetric === "orders" && styles.toggleBtnActive,
            ]}
            onPress={() => setActiveMetric("orders")}
          >
            <Text
              style={[
                styles.toggleText,
                { color: activeMetric === "orders" ? "#0284C7" : textSecondary },
              ]}
            >
              Orders
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Day Tooltip Callout */}
      {selectedItem && (
        <View style={[styles.tooltipBanner, { backgroundColor: isDark ? "#1E293B" : "#F8FAFC" }]}>
          <Text style={[styles.tooltipDate, { color: textSecondary }]}>
            {selectedItem.day}, {selectedItem.date}
          </Text>
          <Text style={[styles.tooltipValue, { color: "#0284C7" }]}>
            {activeMetric === "sales"
              ? `Rs. ${selectedItem.sales.toLocaleString()}`
              : `${selectedItem.orders} Orders`}
          </Text>
        </View>
      )}

      {/* Bar Chart Visualizer */}
      <View style={styles.chartArea}>
        {timeline.map((item, idx) => {
          const val = activeMetric === "sales" ? item.sales : item.orders;
          const ratio = maxVal > 0 ? Math.min(val / maxVal, 1) : 0;
          const barHeight = Math.max(ratio * scale(110), scale(6));
          const isSelected = selectedDayIndex === idx;

          return (
            <TouchableOpacity
              key={item.date}
              activeOpacity={0.7}
              onPress={() => setSelectedDayIndex(idx)}
              style={styles.barCol}
            >
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: barHeight,
                      backgroundColor: isSelected
                        ? "#0284C7"
                        : isDark
                        ? "rgba(2, 132, 199, 0.35)"
                        : "rgba(2, 132, 199, 0.25)",
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  {
                    color: isSelected ? "#0284C7" : textSecondary,
                    fontWeight: isSelected ? "700" : "500",
                  },
                ]}
              >
                {item.day}
              </Text>
              <Text style={[styles.numLabel, { color: textSecondary }]}>
                {item.dayNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: scale(14),
    padding: scale(14),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  title: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    marginTop: moderateScale(1),
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: scale(8),
    padding: scale(2),
  },
  toggleBtn: {
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(4),
    borderRadius: scale(6),
  },
  toggleBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
  },
  tooltipBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(6),
    borderRadius: scale(8),
    marginBottom: moderateScale(12),
  },
  tooltipDate: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  tooltipValue: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: scale(140),
    paddingTop: scale(10),
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  barTrack: {
    height: scale(110),
    width: scale(18),
    justifyContent: "flex-end",
    alignItems: "center",
  },
  barFill: {
    width: scale(14),
    borderRadius: scale(7),
  },
  dayLabel: {
    fontSize: moderateScale(10),
    marginTop: moderateScale(6),
  },
  numLabel: {
    fontSize: moderateScale(9),
    marginTop: moderateScale(1),
  },
});
