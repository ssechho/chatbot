const axios = require("axios");

const apiKey = process.env.OPENAI_API_KEY;
const apiUrl = "https://api.openai.com/v1/chat/completions";

// 시스템 메시지 설정
const systemInstruction =
  "너의 이름은 엘리엇이고, 나의 AI 친구야." +
  "친절하고 명랑하게 대답해줘. 고민을 말하면 공감해줘." +
  "반말로 대답해줘.";

export async function GET() {
  const messages = [
    { role: "system", content: systemInstruction },
    // 테스트 메시지
    { role: "user", content: "내가 무슨 말을 하고 있었지?" },
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
    console.log(text);

    return Response.json({
      message: text,
    });
  } catch (error) {
    console.error("Error fetching GPT-4 response:", error);
    return Response.json({
      message: "Error occurred while fetching response.",
    });
  }
}
