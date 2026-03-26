import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PrompterProps {
  input: string;
  setInput: (text: string) => void;
  handleGen: () => void;
  isLoading: boolean;
  onCameraPress: () => void;
  onDocumentPress: () => void; // <--- NEW PROP
}

export default function Prompter({
  input,
  setInput,
  handleGen,
  isLoading,
  onCameraPress,
  onDocumentPress,
}: PrompterProps) {
  return (
    <View style={styles.container}>
      {/* Camera Button */}
      <TouchableOpacity onPress={onCameraPress} style={styles.iconButton}>
        <Ionicons name="camera-outline" size={24} color="#A1A1AA" />
      </TouchableOpacity>

      {/* Document Button (New) */}
      <TouchableOpacity onPress={onDocumentPress} style={styles.iconButton}>
        <Ionicons name="attach-outline" size={24} color="#A1A1AA" />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Ask MedoX..."
        placeholderTextColor="#52525B"
        value={input}
        onChangeText={setInput}
        multiline
      />

      <TouchableOpacity
        style={[styles.sendButton, !input.trim() && styles.disabledButton]}
        onPress={handleGen}
        disabled={isLoading || !input.trim()}
      >
        {isLoading ? (
          <ActivityIndicator color="#000000" size="small" />
        ) : (
          <Ionicons name="arrow-up" size={20} color="#000000" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 26,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#27272A",
    width: "100%",
  },
  iconButton: {
    padding: 8,
    marginRight: 2,
  },
  input: {
    flex: 1,
    color: "#F4F4F5",
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F4F4F5",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#3F3F46",
    opacity: 0.5,
  },
});
