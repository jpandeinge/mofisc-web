// src/components/Overview/SubscriptionIcon.tsx
// True brand colors for subscription icons - no external dependencies

import React, { useMemo } from 'react';
import { IconType } from 'react-icons';
import {
  FaAmazon,
  FaBook,
  FaCloud,
  FaCreditCard,
  FaGamepad,
  FaLinkedin,
  FaPalette,
  FaSlack,
  FaTv,
} from 'react-icons/fa6';
import { PiOpenAiLogoThin } from 'react-icons/pi';
import {
  SiNetflix, SiSpotify, SiYoutube, SiHbo,
  SiAppletv, SiTwitch, SiCrunchyroll, SiTidal, SiSoundcloud, SiAudible,
  SiGoogle, SiGoogledrive, SiGooglecloud,
  SiApple, SiIcloud, SiApplemusic,
  SiDiscord, SiZoom, SiX, SiReddit, SiTelegram, SiWhatsapp,
  SiNotion, SiTrello, SiAsana, SiFigma, SiGrammarly, SiEvernote, SiMiro,
  SiGithub, SiGitlab, SiVercel, SiNetlify, SiDigitalocean, SiMongodb, SiSupabase,
  SiNordvpn, SiProtonvpn, Si1Password, SiLastpass, SiDashlane,
  SiDropbox, SiBox,
  SiPlaystation, SiEa, SiUbisoft,
  SiPeloton, SiStrava, SiFitbit,
  SiDuolingo, SiCoursera, SiUdemy, SiSkillshare,
  SiMedium, SiSubstack, SiPatreon,
  SiClaude,
  SiWechat, SiLine, SiKakaotalk, SiBilibili,
} from 'react-icons/si';
import { Subscription } from '../../types/Subscriptions';

interface SubscriptionIconProps {
  subscription: Subscription;
  size?: number;
}

// Brand database with icon and color (no external URLs)
interface BrandInfo {
  name: string;
  icon: IconType;
  color: string;
  keywords: string[];
}

