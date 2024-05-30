"use client";

import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { Chat } from "@/components/Chat";
import Sidebar from "@/components/Sidebar";

const personalities = {
  intellectual: "안녕? 나는 안경척!이야. 오늘은 어떤 지적인 이야기를 나눌까?",
  funny: "안녕? 나는 덕메야. 오늘은 무슨 재미난 일이 있었니?",
};

const apiUrls = {
  intellectual: "/api/intellectual",
  funny: "/api/funny",
};

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [personality, setPersonality] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleNewConversation = () => {
    setPersonality(null);
    setCurrentConversation(null);
    setMessages([]);
  };

  const handleSelectConversation = (index) => {
    setCurrentConversation(index);
    setMessages(conversations[index].messages);
  };

  const handleSetPersonality = (selectedPersonality) => {
    setPersonality(selectedPersonality);
    const newConversation = {
      title: `New Conversation (${selectedPersonality})`,
      messages: [],
      mode: selectedPersonality,
    };
    const newConversations = [...conversations, newConversation];
    setConversations(newConversations);
    setCurrentConversation(newConversations.length - 1);
    handleReset();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    handleReset();
  }, [personality]);

  useEffect(() => {
    if (currentConversation !== null) {
      const updatedConversations = [...conversations];
      updatedConversations[currentConversation].messages = messages;
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
        />
        <div className="flex-1 flex flex-col bg-white shadow rounded-lg">
          <div className="flex h-[50px] sm:h-[60px] border-b border-neutral-300 py-2 px-2 sm:px-8 items-center justify-between">
            <div className="font-bold text-3xl flex text-center">
              <a
                className="ml-2 hover:opacity-50"
                href="https://code-scaffold.vercel.app"
              >
                AI동진
              </a>
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
                      className="btn btn-intellectual mb-2"
                      onClick={() => handleSetPersonality("intellectual")}
                    >
                      <img
                        src="/images/profile_intellectual/boy_0.png"
                        alt="boy"
                      />
                      안경 척! 모드
                      <img
                        src="/images/profile_intellectual/girl_0.png"
                        alt="girl"
                      />
                    </button>
                    <button
                      className="btn btn-funny"
                      onClick={() => handleSetPersonality("funny")}
                    >
                      <img src="/images/profile_funny/boy_5.png" alt="boy" />
                      주접이 모드
                      <img src="/images/profile_funny/girl_5.png" alt="girl" />
                    </button>
                  </div>
                </div>
              ) : (
                <Chat
                  messages={messages}
                  loading={loading}
                  onSendMessage={handleSend}
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
}
