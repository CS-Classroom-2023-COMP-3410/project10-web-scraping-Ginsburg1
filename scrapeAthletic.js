const fs = require('fs');
const path = require('path');

(async () => {
  const api_url = "https://denverpioneers.com/services/responsive-calendar.ashx";

  const params = new URLSearchParams({
    type: "month",
    sport: "0",
    location: "all",
    date: new Date('2025-02-26T00:00:00Z').toISOString()
  });

  const headers = { "User-Agent": "Mozilla/5.0" };

  try {
    const response = await fetch(`${api_url}?${params.toString()}`, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch data. HTTP Status Code: ${response.status}`);
    }

    const responseText = await response.text();
    console.log("API Response:", responseText); // Debugging API response

    const data = JSON.parse(responseText); // Parse response manually

    // Ensure the response contains events
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No valid event data found in API response.");
    }

    // Extract all events from different date groups
    const events = data.flatMap(dateGroup => dateGroup.events || []);

    if (events.length === 0) {
      throw new Error("No events found in API response.");
    }

    // Transform event data to match the required format
    const formattedEvents = events.map(event_data => ({
      duTeam: "Denver Pioneers",
      opponent: event_data?.opponent?.title || "Unknown Opponent",
      date: event_data?.date ? new Date(event_data.date).toISOString() : "Unknown Date"
    }));

    // Ensure the results directory exists
    const outputDir = path.join(__dirname, 'results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save the results as a JSON file in the correct format
    const outputFile = path.join(outputDir, 'athletic_events.json');
    fs.writeFileSync(outputFile, JSON.stringify({ events: formattedEvents }, null, 4));

    console.log(`✅ Events successfully saved to ${outputFile}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
})();
