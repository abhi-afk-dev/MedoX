import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/head";

// REPLACE WITH YOUR BACKEND IP
const API_URL = "http://192.168.0.111:8000/tasks/";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCalendarTasks = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error("Failed to fetch tasks from calendar:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCalendarTasks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCalendarTasks();
  };

  const toggleTaskStatus = async (id: string) => {
    const taskToToggle = tasks.find((t) => t.id === id);
    if (!taskToToggle) return;

    const newStatus =
      taskToToggle.status === "completed" ? "pending" : "completed";

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, status: newStatus } : task,
      ),
    );

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, status: newStatus }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
    } catch (error) {
      console.error("Failed to sync task status", error);
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, status: taskToToggle.status } : task,
        ),
      );
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === "completed";

    return (
      <View style={[styles.card, isCompleted && styles.cardCompleted]}>
        <View style={styles.cardLeft}>
          <TouchableOpacity
            style={[styles.checkbox, isCompleted && styles.checkboxChecked]}
            onPress={() => toggleTaskStatus(item.id)}
            activeOpacity={0.7}
          >
            {isCompleted && (
              <Ionicons name="checkmark" size={16} color="#09090b" />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.cardRight}>
          <Text
            style={[styles.patientName, isCompleted && styles.textCompleted]}
          >
            {item.patient}
          </Text>
          <Text
            style={[styles.reasonText, isCompleted && styles.textCompleted]}
          >
            {item.reason}
          </Text>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={12} color="#A1A1AA" />
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Community Visits</Text>
            <Text style={styles.subtitle}>
              Auto-synced from Google Calendar
            </Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Ionicons name="sync" size={20} color="#F4F4F5" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#F4F4F5"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#F4F4F5"
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No upcoming follow-ups scheduled.
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageTitle: { fontSize: 24, fontWeight: "bold", color: "#F4F4F5" },
  subtitle: { fontSize: 14, color: "#10B981", marginTop: 4, fontWeight: "500" },
  refreshBtn: {
    padding: 8,
    backgroundColor: "#18181B",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27272A",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#27272A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardCompleted: { opacity: 0.6 },
  cardLeft: { marginRight: 16, justifyContent: "center" },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#71717A",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: { backgroundColor: "#10B981", borderColor: "#10B981" },

  cardRight: { flex: 1 },
  patientName: { fontSize: 18, fontWeight: "bold", color: "#F4F4F5" },
  reasonText: { fontSize: 14, color: "#D4D4D8", marginTop: 2, marginBottom: 8 },
  textCompleted: { textDecorationLine: "line-through", color: "#71717A" },

  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: { fontSize: 12, color: "#A1A1AA", marginLeft: 4 },
  emptyText: {
    color: "#A1A1AA",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
});
