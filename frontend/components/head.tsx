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
import { useRouter } from "expo-router"; 

const { width } = Dimensions.get("window");

const MENU_ITEMS = [
  { title: "Home", icon: "home", route: "/" },
  { title: "Transcribing", icon: "mic", route: "/voice" },
  { title: "Records", icon: "receipt", route: "/records" },
  { title: "Tasks", icon: "calendar", route: "/tasks" },
  { title: "Stock", icon: "cube", route: "/stock" },
  // { title: "Account", route: "/account" },
  // { title: "Log Out", route: "logout" },
];

const Header = () => {
  const router = useRouter(); 
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
      if (route === "logout") {
        console.log("Handle Logout Logic Here");
        // router.replace('/login');
      } else {
        router.push(route as any);
      }
    }, 100);
  };

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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.logoText}>Medo</Text>
          <Text style={styles.logoSymbol}>X</Text>
        </View>

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
          <Text style={styles.menuTitle}>Settings</Text>
          {/* <TouchableOpacity onPress={toggleSettings}>
            <Ionicons name="close" size={24} color="#F4F4F5" />
          </TouchableOpacity> */}
        </View>

        <View style={styles.menuItems}>
          {MENU_ITEMS.map((item, index) => (
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
  safeArea: {
    backgroundColor: "#09090b",
    zIndex: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
    backgroundColor: "#09090b",
    zIndex: 60,
  },
  menuNav: {
    flexDirection: "row",
    gap:15
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  logoSymbol: {
    color: "#4C8EF5",
    fontFamily: "Plaster_400Regular",
    fontSize: 40,
    fontWeight: "600",
  },
  logoText: {
    color: "#F4F4F5",
    fontWeight: "500",
    fontSize: 24,
    letterSpacing: 0.5,
  },
  iconButton: {
    padding: 4,
  },
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
  backdropClick: {
    flex: 1,
  },
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
  menuTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F4F4F5",
  },
  menuItems: {
    gap: 8,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
  },
  menuItemText: {
    fontSize: 16,
    color: "#E4E4E7",
    fontWeight: "500",
  },
});
