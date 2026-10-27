const {
  withAndroidManifest,
  withGradleProperties,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * 1. Ensure android:usesCleartextTraffic="true" on <application> tag
 * Allows plain HTTP connections to the live backend server.
 */
function withCleartextTraffic(config) {
  return withAndroidManifest(config, (modConfig) => {
    const mainApplication = modConfig.modResults.manifest.application?.[0];
    if (mainApplication) {
      mainApplication.$["android:usesCleartextTraffic"] = "true";
    }
    return modConfig;
  });
}

/**
 * 2. Disable aggressive R8 fullMode in gradle.properties to prevent reflection breakage
 */
function withDisableR8FullMode(config) {
  return withGradleProperties(config, (modConfig) => {
    modConfig.modResults = modConfig.modResults.filter(
      (item) => item.key !== "android.enableR8.fullMode"
    );
    modConfig.modResults.push({
      type: "property",
      key: "android.enableR8.fullMode",
      value: "false",
    });
    return modConfig;
  });
}

/**
 * 3. Add Proguard keep rules for WorkManager and RoomDatabase in release/preview builds
 * Prevents FATAL EXCEPTION: Failed to create an instance of class androidx.work.impl.WorkDatabase
 */
function withWorkManagerProguard(config) {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const proguardPath = path.join(
        modConfig.modRequest.platformProjectRoot,
        "app",
        "proguard-rules.pro"
      );
      const rules = `
# ---- Fix for WorkManager and Room in R8 / Proguard ----
-keep class androidx.work.** { *; }
-keep class androidx.work.impl.WorkDatabase { *; }
-keep class androidx.work.impl.WorkDatabase_Impl { *; }
-keep class * extends androidx.room.RoomDatabase { *; }
-keepclassmembers class * extends androidx.room.RoomDatabase {
    <init>();
}
-dontwarn androidx.work.**
-dontwarn androidx.room.**
`;

      let currentContent = "";
      if (fs.existsSync(proguardPath)) {
        currentContent = fs.readFileSync(proguardPath, "utf-8");
      }
      if (!currentContent.includes("androidx.work.impl.WorkDatabase")) {
        fs.writeFileSync(proguardPath, currentContent + "\n" + rules, "utf-8");
      }
      return modConfig;
    },
  ]);
}

module.exports = function withAndroidFixes(config) {
  config = withCleartextTraffic(config);
  config = withDisableR8FullMode(config);
  config = withWorkManagerProguard(config);
  return config;
};
