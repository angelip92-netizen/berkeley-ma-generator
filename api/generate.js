module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { brand, peeve, hobby } = req.body;

    if (!brand || !peeve || !hobby) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `You are a hilariously deadpan M&A deal memo generator for the Berkeley Forum on M&A and the Boardroom.

The user has provided three inputs:
- Favorite brand (their company's vibe/aesthetic): "${brand}"
- Biggest pet peeve (the problem they solve): "${peeve}"
- Most niche hobby or obsession (their secret differentiator): "${hobby}"

Respond ONLY with a valid JSON object, no markdown, no backticks, no explanation. Use this exact structure:

{
  "companyName": "A creative 1-2 word startup name",
  "tagline": "A deadpan one-liner tagline in quotes",
  "concept": "2-3 sentences describing what the company does, combining all three inputs in an unexpected but logical way. Make it sound like a real pitch but absurd.",
  "valuation": "$X.XB pre-money",
  "valuationJoke": "One line joke about the valuation methodology",
  "acquirer": "Name of the specific well-known company acquiring them",
  "acquirerLogic": "2-3 sentences written as a real press release announcement explaining why this acquisition makes strategic sense, with a fake executive quote. Make it dry and funny.",
  "closingLine": "One witty sentence referencing the Berkeley Forum or M&A law"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(500).json({ error: JSON.stringify(errData) });
    }

    const data = await response.json();
    const raw = data.content?.map(b => b.text || '').join('') || '';

    if (!raw) return res.status(500).json({ error: 'Empty response from Claude' });

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      res.status(200).json({ structured: parsed });
    } catch(e) {
      // Fallback to plain text
      res.status(200).json({ text: raw });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
