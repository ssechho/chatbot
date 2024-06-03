const { OpenAI } = require("openai");

// OpenAI API 키 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
    });
  }

  const data = await req.json();
  console.log("Received messages for title generation:", data.messages);

  // 메시지 히스토리를 OpenAI 포맷에 맞게 변환
  const messages = data.messages.map((msg) => ({
    role: msg.role === "user" ? "user" : "assistant",
    content: msg,
  }));

  // OpenAI API 호출
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `Summarize the following conversation in a short title: ${data.messages}`,
        },
      ],
      temperature: 0.7,
    });

    const title = response.choices[0].message.content.trim();
    console.log("Generated title:", title);

    return new Response(JSON.stringify({ title }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating title:", error);
    return new Response(JSON.stringify({ message: "Error generating title" }), {
      status: 500,
    });
  }
}
