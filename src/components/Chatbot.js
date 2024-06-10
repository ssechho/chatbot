import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { Chat } from "@/components/Chat";
import { ChatLoader } from "@/components/ChatLoader";
import TrendingWords from "@/components/TrendingWords";
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
  intellectual: "오늘 어떤 이야기를 나눌까?(안경 척!👓)",
  funny: "오늘은 어떤 재미난 일이 있었어?(주접ㅎㅎ🥰)",
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
  const [userImage, setUserImage] = useState(""); // 사용자 이미지 상태 추가
  const messagesEndRef = useRef(null);
  const [trendingWords, setTrendingWords] = useState([]);

  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  useEffect(() => {
    if (session) {
      loadConversations();
      // 카카오 프로필 이미지 설정
      if (session.user.image) {
        setUserImage(session.user.image);
      }
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

      // 메시지에서 <> 안의 단어들을 추출하는 함수
      function extractWordsFromMessage(message) {
        const regex = /<([^>]+)>/g;
        let matches;
        const words = [];
        while ((matches = regex.exec(message)) !== null) {
          words.push(matches[1]);
        }
        return words;
      }

      // 메시지에서 단어를 추출
      const extracted = extractWordsFromMessage(result.parts[0].text);

      if (extracted.length > 0) {
        for (const word of extracted) {
          // "extractedWords" 컬렉션 참조
          const existingWordsRef = collection(db, "extractedWords");

          // 동일한 username과 word를 가진 문서를 찾는 쿼리
          const queryRef = query(
            existingWordsRef,
            where("username", "==", session?.user?.name),
            where("word", "==", word)
          );

          // 기존 문서 가져오기
          const existingWordsSnapshot = await getDocs(queryRef);

          if (!existingWordsSnapshot.empty) {
            // 문서가 존재하는 경우
            const doc = existingWordsSnapshot.docs[0];
            const existingData = doc.data();

            // 동일한 username과 word가 이미 존재하지만 conversationId가 다른 경우
            if (!existingData.conversationId.includes(currentConversation)) {
              // conversationId에 현재 conversationId 추가
              const updatedConversationIds = [
                ...existingData.conversationId,
                currentConversation,
              ];

              // 기존 문서 업데이트 및 timestamp 갱신
              await updateDoc(doc.ref, {
                conversationId: updatedConversationIds,
                timestamp: Date.now(),
              });
            } else {
              // conversationId가 이미 존재하는 경우, timestamp만 갱신
              await updateDoc(doc.ref, {
                timestamp: Date.now(),
              });
            }
          } else {
            // 문서가 존재하지 않는 경우, 새로운 문서 생성
            await addDoc(collection(db, "extractedWords"), {
              conversationId: [currentConversation],
              word: word,
              username: session?.user?.name,
              timestamp: Date.now(), // 최초 생성 시 timestamp 추가
            });

            // 로컬 상태 업데이트 (필요한 경우)
            setExtractedWords((prevWords) => [
              ...prevWords,
              { conversationId: [currentConversation], word: word },
            ]);
          }
        }
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
      // conversations 콜렉션에서 대화 삭제
      await deleteDoc(doc(db, "conversations", conversationId));

      // extractedWords에서 conversationId가 포함된 문서들 조회
      const q = query(
        collection(db, "extractedWords"),
        where("conversationId", "array-contains", conversationId)
      );
      const querySnapshot = await getDocs(q);

      // 각 문서에 대해 conversationId 배열에서 삭제하고, 배열이 빈 배열이 되면 문서 삭제
      querySnapshot.forEach(async (docSnapshot) => {
        const docData = docSnapshot.data();
        const updatedConversationIds = docData.conversationId.filter(
          (id) => id !== conversationId
        );

        if (updatedConversationIds.length > 0) {
          await updateDoc(docSnapshot.ref, {
            conversationId: updatedConversationIds,
          });
        } else {
          await deleteDoc(docSnapshot.ref);
        }
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

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const handleInfoClick = () => {
    setIsInfoOpen(true);
  };

  const handleCloseClick = () => {
    setIsInfoOpen(false);
    setCurrentPage(0); // 팝업을 닫을 때 페이지를 초기화
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => (prevPage + 1) % 4);
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => (prevPage - 1 + 4) % 4);
  };

  const pages = [
    {
      image: "/images/page1.png",
      text: "안녕하세요! 영화 덕질 친구 CHATFLIX입니다."
    },
    {
      image: "/images/page2.png",
      text: "두 가지 성격 중 하나를 골라 대화를 시작해보세요."
    },
    {
      image: "/images/page3.png",
      text: "Library에서는 언급했던 영화를 다시 꺼내볼 수 있습니다."
    },
    {
      image: "/images/page4.png",
      text: "인기있는 영화가 궁금하다면, Now Hot을 살펴보세요!"
    }
  ];

  return (
    <>
      <Head>
        <title>Chatflix</title>
        <meta name="description" content="A Simple Chatbot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="fixed top-0 left-0 right-0 z-10 h-[50px] sm:h-[60px] py-2 px-2 sm:px-8 bg-black flex items-center justify-between">
        <div className="flex text-center items-end">
          <Link
            href="/"
            className="text-red-500 font-bold text-3xl hover:opacity-50"
          >
            CHATFLIX
          </Link>
          <Link
            href="/library"
            className="ml-6 text-neutral-200 font-bold text-lg hover:opacity-50"
          >
            Library
          </Link>
          <TrendingWords trendingWords={trendingWords} />
        </div>
        <div className="flex items-center ml-auto">
          {userImage && (
            <img
              src={userImage}
              alt="User profile"
              className="w-8 h-8 rounded-full mr-2" // 적절한 크기로 설정
            />
          )}
          <Link
            href="/login"
            className={`w-28
            p-1 
            text-neutral-300
            border border-neutral-300 rounded
            hover:bg-neutral-800
            ml-auto
            text-center
            flex items-center justify-center`}
          >
            마이 페이지
          </Link>
          <button onClick={handleInfoClick} className="ml-auto text-neutral-300">
          <img src="/images/infoIcon.svg" alt="Info Icon" className="h-6 w-6" />
        </button>
        </div>
      </div>

      {/* 인포메이션 팝업 */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-neutral-800 p-4 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-white">How to</h2>
            <div className="mb-4 overflow-hidden relative h-80">
              <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentPage * 100}%)` }}>
                {pages.map((page, index) => (
                  <div key={index} className="w-full flex-shrink-0 flex flex-col items-center">
                    <img src={page.image} alt={`Page ${index + 1}`} className="w-full h-64 object-cover mb-4 rounded" />
                    <p className="text-neutral-200">{page.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <button onClick={handlePrevPage} className="text-blue-500 hover:underline">Previous</button>
              <div className="flex space-x-1">
                {pages.map((_, index) => (
                  <div key={index} className={`h-2 w-2 rounded-full ${index === currentPage ? 'bg-white' : 'bg-gray-500'}`}></div>
                ))}
              </div>
              <button onClick={handleNextPage} className="text-blue-500 hover:underline">Next</button>
            </div>
            <button onClick={handleCloseClick} className="mt-4 text-red-500 hover:underline">Close</button>
          </div>
        </div>
      )}

      <div className="flex h-screen flex-1 pt-[50px] sm:pt-[60px]">
        <Sidebar
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={deleteConversation}
          onNewConversation={handleNewConversation}
        />
        <div className="flex-1 flex flex-col bg-neutral-900 shadow">
          <div className="flex-1 overflow-auto sm:px-10 pb-4 sm:pb-10">
            <div className="max-w-[800px] mx-auto mt-4 sm:mt-12">
              {personality === null ? (
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
                  userImage={userImage} // userImage prop 전달
                  loading={false} // 챗을 주고받을 때는 로딩 상태를 false로 유지합니다
                  onSendMessage={handleSend}
                  mode={personality}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
