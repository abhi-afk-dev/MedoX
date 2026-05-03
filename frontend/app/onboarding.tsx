import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { useFonts, Plaster_400Regular } from "@expo-google-fonts/plaster";

const ROLES = ["ANM", "GNM", "CHO", "ASHA"];

export default function OnboardingPage() {
  const router = useRouter();
  const keyboardHeight = useKeyboardHeight();

  let [fontsLoaded] = useFonts({
    Plaster_400Regular,
  });

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [district, setDistrict] = useState("");
  const [phc, setPhc] = useState("");

  const handleComplete = async () => {
    if (!name || !role || !district || !phc) {
      alert("Please fill in all details to continue.");
      return;
    }

    const userProfile = { name, role, district, phc };

    try {
      await AsyncStorage.setItem("@medox_profile", JSON.stringify(userProfile));
      await AsyncStorage.setItem("@medox_first_launch", "false");

      router.replace("/");
    } catch (error) {
      console.error("Error saving profile", error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons name="medical" size={40} color="#4C8EF5" />
          <View style={styles.logoContainer}>
            <Text style={styles.title}>Welcome to</Text>
            <Text style={styles.logoText}> Medo</Text>
            <Text style={styles.logoSymbol}>X</Text>
          </View>
          <Text style={styles.subtitle}>
            Let's set up your clinical profile.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sister Anita"
            placeholderTextColor="#52525B"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>ROLE</Text>
          <View style={styles.roleContainer}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.rolePill, role === r && styles.rolePillActive]}
                onPress={() => setRole(r)}
              >
                <Text
                  style={[styles.roleText, role === r && styles.roleTextActive]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>DISTRICT</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Hooghly"
            placeholderTextColor="#52525B"
            value={district}
            onChangeText={setDistrict}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>PHC / SUB-CENTRE</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Singur Rural Hospital"
            placeholderTextColor="#52525B"
            value={phc}
            onChangeText={setPhc}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleComplete}>
          <Text style={styles.submitButtonText}>Start Triage</Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color="#ffffff"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  scrollContent: { padding: 24, flexGrow: 1, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  title: { fontSize: 28, fontWeight: "bold", color: "#F4F4F5" },
  subtitle: { fontSize: 16, color: "#A1A1AA", marginTop: 8 },
  formGroup: { marginBottom: 24 },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#71717A",
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#18181B",
    borderWidth: 1,
    borderColor: "#27272A",
    borderRadius: 8,
    color: "#F4F4F5",
    padding: 16,
    fontSize: 16,
  },
  roleContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  rolePill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3F3F46",
    backgroundColor: "#18181B",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rolePillActive: { backgroundColor: "#4C8EF5", borderColor: "#4C8EF5" },
  roleText: { color: "#A1A1AA", fontWeight: "bold", fontSize: 14 },
  roleTextActive: { color: "#ffffff" },
  submitButton: {
    flexDirection: "row",
    backgroundColor: "#4C8EF5",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  logoText: {
    color: "#F4F4F5",
    fontSize: 38,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  logoSymbol: {
    color: "#4C8EF5",
    fontFamily: "Plaster_400Regular",
    fontSize: 64,
    fontWeight: "600",
  },
  submitButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
});
