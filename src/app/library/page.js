"use client";
import { useEffect, useState } from "react";
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
    router.push(`/?conversationId=${conversationId}`);
  };

return (
  <>
      <div className="fixed top-0 left-0 right-0 z-10 h-[50px] sm:h-[60px] py-2 px-2 sm:px-8 bg-black flex items-center justify-between">
      <div className="flex text-center items-end">
        <Link href="/" className="text-red-500 font-bold text-3xl hover:opacity-50">
          CHATFLIX
        </Link>
        <Link href="/library" className="ml-6 text-neutral-200 font-bold text-lg hover:opacity-50">
          Library
        </Link>
      </div>
      <Link href="/login" className={`w-28
                  p-1 
                  text-neutral-300
                  border border-neutral-300 rounded
                  hover:bg-neutral-800
                  ml-auto
                  text-center
                  flex items-center justify-center`}>
        마이 페이지
      </Link>
      {/* <RealtimeSearch /> */}
      </div>

      <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">라이브러리</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {extractedWords.map((item, index) => (
          <div key={index} className="p-4 rounded-lg shadow bg-neutral-800">
            <h2 className="text-lg  text-neutral-300">{item.words.join(", ")}</h2>
            <p
              className="text-red-500 cursor-pointer"
              onClick={() => handleConversationClick(item.conversationId)}
            >
              언급된 대화
            </p>
          </div>
        ))}
      </div>
    </div>
        </>
    );
};

