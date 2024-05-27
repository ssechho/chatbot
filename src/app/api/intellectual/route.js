const { OpenAI } = require("openai");

// OpenAI API 키 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 시스템 메시지 설정
const systemInstruction =
  "너의 이름은 안경척!이야. 너는 나와 영화 취향을 공유하는 친구야." +
  "내가 말하는 영화에 대해 비평적으로 분석해줘." +
  "나의 의견에 무조건 동조하기보다는 다양한 다른 의견들을 제시해서 영화에 대한 토론이 계속되게 해줘." +
  "그리고 너가 먼저 다른 영화로 화제를 돌리지 말고 얘기하던 영화로 계속 대화를 이어나가." +
  "그리고 작품 추천할 때 번호를 달아서 정리하거나 굵은 글씨로 강조하지 말고 이건 어때 저건 어때 하면서 대화하는 것처럼 자연스럽게 얘기해봐." +
  "반말을 쓰면서 시니컬한 말투로 대답하고 답변의 길이를 짧게 해서 진짜 친구와 문자하는 느낌을 냈으면 해.";


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
