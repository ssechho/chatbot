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

export default function Library() {
  const [extractedWords, setExtractedWords] = useState([]);
  const [userImage, setUserImage] = useState("");
  const [trendingWords, setTrendingWords] = useState([]);
  const [movieDetails, setMovieDetails] = useState({});
  const [loading, setLoading] = useState(true); // 로딩 상태 추가
  const [loadingMovieDetails, setLoadingMovieDetails] = useState({}); // 각 영화에 대한 로딩 상태 추가
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchExtractedWords = async () => {
      if (status === 'loading' || !session?.user?.name) return;

      try {
        const extractedWordsRef = collection(db, 'extractedWords');
        const q = query(
          extractedWordsRef,
          where('username', '==', session.user.name)
        );
        const querySnapshot = await getDocs(q);

        const words = [];
        querySnapshot.forEach((doc) => {
          words.push({ id: doc.id, ...doc.data() });
        });
        setExtractedWords(words);

        const movieDetails = {};
        const movieRequests = words.map(async (word) => {
          setLoadingMovieDetails(prevState => ({ ...prevState, [word.word]: true })); // 각 영화 로딩 상태 설정
          const movies = await getMovieList({ movieNm: word.word });
          const bestMatchMovieCd = await getBestMatch(word.word, movies);
          const movieInfo = await getMovieInfo(bestMatchMovieCd);
          movieDetails[word.word] = movieInfo;
          setLoadingMovieDetails(prevState => ({ ...prevState, [word.word]: false })); // 각 영화 로딩 상태 해제
        });

        await Promise.all(movieRequests);
        setMovieDetails(movieDetails);
        setLoading(false); // 전체 로딩 상태 해제
      } catch (error) {
        console.error('Error fetching extracted words: ', error);
      }
    };

    fetchExtractedWords();
  }, [session?.user?.name, status]);

  useEffect(() => {
    if (session) {
      if (session.user.image) {
        setUserImage(session.user.image);
      }
    }
  }, [session]);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {extractedWords.map((item, index) => (
            <div key={index} className="p-4 rounded-lg shadow bg-neutral-800">
              <h2 className="text-lg text-neutral-300">{item.word}</h2>
              <div>
                {item.conversationId.map((conversationId) => (
                  <Link
                    key={conversationId}
                    href={`/?conversationID=${conversationId}`}
                    className="text-red-500 hover:underline block"
                  >
                    언급된 대화
                  </Link>
                ))}
              </div>
              {loadingMovieDetails[item.word] ? ( // 로딩 상태 확인
                <p className="text-neutral-400 mt-2 font-semibold">영화 정보 가져오는 중...</p>
              ) : (
                movieDetails[item.word] && (
                  <div className="text-neutral-400 mt-2">
                    <p>{movieDetails[item.word].nations[0]?.nationNm}&nbsp;/&nbsp;{movieDetails[item.word].typeNm}&nbsp;/&nbsp;{movieDetails[item.word].genres[0]?.genreNm}</p>
                    <p>영제: {movieDetails[item.word].movieNmEn}</p>
                    <p>제작연도: {movieDetails[item.word].prdtYear}</p>
                    <p>상영시간: {movieDetails[item.word].showTm}분</p>
                    <p>감독: {movieDetails[item.word].directors[0]?.peopleNm}</p>
                    <p>배우: {movieDetails[item.word].actors[0]?.peopleNm},&nbsp;{movieDetails[item.word].actors[1]?.peopleNm},&nbsp;{movieDetails[item.word].actors[2]?.peopleNm}&nbsp;외</p>
                    <p>관람등급: {movieDetails[item.word].audits[0]?.watchGradeNm}</p>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
