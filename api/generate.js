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

    const prompt = `You are a hilariously deadpan M&A press release generator for the Berkeley Forum on M&A and the Boardroom.

The user has provided three inputs:
- Favorite brand (their company's vibe/aesthetic): "${brand}"
- Biggest pet peeve (the problem they solve): "${peeve}"
- Most niche hobby or obsession (their secret differentiator): "${hobby}"

Generate a SHORT, witty mock press release (4-5 paragraphs max) that includes:
1. A headline announcing the acquisition of their absurd startup
2. A creative startup name and one-line description of what it does (combining the three inputs in an unexpected but logical way)
3. A comically precise but absurd valuation (e.g. "$2.3 billion, pending regulatory review in Delaware")
4. A specific, well-known acquirer that makes surprising but perfect sense (could be a tech giant, consumer brand, or unexpected company)
5. A fake quote from the acquirer's CEO explaining why this acquisition is "strategically essential"
6. A closing line that references the Berkeley Forum or M&A in a fun way

Keep it sharp, dry, and smart — like The Onion met the Wall Street Journal. Under 250 words total. Use bold for the headline only.`;

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
    const text = data.content?.map(b => b.text || '').join('') || '';

    if (!text) return res.status(500).json({ error: 'Empty response from Claude' });

    res.status(200).json({ text });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
