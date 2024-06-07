import React, { useEffect, useState } from "react";

const Sidebar = ({
  conversations,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  const handleSelectConversation = (conversationId) => {
    setLoading(true);
    onSelectConversation(conversationId).then(() => {
      setLoading(false);
    });
  };

  return (
    <div className="w-1/4 h-full bg-neutral-950 p-4 flex flex-col">
      <h2 className="text-xl mb-5 ml-5 text-neutral-200">Conversations</h2>
      <button
        onClick={onNewConversation}
        className="btn btn-new-conversation mb-4 w-full"
      >
        New Conversation
      </button>
      <div className="flex-1 overflow-y-auto">
      <ul>
        {conversations.map((conversation, index) => (
          <li
            key={index}
            className="p-2 mb-2 ml-4 flex justify-between items-center cursor-pointer hover:bg-neutral-900"
            onClick={() => handleSelectConversation(conversation.id)} // ID를 전달
          >
            <span className="text-white">{conversation.title}</span>
            <button
              className="text-red-500 ml-2"
              onClick={(e) => {
                e.stopPropagation(); // 클릭 이벤트가 상위 요소로 전파되지 않도록 함
                onDeleteConversation(conversation.id);
              }}
            >
              <img src="/images/deleteIcon.svg" alt="Delete" />
            </button>
          </li>
        ))}
      </ul>
      {loading && (
        <div className="flex justify-center items-center h-full">
          <div className="loader"></div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Sidebar;
