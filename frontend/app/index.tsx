import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Redirect } from "expo-router"; // <-- Added Redirect
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../components/head";

// UPDATE TO YOUR LOCAL IP
// const API_BASE = "http://192.168.0.111:8000";
const API_BASE = "http://10.26.147.30:8000";

export default function DashboardPage() {
  const router = useRouter();

  // App State
  const [isInitializing, setIsInitializing] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // Data State
  const [profile, setProfile] = useState({
    name: "",
    role: "",
    district: "",
    phc: "",
  });
  const [stats, setStats] = useState({ patients: 0, tasks: 0, lowStock: 0 });
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  // Animation refs
  const welcomeAnim = useRef(new Animated.Value(0)).current;
  const summaryAnim = useRef(new Animated.Value(0)).current;
  const alertAnim = useRef(new Animated.Value(0)).current;
  const quickAnim = useRef(new Animated.Value(0)).current;

  const welcomeTY = welcomeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const summaryTY = summaryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const alertTX = alertAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const quickTY = quickAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  const runEntranceAnimations = () => {
    Animated.stagger(80, [
      Animated.timing(welcomeAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(summaryAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(alertAnim, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.timing(quickAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 1. Check Onboarding & Load Profile FIRST
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem("@medox_first_launch");

        if (hasLaunched !== "false") {
          // Send them to onboarding instantly
          setNeedsOnboarding(true);
          setIsInitializing(false);
          return;
        }

        // If they have onboarded, grab their profile
        const profileString = await AsyncStorage.getItem("@medox_profile");
        if (profileString) {
          setProfile(JSON.parse(profileString));
        }

        // Proceed to load dashboard data
        await fetchDashboardData();
      } catch (error) {
        console.error("Init Error", error);
        setNeedsOnboarding(true);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  // Fire animations once stats finish loading
  useEffect(() => {
    if (!loadingStats) {
      runEntranceAnimations();
    }
  }, [loadingStats]);

  // 2. Safely Fetch Backend Stats
  const fetchDashboardData = async () => {
    setLoadingStats(true);
    try {
      const [recordsRes, tasksRes, inventoryRes] = await Promise.all([
        fetch(`${API_BASE}/records/`).catch(() => null),
        fetch(`${API_BASE}/tasks/`).catch(() => null),
        fetch(`${API_BASE}/inventory/`).catch(() => null),
      ]);

      let patientCount = 0;
      let taskCount = 0;
      let lowItems: any[] = [];

      if (recordsRes && recordsRes.ok) {
        try {
          const recordsData = await recordsRes.json();
          patientCount = Array.isArray(recordsData.sbar_history)
            ? recordsData.sbar_history.length
            : 0;
        } catch (e) {
          console.log("Records Parse Error", e);
        }
      }

      if (tasksRes && tasksRes.ok) {
        try {
          const tasksData = await tasksRes.json();
          const pendingTasks = Array.isArray(tasksData.tasks)
            ? tasksData.tasks.filter((t: any) => t.status === "pending")
            : [];
          taskCount = pendingTasks.length;
        } catch (e) {
          console.log("Tasks Parse Error", e);
        }
      }

      if (inventoryRes && inventoryRes.ok) {
        try {
          const invData = await inventoryRes.json();
          const items = Array.isArray(invData.inventory)
            ? invData.inventory
            : [];
          lowItems = items.filter((item: any) => parseInt(item.quantity) < 20);
        } catch (e) {
          console.log("Inventory Parse Error", e);
        }
      }

      setStats({
        patients: patientCount,
        tasks: taskCount,
        lowStock: lowItems.length,
      });
      setLowStockItems(lowItems.slice(0, 3));
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const QUICK_ACTIONS = [
    {
      title: "AI Assistant",
      icon: "chatbubbles-outline",
      route: "/chat",
      color: "#4C8EF5",
    },
    {
      title: "Voice Scribe",
      icon: "mic-outline",
      route: "/voice",
      color: "#10B981",
    },
    {
      title: "Records",
      icon: "folder-outline",
      route: "/records",
      color: "#F59E0B",
    },
    {
      title: "Calendar",
      icon: "calendar-outline",
      route: "/tasks",
      color: "#8B5CF6",
    },
    {
      title: "Inventory",
      icon: "medkit-outline",
      route: "/stock",
      color: "#EF4444",
    },
  ];

  // --- SAFE ROUTING GATEWAYS ---
  if (isInitializing) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#4C8EF5" />
      </View>
    );
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome section */}
        <Animated.View
          style={[
            styles.welcomeSection,
            { opacity: welcomeAnim, transform: [{ translateY: welcomeTY }] },
          ]}
        >
          <View
            style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}
          >
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.nameText}>{profile.name || "Nurse"} 👋</Text>
          </View>
          <View style={styles.locationBadge}>
            <Ionicons name="location" size={14} color="#A1A1AA" />
            <Text style={styles.locationText}>
              {profile.role} • {profile.phc}, {profile.district}
            </Text>
          </View>
        </Animated.View>

        {loadingStats ? (
          <ActivityIndicator size="large" color="#4C8EF5" />
        ) : (
          <View style={{ flexDirection: "column", gap: 10 }}>
            {/* Stats card */}
            <Animated.View
              style={[
                styles.statsSection,
                {
                  opacity: summaryAnim,
                  transform: [{ translateY: summaryTY }],
                },
              ]}
            >
              <Text style={styles.sectionTitle}>Today's Summary</Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.patients}</Text>
                  <Text style={styles.statLabel}>Records</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: "#F59E0B" }]}>
                    {stats.tasks}
                  </Text>
                  <Text style={styles.statLabel}>Follow-ups</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: "#EF4444" }]}>
                    {stats.lowStock}
                  </Text>
                  <Text style={styles.statLabel}>Low Stock</Text>
                </View>
              </View>
            </Animated.View>

            {/* Alert card */}
            {lowStockItems.length > 0 && (
              <Animated.View
                style={[
                  styles.alertCard,
                  { opacity: alertAnim, transform: [{ translateX: alertTX }] },
                ]}
              >
                <View style={styles.alertHeader}>
                  <Ionicons name="warning" size={20} color="#EF4444" />
                  <Text style={styles.alertTitle}>Restock Required</Text>
                </View>
                {lowStockItems.map((item, index) => (
                  <View key={index} style={styles.alertItem}>
                    <Text style={styles.alertItemName}>{item.name}</Text>
                    <Text style={styles.alertItemQty}>
                      Qty: {item.quantity}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* Quick access grid */}
            <Animated.View
              style={[
                { flexDirection: "column", gap: 10 },
                { opacity: quickAnim, transform: [{ translateY: quickTY }] },
              ]}
            >
              <Text style={styles.sectionTitle}>Quick Access</Text>
              <View style={styles.gridContainer}>
                {QUICK_ACTIONS.map((action, index) => {
                  const isFirst = index === 0;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.gridBtn, isFirst && styles.gridBtnFull]}
                      activeOpacity={0.7}
                      onPress={() => router.push(action.route as any)}
                    >
                      <View
                        style={[
                          styles.iconWrapper,
                          { backgroundColor: `${action.color}20` },
                          isFirst && { marginBottom: 0, marginRight: 16 },
                        ]}
                      >
                        <Ionicons
                          name={action.icon as any}
                          size={isFirst ? 28 : 24}
                          color={action.color}
                        />
                      </View>
                      <Text
                        style={[
                          styles.gridBtnText,
                          isFirst && { fontSize: 18 },
                        ]}
                      >
                        {action.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  welcomeSection: { marginBottom: 30 },
  greeting: { fontSize: 32, color: "#A1A1AA" },
  nameText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#F4F4F5",
    marginTop: 4,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#18181B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#27272A",
  },
  locationText: {
    color: "#A1A1AA",
    fontSize: 13,
    marginLeft: 6,
    fontWeight: "500",
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#949494" },
  statsSection: {
    backgroundColor: "#121213",
    padding: 30,
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#353535",
  },
  statsRow: { flexDirection: "row", gap: 16, justifyContent: "space-between" },
  statBox: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingVertical: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#000000",
    alignItems: "center",
  },
  statNumber: { fontSize: 28, fontWeight: "bold", color: "#4C8EF5" },
  statLabel: {
    fontSize: 12,
    color: "#71717A",
    marginTop: 4,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  alertCard: {
    backgroundColor: "#ef444410",
    borderWidth: 1,
    borderColor: "#ef444440",
    borderRadius: 12,
    padding: 16,
  },
  alertHeader: { flexDirection: "row", alignItems: "center" },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#EF4444",
    marginLeft: 8,
  },
  alertItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#ef444420",
  },
  alertItemName: { color: "#F4F4F5", fontSize: 15 },
  alertItemQty: { color: "#EF4444", fontWeight: "bold", fontSize: 15 },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "space-between",
  },
  gridBtn: {
    width: "46%",
    backgroundColor: "#121213",
    paddingVertical: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#353535",
    alignItems: "center",
  },
  gridBtnFull: {
    width: "100%",
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: "flex-start",
  },
  iconWrapper: { padding: 12, borderRadius: 12, marginBottom: 12 },
  gridBtnText: { color: "#F4F4F5", fontSize: 14, fontWeight: "600" },
});
