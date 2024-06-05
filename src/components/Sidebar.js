import React, { useEffect } from "react";

const Sidebar = ({
  conversations,
  onSelectConversation,
  onDeleteConversation,
}) => {
  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  return (
    <div className="w-1/4 h-screen bg-neutral-950 p-4">
      <h2 className="text-xl mb-5 ml-5 text-neutral-200">Conversations</h2>
      <ul>
        {conversations.map((conversation, index) => (
          <li
            key={index}
            className="p-2 mb-2 ml-4 flex justify-between items-center cursor-pointer hover:bg-neutral-900"
            onClick={() => onSelectConversation(conversation.id)} // ID를 전달
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
    </div>
  );
};

export default Sidebar;
