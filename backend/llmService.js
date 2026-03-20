import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

let groq;

export async function evaluateCode(code, problem, pastMistakes) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
      return "Status: Incorrect\nMistake: Please configure GROQ_API_KEY\nHint: Check backend/.env";
  }

  const prompt = `
User is solving: ${problem}

Past mistakes:
${JSON.stringify(pastMistakes)}

User code:
${code}

Respond STRICTLY in this format:

Status: (Correct / Incorrect)

Mistake: (one short line)

Hint: (one short line)

If past mistakes exist:
Warning: mention previous mistake in one line

Keep response under 4 lines. No paragraphs. No explanations.
`;

  try {
    const isOpenRouter = apiKey.startsWith('sk-or-');
    let responseText = "";

    if (isOpenRouter) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenRouter returned ${response.status}`);
      }
      
      const data = await response.json();
      responseText = data.choices[0]?.message?.content || "Status: Incorrect\nMistake: Evaluation failed.";
    } else {
      if (!groq) groq = new Groq({ apiKey });
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama3-8b-8192", 
        temperature: 0.2,
        max_tokens: 300,
      });
      responseText = chatCompletion.choices[0]?.message?.content || "Status: Incorrect\nMistake: Evaluation failed.";
    }

    return responseText;
  } catch (error) {
    console.error("Error calling AI API:", error.message || error);
    return "Status: Incorrect\nMistake: An error occurred due to an API connectivity issue.\nHint: Check node console.";
  }
}
