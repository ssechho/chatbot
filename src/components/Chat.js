// src/components/Chat.js

import React from "react";
import { ChatInput } from "./ChatInput";
import { ChatLoader } from "./ChatLoader";
import { ChatBubble } from "./ChatBubble";

const Chat = ({
  messages,
  messageImages = [],
  userImage,
  loading,
  onSendMessage,
  mode,
}) => {
  return (
    <div className="chat-container flex flex-col rounded-lg px-2 sm:p-4 sm:border border-neutral-800 bg-neutral-950">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`chat-message my-1 sm:my-1.5 ${
            message.role === "assistant" ? "assistant-message" : "user-message"
          }`}
        >
          {message.role === "assistant" && messageImages[index] && (
            <img
              src={messageImages[index]}
              alt="profile"
              className="profile-image assistant-profile-image"
            />
          )}
          <ChatBubble message={message} />
          {message.role === "user" && userImage && (
            <img
              src={userImage}
              alt="profile"
              className="profile-image user-profile-image"
            />
          )}
        </div>
      ))}
      {loading && (
        <div className="chat-loader my-1 sm:my-1.5">
          <ChatLoader />
        </div>
      )}
      <div className="chat-input mt-4 sm:mt-8 bottom-[56px] left-0 w-full">
        <ChatInput onSendMessage={onSendMessage} />
      </div>
    </div>
  );
};

export default Chat;
