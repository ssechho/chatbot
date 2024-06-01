// src/app/library/page.js
"use client";
import { useEffect, useState } from "react";
import Link from 'next/link';

export default function Library() {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const storedConversations = JSON.parse(localStorage.getItem('conversations')) || [];
    setConversations(storedConversations);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">라이브러리</h1>
      <Link href="/" className="btn btn-primary mb-4">메인 페이지로 돌아가기</Link>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {conversations.map((conversation, index) => (
          <div key={index} className="p-4 border rounded-lg shadow">
            <h2 className="text-lg font-semibold">{conversation.title}</h2>
            <p>{conversation.messages.length} 메시지</p>
          </div>
        ))}
      </div>
    </div>
  );
}




