import dotenv from "dotenv";

dotenv.config();

/**
 * Stores a mistake into the Hindsight API.
 * @param {string} user 
 * @param {string} topic 
 * @param {string} mistake 
 */
export async function storeMistake(user, topic, mistake) {
  const apiKey = process.env.HINDSIGHT_API_KEY;
  const baseUrl = process.env.HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io';

  if (!apiKey) {
    console.warn("HINDSIGHT_API_KEY is missing. Skipping storeMistake operation.");
    return;
  }

  const payload = {
    user_id: user,
    topic: topic,
    mistake_description: mistake,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(`${baseUrl}/v1/retain`, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
       console.error(`[Hindsight Retain Error] Status: ${response.status}`);
    } else {
       console.log(`[Hindsight Retain] Memory successfully stored for ${user}:`, payload);
    }
  } catch (err) {
    console.error(`[Hindsight Retain Failed] Exception: ${err.message}`);
  }
}

/**
 * Fetches past mistakes from the Hindsight API.
 * @param {string} user 
 * @param {string} topic 
 * @returns {Promise<Array<string>>}
 */
export async function getPastMistakes(user, topic) {
  const apiKey = process.env.HINDSIGHT_API_KEY;
  const baseUrl = process.env.HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io';

  if (!apiKey) {
    console.warn("HINDSIGHT_API_KEY is missing. Skipping getPastMistakes operation.");
    return [];
  }

  // Passing filter context for the recall using HTTP POST
  const payload = {
    user_id: user,
    topic: topic
  };

  try {
    const response = await fetch(`${baseUrl}/v1/recall`, {
      method: "POST", // Standard inference search pattern
      headers: {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
       console.error(`[Hindsight Recall Error] Status: ${response.status}`);
       return [];
    }

    const data = await response.json();
    console.log(`[Hindsight Recall] Fetched memory for ${user}:`, data);
    
    // We assume the API returns an array of objects or an array directly under a property
    const items = data.items || data.memories || data.data || (Array.isArray(data) ? data : []);
    return items.map(record => record.mistake_description || record.mistake || JSON.stringify(record));
  } catch (err) {
    console.error(`[Hindsight Recall Failed] Exception: ${err.message}`);
    return [];
  }
}
