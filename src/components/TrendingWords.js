import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

const TrendingWords = () => {
  const [trendingWords, setTrendingWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupWidth, setPopupWidth] = useState(200); // 박스 너비 상태 추가
  const [popupHeight, setPopupHeight] = useState(0); // 박스 높이 상태 추가

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
        const topTrendingWords = sortedWords.slice(0, 10).map(([word], index) => `${index + 1}` +`\xa0\xa0\xa0\xa0\xa0\xa0\xa0` + `${word}`);

        // 최대 단어 길이를 계산하여 팝업 박스의 너비 설정
        const maxWidth = sortedWords.reduce((max, [word]) => Math.max(max, word.length), 0);
        setPopupWidth(maxWidth * 15 - 10);

        // 모든 단어를 담을 수 있도록 팝업 박스의 높이 설정
        setPopupHeight(topTrendingWords.length * 28.5);

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

  function truncateWord(word, maxWidth) {
    if (word.length <= 3 || word.length <= maxWidth / 8) {
      return word; 
    } else {
      return word.slice(0, Math.floor((maxWidth - 20) / 8)) + '...'; 
    }
  }  

  return (
    <div className="flex items-center space-x-4">
      <h3 className="ml-6 text-neutral-200 font-bold text-lg hover:opacity-50">NOW HOT: </h3>
      <div className="relative" onMouseEnter={() => setIsPopupVisible(true)} onMouseLeave={() => setIsPopupVisible(false)}>
        <div className="h-6 overflow-auto bg-red-500 rounded-md absolute z-10" style={{ width: `${popupWidth}px`, height: `${popupHeight}px`, whiteSpace: 'nowrap', display: isPopupVisible ? 'block' : 'none', top: '0', left: '0' }}>
          {trendingWords.map((word, index) => (
            <div key={index} className="text-white text-sm font-bold px-2 py-1" style={{ textAlign: 'left' }}>
              {word}
            </div>
          ))}
        </div>
        <div className="h-6 overflow-hidden w-40 bg-red-500 rounded-md relative cursor-pointer">
          <div className="absolute transition-transform duration-1000 ease-in-out" style={{ height: `${trendingWords.length * 20}px` }}>
            {trendingWords.map((word, index) => (
              <div key={index} className="text-white text-sm font-bold h-6 px-2 flex items-center justify-start truncate" style={{ transform: `translateY(-${currentIndex * 100}%)`, transitionDuration: '0.5s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {truncateWord(word, 150)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingWords;



