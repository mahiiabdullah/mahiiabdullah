const fs = require('fs');

const USERNAME = 'mahiiabdullah';
const TOKEN = process.env.GITHUB_TOKEN || '';

const HEADERS = {
  'Accept': 'application/vnd.github.v3+json',
  ...(TOKEN ? { 'Authorization': `token ${TOKEN}` } : {})
};

const EXTENSION_MAP = {
  '.js': 'JavaScript',
  '.jsx': 'React',
  '.ts': 'TypeScript',
  '.tsx': 'React',
  '.py': 'Python',
  '.dart': 'Dart',
  '.cpp': 'C++',
  '.c': 'C',
  '.html': 'HTML',
  '.css': 'CSS',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.go': 'Go',
  '.rs': 'Rust',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.swift': 'Swift',
  '.cs': 'C#',
};

const EMOJI_MAP = {
  'JavaScript': '⚡',
  'React': '⚛️',
  'TypeScript': '📘',
  'Python': '🐍',
  'Dart': '🎯',
  'C++': '⚙️',
  'C': '⚙️',
  'HTML': '🌐',
  'CSS': '🎨',
  'Java': '☕',
  'Kotlin': '🚀',
  'Go': '🐹',
  'Rust': '🦀',
  'Ruby': '💎',
  'PHP': '🐘',
  'Swift': '🐦',
  'C#': '🔷',
};

async function fetchGithub(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    if (res.status === 403 || res.status === 401) {
       console.warn(`Auth/Rate limit error for ${url}`);
       return null;
    }
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  }
  return res.json();
}

async function getDailyStack() {
  const events = await fetchGithub(`https://api.github.com/users/${USERNAME}/events`);
  if (!events) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyLanguages = {};
  let totalFiles = 0;

  for (const event of events) {
    if (event.type === 'PushEvent') {
      const eventDate = new Date(event.created_at);
      if (eventDate >= today && event.payload && event.payload.commits) {
        for (const commit of event.payload.commits) {
          const commitData = await fetchGithub(commit.url);
          if (commitData && commitData.files) {
            for (const file of commitData.files) {
              const ext = file.filename.substring(file.filename.lastIndexOf('.'));
              const lang = EXTENSION_MAP[ext];
              if (lang) {
                dailyLanguages[lang] = (dailyLanguages[lang] || 0) + 1;
                totalFiles++;
              }
            }
          }
        }
      }
    }
  }

  const sorted = Object.entries(dailyLanguages).sort((a, b) => b[1] - a[1]);
  return sorted.map(([lang, count]) => {
    const percentage = totalFiles > 0 ? Math.round((count / totalFiles) * 100) : 0;
    return { lang, percentage };
  });
}

async function getMaxStack() {
  const repos = await fetchGithub(`https://api.github.com/users/${USERNAME}/repos?per_page=100&type=owner`);
  if (!repos) return [];

  const overallLangs = {};
  
  for (const repo of repos) {
    if (!repo.fork) {
      const langs = await fetchGithub(repo.languages_url);
      if (langs) {
        for (const [lang, bytes] of Object.entries(langs)) {
          overallLangs[lang] = (overallLangs[lang] || 0) + bytes;
        }
      }
    }
  }

  const sorted = Object.entries(overallLangs).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 5).map(([lang]) => lang);
}

function generateDailyStackMarkdown(stack) {
  if (stack.length === 0) return "> No code pushed today yet! Taking a break or working secretly. 🤫";
  let md = "";
  for (const item of stack) {
    const emoji = EMOJI_MAP[item.lang] || '💻';
    md += `- ${emoji} ${item.lang} (${item.percentage}%)\n`;
  }
  return md;
}

function generateMaxStackMarkdown(stack) {
  if (stack.length === 0) return "> Not enough data.";
  let md = "";
  stack.forEach((lang, i) => {
    const emoji = EMOJI_MAP[lang] || '💻';
    md += `${i + 1}. ${emoji} ${lang}\n`;
  });
  return md;
}

async function run() {
  console.log("Fetching daily stack...");
  const dailyStack = await getDailyStack();
  const dailyMd = generateDailyStackMarkdown(dailyStack);

  console.log("Fetching max stack...");
  const maxStack = await getMaxStack();
  const maxMd = generateMaxStackMarkdown(maxStack);

  const readmePath = 'README.md';
  let readme = fs.readFileSync(readmePath, 'utf8');

  readme = readme.replace(
    /<!--START_SECTION:daily-stack-->[\s\S]*<!--END_SECTION:daily-stack-->/,
    `<!--START_SECTION:daily-stack-->\n${dailyMd}\n<!--END_SECTION:daily-stack-->`
  );

  readme = readme.replace(
    /<!--START_SECTION:max-stack-->[\s\S]*<!--END_SECTION:max-stack-->/,
    `<!--START_SECTION:max-stack-->\n${maxMd}\n<!--END_SECTION:max-stack-->`
  );

  fs.writeFileSync(readmePath, readme);
  console.log("README updated successfully!");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
