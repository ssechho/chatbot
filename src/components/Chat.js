import React, { useState, useEffect } from "react";
import { ChatInput } from "./ChatInput";
import { ChatLoader } from "./ChatLoader";
import { ChatBubble } from "./ChatBubble";

export const Chat = ({ messages, loading, onSendMessage, mode }) => {
  return (
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
              src={message.profileImage}
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
        <ChatInput onSendMessage={onSendMessage} />
      </div>
    </div>
  );
};
