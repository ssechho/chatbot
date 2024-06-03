import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function POST(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
    });
  }

  const { messages } = await req.json();
  console.log("Received messages for title generation:", messages);

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `Summarize the following conversation in a short title: ${messages}`,
        },
      ],
    });

    const title = completion.data.choices[0].message.content.trim();
    console.log("Generated title:", title);
    return new Response(JSON.stringify({ title }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error generating title:", error);
    return new Response(JSON.stringify({ message: "Error generating title" }), {
      status: 500,
    });
  }
}
