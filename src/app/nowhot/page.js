"use client";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/firebase';
import { collection, getDocs, where, query } from 'firebase/firestore';
import TrendingWords from '@/components/TrendingWords';

const API_KEY = process.env.NEXT_PUBLIC_KOBIS_API_KEY;
const HOST = 'https://www.kobis.or.kr';

const getMovieList = async (params) => {
  const url = new URL(`${HOST}/kobisopenapi/webservice/rest/movie/searchMovieList.json`);
  url.searchParams.append('key', API_KEY);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.movieListResult.movieList;
  } catch (error) {
    console.error('Error fetching movie list:', error);
    return [];
  }
};

const getMovieInfo = async (movieCd) => {
  const url = new URL(`${HOST}/kobisopenapi/webservice/rest/movie/searchMovieInfo.json`);
  url.searchParams.append('key', API_KEY);
  url.searchParams.append('movieCd', movieCd);

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.movieInfoResult.movieInfo;
  } catch (error) {
    console.error('Error fetching movie info:', error);
    return null;
  }
};

const getBestMatch = async (query, movieList) => {
  try {
    const response = await fetch('/api/kobis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, movieList })
    });
    const data = await response.json();
    return data.bestMatchMovieCd;
  } catch (error) {
    console.error('Error fetching best match from OpenAI:', error);
    return null;
  }
};

export default function NowHot() {
  const [extractedWords, setExtractedWords] = useState([]);
  const [userImage, setUserImage] = useState("");
  const [trendingWords, setTrendingWords] = useState([]);
  const [movieDetails, setMovieDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMovieDetails, setLoadingMovieDetails] = useState({});
  const [wordCount, setWordCount] = useState({}); // 상태 추가
  const router = useRouter();
  const { data: session, status } = useSession();

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
        const topTrendingWords = sortedWords.slice(0, 10).map(([word]) => word);

        setTrendingWords(topTrendingWords);
        setWordCount(wordCount); // 상태 업데이트
      } catch (error) {
        console.error('Error fetching trending words:', error);
      }
    };

    fetchTrendingWords();
  }, []);

  useEffect(() => {
    if (session) {
      if (session.user.image) {
        setUserImage(session.user.image);
      }
    }
  }, [session]);

  useEffect(() => {
    const fetchTrendingWordsMovieDetails = async () => {
      const trendingMovieDetails = {};
      const movieRequests = trendingWords.map(async (word) => {
        setLoadingMovieDetails(prevState => ({ ...prevState, [word]: true }));
        const movies = await getMovieList({ movieNm: word });
        const bestMatchMovieCd = await getBestMatch(word, movies);
        const movieInfo = await getMovieInfo(bestMatchMovieCd);
        trendingMovieDetails[word] = movieInfo;
        setLoadingMovieDetails(prevState => ({ ...prevState, [word]: false }));
      });

      await Promise.all(movieRequests);
      setMovieDetails(prevState => ({ ...prevState, ...trendingMovieDetails }));
    };

    fetchTrendingWordsMovieDetails();
  }, [trendingWords]);

  if (status === 'loading') return null;

  return (
<>
  <div className="fixed top-0 left-0 right-0 z-10 h-[50px] sm:h-[60px] py-2 px-2 sm:px-8 bg-black flex items-center justify-between">
    <div className="flex text-center items-end">
      <Link
        href="/"
        className="text-red-500 font-bold text-3xl hover:opacity-50"
      >
        CHATFLIX
      </Link>
      <Link
        href="/library"
        className="ml-6 text-neutral-200 font-bold text-lg hover:opacity-50"
      >
        Library
      </Link>
      <TrendingWords trendingWords={trendingWords} />
    </div>
    <div className="flex items-center ml-auto">
      {userImage && (
        <img
          src={userImage}
          alt="User profile"
          className="w-8 h-8 rounded-full mr-2"
        />
      )}
      <Link
        href="/login"
        className={`w-28
                    p-1 
                    text-neutral-300
                    border border-neutral-300 rounded
                    hover:bg-neutral-800
                    ml-auto
                    text-center
                    flex items-center justify-center`}
      >
        마이 페이지
      </Link>
    </div>
  </div>

  <div className="p-4">
  <h1 className="text-2xl font-bold mb-4">라이브러리</h1>
  <div className="p-4">
    {trendingWords.map((word, index) => (
        <div
        key={index}
        className="p-4 rounded-lg shadow mb-4"
        style={{ backgroundColor: `rgba(${200 - index * 30}, ${68 + index * 10}, ${68 + index * 10}, 1)` }}
        >
        <div className="flex flex-col md:flex-row md:space-x-4">
          <div className="md:w-1/2">
            <h2 className="text-lg text-neutral-300 font-semibold">{index + 1}위 - {word}</h2>
            <h3 className="text-base text-orange-300 font-bold">언급한 사람: {wordCount[word]}명</h3>
          </div>
          <div className="md:w-1/2 flex flex-row">
          {loadingMovieDetails[word] ? (
            <div className="p-4 flex-1 text-neutral-100 font-semibold">
            영화 정보 가져오는 중...
            </div>
        ) : (
            <>
            {!loadingMovieDetails[word] && movieDetails[word] && (
              <>
                <div className="p-4 flex-1">
                  <div className="text-neutral-300">
                    <p>영제: {movieDetails[word].movieNmEn}</p>
                    <p>제작연도: {movieDetails[word].prdtYear}</p>
                    <p>상영시간: {movieDetails[word].showTm}분</p>
                  </div>
                </div>
                <div className="p-4 flex-1">
                  <div className="text-neutral-300">
                    <p>감독: {movieDetails[word].directors[0]?.peopleNm}</p>
                    <p>배우: {movieDetails[word].actors[0]?.peopleNm},&nbsp;{movieDetails[word].actors[1]?.peopleNm},&nbsp;{movieDetails[word].actors[2]?.peopleNm}&nbsp;외</p>
                    <p>관람등급: {movieDetails[word].audits[0]?.watchGradeNm}</p>
                    </div>
                    </div>
                    </>
                )}
                </>
            )}
            </div>
        </div>
        </div>
    ))}
  </div>
</div>
</>
  );
}

           
