import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { Chat } from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { db } from "@/firebase";
import {
  collection,
  query,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { getProfileImage } from "@/utils/profileImageHelper";

const personalities = {
  intellectual: "안경척! 오늘 어떤 이야기를 나눌까?",
  funny: "덕메야! 오늘 어떤 재미난 일이 있었어?",
};

const apiUrls = {
  intellectual: "/api/intellectual",
  funny: "/api/funny",
};

const generateRandomUsername = () => {
  const adjectives = ["Brave", "Clever", "Witty", "Kind", "Curious"];
  const nouns = ["Lion", "Wizard", "Unicorn", "Phoenix", "Dragon"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective}${noun}${number}`;
};

const Chatbot = () => {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [messageImages, setMessageImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [personality, setPersonality] = useState(null);
  const [defaultProfileImages, setDefaultProfileImages] = useState({});
  const messagesEndRef = useRef(null);

  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  useEffect(() => {
    if (session) {
      loadConversations();
    }
  }, [session]);

  const loadConversations = async () => {
    if (session?.user?.name) {
      const q = query(
        collection(db, "conversations"),
        where("username", "==", session.user.name)
      );
      const querySnapshot = await getDocs(q);
      const loadedConversations = [];
      querySnapshot.forEach((doc) => {
        loadedConversations.push({ id: doc.id, ...doc.data() });
      });
      setConversations(loadedConversations);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const generateProfileImageForMessage = (
    message,
    index,
    mode,
    defaultProfile
  ) => {
    if (message.role === "assistant") {
      return getProfileImage(index, defaultProfile, mode);
    }
    return null;
  };

  const getChatTitle = async (messages) => {
    const allMessages = messages.map((msg) => {
      const role = msg.role === "user" ? "User" : "Assistant";
      const content = msg.parts.map((part) => part.text).join(" ");
      return { role: msg.role, content };
    });

    if (allMessages.length < 2) {
      const now = new Date();
      return now.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }

    try {
      console.log("Sending API request with messages:", allMessages);
      const response = await fetch("/api/generate-title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      console.log("API response status:", response.status);

      if (!response.ok) {
        throw new Error("Failed to fetch the title from API");
      }

      const data = await response.json();
      console.log("API response data:", data);

      if (!data || !data.title) {
        throw new Error("Invalid response format");
      }

      return data.title;
    } catch (error) {
      console.error("Error generating title:", error);
      const now = new Date();
      return now.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
  };

  const handleSend = async (message) => {
    const updatedMessages = [...messages, message];
    const updatedMessageImages = [
      ...messageImages,
      generateProfileImageForMessage(
        message,
        messages.length,
        personality,
        defaultProfileImages[personality]
      ),
    ];
    setMessages(updatedMessages);
    setMessageImages(updatedMessageImages);
    setLoading(true);

    const response = await fetch(apiUrls[personality], {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: updatedMessages.slice(1) }),
    });

    if (!response.ok) {
      setLoading(false);
      throw new Error(response.statusText);
    }

    const result = await response.json();
    const updatedResultMessage = result;
    const updatedResultImage = generateProfileImageForMessage(
      result,
      updatedMessages.length,
      personality,
      defaultProfileImages[personality]
    );

    setMessages((messages) => [...messages, updatedResultMessage]);
    setMessageImages((images) => [...images, updatedResultImage]);

    if (currentConversation !== null) {
      const conversationRef = doc(db, "conversations", currentConversation);
      const title = await getChatTitle([
        ...updatedMessages,
        updatedResultMessage,
      ]);
      await updateDoc(conversationRef, {
        messages: [...updatedMessages, updatedResultMessage],
        messageImages: [...updatedMessageImages, updatedResultImage],
        title: title,
      });
      // 사이드바 대화 목록 업데이트
      setConversations((prevConversations) =>
        prevConversations.map((conversation) =>
          conversation.id === currentConversation
            ? { ...conversation, title: title }
            : conversation
        )
      );
    }

    setLoading(false);
  };

  const handleReset = () => {
    if (personality) {
      const initialProfile = Math.random() > 0.5 ? "boy" : "girl";
      setDefaultProfileImages((prev) => ({
        ...prev,
        [personality]: initialProfile,
      }));
      const initialMessage = {
        role: "assistant",
        parts: [{ text: personalities[personality] }],
      };
      setMessages([initialMessage]);
      setMessageImages([getProfileImage(0, initialProfile, personality)]);
    } else {
      setMessages([]);
      setMessageImages([]);
    }
  };

  const handleNewConversation = async () => {
    setPersonality(null);
    setCurrentConversation(null);
    setMessages([]);
    setMessageImages([]);
  };

  const handleSelectConversation = async (conversationId) => {
    setLoading(true);
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationDoc = await getDoc(conversationRef);
    if (conversationDoc.exists()) {
      const conversationData = conversationDoc.data();
      setCurrentConversation(conversationId);
      setMessages(conversationData.messages || []);
      setMessageImages(conversationData.messageImages || []);
      setPersonality(conversationData.mode);
      setDefaultProfileImages((prev) => ({
        ...prev,
        [conversationData.mode]:
          conversationData.messageImages &&
          conversationData.messageImages[0] &&
          conversationData.messageImages[0].includes("boy")
            ? "boy"
            : "girl",
      }));
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const handleSetPersonality = async (selectedPersonality) => {
    setPersonality(selectedPersonality);
    const initialProfile = Math.random() > 0.5 ? "boy" : "girl";
    setDefaultProfileImages((prev) => ({
      ...prev,
      [selectedPersonality]: initialProfile,
    }));
    const now = new Date();
    const timestamp = now.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const username = session?.user?.name || generateRandomUsername();

    const initialMessage = {
      role: "assistant",
      parts: [{ text: personalities[selectedPersonality] }],
    };
    const newConversation = {
      title: timestamp,
      messages: [initialMessage],
      messageImages: [getProfileImage(0, initialProfile, selectedPersonality)],
      mode: selectedPersonality,
      username: username,
    };
    const docRef = await addDoc(
      collection(db, "conversations"),
      newConversation
    );
    const newConversations = [
      ...conversations,
      { id: docRef.id, ...newConversation },
    ];
    setConversations(newConversations);
    setCurrentConversation(docRef.id);
    setMessages([initialMessage]);
    setMessageImages([getProfileImage(0, initialProfile, selectedPersonality)]);

    // 대화 제목 업데이트
    const title = await getChatTitle([initialMessage]);
    await updateDoc(docRef, { title: title });
    setConversations((prevConversations) =>
      prevConversations.map((conversation) =>
        conversation.id === docRef.id
          ? { ...conversation, title: title }
          : conversation
      )
    );
  };

  const deleteConversation = async (conversationId) => {
    try {
      await deleteDoc(doc(db, "conversations", conversationId));
      setConversations(
        conversations.filter(
          (conversation) => conversation.id !== conversationId
        )
      );
      if (currentConversation === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
        setMessageImages([]);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    handleReset();
  }, [personality]);

  useEffect(() => {
    if (currentConversation !== null) {
      const updatedConversations = conversations.map((conversation) =>
        conversation.id === currentConversation
          ? { ...conversation, messages, messageImages }
          : conversation
      );
      setConversations(updatedConversations);
    }
  }, [messages, messageImages]);

  return (
    <>
      <Head>
        <title>A Simple Chatbot</title>
        <meta name="description" content="A Simple Chatbot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen">
        <Sidebar
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={deleteConversation}
        />
        <div className="flex-1 flex flex-col bg-white shadow rounded-lg">
          <div className="flex h-[50px] sm:h-[60px] border-b border-neutral-300 py-2 px-2 sm:px-8 items-center justify-between">
            <div className="font-bold text-3xl flex text-center">
              <Link href="/login" className="ml-2 hover:opacity-50">
                Chatflix
              </Link>
              <Link href="/library" className="ml-4 hover:opacity-50">
                {" "}
                라이브러리{" "}
              </Link>
            </div>
          </div>
          <div className="flex-1 overflow-auto sm:px-10 pb-4 sm:pb-10">
            <div className="max-w-[800px] mx-auto mt-4 sm:mt-12">
              {personality === null ? (
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-4">
                    Start New Conversation
                  </h2>
                  <div className="flex space-x-4">
                    <button
                      className="btn btn-intellectual"
                      onClick={() => handleSetPersonality("intellectual")}
                    >
                      <img
                        src="/images/profile_intellectual/boy_0.png"
                        alt="boy"
                        className="w-15 h-15"
                      />
                      안경 척! 모드
                      <img
                        src="/images/profile_intellectual/girl_0.png"
                        alt="girl"
                        className="w-15 h-15"
                      />
                    </button>
                    <button
                      className="btn btn-funny"
                      onClick={() => handleSetPersonality("funny")}
                    >
                      <img
                        src="/images/profile_funny/boy_5.png"
                        alt="boy"
                        className="w-15 h-15"
                      />
                      주접이 모드
                      <img
                        src="/images/profile_funny/girl_5.png"
                        alt="girl"
                        className="w-15 h-15"
                      />
                    </button>
                  </div>
                </div>
              ) : (
                <Chat
                  messages={messages}
                  messageImages={messageImages}
                  loading={loading}
                  onSendMessage={handleSend}
                  mode={personality}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {personality !== null && (
            <div className="flex h-[30px] sm:h-[50px] border-t border-neutral-300 py-2 px-8 items-center sm:justify-between justify-center">
              <button
                onClick={handleNewConversation}
                className="btn btn-primary"
              >
                New Conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Chatbot;
