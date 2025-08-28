"use client";

interface TikTokEmbedProps {
  url: string;
  className?: string;
}

export default function TikTokEmbed({ url, className = "" }: TikTokEmbedProps) {
  // Extract video ID from TikTok URL
  const videoId = url.match(/\/video\/(\d+)/)?.[1];
  
  if (!videoId) {
    return (
      <div className={`aspect-[9/16] bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-500">Invalid TikTok URL</p>
      </div>
    );
  }

  return (
    <div className={`aspect-[9/16] w-[280px] md:w-[325px] ${className}`}>
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={videoId}
        style={{ width: '100%', maxWidth: '325px' }}
      >
        <section>
          <a
            target="_blank"
            href={url}
            rel="noopener noreferrer"
          >
            @getcotto on TikTok
          </a>
        </section>
      </blockquote>
      <script async src="https://www.tiktok.com/embed.js"></script>
    </div>
  );
}
