function extractDatabaseId(input) {
  const clean = input.replace(/-/g, '');
  const match = clean.match(/([0-9a-f]{32})/i);
  return match ? match[1] : input;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, database_id, japanese, english } = req.body;

  if (!token || !database_id || !japanese || !english) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const dbId = extractDatabaseId(database_id);

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          Japanese: {
            title: [{ text: { content: japanese } }],
          },
          English: {
            rich_text: [{ text: { content: english } }],
          },
          Date: {
            date: { start: new Date().toISOString().split('T')[0] },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || JSON.stringify(data) });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
