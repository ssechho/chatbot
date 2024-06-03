import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { Chat } from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import Link from 'next/link';
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
  where
} from "firebase/firestore";

const personalities = {
  intellectual: "안녕? 나는 안경척!이야. 오늘은 어떤 지적인 이야기를 나눌까?",
  funny: "안녕? 나는 덕메야. 오늘은 무슨 재미난 일이 있었니?",
};

const apiUrls = {
  intellectual: "/api/intellectual",
  funny: "/api/funny",
};

const RealtimeSearch = () => {
  const [index, setIndex] = useState(0);
  const items = Array.from({ length: 10 }, (_, i) => `검색어 ${i + 1}`);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div className="relative inline-block ml-auto">
      <div className="realtime-search-container">
        <div className="realtime-search">
          {items.map((item, idx) => (
            <div key={idx} className={`item ${index === idx ? 'active' : ''}`}>
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="realtime-search-hover">
        <ul>
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const Chatbot = () => {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [extractedWords, setExtractedWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [personality, setPersonality] = useState(null);
  const messagesEndRef = useRef(null);

  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  useEffect(() => {
    console.log("session data", session);
    loadConversations();
  }, [session]); // 세션이 변경될 때마다 대화 목록을 다시 불러옴

  // Firebase에서 대화 내용 로드
  const loadConversations = async () => {
    if (session?.user?.name) {
      const q = query(collection(db, "conversations"), where("username", "==", session?.user?.name));
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
    setMessages(updatedMessages);
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
    if (!result) {
      return;
    }

    setLoading(false);
    setMessages((messages) => [...messages, result]);

    // Firebase에 대화 내용 저장
    if (currentConversation !== null) {
      const conversationRef = doc(db, "conversations", currentConversation);
      await updateDoc(conversationRef, {
        messages: [...updatedMessages, result],
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
    }
  };

  const handleReset = () => {
    if (personality) {
      setMessages([
        {
          role: "assistant",
          parts: [{ text: personalities[personality] }],
        },
      ]);
    } else {
      setMessages([]);
    }
  };

  const handleNewConversation = async () => {
    setPersonality(null);
    setCurrentConversation(null);
    setMessages([]);
  };

  const handleSelectConversation = async (conversationId) => {
    setLoading(true);
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationDoc = await getDoc(conversationRef);
    if (conversationDoc.exists()) {
      const conversationData = conversationDoc.data();
      setCurrentConversation(conversationId); // 현재 선택된 대화 ID 설정
      setMessages(conversationData.messages);
      setPersonality(conversationData.mode);
      setLoading(false);
    } else {
      setLoading(false);
    }
  };


  const handleSetPersonality = async (selectedPersonality) => {
    setPersonality(selectedPersonality);
    const now = new Date();
    const timestamp = now.toLocaleString("ko-KR", {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const newConversation = {
      title: timestamp,
      messages: [
        {
          role: "assistant",
          parts: [{ text: personalities[selectedPersonality] }],
        },
      ],
      mode: selectedPersonality,
      username: session.user.name,
    };
    const docRef = await addDoc(collection(db, "conversations"), newConversation);
    const newConversations = [...conversations, { id: docRef.id, ...newConversation }];
    setConversations(newConversations);
    setCurrentConversation(docRef.id);
    setMessages(newConversation.messages); // 새로운 대화 시작 시 초기 메시지 설정
  };


  const deleteConversation = async (conversationId) => {
    try {
      // Firebase에서 대화 삭제
      await deleteDoc(doc(db, "conversations", conversationId));

      // Firebase에서 추출된 단어 삭제
      const q = query(collection(db, "extractedWords"), where("conversationId", "==", conversationId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        deleteDoc(doc.ref);
      });

      // 로컬 상태에서 대화 삭제
      setConversations(conversations.filter(conversation => conversation.id !== conversationId));

      // 현재 선택된 대화가 삭제된 경우 초기화
      if (currentConversation === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
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
      const updatedConversations = conversations.map(conversation =>
        conversation.id === currentConversation ? { ...conversation, messages } : conversation
      );
      setConversations(updatedConversations);
    }
  }, [messages]);

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
          onDeleteConversation={deleteConversation} // 추가된 부분
        />
        <div className="flex-1 flex flex-col bg-white shadow rounded-lg">
          <div className="flex h-[50px] sm:h-[60px] border-b border-neutral-300 py-2 px-2 sm:px-8 items-center justify-between">
            <div className="font-bold text-3xl flex text-center">
              <Link href="/login" className="ml-2 hover:opacity-50">Chatflix</Link>
              <Link href="/library" className="ml-4 hover:opacity-50"> 라이브러리 </Link>
            </div>
            <RealtimeSearch />
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
