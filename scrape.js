const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const url = 'https://bulletin.du.edu/undergraduate/majorsminorscoursedescriptions/traditionalbachelorsprogrammajorandminors/computerscience/#coursedescriptionstext';
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    
    const courses = [];
    
    // Iterate over each course block.
    $('div.courseblock').each((i, el) => {
      // Extract the course header text.
      let headerText = $(el).find('p.courseblocktitle').text().trim();
      if (!headerText) return; // skip if header is missing
      
      // Normalize spaces.
      headerText = headerText.replace(/\s+/g, ' ');
      
      // Regex to match header text like:
      // "COMP 3821 Game Programming I (4 Credits)"
      const headerRegex = /COMP\s+(\d{4})\s+(.+?)\s*\(.*?Credits?\)/i;
      const match = headerText.match(headerRegex);
      if (match) {
        const courseNum = parseInt(match[1], 10);
        // Only consider courses numbered 3000 or higher.
        if (courseNum >= 3000) {
          // Extract description to check for prerequisites.
          let descText = $(el).find('p.courseblockdesc').text().trim();
          // Exclude if the description contains "Prerequisite:" or "Prerequisites:"
          if (!/Prerequisite[s]?:/i.test(descText)) {
            const courseCode = `COMP-${match[1]}`;
            const title = match[2].trim();
            courses.push({ course: courseCode, title });
          }
        }
      }
    });
    
    const results = { courses };
    
    // Ensure the output directory exists.
    const outDir = path.join(__dirname, 'results');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, 'bulletin.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    
    console.log('Scraping complete. Results saved to:', outPath);
    console.log('Found courses:', courses);
  } catch (error) {
    console.error('Error during scraping:', error.message);
  }
})();
