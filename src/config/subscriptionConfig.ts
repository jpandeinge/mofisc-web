// src/config/subscriptionConfig.ts

import {
    FaGoogleDrive, FaSpotify, FaDropbox, FaDeezer, FaLinkedin, FaGithub,
    FaSlack, FaTrello, FaFigma, FaYoutube, FaXTwitter,
    FaSoundcloud, FaPatreon, FaRedditAlien, FaDiscord,
    FaMedium, FaKaggle, FaMicrosoft, FaGoogle, FaAmazon, FaApple, FaCloud,
    FaGamepad
} from "react-icons/fa6";

import {
    SiNetflix, SiApplemusic, SiAppletv, SiGrammarly, SiHbo, SiPlaystation,
    Si1Password, SiLastpass,
    SiNotion, SiEvernote, SiShazam, SiCrunchyroll, SiWebtoon, SiBilibili,
    SiNiconico, SiLine, SiWechat, SiKakao, SiNaver, SiBaidu,
    SiProtonmail, SiGooglecloud, SiDigitalocean,
    SiVercel, SiNetlify, SiMongodb, SiTidal, SiAudible,
    SiDatacamp, SiMiro, SiNordvpn, SiExpressvpn, SiProtonvpn, SiAsana,
    SiStrava, SiFitbit, SiCoursera, SiUdemy, SiPeloton, SiDuolingo,
    SiGmail, SiGooglemeet, SiGooglephotos, SiGooglegemini, SiGooglemaps,
    SiTwitch, SiZoom
} from "react-icons/si";

import { PiOpenAiLogoThin } from "react-icons/pi";
import { RiSupabaseFill, RiNetflixFill } from "react-icons/ri";

  export interface SubscriptionPlatform {
    name: string;
    keywords: string[];
    icon: keyof typeof iconMap;
    color: string;
    category: string;
  }

  export const iconMap = {
    // Streaming & Entertainment
    'Netflix': RiNetflixFill,
    'Disney+': SiNetflix,
    'Amazon Prime': FaAmazon,
    'Prime Video': FaAmazon,
    'HBO Max': SiHbo,
    'Max': SiHbo,
    'Hulu': SiNetflix,
    'Apple TV+': SiAppletv,
    'YouTube Premium': FaYoutube,
    'Crunchyroll': SiCrunchyroll,
    'WEBTOON': SiWebtoon,
    'Paramount+': SiNetflix,
    'Peacock': SiNetflix,
    'Twitch': SiTwitch,

    // Music & Audio
    'Spotify': FaSpotify,
    'Apple Music': SiApplemusic,
    'TIDAL': SiTidal,
    'YouTube Music': FaYoutube,
    'Deezer': FaDeezer,
    'SoundCloud': FaSoundcloud,
    'Shazam': SiShazam,

    // Gaming
    'PlayStation Plus': SiPlaystation,
    'PlayStation': SiPlaystation,
    'Xbox Game Pass': FaMicrosoft,
    'Xbox': FaMicrosoft,
    'Nintendo Online': FaGamepad,
    'Nintendo Switch Online': FaGamepad,
    'EA Play': SiPlaystation,

    // Google Products (The Ecosystem)
    'Google One': FaGoogle,
    'Google Workspace': FaGoogle,
    'Gmail': SiGmail,
    'Google Drive': FaGoogleDrive,
    'Google Meet': SiGooglemeet,
    'Google Photos': SiGooglephotos,
    'Google Maps': SiGooglemaps,
    'Gemini': SiGooglegemini,
    'Google Cloud': SiGooglecloud,

    // Apple Products (The Ecosystem)
    'iCloud': FaApple,
    'iCloud+': FaApple,
    'Apple One': FaApple,
    'Apple Arcade': FaApple,
    'Apple Fitness+': FaApple,
    'Apple News+': FaApple,

    // Amazon Products (The Ecosystem)
    'Amazon Music': FaAmazon,
    'Audible': SiAudible,
    'Kindle Unlimited': FaAmazon,
    'Amazon Photos': FaAmazon,

    // Productivity & Business
    'Microsoft 365': FaMicrosoft,
    'Office 365': FaMicrosoft,
    'Notion': SiNotion,
    'Evernote': SiEvernote,
    'Slack': FaSlack,
    'Trello': FaTrello,
    'Asana': SiAsana,
    'Monday.com': SiAsana,
    'Miro': SiMiro,
    'Figma': FaFigma,
    'Adobe Creative Cloud': FaFigma,
    'Canva': FaFigma,
    'Grammarly': SiGrammarly,
    'Zoom': SiZoom,

    // Cloud & Development
    'GitHub': FaGithub,
    'GitHub Pro': FaGithub,
    'GitLab': FaGithub,
    'Bitbucket': FaGithub,
    'DigitalOcean': SiDigitalocean,
    'Heroku': FaCloud,
    'AWS': FaAmazon,
    'Azure': FaMicrosoft,
    'Vercel': SiVercel,
    'Netlify': SiNetlify,
    'MongoDB Atlas': SiMongodb,
    'Supabase': RiSupabaseFill,

    // Security & Privacy
    '1Password': Si1Password,
    'LastPass': SiLastpass,
    'Dashlane': Si1Password,
    'NordVPN': SiNordvpn,
    'ExpressVPN': SiExpressvpn,
    'ProtonVPN': SiProtonvpn,
    'ProtonMail': SiProtonmail,
    'Proton': SiProtonmail,

    // Education & Learning
    'Coursera': SiCoursera,
    'Coursera Plus': SiCoursera,
    'Udemy': SiUdemy,
    'DataCamp': SiDatacamp,
    'Duolingo': SiDuolingo,
    'Duolingo Plus': SiDuolingo,
    'Skillshare': SiDatacamp,
    'MasterClass': SiCoursera,

    // Social & Communication
    'Discord Nitro': FaDiscord,
    'Discord': FaDiscord,
    'Twitter Blue': FaXTwitter,
    'X Premium': FaXTwitter,
    'LinkedIn Premium': FaLinkedin,
    'Reddit Premium': FaRedditAlien,
    'Medium': FaMedium,
    'Substack': FaMedium,
    'Patreon': FaPatreon,

    // Asian Platforms
    'WeChat': SiWechat,
    'LINE': SiLine,
    'KakaoTalk': SiKakao,
    'NAVER': SiNaver,
    'Bilibili': SiBilibili,
    'niconico': SiNiconico,
    'Baidu': SiBaidu,

    // Fitness & Health
    'Strava': SiStrava,
    'Strava Premium': SiStrava,
    'Fitbit Premium': SiFitbit,
    'Fitbit': SiFitbit,
    'Peloton': SiPeloton,
    'MyFitnessPal': SiFitbit,

    // Storage & Backup (Already covered in ecosystems above)
    'Dropbox': FaDropbox,
    'Dropbox Plus': FaDropbox,
    'OneDrive': FaMicrosoft,

    // AI & ML
    'OpenAI': PiOpenAiLogoThin,
    'ChatGPT Plus': PiOpenAiLogoThin,
    'ChatGPT': PiOpenAiLogoThin,
    'Anthropic': PiOpenAiLogoThin,
    'Claude': PiOpenAiLogoThin,
    'Midjourney': PiOpenAiLogoThin,
    'Kaggle': FaKaggle,

    // Other
    'Scribd': FaMedium,
  };


