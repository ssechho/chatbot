import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages } = req.body;
  const content = messages.map((msg) => msg.content).join(" ");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Summarize the following conversation." },
        { role: "user", content },
      ],
      temperature: 0.7,
    });

    const summary = response.choices[0].message.content;
    res.status(200).json({ summary });
  } catch (error) {
    console.error("Error summarizing conversation:", error);
    res.status(500).json({ error: "Failed to summarize conversation" });
  }
}
