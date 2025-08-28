# TikTok Video Setup Guide

## Adding TikTok Videos to the Home Page

To add TikTok videos to the "Follow along our journey to launch" section:

1. **Get the TikTok URL**: Copy the full URL of your TikTok video

2. **Add TikTokEmbed Component**: In `src/app/page.tsx`, add TikTokEmbed components with the full URL:

```tsx
<TikTokEmbed url="https://www.tiktok.com/@getcotto/video/YOUR_VIDEO_ID" />
```

3. **Example**: 
```tsx
<TikTokEmbed url="https://www.tiktok.com/@getcotto/video/7542615383367224631" />
<TikTokEmbed url="https://www.tiktok.com/@getcotto/video/7542925693361900855" />
```

## Notes
- The TikTokEmbed component automatically extracts the video ID from the URL
- Videos will display in a responsive layout (stacked on mobile, side-by-side on desktop)
- Each video maintains the proper 9:16 aspect ratio
- The component automatically loads the TikTok embed script
- Invalid URLs will show a placeholder with "Invalid TikTok URL"

## Current Videos
The home page currently includes:
- Video 1: https://www.tiktok.com/@getcotto/video/7542615383367224631
- Video 2: https://www.tiktok.com/@getcotto/video/7542925693361900855

## Adding More Videos
To add more videos, simply add additional `<TikTokEmbed url="..." />` components to the flex container in the TikTok section.
