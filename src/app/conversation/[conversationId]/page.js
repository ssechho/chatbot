// src/app/conversation/[conversationId]/page.js
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase";
import Sidebar from "@/components/Sidebar";
import Chat from "@/components/Chat";
import Link from "next/link";

const ChatPage = ({ params }) => {
  const router = useRouter();
  const { conversationId } = params;
  const [messages, setMessages] = useState([]);
  const [messageImages, setMessageImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [personality, setPersonality] = useState(null);
  const [conversations, setConversations] = useState([]);
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

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  const loadConversation = async (conversationId) => {
    setLoading(true);

    const conversationRef = doc(db, "conversations", conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (conversationDoc.exists()) {
      const conversationData = conversationDoc.data();
      setMessages(conversationData.messages || []);
      setMessageImages(conversationData.messageImages || []);
      setPersonality(conversationData.mode);
    }

    setLoading(false);
  };

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
          className={`w-28 p-1 text-neutral-300 border border-neutral-300 rounded hover:bg-neutral-800 ml-auto text-center flex items-center justify-center`}
        >
          마이 페이지
        </Link>
      </div>

      <div className="flex flex-1 pt-[50px] sm:pt-[60px]">
        <Sidebar
          conversations={conversations} // conversations prop 전달
          onSelectConversation={(id) => router.push(`/conversation/${id}`)}
          onDeleteConversation={async (id) => {
            await deleteDoc(doc(db, "conversations", id));
            setConversations(conversations.filter((convo) => convo.id !== id));
          }}
          onNewConversation={() => router.push("/new-conversation")}
        />
        <div className="flex-1 flex flex-col bg-neutral-900 shadow">
          <div className="flex-1 overflow-auto sm:px-10 pb-4 sm:pb-10">
            <div className="max-w-[800px] mx-auto mt-4 sm:mt-12">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="loader"></div>
                </div>
              ) : personality === null ? (
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl mb-12 text-neutral-200">
                    새로운 주제로 대화를 시작해보세요.
                  </h2>
                </div>
              ) : (
                <Chat
                  messages={messages}
                  messageImages={messageImages}
                  loading={false}
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
