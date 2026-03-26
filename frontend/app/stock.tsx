import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/head";

const API_URL = "http://192.168.0.111:8000/inventory/";

export default function StockPage() {
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (data.inventory) {
        setStock(data.inventory);
      }
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const updateQuantity = async (
    id: string,
    currentQty: number,
    change: number,
  ) => {
    const newQty = currentQty + change;
    if (newQty < 0) return; 

    setUpdatingId(id);
    try {
      setStock((prev) =>
        prev.map((item) =>
          item.id == id ? { ...item, quantity: newQty } : item,
        ),
      );

      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, quantity: newQty }),
      });
    } catch (error) {
      console.error("Failed to update quantity", error);
      setStock((prev) =>
        prev.map((item) =>
          item.id == id ? { ...item, quantity: currentQty } : item,
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isLow = item.quantity <= item.threshold;
    const isUpdating = updatingId == item.id;

    return (
      <View style={[styles.card, isLow && styles.cardLow]}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrapper}>
            <Ionicons
              name={item.type}
              size={24}
              color={isLow ? "#EF4444" : "#A1A1AA"}
            />
          </View>

          <View style={styles.textWrapper}>
            <Text style={styles.itemName}>{item.name}</Text>
            {isLow && <Text style={styles.alertText}>Restock Needed</Text>}
          </View>

          <View style={styles.actionArea}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => updateQuantity(item.id, item.quantity, -1)}
              disabled={isUpdating}
            >
              <Ionicons name="remove" size={18} color="#F4F4F5" />
            </TouchableOpacity>

            <View style={styles.quantityWrapper}>
              {isUpdating ? (
                <ActivityIndicator
                  size="small"
                  color="#F4F4F5"
                  style={{ marginVertical: 4 }}
                />
              ) : (
                <Text
                  style={[styles.quantityText, isLow && { color: "#EF4444" }]}
                >
                  {item.quantity}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => updateQuantity(item.id, item.quantity, 1)}
              disabled={isUpdating}
            >
              <Ionicons name="add" size={18} color="#F4F4F5" />
            </TouchableOpacity>
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
          <Text style={styles.pageTitle}>PHC Inventory</Text>
          <TouchableOpacity style={styles.syncButton} onPress={fetchInventory}>
            <Ionicons name="sync" size={16} color="#09090b" />
            <Text style={styles.syncText}>Sync Sheets</Text>
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
            data={stock}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
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
    marginBottom: 20,
  },
  pageTitle: { fontSize: 24, fontWeight: "bold", color: "#F4F4F5" },
  syncButton: {
    flexDirection: "row",
    backgroundColor: "#F4F4F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: "center",
  },
  syncText: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#09090b",
    marginLeft: 4,
  },

  card: {
    backgroundColor: "#27272A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#3F3F46",
  },
  cardLow: {
    borderColor: "#EF4444",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#18181B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textWrapper: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "bold", color: "#F4F4F5" },
  alertText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 2,
    fontWeight: "bold",
  },

  actionArea: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3F3F46",
  },
  actionButton: { padding: 8, justifyContent: "center", alignItems: "center" },
  quantityWrapper: {
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: { fontSize: 18, fontWeight: "bold", color: "#F4F4F5" },
});
