"use client";

import { SessionProvider } from "next-auth/react";
import { Suspense } from "react";
import Chatbot from "@/components/Chatbot";

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SessionProvider>
        <div>
          <Chatbot />
        </div>
      </SessionProvider>
    </Suspense>
  );
}
