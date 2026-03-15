export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const response = await fetch("https://white-limit-e2fe.luckyfaizu3.workers.dev/braintrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Question generation failed");
    }

    return res.status(200).json({ success: true, questions: data.questions, count: data.count });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}