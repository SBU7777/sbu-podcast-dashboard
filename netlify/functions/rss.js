// netlify/functions/rss.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const PODCAST_TITLE = 'Struggling Brothers United';
const PODCAST_DESCRIPTION = 'Breaking the silence. Building brotherhood. Standing together.';
const PODCAST_AUTHOR = 'Robert Bedard';
const PODCAST_EMAIL = 'info@strugglingbrothersunited.org';
const PODCAST_WEBSITE = 'https://strugglingbrothersunited.org';
const PODCAST_IMAGE = 'https://strugglingbrothersunited.org/image.jpg';

exports.handler = async (event) => {
  try {
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('*')
      .order('episode_number', { ascending: false });

    if (error) throw error;

    const rssItems = episodes
      .map((ep) => {
        const publishDate = new Date(ep.published_at).toUTCString();
        const episodeUrl = `${PODCAST_WEBSITE}/episode/${ep.episode_number}`;
        
        return `
    <item>
      <title>Episode ${ep.episode_number}: ${escapeXml(ep.title)}</title>
      <description>${escapeXml(ep.description || '')}</description>
      <link>${episodeUrl}</link>
      <guid isPermaLink="false">episode-${ep.episode_number}</guid>
      <pubDate>${publishDate}</pubDate>
      <enclosure url="${escapeXml(ep.audio_url)}" type="audio/mpeg" length="0" />
      <itunes:duration>00:00:00</itunes:duration>
      <itunes:episodeType>full</itunes:episodeType>
    </item>`;
      })
      .join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(PODCAST_TITLE)}</title>
    <link>${PODCAST_WEBSITE}</link>
    <description>${escapeXml(PODCAST_DESCRIPTION)}</description>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} Struggling Brothers United</copyright>
    <managingEditor>${PODCAST_EMAIL}</managingEditor>
    <webMaster>${PODCAST_EMAIL}</webMaster>
    <image>
      <url>${PODCAST_IMAGE}</url>
      <title>${escapeXml(PODCAST_TITLE)}</title>
      <link>${PODCAST_WEBSITE}</link>
    </image>
    <itunes:author>${PODCAST_AUTHOR}</itunes:author>
    <itunes:owner>
      <itunes:name>${PODCAST_AUTHOR}</itunes:name>
      <itunes:email>${PODCAST_EMAIL}</itunes:email>
    </itunes:owner>
    <itunes:image href="${PODCAST_IMAGE}" />
    <itunes:category text="Religion &amp; Spirituality">
      <itunes:category text="Christianity" />
    </itunes:category>
    <itunes:explicit>false</itunes:explicit>
${rssItems}
  </channel>
</rss>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
      body: rss,
    };
  } catch (error) {
    console.error('RSS generation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
