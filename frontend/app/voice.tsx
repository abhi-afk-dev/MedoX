import React, { useState, useRef, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Animated, // <--- Using Standard Animated
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/head";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  isThinking?: boolean;
}

export default function VoiceInterfacePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const waveScale = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingStartTime = useRef<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();

  const API_URL = "http://192.168.0.111:8000/audio/";

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== "granted")
          Alert.alert("Permission needed", "Microphone required.");

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.log("Audio Init Error:", e);
      }
    })();

    return () => {
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync();
    };
  }, []);

  const updateMetering = (status: Audio.RecordingStatus) => {
    if (status.metering) {
      // Metering is -160 (quiet) to 0 (loud)
      const level = status.metering;
      // Normalize to scale between 1 and 1.5
      const targetScale = Math.max(1, 1 + (level + 50) / 20);

      // Smoothly animate to the new scale
      Animated.timing(waveScale, {
        toValue: targetScale,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const startRecording = async () => {
    try {
      if (recordingRef.current) return;

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        updateMetering, // The callback
        100, // Update every 100ms
      );

      recordingRef.current = recording;
      recordingStartTime.current = Date.now();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    const duration = Date.now() - recordingStartTime.current;
    setIsRecording(false);

    // Reset wave
    Animated.timing(waveScale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (duration < 1000) {
        Alert.alert("Too Short", "Hold the button to record.");
        return;
      }
      if (uri) handleVoiceSend(uri);
    } catch (error) {
      console.log("Error stopping recording:", error);
      recordingRef.current = null;
    }
  };

  const handleVoiceSend = async (uri: string) => {
    setIsLoading(true);
    const tempId = Date.now().toString();
    const thinkingId = "thinking-" + tempId;

    setMessages((prev) => [
      ...prev,
      { id: tempId, text: "🎤 Audio Sent", sender: "user" },
      { id: thinkingId, text: "Analyzing...", sender: "bot", isThinking: true },
    ]);

    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append("audio", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        name: "voice.wav",
        type: "audio/wav",
      });

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const data = await response.json();
      processResponse(data, thinkingId);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to upload audio.");
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
    } finally {
      setIsLoading(false);
    }
  };

  const processResponse = (data: any, thinkingId: string) => {
    if (data.reply) {
      let displayText = "Record Saved.";

      if (typeof data.reply === "object") {
        const patient = data.reply.patient_name || "Unknown";
        const diagnosis = data.reply.diagnosis || "No diagnosis";
        displayText = `✅ Record Saved!\n\nPatient: ${patient}\nDiagnosis: ${diagnosis}\n\n(View full details in Records tab)`;
      } else {
        displayText = String(data.reply);
      }

      const botMsg: Message = {
        id: Date.now().toString(),
        text: displayText,
        sender: "bot",
        isThinking: false,
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === thinkingId ? botMsg : msg)),
      );
    }
  };

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.sender === "user" ? styles.userBubble : styles.botBubble,
            ]}
          >
            {msg.isThinking ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator
                  size="small"
                  color="#A1A1AA"
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.botText, { fontStyle: "italic" }]}>
                  {msg.text}
                </Text>
              </View>
            ) : (
              <Text
                style={msg.sender === "user" ? styles.userText : styles.botText}
              >
                {msg.text}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.prompterWrapper}>
        <View style={styles.waveContainer}>
          {/* THE WAVE RING */}
          {isRecording && (
            <Animated.View
              style={[
                styles.waveRing,
                { transform: [{ scale: waveScale }] }, // Connect Animated Value
              ]}
            />
          )}

          <TouchableOpacity
            style={[styles.micButton, isRecording && styles.micButtonActive]}
            activeOpacity={0.8}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            disabled={isLoading}
          >
            <Ionicons
              name={isRecording ? "mic" : "mic-outline"}
              size={40}
              color={isLoading ? "#52525b" : "#F4F4F5"}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.hintText}>
          {isRecording ? "Listening..." : "Hold to Record"}
        </Text>
      </View>
      <View style={{ height: keyboardHeight }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  chatContainer: { flex: 1 },
  chatContent: { padding: 20, paddingBottom: 40 },

  bubble: { padding: 14, borderRadius: 18, marginVertical: 6, maxWidth: "85%" },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#27272A",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#27272A",
    borderBottomLeftRadius: 4,
  },

  userText: { color: "#F4F4F5", fontSize: 16 },
  botText: { color: "#D4D4D8", fontSize: 16, lineHeight: 22 },

  prompterWrapper: {
    width: "100%",
    paddingBottom: 40,
    alignItems: "center",
    backgroundColor: "#09090b",
  },
  waveContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  waveRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(220, 38, 38, 0.4)", // Slightly stronger Red
    zIndex: 0,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4C8EF5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3F3F46",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: "#DC2626",
    borderColor: "#EF4444",
  },
  hintText: {
    color: "#4C8EF5",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "bold",
  },
});
