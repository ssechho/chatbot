const { OpenAI } = require("openai");

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
    const { query, movieList } = data;

    const prompt = `다음 영화 목록에서 "${query}"와 가장 일치하는 영화를 선택하고 해당 영화의 movieCd를 반환하세요. 가장 일치하는 영화가 여러 개라면, 그 중 첫번째 영화의 movieCd를 반환하세요. 반드시 한 개의 movieCd는 반환해야 합니다:\n\n${movieList
      .map((movie) => `Title: ${movie.movieNm}, movieCd: ${movie.movieCd}`)
      .join("\n")}\n\n가장 일치하는 영화의 movieCd는:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 1,
    });

    const bestMatchMovieCd = response.choices[0].message.content.trim();
    return new Response(JSON.stringify({ bestMatchMovieCd }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching best match:", error);
    return new Response(
      JSON.stringify({ message: "Error fetching best match" }),
      {
        status: 500,
      }
    );
  }
}
