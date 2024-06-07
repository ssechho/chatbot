import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

const TrendingWords = () => {
  const [trendingWords, setTrendingWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // currentIndex 상태 추가

  useEffect(() => {
    const fetchTrendingWords = async () => {
      try {
        const now = Date.now();
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

        const q = query(
          collection(db, 'extractedWords'),
          where('timestamp', '>', twentyFourHoursAgo)
        );
        const querySnapshot = await getDocs(q);

        const wordCount = {};
        querySnapshot.forEach((doc) => {
          const word = doc.data().word;
          if (wordCount[word]) {
            wordCount[word]++;
          } else {
            wordCount[word] = 1;
          }
        });

        const sortedWords = Object.entries(wordCount).sort((a, b) => b[1] - a[1]);
        const topTrendingWords = sortedWords.slice(0, 10).map(([word]) => word); // 상위 10개 단어

        setTrendingWords(topTrendingWords);
      } catch (error) {
        console.error('Error fetching trending words:', error);
      }
    };

    fetchTrendingWords();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % trendingWords.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [trendingWords]);

  return (
    <div className="flex items-center space-x-4">
      <h3 className="ml-6 text-neutral-200 font-bold text-lg hover:opacity-50">NOW HOT: </h3>
        <span className="bg-red-500 py-0.5 w-40 rounded-md text-white text-sm font-bold overflow-hidden">
            <span className="truncate block max-w-[40]">{trendingWords[currentIndex]}</span>
        </span>
    </div>
  );
};

export default TrendingWords;
