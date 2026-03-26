import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Linking, // <--- Added for the Dashboard button
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/head";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface RecordItem {
  id: number;
  type: "SBAR";
  date: string;
  patient?: string;
  transcription?: string;
  full_data: {
    patient_name?: string;
    vitals?: string;
    symptoms?: string | string[];
    diagnosis?: string;
    plan?: string;
    follow_up?: string;
    [key: string]: any;
  };
}

interface ApiResponse {
  soap_history: any[];
  sbar_history: RecordItem[];
}

export default function RecordsPage() {
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);

  // UPDATE TO YOUR IP
  const API_URL = "http://192.168.0.111:8000/records/";

  const fetchRecords = async () => {
    try {
      const response = await fetch(API_URL);
      const data: ApiResponse = await response.json();

      const sorted = data.sbar_history.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      setRecords(sorted);
    } catch (error) {
      console.error("Failed to fetch records:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };
const handleOpenDashboard = async () => {
  const dashboardUrl =
    "https://lookerstudio.google.com/reporting/60ae83c3-9b9e-481a-9894-df6fbbfc9b59";
  try {
    await Linking.openURL(dashboardUrl);
  } catch (error) {
    console.error("Failed to open Dashboard URL:", error);
  }
};

const handleOpenSheet = async () => {
  const sheetUrl =
    "https://docs.google.com/spreadsheets/d/1MbyoX9ykN8cr6u7y6dmddFfdHoeqQS9rvS1gHoN7qIM/edit?gid=0#gid=0";
  try {
    await Linking.openURL(sheetUrl);
  } catch (error) {
    console.error("Failed to open Sheet URL:", error);
  }
};
  const renderItem = ({ item }: { item: RecordItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelectedRecord(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.badgeBlue}>
          <Text style={styles.textBlue}>Clinical Note</Text>
        </View>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.patient || "Unknown Patient"}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={2}>
          {item.full_data?.diagnosis
            ? `Dx: ${item.full_data.diagnosis}`
            : item.transcription || "No details available."}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#52525B"
        style={styles.arrowIcon}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.listHeader}>
        <Text style={styles.pageTitle}>Patient History</Text>
        <View style={styles.actionButtonGroup}>
          {/* Dashboard Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.dashboardBtn]}
            activeOpacity={0.8}
            onPress={handleOpenDashboard}
          >
            <Ionicons name="pie-chart" size={18} color="#F4F4F5" />
            <Text style={styles.actionBtnTextDark}>Analytics</Text>
          </TouchableOpacity>

          {/* Raw Sheet Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.sheetBtn]}
            activeOpacity={0.8}
            onPress={handleOpenSheet}
          >
            <Ionicons name="receipt" size={18} color="#F4F4F5" />
            <Text style={styles.actionBtnTextLight}>Raw Sheet</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F4F4F5" />
        </View>
      ) : (
        <FlatList
          data={records}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F4F4F5"
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No clinical records found.</Text>
            </View>
          }
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selectedRecord}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedRecord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { marginTop: insets.top + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Details</Text>
              <TouchableOpacity
                onPress={() => setSelectedRecord(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#F4F4F5" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedRecord && (
                <View style={styles.jsonContainer}>
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>PATIENT</Text>
                    <Text style={styles.infoValue}>
                      {selectedRecord.patient || "Unknown"}
                    </Text>
                  </View>

                  {Object.entries(selectedRecord.full_data || {}).map(
                    ([key, value]) => {
                      if (key === "patient_name") return null;

                      return (
                        <View key={key} style={styles.detailSection}>
                          <Text style={styles.detailLabel}>
                            {key.replace(/_/g, " ").toUpperCase()}
                          </Text>

                          {Array.isArray(value) ? (
                            <View style={styles.nestedBox}>
                              {value.map((v, i) => (
                                <Text key={i} style={styles.nestedValue}>
                                  • {v}
                                </Text>
                              ))}
                            </View>
                          ) : typeof value === "object" && value !== null ? (
                            <View style={styles.nestedBox}>
                              {Object.entries(value as object).map(([k, v]) => (
                                <Text key={k} style={styles.nestedValue}>
                                  <Text style={{ fontWeight: "bold" }}>
                                    {k}:{" "}
                                  </Text>{" "}
                                  {String(v)}
                                </Text>
                              ))}
                            </View>
                          ) : (
                            <Text style={styles.detailValue}>
                              {/* Safely convert null/undefined to strings */}
                              {value !== null && value !== undefined
                                ? String(value)
                                : "N/A"}
                            </Text>
                          )}
                        </View>
                      );
                    },
                  )}

                  <View
                    style={[
                      styles.detailSection,
                      {
                        marginTop: 20,
                        borderTopWidth: 1,
                        borderTopColor: "#27272A",
                        paddingTop: 20,
                      },
                    ]}
                  >
                    <Text style={styles.detailLabel}>ORIGINAL TRANSCRIPT</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { fontStyle: "italic", color: "#71717A" },
                      ]}
                    >
                      "{selectedRecord.transcription}"
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  actionButtonGroup: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  dashboardBtn: {
    backgroundColor: "#4c8df5dc",
    borderColor: "#646464",
  },
  sheetBtn: {
    backgroundColor: "transparent",
    borderColor: "#3F3F46",
  },
  actionBtnTextDark: {
    color: "#F4F4F5",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
  actionBtnTextLight: {
    color: "#F4F4F5",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F4F4F5",
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272A",
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badgeBlue: {
    backgroundColor: "#4c8df51c",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  textBlue: {
    color: "#4C8EF5",
    fontSize: 12,
    fontWeight: "bold",
  },
  dateText: {
    color: "#71717A",
    fontSize: 12,
  },
  cardContent: {
    paddingRight: 20,
  },
  cardTitle: {
    color: "#F4F4F5",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardSubtitle: {
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
  },
  arrowIcon: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -10,
  },
  emptyText: {
    color: "#52525B",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#09090b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
  },
  modalTitle: {
    color: "#F4F4F5",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  jsonContainer: {
    paddingBottom: 40,
  },
  infoBlock: {
    backgroundColor: "#27272A",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: "center",
  },
  infoLabel: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    color: "#F4F4F5",
    fontSize: 20,
    fontWeight: "bold",
  },
  detailSection: {
    marginBottom: 24,
  },
  detailLabel: {
    color: "#71717A",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 1,
  },
  detailValue: {
    color: "#E4E4E7",
    fontSize: 16,
    lineHeight: 24,
  },
  nestedBox: {
    backgroundColor: "#18181B",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  nestedValue: {
    color: "#F4F4F5",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 4,
  },
});
