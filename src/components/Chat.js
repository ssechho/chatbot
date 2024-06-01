import React, { useState, useEffect } from "react";
import { ChatInput } from "./ChatInput";
import { ChatLoader } from "./ChatLoader";
import { ChatBubble } from "./ChatBubble";
import { getProfileImage } from "../utils/profileImageHelper"; // 프로필 이미지 헬퍼 함수
import Sidebar from "./Sidebar"; // Sidebar import 추가

export const Chat = ({ initialMessages = [], mode }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(false);
  const [defaultProfile, setDefaultProfile] = useState("");
  const [conversations, setConversations] = useState([
    { title: "Conversation 1", messages: initialMessages, summary: "" },
  ]);
  const [selectedConversation, setSelectedConversation] = useState(0);

  useEffect(() => {
    // 초기 기본 프로필 설정
    const initialProfile = Math.random() > 0.5 ? "boy" : "girl";
    setDefaultProfile(initialProfile);
  }, []);

  const summarizeConversation = async (conversation) => {
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: conversation.messages }),
      });
      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error("Error summarizing conversation:", error);
      return "";
    }
  };

  const handleSendMessage = async (newMessage) => {
    setLoading(true);
    const updatedMessages = [
      ...messages,
      { role: "user", content: newMessage },
    ];
    setMessages(updatedMessages);

    try {
      // 여기에 실제 API 호출 로직이 들어갑니다
      const responseMessage = "API 응답 메시지"; // 예시 응답 메시지
      const updatedConversations = [...conversations];
      const currentConversation = updatedConversations[selectedConversation];
      currentConversation.messages = [
        ...currentConversation.messages,
        { role: "user", content: newMessage },
        { role: "assistant", content: responseMessage },
      ];

      const summary = await summarizeConversation(currentConversation);
      currentConversation.summary = summary;

      setConversations(updatedConversations);
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: responseMessage },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar
        conversations={conversations}
        onSelectConversation={setSelectedConversation}
      />
      <div className="chat-container flex flex-col rounded-lg px-2 sm:p-4 sm:border border-neutral-300">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message my-1 sm:my-1.5 flex ${
              message.role === "assistant" ? "items-start" : "items-end"
            }`}
          >
            {message.role === "assistant" && (
              <img
                src={getProfileImage(index, defaultProfile, mode)}
                alt="profile"
                className="profile-image"
              />
            )}
            <ChatBubble message={message} />
          </div>
        ))}
        {loading && (
          <div className="chat-loader my-1 sm:my-1.5">
            <ChatLoader />
          </div>
        )}
        <div className="chat-input mt-4 sm:mt-8 bottom-[56px] left-0 w-full">
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
};
