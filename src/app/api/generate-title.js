import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { messages } = req.body;

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
    console.log("Generated title:", title); // 콘솔 로그 추가
    res.status(200).json({ title });
  } catch (error) {
    console.error("Error generating title:", error);
    res.status(500).json({ message: "Error generating title" });
  }
}
