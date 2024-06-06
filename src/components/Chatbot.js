import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { Chat } from "@/components/Chat";
import { ChatLoader } from "@/components/ChatLoader";
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
  intellectual: "오늘 어떤 이야기를 나눌까?(안경 척!)",
  funny: "오늘은 어떤 재미난 일이 있었어?(주접ㅎㅎ)",
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
  const [extractedWords, setExtractedWords] = useState([]);
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

  const generateProfileImageForMessage = (message, index, gender, mode) => {
    if (message.role === "assistant") {
      return getProfileImage(index, gender, mode);
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

  const extractWordsFromMessage = (message) => {
    const regex = /<(.*?)>/g; // <> 사이의 내용을 추출하는 정규식
    const matches = [];
    let match;
    while ((match = regex.exec(message)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  };

  const handleSend = async (message) => {
    const updatedMessages = [...messages, message];
    const updatedMessageImages = [
      ...messageImages,
      generateProfileImageForMessage(
        message,
        messages.length,
        defaultProfileImages[personality].gender,
        personality
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
      defaultProfileImages[personality].gender,
      personality
    );
  
    setMessages((messages) => [...messages, updatedResultMessage]);
    setMessageImages((images) => [...images, updatedResultImage]);
    setLoading(false);
  
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
      
      // 답변에서 <> 사이의 단어들을 추출하여 Firebase에 저장
      const extracted = extractWordsFromMessage(result.parts[0].text);
      if (extracted.length > 0) {
        const newExtractedWords = [
          ...extractedWords,
          { conversationId: currentConversation, words: extracted },
        ];
        setExtractedWords(newExtractedWords);
  
        // Firebase에 저장
        await addDoc(collection(db, "extractedWords"), {
          conversationId: currentConversation,
          words: extracted,
        });
      }      
  
      // 사이드바 대화 목록 업데이트
      setConversations((prevConversations) =>
        prevConversations.map((conversation) =>
          conversation.id === currentConversation
            ? { ...conversation, title: title }
            : conversation
        )
      );
    }
  };

  const handleReset = () => {
    if (personality) {
      const gender = Math.random() > 0.5 ? "boy" : "girl";
      setDefaultProfileImages((prev) => ({
        ...prev,
        [personality]: { gender, profile: gender },
      }));
      const initialMessage = {
        role: "assistant",
        parts: [{ text: personalities[personality] }],
      };
      setMessages([initialMessage]);
      setMessageImages([getProfileImage(0, gender, personality)]);
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
    setCurrentConversation(conversationId);
    
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationDoc = await getDoc(conversationRef);
  
    if (conversationDoc.exists()) {
      const conversationData = conversationDoc.data();
      const messagesData = conversationData.messages || [];
      const messageImagesData = conversationData.messageImages || [];
      const mode = conversationData.mode;
  
      setMessages(messagesData);
      setMessageImages(messageImagesData);
      setPersonality(mode);
      setDefaultProfileImages((prev) => ({
        ...prev,
        [mode]: {
          gender:
            messageImagesData[0] && messageImagesData[0].includes("boy")
              ? "boy"
              : "girl",
          profile:
            messageImagesData[0] && messageImagesData[0].includes("boy")
              ? "boy"
              : "girl",
        },
      }));
    }
  
    setLoading(false);
  };


  const handleSetPersonality = async (selectedPersonality) => {
    setPersonality(selectedPersonality);
    const gender = Math.random() > 0.5 ? "boy" : "girl";
    setDefaultProfileImages((prev) => ({
      ...prev,
      [selectedPersonality]: { gender, profile: gender },
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
      messageImages: [getProfileImage(0, gender, selectedPersonality)],
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
    setMessageImages([getProfileImage(0, gender, selectedPersonality)]);

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

      // Firebase에서 추출된 단어 삭제
      const q = query(collection(db, "extractedWords"), where("conversationId", "==", conversationId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        deleteDoc(doc.ref);
      });

      // 로컬 상태에서 대화 삭제
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

      <div className="fixed top-0 left-0 right-0 z-10 h-[50px] sm:h-[60px] py-2 px-2 sm:px-8 bg-black flex items-center justify-between">
      <div className="flex text-center items-end">
        <Link href="/" className="text-red-500 font-bold text-3xl hover:opacity-50">
          CHATFLIX
        </Link>
        <Link href="/library" className="ml-6 text-neutral-200 font-bold text-lg hover:opacity-50">
          Library
        </Link>
      </div>
      <Link href="/login" className={`w-28
                  p-1 
                  text-neutral-300
                  border border-neutral-300 rounded
                  hover:bg-neutral-800
                  ml-auto
                  text-center
                  flex items-center justify-center`}>
        마이 페이지
      </Link>
      {/* <RealtimeSearch /> */}
    </div>


      <div className="flex flex-1 pt-[50px] sm:pt-[60px]">
        <Sidebar
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={deleteConversation}
        />
        <div className="flex-1 flex flex-col bg-neutral-900 shadow">
          <div className="flex-1 overflow-auto sm:px-10 pb-4 sm:pb-10">
            <div className="max-w-[800px] mx-auto mt-4 sm:mt-12">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="loader"></div>
                </div>
              ) : (
                personality === null ? (
                  <div className="flex flex-col items-center">
                    <h2 className="text-2xl mb-12 text-neutral-200">
                      새로운 주제로 대화를 시작해보세요.
                    </h2>
                    <div className="flex space-x-20">
                      <button
                        className="btn btn-intellectual h-[400px] w-[300px] flex flex-col items-center justify-center border-4 border-orange-500 hover:border-gradient-to-r from-orange-500 to-yellow-500"
                        onClick={() => handleSetPersonality("intellectual")}
                      >
                        <div className="flex-1 flex items-center justify-center w-full">
                          <img
                            src="/images/profile_intellectual/intellectualset.png"
                            alt="intellectual"
                            className="object-cover h-full w-full"
                          />
                        </div>
                        <span>안경 척! 모드</span>
                      </button>
                      <button
                        className="btn btn-funny h-[400px] w-[300px] flex flex-col items-center justify-center border-4 border-orange-500 hover:border-gradient-to-r from-orange-500 to-yellow-500"
                        onClick={() => handleSetPersonality("funny")}
                      >
                        <div className="flex-1 flex items-center justify-center w-full">
                          <img
                            src="/images/profile_funny/funnyset.png"
                            alt="funny"
                            className="object-cover h-full w-full"
                          />
                        </div>
                        <span>주접이 모드</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <Chat
                    messages={messages}
                    messageImages={messageImages}
                    loading={false}  // 챗을 주고받을 때는 로딩 상태를 false로 유지합니다
                    onSendMessage={handleSend}
                    mode={personality}
                  />
                )
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          {personality !== null && (
            <div className="flex h-[30px] sm:h-[50px] border-t border-neutral-300 py-2 px-8 items-center sm:justify-between justify-center">
              <button
                onClick={handleNewConversation}
                className="btn btn-primary text-white"
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
