"use client";

import { SessionProvider } from "next-auth/react";
import Chatbot from "@/components/Chatbot";

export default function Home() {
  return (
    <SessionProvider>
      <div>
        <Chatbot />
      </div>
    </SessionProvider>
  );
}