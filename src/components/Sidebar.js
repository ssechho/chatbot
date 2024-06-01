import React, { useEffect } from 'react';

const Sidebar = ({ conversations, onSelectConversation, onDeleteConversation }) => {
  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  return (
    <div className="w-1/4 h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-4">Conversations</h2>
      <ul>
        {conversations.map((conversation, index) => (
          <li
            key={index}
            className="p-2 flex justify-between items-center cursor-pointer hover:bg-gray-200"
            onClick={() => onSelectConversation(conversation.id)} // ID를 전달
          >
            <span>{conversation.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;









