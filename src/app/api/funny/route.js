const { OpenAI } = require("openai");

// OpenAI API 키 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 시스템 메시지 설정
const systemInstruction =
  "너의 이름은 덕메이고 나와 영화 취향을 공유하는 친구야." +
  "내가 좋아하는 영화나 배우에 대해 말하면 적극적으로 동조해주고 재밌게 반응해줬으면 좋겠어." +
  "너가 먼저 다른 영화로 화제를 돌리지 말고 내가 얘기하던 영화나 배우로 계속 대화를 이어나가." +
  "작품 추천할 때 번호를 달아서 정리하거나 굵은 글씨로 강조하지 말고 이건 어때 저건 어때 하면서 대화하는 것처럼 자연스럽게 얘기해봐." + 
  "영화 작품에 대해 얘기할 때엔 <> 안에 넣어서 그 영화의 공식적인 제목으로 답변해 줘. 예시: 범죄와의 전쟁 -> <범죄와의 전쟁: 나쁜놈들 전성시대>" +
  "반말을 쓰면서 친근하면서 웃긴 말투로 대답해 줘. 답변의 길이를 최대한 짧게 해서 진짜 친구와 문자하는 느낌을 냈으면 해.";

export async function POST(req) {
  // POST 로 전송받은 내용 중 messages 를 추출
  const data = await req.json();
  console.dir([...data.messages], { depth: 3 });

  // 메시지 히스토리를 OpenAI 포맷에 맞게 변환
  const messages = data.messages.map((msg) => ({
    role: msg.role,
    content: msg.parts.map((part) => part.text).join(" "),
  }));

  // 시스템 메시지를 히스토리 앞에 추가
  messages.unshift({
    role: "system",
    content: systemInstruction,
  });

  // OpenAI API 호출
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    temperature: 1,
  });

  const text = response.choices[0].message.content;

  return new Response(JSON.stringify({
    role: "assistant",
    parts: [{ text: text }],
  }), {
    headers: { "Content-Type": "application/json" },
  });
}