export const subscriptionPlatforms: SubscriptionPlatform[] = [
    // Streaming & Entertainment
    {
      name: 'Netflix',
      keywords: ['netflix', 'nflx', 'netflix.com'],
      icon: 'Netflix',
      color: '#E50914',
      category: 'Entertainment'
    },
    {
      name: 'Disney+',
      keywords: ['disney+', 'disney plus', 'disneyplus', 'disney subscription'],
      icon: 'Disney+',
      color: '#113CCF',
      category: 'Entertainment'
    },
    {
      name: 'Amazon Prime',
      keywords: ['prime video', 'amazon.com/prime', 'prime subscription', 'amazon prime'],
      icon: 'Amazon Prime',
      color: '#00A8E1',
      category: 'Entertainment'
    },
    {
      name: 'HBO Max',
      keywords: ['hbo max', 'hbomax', 'hbo subscription', 'max streaming'],
      icon: 'HBO Max',
      color: '#5822B4',
      category: 'Entertainment'
    },
    {
      name: 'Hulu',
      keywords: ['hulu', 'hulu.com', 'hulu subscription'],
      icon: 'Hulu',
      color: '#1CE783',
      category: 'Entertainment'
    },
    {
      name: 'Apple TV+',
      keywords: ['apple tv+', 'apple tv plus', 'tv.apple', 'apple tv subscription'],
      icon: 'Apple TV+',
      color: '#000000',
      category: 'Entertainment'
    },
    {
      name: 'YouTube Premium',
      keywords: ['youtube premium', 'youtube red', 'youtube subscription', 'youtube music', 'youtube tv'],
      icon: 'YouTube Premium',
      color: '#FF0000',
      category: 'Entertainment'
    },
    {
      name: 'Paramount+',
      keywords: ['paramount plus', 'paramount+', 'paramount subscription'],
      icon: 'Paramount+',
      color: '#0064FF',
      category: 'Entertainment'
    },
    {
      name: 'Peacock',
      keywords: ['peacock', 'peacock tv', 'peacock streaming'],
      icon: 'Peacock',
      color: '#000000',
      category: 'Entertainment'
    },
    {
      name: 'Twitch',
      keywords: ['twitch', 'twitch subscription', 'twitch turbo', 'twitch.tv'],
      icon: 'Twitch',
      color: '#9146FF',
      category: 'Entertainment'
    },

    // Google Products (The Ecosystem)
    {
      name: 'Google One',
      keywords: ['google one', 'google storage', 'google.com/one', 'google'],
      icon: 'Google One',
      color: '#4285F4',
      category: 'Storage'
    },
    {
      name: 'Google Workspace',
      keywords: ['google workspace', 'gsuite', 'google apps', 'workspace.google'],
      icon: 'Google Workspace',
      color: '#4285F4',
      category: 'Productivity'
    },
    {
      name: 'Gmail',
      keywords: ['gmail premium', 'gmail subscription', 'gmail.com'],
      icon: 'Gmail',
      color: '#EA4335',
      category: 'Productivity'
    },
    {
      name: 'Google Meet',
      keywords: ['google meet', 'meet.google', 'meet subscription'],
      icon: 'Google Meet',
      color: '#00897B',
      category: 'Productivity'
    },
    {
      name: 'Google Photos',
      keywords: ['google photos', 'photos.google', 'photos subscription'],
      icon: 'Google Photos',
      color: '#FBBC04',
      category: 'Storage'
    },
    {
      name: 'Gemini',
      keywords: ['gemini', 'google gemini', 'gemini advanced', 'bard'],
      icon: 'Gemini',
      color: '#8E75B2',
      category: 'AI'
    },

    // Music & Audio
    {
      name: 'Spotify',
      keywords: ['spotify', 'spotify.com', 'spotify premium'],
      icon: 'Spotify',
      color: '#1DB954',
      category: 'Music'
    },
    {
      name: 'Apple Music',
      keywords: ['apple music', 'music.apple', 'itunes music'],
      icon: 'Apple Music',
      color: '#FA243C',
      category: 'Music'
    },
    {
      name: 'Amazon Music',
      keywords: ['amazon music', 'amazon music unlimited', 'music.amazon'],
      icon: 'Amazon Music',
      color: '#1DB954',
      category: 'Music'
    },
    {
      name: 'TIDAL',
      keywords: ['tidal', 'tidal.com', 'tidal premium'],
      icon: 'TIDAL',
      color: '#000000',
      category: 'Music'
    },
    {
      name: 'Shazam',
      keywords: ['shazam premium', 'shazam subscription'],
      icon: 'Shazam',
      color: '#0088FF',
      category: 'Music'
    },
    {
      name: 'Audible',
      keywords: ['audible', 'audible.com', 'audible subscription'],
      icon: 'Audible',
      color: '#FF9900',
      category: 'Music'
    },

    // Apple Products (The Ecosystem)
    {
      name: 'Apple One',
      keywords: ['apple one', 'apple subscription bundle', 'one.apple'],
      icon: 'Apple One',
      color: '#000000',
      category: 'Productivity'
    },
    {
      name: 'iCloud',
      keywords: ['icloud storage', 'apple icloud', 'icloud.com', 'icloud+', 'icloud plus'],
      icon: 'iCloud',
      color: '#3693F3',
      category: 'Storage'
    },
    {
      name: 'Apple Arcade',
      keywords: ['apple arcade', 'arcade.apple', 'apple gaming'],
      icon: 'Apple Arcade',
      color: '#6C18FF',
      category: 'Gaming'
    },
    {
      name: 'Apple Fitness+',
      keywords: ['apple fitness', 'fitness+', 'apple fitness plus', 'fitness.apple'],
      icon: 'Apple Fitness+',
      color: '#FA6400',
      category: 'Fitness'
    },
    {
      name: 'Apple News+',
      keywords: ['apple news', 'news+', 'apple news plus', 'news.apple'],
      icon: 'Apple News+',
      color: '#FF2D55',
      category: 'Entertainment'
    },

    // Cloud Storage
    {
      name: 'Google Drive',
      keywords: ['google drive', 'google.com/drive', 'drive.google'],
      icon: 'Google Drive',
      color: '#4285F4',
      category: 'Storage'
    },
    {
      name: 'Dropbox',
      keywords: ['dropbox', 'dropbox.com', 'dropbox storage', 'dropbox plus'],
      icon: 'Dropbox',
      color: '#0061FF',
      category: 'Storage'
    },
    {
      name: 'OneDrive',
      keywords: ['onedrive', 'microsoft onedrive', 'onedrive.com'],
      icon: 'OneDrive',
      color: '#0078D4',
      category: 'Storage'
    },

    // Gaming
    {
      name: 'PlayStation Plus',
      keywords: ['playstation plus', 'ps plus', 'playstation subscription', 'playstation.com'],
      icon: 'PlayStation Plus',
      color: '#003791',
      category: 'Gaming'
    },
    {
      name: 'Xbox Game Pass',
      keywords: ['xbox game pass', 'game pass', 'xbox subscription', 'xbox.com'],
      icon: 'Xbox Game Pass',
      color: '#107C10',
      category: 'Gaming'
    },
    {
      name: 'Nintendo Switch Online',
      keywords: ['nintendo switch online', 'nintendo online', 'switch online', 'nintendo subscription'],
      icon: 'Nintendo Switch Online',
      color: '#E60012',
      category: 'Gaming'
    },

    // Productivity & Business
    {
      name: 'Microsoft 365',
      keywords: ['microsoft 365', 'office 365', 'ms office', 'microsoft office'],
      icon: 'Microsoft 365',
      color: '#D83B01',
      category: 'Productivity'
    },
    {
      name: 'Slack',
      keywords: ['slack', 'slack.com', 'slack subscription'],
      icon: 'Slack',
      color: '#4A154B',
      category: 'Productivity'
    },
    {
      name: 'Notion',
      keywords: ['notion', 'notion.so', 'notion subscription'],
      icon: 'Notion',
      color: '#000000',
      category: 'Productivity'
    },
    {
      name: 'Zoom',
      keywords: ['zoom', 'zoom.us', 'zoom subscription', 'zoom pro'],
      icon: 'Zoom',
      color: '#2D8CFF',
      category: 'Productivity'
    },
    {
      name: 'Trello',
      keywords: ['trello', 'trello.com', 'trello subscription'],
      icon: 'Trello',
      color: '#0079BF',
      category: 'Productivity'
    },
    {
      name: 'Asana',
      keywords: ['asana', 'asana.com', 'asana subscription'],
      icon: 'Asana',
      color: '#F06A6A',
      category: 'Productivity'
    },

    // Development & Design
    {
      name: 'GitHub',
      keywords: ['github pro', 'github subscription', 'github.com', 'github team'],
      icon: 'GitHub',
      color: '#181717',
      category: 'Development'
    },
    {
      name: 'Adobe Creative Cloud',
      keywords: ['adobe creative cloud', 'adobe cc', 'adobe subscription', 'creative cloud'],
      icon: 'Adobe Creative Cloud',
      color: '#FF0000',
      category: 'Design'
    },
    {
      name: 'Figma',
      keywords: ['figma', 'figma.com', 'figma subscription', 'figma professional'],
      icon: 'Figma',
      color: '#F24E1E',
      category: 'Design'
    },
    {
      name: 'Canva',
      keywords: ['canva', 'canva.com', 'canva pro', 'canva subscription'],
      icon: 'Canva',
      color: '#00C4CC',
      category: 'Design'
    },

    // Security & Privacy
    {
      name: 'NordVPN',
      keywords: ['nordvpn', 'nord vpn', 'nordvpn.com'],
      icon: 'NordVPN',
      color: '#4687FF',
      category: 'Security'
    },
    {
      name: '1Password',
      keywords: ['1password', '1password.com', 'one password'],
      icon: '1Password',
      color: '#0364D3',
      category: 'Security'
    },
    {
      name: 'LastPass',
      keywords: ['lastpass', 'lastpass.com', 'last pass'],
      icon: 'LastPass',
      color: '#D32D27',
      category: 'Security'
    },
    {
      name: 'ExpressVPN',
      keywords: ['expressvpn', 'express vpn', 'expressvpn.com'],
      icon: 'ExpressVPN',
      color: '#DA3940',
      category: 'Security'
    },
    {
      name: 'ProtonVPN',
      keywords: ['protonvpn', 'proton vpn', 'protonvpn.com', 'protonmail'],
      icon: 'ProtonVPN',
      color: '#6D4AFF',
      category: 'Security'
    },

    // Social Media
    {
      name: 'Twitter Blue',
      keywords: ['twitter blue', 'x premium', 'x.com premium', 'x subscription'],
      icon: 'Twitter Blue',
      color: '#1DA1F2',
      category: 'Social'
    },
    {
      name: 'Discord Nitro',
      keywords: ['discord nitro', 'discord subscription', 'discord.com'],
      icon: 'Discord Nitro',
      color: '#5865F2',
      category: 'Social'
    },
    {
      name: 'LinkedIn Premium',
      keywords: ['linkedin premium', 'linkedin subscription', 'linkedin.com'],
      icon: 'LinkedIn Premium',
      color: '#0A66C2',
      category: 'Social'
    },
    {
      name: 'Reddit Premium',
      keywords: ['reddit premium', 'reddit gold', 'reddit subscription'],
      icon: 'Reddit Premium',
      color: '#FF4500',
      category: 'Social'
    },

    // AI & ML
    {
      name: 'OpenAI',
      keywords: ['openai', 'chatgpt plus', 'chatgpt subscription', 'chatgpt', 'openai.com'],
      icon: 'OpenAI',
      color: '#00A67E',
      category: 'AI'
    },
    {
      name: 'Anthropic',
      keywords: ['anthropic', 'claude', 'claude pro', 'claude subscription', 'anthropic.com'],
      icon: 'Anthropic',
      color: '#181818',
      category: 'AI'
    },
    {
      name: 'Midjourney',
      keywords: ['midjourney', 'mid journey', 'midjourney subscription'],
      icon: 'Midjourney',
      color: '#000000',
      category: 'AI'
    },

    // Asian Platforms
    {
      name: 'WeChat',
      keywords: ['wechat premium', 'weixin premium', 'wechat', 'weixin'],
      icon: 'WeChat',
      color: '#7BB32E',
      category: 'Social'
    },
    {
      name: 'LINE',
      keywords: ['line premium', 'line subscription', 'line.me'],
      icon: 'LINE',
      color: '#00B900',
      category: 'Social'
    },
    {
      name: 'KakaoTalk',
      keywords: ['kakaotalk', 'kakao talk', 'kakao premium'],
      icon: 'KakaoTalk',
      color: '#FFE812',
      category: 'Social'
    },
    {
      name: 'Bilibili',
      keywords: ['bilibili premium', 'bilibili subscription', 'bilibili.com'],
      icon: 'Bilibili',
      color: '#00A1D6',
      category: 'Entertainment'
    },

    // Fitness & Health
    {
      name: 'Strava',
      keywords: ['strava subscription', 'strava premium', 'strava.com'],
      icon: 'Strava',
      color: '#FC4C02',
      category: 'Fitness'
    },
    {
      name: 'Peloton',
      keywords: ['peloton subscription', 'peloton membership', 'peloton.com'],
      icon: 'Peloton',
      color: '#D72D35',
      category: 'Fitness'
    },
    {
      name: 'Fitbit Premium',
      keywords: ['fitbit premium', 'fitbit subscription', 'fitbit.com'],
      icon: 'Fitbit Premium',
      color: '#00B0B9',
      category: 'Fitness'
    },
    {
      name: 'Apple Fitness+',
      keywords: ['apple fitness', 'fitness+', 'apple fitness plus', 'fitness.apple'],
      icon: 'Apple Fitness+',
      color: '#FA6400',
      category: 'Fitness'
    },

    // Education
    {
      name: 'Coursera',
      keywords: ['coursera plus', 'coursera subscription', 'coursera.org'],
      icon: 'Coursera',
      color: '#0056D2',
      category: 'Education'
    },
    {
      name: 'Udemy',
      keywords: ['udemy', 'udemy subscription', 'udemy.com'],
      icon: 'Udemy',
      color: '#A435F0',
      category: 'Education'
    },
    {
      name: 'Duolingo',
      keywords: ['duolingo plus', 'duolingo super', 'duolingo subscription', 'duolingo.com'],
      icon: 'Duolingo',
      color: '#58CC02',
      category: 'Education'
    },
    {
      name: 'DataCamp',
      keywords: ['datacamp', 'datacamp subscription', 'datacamp.com'],
      icon: 'DataCamp',
      color: '#03EF62',
      category: 'Education'
    }
  ];

  export const getSubscriptionInfo = (description: string): SubscriptionPlatform | null => {
    const lowercaseDesc = description.toLowerCase();
    return subscriptionPlatforms.find(platform =>
      platform.keywords.some(keyword => lowercaseDesc.includes(keyword))
    ) || null;
  };
