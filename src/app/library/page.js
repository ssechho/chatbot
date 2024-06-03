"use client";
import { useEffect, useState } from "react";
import Chatbot from "@/components/Chatbot";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
} from "firebase/firestore";

export default function Library() {
  const [extractedWords, setExtractedWords] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchExtractedWords = async () => {
      const querySnapshot = await getDocs(collection(db, "extractedWords"));
      const words = [];
      querySnapshot.forEach((doc) => {
        words.push({ id: doc.id, ...doc.data() });
      });
      setExtractedWords(words);
    };

    fetchExtractedWords();
  }, []);

  const handleConversationClick = (conversationId) => {
    router.push(`/`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">라이브러리</h1>
      <Link href="/" className="btn btn-primary mb-4">메인 페이지로 돌아가기</Link>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {extractedWords.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg shadow">
            <h2 className="text-lg font-semibold">{item.words.join(", ")}</h2>
            <p
              className="text-blue-500 cursor-pointer"
              onClick={() => handleConversationClick(item.conversationId)}
            >
              언급된 대화
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

