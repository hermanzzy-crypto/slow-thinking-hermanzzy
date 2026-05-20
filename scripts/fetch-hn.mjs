#!/usr/bin/env node
/**
 * Fetch Hacker News Top 3 stories with 3 dimensions:
 *   - rank #1 (top of front page)
 *   - most points
 *   - most comments
 *
 * Output: JSON to stdout, structured for slow-thinking Step 2.
 * Cross-platform: works in Claude Code, Codex, or any node env.
 *
 * Usage:
 *   node fetch-hn.mjs           # picks 3 distinct stories
 *   node fetch-hn.mjs --raw     # dump all 30 raw front-page items
 */

const HN_API = 'https://hacker-news.firebaseio.com/v0';
const TOP_LIMIT = 30;

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

async function getTopStories() {
  const ids = await fetchJSON(`${HN_API}/topstories.json`);
  const top = ids.slice(0, TOP_LIMIT);
  // fetch concurrently with mild throttle
  const items = [];
  const concurrency = 8;
  for (let i = 0; i < top.length; i += concurrency) {
    const batch = top.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(id => fetchJSON(`${HN_API}/item/${id}.json`)));
    items.push(...results.filter(Boolean));
  }
  return items.map((it, idx) => ({
    rank: idx + 1,
    id: it.id,
    title: it.title,
    url: it.url || `https://news.ycombinator.com/item?id=${it.id}`,
    hn_url: `https://news.ycombinator.com/item?id=${it.id}`,
    points: it.score || 0,
    comments: it.descendants || 0,
    by: it.by,
    time: it.time
  }));
}

function pickThree(items) {
  const rankWinner = items[0];
  const sortedByPoints = [...items].sort((a, b) => b.points - a.points);
  const sortedByComments = [...items].sort((a, b) => b.comments - a.comments);

  const chosen = [{ ...rankWinner, dimension: 'rank', tag: '🥇 Rank #1' }];
  const used = new Set([rankWinner.id]);

  for (const it of sortedByPoints) {
    if (!used.has(it.id)) {
      chosen.push({ ...it, dimension: 'points', tag: '🔥 Most Points' });
      used.add(it.id);
      break;
    }
  }
  for (const it of sortedByComments) {
    if (!used.has(it.id)) {
      chosen.push({ ...it, dimension: 'comments', tag: '💬 Most Comments' });
      used.add(it.id);
      break;
    }
  }
  return chosen;
}

(async () => {
  try {
    const items = await getTopStories();
    if (process.argv.includes('--raw')) {
      process.stdout.write(JSON.stringify(items, null, 2));
      return;
    }
    const chosen = pickThree(items);
    process.stdout.write(JSON.stringify({
      fetched_at: new Date().toISOString(),
      source: 'https://news.ycombinator.com/',
      stories: chosen
    }, null, 2));
  } catch (e) {
    process.stderr.write(`[fetch-hn] error: ${e.message}\n`);
    process.exit(1);
  }
})();
