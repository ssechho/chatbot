import React from 'react';

const Sidebar = ({ conversations, onSelectConversation }) => {
  return (
    <div className="w-1/4 h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-4">Conversations</h2>
      <ul>
        {conversations.map((conversation, index) => (
          <li
            key={index}
            className="p-2 cursor-pointer hover:bg-gray-200"
            onClick={() => onSelectConversation(index)}
          >
            {conversation.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;




