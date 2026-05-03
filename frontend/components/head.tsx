import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFonts, Plaster_400Regular } from "@expo-google-fonts/plaster";
import { useRouter, usePathname } from "expo-router";

const { width } = Dimensions.get("window");

const MENU_ITEMS = [
  { title: "Dashboard", icon: "home", route: "/" },
  { title: "AI Assistant", icon: "chatbubbles", route: "/chat" },
  { title: "Voice Scribe", icon: "mic", route: "/voice" },
  { title: "Records", icon: "receipt", route: "/records" },
  { title: "Tasks", icon: "calendar", route: "/tasks" },
  { title: "Stock", icon: "cube", route: "/stock" },
];

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  let [fontsLoaded] = useFonts({
    Plaster_400Regular,
  });

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showSettingsOverlay ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [showSettingsOverlay]);

  const toggleSettings = () => {
    setShowSettingsOverlay(!showSettingsOverlay);
  };

  const handleNavigation = (route: string) => {
    toggleSettings();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  const getHeaderContent = () => {
    switch (pathname) {
      case "/":
        return {
          title: "Medo",
          symbol: "X",
          // subtitle: "Public Health Command Center",
        };
      case "/chat":
        return {
          title: "Medo",
          symbol: "X",
          title2: "  AI",
          // subtitle: "MedGemma",
          subtitle2: "powered by MedGemma",
        };
      case "/voice":
        return {
          title: "Voice Scribe",
          symbol: "",
          subtitle: "Whisper SBAR Generator",
        };
      case "/records":
        return {
          title: "Patient Records",
          symbol: "",
          subtitle: "Encrypted History & DISTRICT TRACKING",
        };
      case "/tasks":
        return {
          title: "Community Tasks",
          symbol: "",
          subtitle: "Google Calendar Sync",
        };
      case "/stock":
        return {
          title: "PHC Inventory",
          symbol: "",
          subtitle: "Live PHC Stock Sheet",
        };
      default:
        return { title: "Medo", symbol: "X", subtitle: "Medical Assistant" };
    }
  };

  const { title, title2, symbol, subtitle, subtitle2 } = getHeaderContent();

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [width, 0],
  });

  const pointerEvents = showSettingsOverlay ? "auto" : "none";

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
        {/* Dynamic Header Left Section */}
        <TouchableOpacity
          style={styles.headerLeftContainer}
          onPress={() => router.push("/")}
          activeOpacity={0.7}
        >
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>{title}</Text>
            {symbol ? <Text style={styles.logoSymbol}>{symbol}</Text> : null}
            {title2 ? <Text style={styles.pageTitle}>{title2}</Text> : null}
          </View>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            {subtitle ? (
              <Text style={styles.pageSubtitle}>{subtitle}</Text>
            ) : null}
            {subtitle2 ? (
              <Text style={styles.pageSubtitle2}>{subtitle2}</Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleSettings} style={styles.iconButton}>
          <Ionicons name="reorder-three-outline" size={28} color="#F4F4F5" />
        </TouchableOpacity>
      </View>

      <Animated.View
        pointerEvents={pointerEvents}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <TouchableOpacity
          style={styles.backdropClick}
          onPress={toggleSettings}
        />
      </Animated.View>

      <Animated.View
        style={[styles.slideMenu, { transform: [{ translateX }] }]}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Menu</Text>
        </View>

        <View style={styles.menuItems}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.route)}
            >
              <View style={styles.menuNav}>
                <Ionicons name={item.icon as any} size={20} color="#E4E4E7" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#52525B" />
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default Header;

const styles = StyleSheet.create({
  safeArea: { backgroundColor: "#09090b", zIndex: 50 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
    backgroundColor: "#09090b",
    zIndex: 60,
  },
  headerLeftContainer: {
    flexDirection: "column",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  pageTitle: {
    color: "#F4F4F5",
    fontWeight: "600",
    fontSize: 24,
    letterSpacing: 0.5,
  },
  logoSymbol: {
    color: "#4C8EF5",
    fontFamily: "Plaster_400Regular",
    fontSize: 32,
    fontWeight: "600",
  },
  pageSubtitle: {
    color: "#71717A",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  pageSubtitle2: {
    color: "#4C8EF5",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  iconButton: { padding: 4 },
  menuNav: { flexDirection: "row", gap: 15 },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 90,
    height: Dimensions.get("window").height,
  },
  backdropClick: { flex: 1 },
  slideMenu: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "75%",
    height: Dimensions.get("window").height,
    backgroundColor: "#18181B",
    zIndex: 100,
    borderLeftWidth: 1,
    borderLeftColor: "#27272A",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  menuTitle: { fontSize: 20, fontWeight: "600", color: "#F4F4F5" },
  menuItems: { gap: 8 },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
  },
  menuItemText: { fontSize: 16, color: "#E4E4E7", fontWeight: "500" },
});
