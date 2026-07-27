import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Speech from "expo-speech";
import {
  fetchMobileChatsApi,
  createMobileChatApi,
  fetchMobileMessagesApi,
  streamMobileMessageApi,
  MobileMessage,
  MobileChat,
} from "./src/services/api";

export default function App() {
  const [chats, setChats] = useState<MobileChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MobileMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("auto");
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    async function init() {
      try {
        const list = await fetchMobileChatsApi();
        setChats(list);
        if (list.length > 0) setActiveChatId(list[0].id);
      } catch (err: any) {
        console.log("Initial chats fetch:", err.message);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    async function loadMsgs() {
      try {
        const msgs = await fetchMobileMessagesApi(activeChatId!);
        setMessages(msgs);
      } catch (err: any) {
        console.log("Load msgs err:", err.message);
      }
    }
    loadMsgs();
  }, [activeChatId]);

  // Pick Image from Gallery or Camera
  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Please allow access to photos to attach images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Text to Speech Read Aloud
  const handleSpeak = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      Speech.stop();
      setSpeakingMsgId(null);
    } else {
      Speech.stop();
      Speech.speak(text, {
        onDone: () => setSpeakingMsgId(null),
        onError: () => setSpeakingMsgId(null),
      });
      setSpeakingMsgId(msgId);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    let targetChatId = activeChatId;
    if (!targetChatId) {
      try {
        const newChat = await createMobileChatApi();
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        targetChatId = newChat.id;
      } catch (e: any) {
        Alert.alert("Error", "Failed to start new chat");
        return;
      }
    }

    const userContent = inputText.trim();
    const tempUserMsg: MobileMessage = {
      id: `temp-${Date.now()}`,
      chatId: targetChatId,
      role: "user",
      content: userContent || "[Image Attached]",
      imageUri: selectedImage || undefined,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputText("");
    const currentImg = selectedImage;
    setSelectedImage(null);
    setIsStreaming(true);
    setStreamingText("");

    let attachments: any[] | undefined = undefined;
    if (currentImg) {
      // Create inlineData attachment
      attachments = [
        {
          type: "image/jpeg",
          data: currentImg.replace(/^data:image\/\w+;base64,/, ""),
        },
      ];
    }

    await streamMobileMessageApi(
      targetChatId,
      userContent || "Please analyze this image",
      attachments,
      selectedPersona,
      (userMsg) => {
        setMessages((prev) => prev.map((m) => (m.id === tempUserMsg.id ? userMsg : m)));
      },
      (chunk) => {
        setStreamingText((prev) => prev + chunk);
      },
      (assistantMsg) => {
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingText("");
        setIsStreaming(false);
      },
      (err) => {
        Alert.alert("Streaming Error", err);
        setIsStreaming(false);
      },
      (newTitle) => {
        setChats((prev) =>
          prev.map((c) => (c.id === targetChatId ? { ...c, title: newTitle } : c))
        );
      }
    );
  };

  const personas = [
    { id: "auto", name: "⚡ Afridi-GPT Pro (Auto)" },
    { id: "coder", name: "💻 Software Engineer" },
    { id: "researcher", name: "🌐 Web Researcher" },
    { id: "designer", name: "🎨 AI Art & UI Designer" },
    { id: "reasoner", name: "🧠 Deep Logic & Math" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" />

      {/* Mobile Top Header */}
      <View style={styles.header}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandLogo}>⚡</Text>
          <Text style={styles.brandTitle}>Afridi-GPT Pro</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowPersonaModal(true)}
          style={styles.personaBtn}
        >
          <Text style={styles.personaBtnText}>🎭 Persona</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            const nc = await createMobileChatApi();
            setChats((prev) => [nc, ...prev]);
            setActiveChatId(nc.id);
            setMessages([]);
          }}
          style={styles.newChatBtn}
        >
          <Text style={styles.newChatText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isUser = item.role === "user";
            return (
              <View
                style={[
                  styles.msgContainer,
                  isUser ? styles.userMsgContainer : styles.aiMsgContainer,
                ]}
              >
                <Text style={styles.msgRole}>{isUser ? "You" : "Afridi-GPT"}</Text>
                {item.imageUri && (
                  <Image source={{ uri: item.imageUri }} style={styles.attachedImg} />
                )}
                <Text style={styles.msgText}>{item.content}</Text>

                {!isUser && (
                  <TouchableOpacity
                    onPress={() => handleSpeak(item.id, item.content)}
                    style={styles.speakBtn}
                  >
                    <Text style={styles.speakBtnText}>
                      {speakingMsgId === item.id ? "🔇 Stop" : "🔊 Speak"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            isStreaming ? (
              <View style={[styles.msgContainer, styles.aiMsgContainer]}>
                <Text style={styles.msgRole}>Afridi-GPT</Text>
                <Text style={styles.msgText}>{streamingText}</Text>
                <ActivityIndicator color="#10B981" size="small" style={{ marginTop: 6 }} />
              </View>
            ) : null
          }
        />

        {/* Selected Image Thumbnail Bar */}
        {selectedImage && (
          <View style={styles.imgPreviewBar}>
            <Image source={{ uri: selectedImage }} style={styles.thumbImg} />
            <Text style={styles.thumbText}>Image attached</Text>
            <TouchableOpacity onPress={() => setSelectedImage(null)}>
              <Text style={styles.removeImgText}>❌</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mobile Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity onPress={handlePickImage} style={styles.attachBtn}>
            <Text style={styles.attachIcon}>📷</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message Afridi-GPT..."
            placeholderTextColor="#64748B"
            multiline
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={isStreaming}
            style={[styles.sendBtn, isStreaming && { opacity: 0.5 }]}
          >
            <Text style={styles.sendBtnText}>🚀</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Persona Selection Modal */}
      <Modal visible={showPersonaModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select AI Persona</Text>
            {personas.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  setSelectedPersona(p.id);
                  setShowPersonaModal(false);
                }}
                style={[
                  styles.personaItem,
                  selectedPersona === p.id && styles.personaItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.personaItemText,
                    selectedPersona === p.id && styles.personaItemTextActive,
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setShowPersonaModal(false)}
              style={styles.closeModalBtn}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F17",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandLogo: {
    fontSize: 18,
  },
  brandTitle: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "bold",
  },
  personaBtn: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  personaBtnText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },
  newChatBtn: {
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  newChatText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
  },
  msgContainer: {
    marginVertical: 6,
    padding: 14,
    borderRadius: 16,
    maxWidth: "88%",
  },
  userMsgContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#1E293B",
    borderBottomRightRadius: 4,
  },
  aiMsgContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#131B2E",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  msgRole: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
  },
  msgText: {
    color: "#F8FAFC",
    fontSize: 14,
    lineHeight: 20,
  },
  attachedImg: {
    width: 180,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  speakBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  speakBtnText: {
    color: "#64748B",
    fontSize: 11,
  },
  imgPreviewBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    marginHorizontal: 16,
    padding: 8,
    borderRadius: 12,
    gap: 8,
  },
  thumbImg: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  thumbText: {
    color: "#94A3B8",
    fontSize: 12,
    flex: 1,
  },
  removeImgText: {
    fontSize: 12,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#0F172A",
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    gap: 8,
  },
  attachBtn: {
    padding: 8,
  },
  attachIcon: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#1E293B",
    color: "#F8FAFC",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: "#10B981",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  modalTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  personaItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: "#1E293B",
  },
  personaItemActive: {
    backgroundColor: "#10B981",
  },
  personaItemText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "600",
  },
  personaItemTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  closeModalBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 10,
  },
  closeModalText: {
    color: "#94A3B8",
    fontSize: 14,
  },
});
