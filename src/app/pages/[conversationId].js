// src/pages/[conversationId].js

import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Chat } from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { db } from "@/firebase";
import {
  collection,
  query,
  doc,
  getDoc,
} from "firebase/firestore";

const ChatPage = () => {
  const router = useRouter();
  const { conversationId } = router.query;
  const [messages, setMessages] = useState([]);
  const [messageImages, setMessageImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [personality, setPersonality] = useState(null);
  const [defaultProfileImages, setDefaultProfileImages] = useState({});
  const messagesEndRef = useRef(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (conversationId && session) {
      loadConversation(conversationId);
    }
  }, [conversationId, session]);

  const loadConversation = async (conversationId) => {
    setLoading(true);
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationDoc = await getDoc(conversationRef);
    if (conversationDoc.exists()) {
      const conversationData = conversationDoc.data();
      setMessages(conversationData.messages || []);
      setMessageImages(conversationData.messageImages || []);
      setPersonality(conversationData.mode);
      setDefaultProfileImages((prev) => ({
        ...prev,
        [conversationData.mode]: {
          gender:
            conversationData.messageImages &&
            conversationData.messageImages[0] &&
            conversationData.messageImages[0].includes("boy")
              ? "boy"
              : "girl",
          profile:
            conversationData.messageImages &&
            conversationData.messageImages[0] &&
            conversationData.messageImages[0].includes("boy")
              ? "boy"
              : "girl",
        },
      }));
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
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
        <Sidebar />
        <div className="flex-1 flex flex-col bg-white shadow rounded-lg">
          <div className="flex h-[50px] sm:h-[60px] border-b border-neutral-300 py-2 px-2 sm:px-8 items-center justify-between">
            <div className="font-bold text-3xl flex text-center">
              <Link href="/login" className="ml-2 hover:opacity-50">
                Chatflix
              </Link>
              <Link href="/library" className="ml-4 hover:opacity-50">
                라이브러리
              </Link>
            </div>
          </div>
          <div className="flex-1 overflow-auto sm:px-10 pb-4 sm:pb-10">
            <div className="max-w-[800px] mx-auto mt-4 sm:mt-12">
              <Chat
                messages={messages}
                messageImages={messageImages}
                loading={loading}
                mode={personality}
              />
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPage;
