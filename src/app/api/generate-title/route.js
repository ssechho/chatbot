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

  try {
    const data = await req.json();
    console.log("Received messages for title generation:", data.messages);
    // 메시지 히스토리를 OpenAI 포맷에 맞게 변환
    const messages = data.messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content || msg, // JSON 구조에 맞게 content 필드를 처리합니다.
    }));

    console.log("Formatted messages for OpenAI API:", messages);

    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `다음 대화를 바탕으로, 대화에서 언급된 영화, 배우, 감독 등의 제목 또는 이름을 반드시 포함해 10글자 이내의 간결한 요약문을 한국어로 만들어라.: ${JSON.stringify(
            messages
          )}`,
        },
      ],
      temperature: 1,
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
