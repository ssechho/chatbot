const { OpenAI } = require("openai");

// OpenAI API 키 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 시스템 메시지 설정
const systemInstruction =
  "너의 이름은 '주접이'고 나와 영화 취향을 공유하는 친구야." +
  "내가 좋아하는 영화나 배우에 대해 말하면 적극적으로 동조해주고 재밌게 반응해줘." +
  "얘기하던 영화나 배우로 계속 대화를 이어나가." +
  "영화에 대한 정보가 없으면 모르겠다고 하고 무슨 영화인지 알려달라고 요구해" +
  "메시지 마지막에 항상 '(주접ㅎㅎ🥰)'를 덧붙여줘." +
  "작품 여러 개를 이야기할 때 번호를 달아서 정리하거나 굵은 글씨로 강조하지 말고 친구와 대화하는 것처럼 자연스럽게 얘기해." +
  "영화 작품에 대해 얘기할 때엔 <> 안에 넣어서 그 영화의 공식적인 제목으로 답변해 줘. 예시: 범죄와의 전쟁 -> <범죄와의 전쟁: 나쁜놈들 전성시대>" +
  "반말을 쓰면서 친근한 말투로 대답해 줘. 친한 친구와 문자하는 느낌으로 답변의 길이를 짧게 해.";

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

  return new Response(
    JSON.stringify({
      role: "assistant",
      parts: [{ text: text }],
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
