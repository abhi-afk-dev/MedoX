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

const API_BASE = "http://10.26.147.30:8000/tasks/";

const formatDisplayDate = (dateString: string) => {
  if (!dateString) return "No date";

  try {
    const dateObj = new Date(dateString.replace(" ", "T"));
    if (isNaN(dateObj.getTime())) return dateString;
    const hasTime = dateString.includes("T") || dateString.includes(":");

    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      ...(hasTime && { hour: "numeric", minute: "2-digit", hour12: true }),
    };

    const formatted = new Intl.DateTimeFormat("en-US", options).format(dateObj);
    return formatted.replace(", ", " · ");
  } catch (error) {
    return dateString;
  }
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCalendarTasks = async () => {
    try {
      const response = await fetch(API_BASE);
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
      const response = await fetch(API_BASE, {
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

    const rawReason = item.reason ? String(item.reason).trim() : "";
    const displayReason =
      rawReason.toLowerCase() === "none" ||
      rawReason.toLowerCase() === "n/a" ||
      rawReason === ""
        ? "Routine Follow-up"
        : rawReason;

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
            {displayReason}
          </Text>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={12} color="#A1A1AA" />
            <Text style={styles.dateText}>{formatDisplayDate(item.date)}</Text>
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
            ListFooterComponent={
              tasks.length > 0 ? (
                <View style={styles.footerContainer}>
                  <Text style={styles.footerIcon}>🎉</Text>
                  <Text style={styles.footerTitle}>All caught up!</Text>
                  <Text style={styles.footerSubText}>
                    No more scheduled tasks.
                  </Text>
                </View>
              ) : null
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
    justifyContent: "flex-end",
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
    marginBottom: 10,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  cardCompleted: { opacity: 0.5 },
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
    backgroundColor: "#27272A",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: { fontSize: 12, color: "#D4D4D8", marginLeft: 4 },

  emptyText: {
    color: "#A1A1AA",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },

  footerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    marginTop: 10,
    opacity: 0.8,
  },
  footerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  footerTitle: {
    color: "#F4F4F5",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerSubText: {
    color: "#71717A",
    fontSize: 14,
    marginTop: 4,
  },
});
