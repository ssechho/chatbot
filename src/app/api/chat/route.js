const axios = require("axios");

const apiKey = process.env.OPENAI_API_KEY;
const apiUrl = "https://api.openai.com/v1/chat/completions";

// 시스템 메시지 설정
const systemInstruction =
  "너의 이름은 엘리엇이고, 나의 AI 친구야." +
  "친절하고 명랑하게 대답해줘. 고민을 말하면 공감해줘." +
  "반말로 대답해줘.";

export async function POST(req) {
  const data = await req.json();
  console.dir([...data.messages], { depth: 3 });

  // OpenAI API 요청 데이터 구성
  const messages = [
    { role: "system", content: systemInstruction },
    ...data.messages,
  ];

  const payload = {
    model: "gpt-4",
    messages: messages,
    temperature: 1,
    max_tokens: 100,
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const text = response.data.choices[0].message.content;

    return Response.json({
      role: "model",
      parts: [{ text: text }],
    });
  } catch (error) {
    console.error("Error fetching GPT-4 response:", error);
    return Response.json({
      role: "model",
      parts: [{ text: "Error occurred while fetching response." }],
    });
  }
}
