"use client";

import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Login() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div className="flex justify-center h-screen">
      {session ? (
        <div className="grid m-auto text-center">
          <div className="flex flex-col items-center mb-4">
            <img
              src={session.user.picture} // 프로필 사진을 여기서 사용
              alt="Profile"
              className="w-40 h-40 rounded-full object-cover mb-8"
            />
            <div className="text-2xl mb-12 text-neutral-300">
              안녕하세요 {session.user.name}님!
            </div>
          </div>
          <button
            className={`w-40 justify-self-center p-1 mb-4 bg-red-500 text-white border border-red-500 rounded hover:bg-red-800`}
            onClick={() => router.push("/")}
          >
            채팅 시작하기
          </button>
          <button
            className={`w-40 justify-self-center p-1 mb-4 text-red-500 border border-red-500 rounded hover:bg-neutral-800`}
            onClick={() => signOut()}
          >
            로그아웃
          </button>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-no-repeat bg-cover"
            style={{ backgroundImage: "url(/images/startingBG.png)" }}
          ></div>
          <div className="relative z-10 h-full flex">
            <div className="flex-grow-0 w-[55%]"></div>
            <div className="w-[30%] flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-red-500 font-bold text-6xl mb-12">
                  CHATFLIX
                </div>
                <div className="text-2xl mb-12 text-neutral-300">
                  영화 덕질 친구, CHATFLIX
                </div>
                <button
                  className="w-40 p-1 mb-4 bg-red-500 text-white border border-red-500 rounded hover:bg-neutral-800"
                  onClick={() => signIn()}
                >
                  로그인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