const brandDatabase: BrandInfo[] = [
  // Streaming & Entertainment
  { name: 'Netflix', icon: SiNetflix, color: '#E50914', keywords: ['netflix'] },
  { name: 'Spotify', icon: SiSpotify, color: '#1DB954', keywords: ['spotify'] },
  { name: 'YouTube', icon: SiYoutube, color: '#FF0000', keywords: ['youtube', 'yt premium', 'youtube music', 'youtube tv'] },
  { name: 'Disney+', icon: FaTv, color: '#113CCF', keywords: ['disney+', 'disney plus', 'disneyplus'] },
  { name: 'Amazon Prime', icon: FaAmazon, color: '#00A8E1', keywords: ['prime video', 'amazon prime', 'prime subscription'] },
  { name: 'HBO Max', icon: SiHbo, color: '#5822B4', keywords: ['hbo', 'hbo max', 'max streaming'] },
  { name: 'Hulu', icon: FaTv, color: '#1CE783', keywords: ['hulu'] },
  { name: 'Apple TV+', icon: SiAppletv, color: '#000000', keywords: ['apple tv', 'appletv'] },
  { name: 'Twitch', icon: SiTwitch, color: '#9146FF', keywords: ['twitch'] },
  { name: 'Crunchyroll', icon: SiCrunchyroll, color: '#F47521', keywords: ['crunchyroll'] },
  { name: 'Tidal', icon: SiTidal, color: '#000000', keywords: ['tidal'] },
  { name: 'Deezer', icon: SiSpotify, color: '#00C7F2', keywords: ['deezer'] },
  { name: 'SoundCloud', icon: SiSoundcloud, color: '#FF3300', keywords: ['soundcloud'] },
  { name: 'Audible', icon: SiAudible, color: '#FF9900', keywords: ['audible'] },

  // Google Products
  { name: 'Google One', icon: SiGoogledrive, color: '#4285F4', keywords: ['google one', 'google storage'] },
  { name: 'Google Cloud', icon: SiGooglecloud, color: '#4285F4', keywords: ['google cloud', 'gcp'] },
  { name: 'Google', icon: SiGoogle, color: '#4285F4', keywords: ['google', 'gmail', 'google drive', 'google meet', 'google photos', 'google play', 'gemini'] },

  // Apple Products
  { name: 'Apple Music', icon: SiApplemusic, color: '#FC3C44', keywords: ['apple music'] },
  { name: 'iCloud', icon: SiIcloud, color: '#3693F3', keywords: ['icloud'] },
  { name: 'Apple', icon: SiApple, color: '#000000', keywords: ['apple', 'apple arcade', 'apple fitness', 'apple news', 'apple one'] },

  // Amazon Products
  { name: 'Kindle', icon: FaBook, color: '#FF9900', keywords: ['kindle'] },
  { name: 'Amazon', icon: FaAmazon, color: '#FF9900', keywords: ['amazon', 'aws'] },

  // Microsoft Products (using FaCloud as fallback since Si icons don't exist)
  { name: 'Microsoft 365', icon: FaCloud, color: '#D83B01', keywords: ['microsoft 365', 'office 365', 'ms office'] },
  { name: 'Xbox Game Pass', icon: FaGamepad, color: '#107C10', keywords: ['xbox', 'game pass'] },
  { name: 'OneDrive', icon: FaCloud, color: '#0078D4', keywords: ['onedrive'] },
  { name: 'Microsoft', icon: FaCloud, color: '#00A4EF', keywords: ['microsoft'] },

  // Social & Communication
  { name: 'Discord', icon: SiDiscord, color: '#5865F2', keywords: ['discord', 'nitro'] },
  { name: 'Slack', icon: FaSlack, color: '#4A154B', keywords: ['slack'] },
  { name: 'Zoom', icon: SiZoom, color: '#2D8CFF', keywords: ['zoom'] },
  { name: 'LinkedIn', icon: FaLinkedin, color: '#0A66C2', keywords: ['linkedin'] },
  { name: 'X Premium', icon: SiX, color: '#000000', keywords: ['twitter', 'x premium', 'x.com'] },
  { name: 'Reddit', icon: SiReddit, color: '#FF4500', keywords: ['reddit'] },
  { name: 'Telegram', icon: SiTelegram, color: '#0088CC', keywords: ['telegram'] },
  { name: 'WhatsApp', icon: SiWhatsapp, color: '#25D366', keywords: ['whatsapp'] },

  // Productivity & Design
  { name: 'Notion', icon: SiNotion, color: '#000000', keywords: ['notion'] },
  { name: 'Trello', icon: SiTrello, color: '#0079BF', keywords: ['trello'] },
  { name: 'Asana', icon: SiAsana, color: '#F06A6A', keywords: ['asana'] },
  { name: 'Figma', icon: SiFigma, color: '#F24E1E', keywords: ['figma'] },
  { name: 'Canva', icon: FaPalette, color: '#00C4CC', keywords: ['canva'] },
  { name: 'Adobe', icon: FaPalette, color: '#FF0000', keywords: ['adobe', 'creative cloud', 'photoshop', 'illustrator', 'premiere'] },
  { name: 'Grammarly', icon: SiGrammarly, color: '#15C39A', keywords: ['grammarly'] },
  { name: 'Evernote', icon: SiEvernote, color: '#00A82D', keywords: ['evernote'] },
  { name: 'Miro', icon: SiMiro, color: '#FFD02F', keywords: ['miro'] },

  // Development & Cloud
  { name: 'GitHub', icon: SiGithub, color: '#181717', keywords: ['github', 'copilot'] },
  { name: 'GitLab', icon: SiGitlab, color: '#FC6D26', keywords: ['gitlab'] },
  { name: 'Vercel', icon: SiVercel, color: '#000000', keywords: ['vercel'] },
  { name: 'Netlify', icon: SiNetlify, color: '#00C7B7', keywords: ['netlify'] },
  { name: 'Heroku', icon: FaCloud, color: '#430098', keywords: ['heroku'] },
  { name: 'DigitalOcean', icon: SiDigitalocean, color: '#0080FF', keywords: ['digitalocean'] },
  { name: 'MongoDB', icon: SiMongodb, color: '#00ED64', keywords: ['mongodb'] },
  { name: 'Supabase', icon: SiSupabase, color: '#3ECF8E', keywords: ['supabase'] },

  // Security & VPN
  { name: 'NordVPN', icon: SiNordvpn, color: '#4687FF', keywords: ['nordvpn', 'nord vpn'] },
  { name: 'ProtonVPN', icon: SiProtonvpn, color: '#6D4AFF', keywords: ['protonvpn', 'proton vpn', 'protonmail', 'proton'] },
  { name: '1Password', icon: Si1Password, color: '#0064DB', keywords: ['1password', 'one password', '1 password'] },
  { name: 'LastPass', icon: SiLastpass, color: '#D32D27', keywords: ['lastpass'] },
  { name: 'Dashlane', icon: SiDashlane, color: '#30A978', keywords: ['dashlane'] },

  // Cloud Storage
  { name: 'Dropbox', icon: SiDropbox, color: '#0061FF', keywords: ['dropbox'] },
  { name: 'Box', icon: SiBox, color: '#0061D5', keywords: ['box.com', 'box storage'] },

  // Gaming
  { name: 'PlayStation', icon: SiPlaystation, color: '#003791', keywords: ['playstation', 'ps plus', 'psn'] },
  { name: 'Nintendo', icon: FaGamepad, color: '#E60012', keywords: ['nintendo', 'switch online'] },
  { name: 'EA Play', icon: SiEa, color: '#000000', keywords: ['ea play', 'ea sports'] },
  { name: 'Ubisoft', icon: SiUbisoft, color: '#000000', keywords: ['ubisoft'] },

  // Fitness & Health
  { name: 'Peloton', icon: SiPeloton, color: '#D72D35', keywords: ['peloton'] },
  { name: 'Strava', icon: SiStrava, color: '#FC4C02', keywords: ['strava'] },
  { name: 'Fitbit', icon: SiFitbit, color: '#00B0B9', keywords: ['fitbit'] },

  // Education & Learning
  { name: 'Duolingo', icon: SiDuolingo, color: '#58CC02', keywords: ['duolingo'] },
  { name: 'Coursera', icon: SiCoursera, color: '#0056D2', keywords: ['coursera'] },
  { name: 'Udemy', icon: SiUdemy, color: '#A435F0', keywords: ['udemy'] },
  { name: 'Skillshare', icon: SiSkillshare, color: '#17C5CB', keywords: ['skillshare'] },

  // News & Media
  { name: 'Medium', icon: SiMedium, color: '#000000', keywords: ['medium'] },
  { name: 'Substack', icon: SiSubstack, color: '#FF6719', keywords: ['substack'] },
  { name: 'Patreon', icon: SiPatreon, color: '#FF424D', keywords: ['patreon'] },

  // AI & Tools
  { name: 'OpenAI', icon: PiOpenAiLogoThin, color: '#00A67E', keywords: ['openai', 'chatgpt', 'gpt-4', 'gpt4'] },
  { name: 'Claude', icon: SiClaude, color: '#D97757', keywords: ['anthropic', 'claude'] },

  // Asian Platforms
  { name: 'WeChat', icon: SiWechat, color: '#7BB32E', keywords: ['wechat', 'weixin'] },
  { name: 'LINE', icon: SiLine, color: '#00B900', keywords: ['line'] },
  { name: 'KakaoTalk', icon: SiKakaotalk, color: '#FFE812', keywords: ['kakao'] },
  { name: 'Bilibili', icon: SiBilibili, color: '#00A1D6', keywords: ['bilibili'] },
];

// Identify brand from subscription name or description using keyword matching
function identifyBrand(text: string | undefined): BrandInfo | null {
  if (!text) return null;

  const lowerText = text.toLowerCase();

  for (const brand of brandDatabase) {
    for (const keyword of brand.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return brand;
      }
    }
  }

  return null;
}

const SubscriptionIcon: React.FC<SubscriptionIconProps> = ({ subscription, size = 14 }) => {
  // Identify the brand using keyword matching
  const brandInfo = useMemo(() => {
    return identifyBrand(subscription.name) || identifyBrand(subscription.icon);
  }, [subscription.name, subscription.icon]);

  // Use brand icon if found, otherwise default to credit card
  const IconComponent = brandInfo?.icon || FaCreditCard;
  // Use brand color if identified, otherwise use accent blue
  const iconColor = brandInfo?.color || '#4285F4';

  return (
    <div
      className="subscription-icon-wrapper-inner"
      style={{
        backgroundColor: '#FFFFFF',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
      }}
    >
      <IconComponent
        size={size * 0.55}
        style={{
          color: iconColor,
          fill: iconColor,
          display: 'block',
          flexShrink: 0,
        }}
      />
    </div>
  );
};

export default SubscriptionIcon;
