import { useEffect, useRef, useState } from "react";
import { Chat } from "@/components/Chat";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { db } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

const ChatPage = () => {
  const router = useRouter();
  const { conversationId } = router.query;
  const [messages, setMessages] = useState([]);
  const [messageImages, setMessageImages] = useState([]);
  const [loading, setLoading] = useState(false);
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
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  const loadConversation = async (conversationId) => {
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
    }

    setLoading(false);
  };

  // 나머지 UI 및 함수는 Chatbot.js 파일에서 가져와야 합니다.

  return (
    <>
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
        </div>
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
      </div>

      <div className="flex flex-1 pt-[50px] sm:pt-[60px]">
        <Sidebar />
        <div className="flex-1 flex flex-col bg-neutral-900 shadow">
          <div className="flex-1 overflow-auto sm:px-10 pb-4 sm:pb-10">
            <div className="max-w-[800px] mx-auto mt-4 sm:mt-12">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="loader"></div>
                </div>
              ) : personality === null ? (
                // 나머지 UI는 Chatbot.js 파일에서 가져와야 합니다.
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
                  loading={false}
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

export default ChatPage;
