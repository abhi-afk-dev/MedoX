import React, { useState, useRef, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import Markdown from "react-native-markdown-display";
import Header from "../components/head";
import Prompter from "../components/prompter";
import Camera from "../components/camera";
import { Ionicons } from "@expo/vector-icons";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import * as DocumentPicker from "expo-document-picker";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  isThinking?: boolean;
}
interface Attachment {
  uri: string;
  type: string;
  name: string;
}

export default function InterfacePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0.4)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();

  const API_URL = "http://192.168.0.111:8000/med/";

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      fadeAnim.setValue(0.4);
    }
  }, [isLoading]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== "granted") console.log("Permission not granted");
      } catch (e) {
        console.log("Audio permission error", e);
      }
    })();
  }, []);

  const handlePictureTaken = (uri: string) => {
    setAttachment({
      uri: uri,
      type: "image",
      name: "camera_photo.jpg",
    });
    setIsCameraVisible(false);
  };

  const handleTextSend = async () => {
    if (!input.trim() && !attachment) return;

    const promptToSend = input;
    const tempId = Date.now().toString();
    const thinkingId = "thinking-" + tempId;

    // Clear Input UI immediately
    setInput("");
    setAttachment(null);
    setIsLoading(true);

    // Add User Message to Chat and a temporary "Thinking..." bot message
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: attachment ? `📷 [Image Sent] ${promptToSend}` : promptToSend,
        sender: "user",
      },
      { id: thinkingId, text: "Thinking...", sender: "bot", isThinking: true },
    ]);

    // --- START STREAMING LOGIC ---
    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_URL);

    let seenBytes = 0;

    xhr.onreadystatechange = () => {
      // readyState 3 means data is streaming in. readyState 4 means it's finished.
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        // Extract only the new chunk of text that just arrived
        const newData = xhr.responseText.substring(seenBytes);
        seenBytes = xhr.responseText.length;

        if (newData) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === thinkingId) {
                // If this is the very first chunk, replace "Thinking..." with the new text and turn off the spinner
                if (msg.isThinking) {
                  return { ...msg, text: newData, isThinking: false };
                }
                // For all future chunks, append the new text to the existing text
                return { ...msg, text: msg.text + newData };
              }
              return msg;
            }),
          );
        }
      }

      // When the stream fully completes
      if (xhr.readyState === 4) {
        setIsLoading(false);
      }
    };

    xhr.onerror = () => {
      console.error("Stream failed");
      Alert.alert("Error", "Failed to connect to MedoX.");
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
      setIsLoading(false);
    };
    if (attachment) {
      const formData = new FormData();
      formData.append("prompt", promptToSend);
      // @ts-ignore
      formData.append("image", {
        uri:
          Platform.OS === "android"
            ? attachment.uri
            : attachment.uri.replace("file://", ""),
        name: attachment.name,
        type: attachment.name.endsWith("pdf")
          ? "application/pdf"
          : "image/jpeg",
      });
      xhr.send(formData);
    } else {
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify({ prompt: promptToSend }));
    }
  };

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"], // Limit to images/PDFs
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        setAttachment({
          uri: file.uri,
          type: "document",
          name: file.name,
        });
      }
    } catch (err) {
      console.error(err);
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
        keyboardDismissMode="on-drag"
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Medo X</Text>
            <Text style={styles.emptyStateSubtitle}>Medical Assistant</Text>
          </View>
        ) : (
          messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.bubble,
                msg.sender === "user" ? styles.userBubble : styles.botBubble,
              ]}
            >
              <View
                style={[
                  styles.bubbleContent,
                  msg.sender === "user"
                    ? { alignItems: "flex-end" }
                    : { alignItems: "flex-start" },
                ]}
              >
                {msg.isThinking ? (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <ActivityIndicator
                      size="small"
                      color="#A1A1AA"
                      style={{ marginRight: 8 }}
                    />
                    <Animated.Text
                      style={[
                        styles.botText,
                        { opacity: fadeAnim, fontStyle: "italic" },
                      ]}
                    >
                      {msg.text}
                    </Animated.Text>
                  </View>
                ) : (
                  <>
                    {msg.sender === "user" ? (
                      <Text style={styles.userText}>{msg.text}</Text>
                    ) : (
                      <Markdown style={markdownStyles}>{msg.text}</Markdown>
                    )}
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View
        style={[
          styles.prompterWrapper,
          { paddingBottom: keyboardHeight > 0 ? 30 : 30 },
        ]}
      >
        {attachment && (
          <View style={styles.previewContainer}>
            <View style={styles.previewBox}>
              <Ionicons
                name="image"
                size={20}
                color="#F4F4F5"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.previewText} numberOfLines={1}>
                {attachment.name}
              </Text>
              <TouchableOpacity onPress={() => setAttachment(null)}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="#EF4444"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={styles.inputContainer}>
          <Prompter
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            handleGen={handleTextSend}
            onCameraPress={() => setIsCameraVisible(true)}
            onDocumentPress={handleDocumentPick}
          />
        </View>
      </View>
      <Camera
        isVisible={isCameraVisible}
        onClose={() => setIsCameraVisible(false)}
        onPictureTaken={handlePictureTaken}
      />
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
  heading1: {
    color: "#F4F4F5",
    fontSize: 22,
    fontWeight: "bold" as const,
    marginVertical: 10,
  },
  heading2: {
    color: "#F4F4F5",
    fontSize: 20,
    fontWeight: "bold" as const,
    marginVertical: 8,
  },
  strong: {
    color: "#F4F4F5",
    fontWeight: "bold" as const,
  },
  bullet_list: {
    marginVertical: 5,
  },
  code_inline: {
    backgroundColor: "#27272A",
    color: "#E4E4E7",
    borderRadius: 4,
  },
  fence: {
    backgroundColor: "#27272A",
    borderColor: "#3F3F46",
    color: "#E4E4E7",
  },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  chatContainer: { flex: 1 },
  chatContent: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
    opacity: 0.5,
  },
  emptyStateTitle: {
    color: "#F4F4F5",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  previewContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  previewBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27272A",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3F3F46",
  },
  previewText: {
    color: "#F4F4F5",
    fontSize: 12,
    maxWidth: 200,
  },
  emptyStateSubtitle: { color: "#A1A1AA", fontSize: 14 },
  bubble: { padding: 14, borderRadius: 18, marginVertical: 6, maxWidth: "85%" },
  bubbleContent: {
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
  },
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
    minWidth: 120,
  },
  userText: { color: "#F4F4F5", fontSize: 16, lineHeight: 22 },
  botText: { color: "#D4D4D8", fontSize: 16, lineHeight: 22 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    width: "100%",
  },
  prompterWrapper: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#09090b",
  },
});
