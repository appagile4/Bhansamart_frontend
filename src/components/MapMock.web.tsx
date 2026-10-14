import React, { forwardRef, useImperativeHandle } from "react";
import { StyleSheet, Text, View } from "react-native";

export const PROVIDER_DEFAULT = "default";
export const PROVIDER_GOOGLE = "google";

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export const Marker = ({ children, title, ...props }: any) => {
  return <View {...props}>{children}</View>;
};

export const Polyline = (props: any) => null;
export const Polygon = (props: any) => null;
export const Circle = (props: any) => null;
export const Callout = ({ children, ...props }: any) => (
  <View {...props}>{children}</View>
);

const MapView = forwardRef<any, any>(
  ({ style, children, initialRegion, ...props }, ref) => {
    useImperativeHandle(ref, () => ({
      fitToCoordinates: () => {},
      animateToRegion: () => {},
      fitToSuppliedMarkers: () => {},
      getCamera: async () => ({}),
      setCamera: () => {},
    }));

    return (
      <View style={[styles.container, style]}>
        <View style={styles.content}>
          <Text style={styles.text}>🗺️ Map preview available on mobile app</Text>
        </View>
        {children}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  content: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
});

export default MapView;
