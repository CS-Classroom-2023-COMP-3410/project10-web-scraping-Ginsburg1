const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

const RESULTS_DIR = path.join(__dirname, "results");
fs.ensureDirSync(RESULTS_DIR);

async function scrapeCalendarEvents() {
  const baseUrl = "https://www.du.edu/calendar";
  const resultFile = path.join(RESULTS_DIR, "calendar_events.json");

  // Set a single date range for the whole year
  const startDate = "2025-01-01";
  const endDateObj = new Date(startDate);
  endDateObj.setFullYear(endDateObj.getFullYear()+1);
  const endDate = endDateObj.toISOString().split("T")[0];

  const url = `${baseUrl}?search=&start_date=${startDate}&end_date=${endDate}`;
  console.log(`🔄 Fetching events for ${startDate} - ${endDate}...`);

  const allEvents = [];

  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const $ = cheerio.load(data);

    $(".events-listing__item").each((i, el) => {
      const title = $(el).find("h3").text().trim();
      const date = $(el).find("p").first().text().trim();
      // Try to capture a time string (this selector may need tweaking)
      const time = $(el).find("p:contains('am'), p:contains('pm')").text().trim() || null;
      // Try to capture location if available (adjust selector as needed)
      const location = $(el).find("p:contains('Community Commons')").text().trim() || null;
      const link = $(el).find("a").attr("href");

      if (title && date) {
        const event = { title, date };
        if (time) event.time = time;
        if (location) event.location = location;
        if (link) event.link = `https://www.du.edu${link}`;
        allEvents.push(event);
      }
    });

    console.log(`✅ Successfully fetched ${allEvents.length} events.`);
  } catch (error) {
    console.error(`❌ Error fetching events:`, error.message);
  }

  fs.writeJsonSync(resultFile, { events: allEvents }, { spaces: 2 });
  console.log(`✅ Successfully saved ${allEvents.length} events to ${resultFile}`);
}

scrapeCalendarEvents();
