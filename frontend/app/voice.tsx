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
  Animated,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/head";
import Markdown from "react-native-markdown-display";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

const PIPELINE_STEPS = [
  {
    id: "whisper",
    label: "Whisper transcribing audio",
    icon: "mic-outline",
    color: "#4C8EF5",
  },
  {
    id: "medgemma",
    label: "MedGemma extracting SBAR",
    icon: "medkit-outline",
    color: "#10B981",
  },
  {
    id: "sheets",
    label: "Updating Google Sheets",
    icon: "analytics-outline",
    color: "#F59E0B",
  },
  {
    id: "calendar",
    label: "Scheduling Calendar follow-up",
    icon: "calendar-outline",
    color: "#8B5CF6",
  },
];

type StepStatus = "waiting" | "active" | "done";

interface PipelineState {
  whisper: StepStatus;
  medgemma: StepStatus;
  sheets: StepStatus;
  calendar: StepStatus;
}

function PipelineCard({ pipeline }: { pipeline: PipelineState }) {
  return (
    <View style={pipelineStyles.card}>
      <Text style={pipelineStyles.title}>Processing pipeline</Text>
      {PIPELINE_STEPS.map((step) => {
        const status = pipeline[step.id as keyof PipelineState];
        return (
          <View key={step.id} style={pipelineStyles.row}>
            {status === "done" ? (
              <View
                style={[
                  pipelineStyles.iconWrap,
                  { backgroundColor: "#10B98120" },
                ]}
              >
                <Ionicons name="checkmark" size={14} color="#10B981" />
              </View>
            ) : status === "active" ? (
              <View
                style={[
                  pipelineStyles.iconWrap,
                  { backgroundColor: `${step.color}20` },
                ]}
              >
                <ActivityIndicator size={12} color={step.color} />
              </View>
            ) : (
              <View
                style={[
                  pipelineStyles.iconWrap,
                  { backgroundColor: "#27272A" },
                ]}
              >
                <Ionicons name={step.icon as any} size={12} color="#52525B" />
              </View>
            )}
            <Text
              style={[
                pipelineStyles.label,
                status === "done" && { color: "#10B981" },
                status === "active" && { color: step.color },
                status === "waiting" && { color: "#52525B" },
              ]}
            >
              {step.label}
              {status === "active" ? "..." : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const pipelineStyles = StyleSheet.create({
  card: {
    backgroundColor: "#121213",
    borderWidth: 1,
    borderColor: "#27272A",
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginVertical: 6,
    maxWidth: "85%",
    alignSelf: "flex-start",
  },
  title: {
    color: "#52525B",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 13, fontWeight: "500" },
});
// ─────────────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  isThinking?: boolean;
  isPipeline?: boolean;
  pipeline?: PipelineState;
  actions?: { icon: string; text: string; color: string }[];
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

  const API_BASE = "http://10.26.147.30:8000/audio/";

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
      const level = status.metering;
      const targetScale = Math.max(1, 1 + (level + 50) / 20);

      Animated.timing(waveScale, {
        toValue: targetScale,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  // ── Pipeline helper ──────────────────────────────────────────────────────
  const updatePipeline = (pipelineId: string, next: Partial<PipelineState>) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === pipelineId && msg.isPipeline
          ? { ...msg, pipeline: { ...msg.pipeline!, ...next } }
          : msg,
      ),
    );
  };
  // ─────────────────────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      if (recordingRef.current) return;

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        updateMetering,
        100,
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
    const pipelineId = "pipeline-" + tempId;

    setMessages((prev) => [
      ...prev,
      { id: tempId, text: "🎤 Audio Sent", sender: "user" },
      {
        id: pipelineId,
        text: "",
        sender: "bot",
        isPipeline: true,
        pipeline: {
          whisper: "active",
          medgemma: "waiting",
          sheets: "waiting",
          calendar: "waiting",
        },
      },
    ]);

    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append("audio", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        name: "voice.wav",
        type: "audio/wav",
      });

      // Tick to MedGemma after 1.5s if backend is still processing
      const whisperTimer = setTimeout(() => {
        updatePipeline(pipelineId, { whisper: "done", medgemma: "active" });
      }, 1500);

      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      clearTimeout(whisperTimer);
      updatePipeline(pipelineId, { whisper: "done", medgemma: "active" });

      const data = await response.json();

      updatePipeline(pipelineId, { medgemma: "done", sheets: "active" });
      await new Promise((r) => setTimeout(r, 600));

      const hasFollowUp =
        typeof data.reply === "object" &&
        parseInt(data.reply?.follow_up_days) > 0;

      if (hasFollowUp) {
        updatePipeline(pipelineId, { sheets: "done", calendar: "active" });
        await new Promise((r) => setTimeout(r, 500));
        updatePipeline(pipelineId, { calendar: "done" });
      } else {
        updatePipeline(pipelineId, { sheets: "done" });
      }

      await new Promise((r) => setTimeout(r, 400));
      processResponse(data, pipelineId);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to upload audio.");
      setMessages((prev) => prev.filter((m) => m.id !== pipelineId));
    } finally {
      setIsLoading(false);
    }
  };

  const processResponse = (data: any, pipelineId: string) => {
    if (data.reply) {
      let displayText = "Record Saved.";
      let agentActions: { icon: string; text: string; color: string }[] = [];

      const rawText = data.audio_transcription
        ? `**🎙️ Transcription:**\n*${data.audio_transcription}*\n\n---\n`
        : "";

      if (typeof data.reply === "object") {
        const patient = data.reply.patient_name || "Unknown";
        const diagnosis = data.reply.diagnosis || "N/A";
        const vitals = data.reply.vitals || "N/A";
        const plan = data.reply.plan || "N/A";
        const followUpDays = parseInt(data.reply.follow_up_days) || 0;
        const followUp =
          followUpDays > 0 ? `In ${followUpDays} days` : "None required";

        displayText = `${rawText}### ✅ Clinical Record Generated\n\n**👤 Patient:** ${patient}\n**❤️ Vitals:** ${vitals}\n**🩺 Diagnosis:** ${diagnosis}\n**💊 Plan:** ${plan}\n**📅 Follow-up:** ${followUp}`;

        agentActions.push({
          icon: "server-outline",
          text: "Patient Record Saved locally",
          color: "#10B981",
        });
        agentActions.push({
          icon: "analytics-outline",
          text: "Epidemic Tracker Updated (Sheets)",
          color: "#F59E0B",
        });

        if (followUpDays > 0) {
          agentActions.push({
            icon: "calendar-outline",
            text: "Follow-up Scheduled (Google Calendar)",
            color: "#8B5CF6",
          });
        }
      } else {
        displayText = rawText + String(data.reply);
      }

      const botMsg: Message = {
        id: Date.now().toString(),
        text: displayText,
        sender: "bot",
        isThinking: false,
        actions: agentActions,
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === pipelineId ? botMsg : msg)),
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
        {/* --- ADDED EMPTY STATE PROMPTS --- */}
        {messages.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="mic-circle-outline"
              size={64}
              color="#27272A"
              style={{ alignSelf: "center", marginBottom: 16 }}
            />
            <Text style={styles.emptyStateTitle}>Ready to Transcribe</Text>
            <Text style={styles.emptyStateSubtitle}>
              Hold the microphone button and dictate your notes. MedoX will
              automatically generate an SBAR report.
            </Text>

            <View style={styles.promptCard}>
              <Text style={styles.promptIcon}>💡</Text>
              <Text style={styles.promptText}>
                <Text style={{ fontWeight: "bold", color: "#F4F4F5" }}>
                  Try saying:{" "}
                </Text>
                "Patient Sunita is 45. BP is 120/80. She has a severe cough.
                Give paracetamol and follow up in 3 days."
              </Text>
            </View>

            <View style={styles.promptCard}>
              <Text style={styles.promptIcon}>📋</Text>
              <Text style={styles.promptText}>
                <Text style={{ fontWeight: "bold", color: "#F4F4F5" }}>
                  Include details:{" "}
                </Text>
                Patient name, symptoms, vitals, diagnosis, and treatment plan.
              </Text>
            </View>

            <View style={styles.promptCard}>
              <Text style={styles.promptIcon}>📅</Text>
              <Text style={styles.promptText}>
                <Text style={{ fontWeight: "bold", color: "#F4F4F5" }}>
                  Smart Scheduling:{" "}
                </Text>
                Mention follow-up days, and MedoX will add it to your Google
                Calendar.
              </Text>
            </View>
          </View>
        )}

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              msg.isPipeline ? {} : styles.bubble,
              msg.sender === "user"
                ? styles.userBubble
                : !msg.isPipeline
                  ? styles.botBubble
                  : {},
            ]}
          >
            {/* ── Pipeline card replaces the old isThinking spinner ── */}
            {msg.isPipeline && msg.pipeline ? (
              <PipelineCard pipeline={msg.pipeline} />
            ) : msg.isThinking ? (
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
            ) : msg.sender === "user" ? (
              <Text style={styles.userText}>{msg.text}</Text>
            ) : (
              <View>
                <Markdown style={markdownStyles}>{msg.text}</Markdown>

                {/* Render the Agentic Action Pills */}
                {msg.actions && msg.actions.length > 0 && (
                  <View style={styles.actionsContainer}>
                    <Text style={styles.actionsTitle}>
                      🤖 Autonomous Actions Triggered:
                    </Text>
                    {msg.actions.map((act, idx) => (
                      <View
                        key={idx}
                        style={[styles.actionBadge, { borderColor: act.color }]}
                      >
                        <Ionicons
                          name={act.icon as any}
                          size={14}
                          color={act.color}
                        />
                        <Text style={[styles.actionText, { color: act.color }]}>
                          {act.text}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.prompterWrapper}>
        <Text style={styles.hintTextstart}>
          {isRecording ? "Release to process" : "Ready to record..."}
        </Text>
        <View style={styles.waveContainer}>
          {isRecording && (
            <Animated.View
              style={[styles.waveRing, { transform: [{ scale: waveScale }] }]}
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

const markdownStyles = {
  body: {
    color: "#D4D4D8",
    fontSize: 16,
    lineHeight: 24,
  },
  heading3: {
    color: "#10B981",
    fontSize: 18,
    fontWeight: "bold" as const,
    marginTop: 10,
    marginBottom: 10,
  },
  strong: {
    color: "#F4F4F5",
    fontWeight: "bold" as const,
  },
  em: {
    color: "#A1A1AA",
    fontStyle: "italic" as const,
  },
  hr: {
    backgroundColor: "#27272A",
    height: 1,
    marginVertical: 12,
  },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  chatContainer: { flex: 1 },
  chatContent: { padding: 20, paddingBottom: 40 },

  /* --- NEW STYLES FOR EMPTY STATE --- */
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    marginTop: 30,
    paddingHorizontal: 10,
  },
  emptyStateTitle: {
    color: "#F4F4F5",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    color: "#A1A1AA",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  promptCard: {
    flexDirection: "row",
    backgroundColor: "#121213",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272A",
    marginBottom: 12,
    alignItems: "center",
  },
  promptIcon: {
    fontSize: 22,
    marginRight: 16,
  },
  promptText: {
    color: "#D4D4D8",
    fontSize: 14,
    flex: 1,
    lineHeight: 22,
  },
  /* -------------------------------- */

  bubble: { padding: 14, borderRadius: 18, marginVertical: 6, maxWidth: "85%" },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#27272A",
    borderBottomRightRadius: 4,
  },
  actionsContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#3F3F46",
    paddingTop: 12,
  },
  actionsTitle: {
    fontSize: 11,
    color: "#A1A1AA",
    marginBottom: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "#18181B",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  actionText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "600",
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
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#27272A",
    backgroundColor: "#11111b",
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
    backgroundColor: "rgba(220, 38, 38, 0.4)",
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
    color: "#4a88ec",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "bold",
  },
  hintTextstart: {
    color: "#46556d",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "bold",
  },
});
