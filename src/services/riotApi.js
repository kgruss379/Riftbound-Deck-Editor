// Riot Games Champion ID mapping for our card pool
export const CHAMPION_ID_MAP = {
  86: 'Garen, Might of Demacia',      // Garen
  157: 'Yasuo, Unforgiven',           // Yasuo
  63: 'Brand, Burning Vengeance',     // Brand
  105: 'Fizz, Tidal Trickster',       // Fizz
  99: 'Lux, Light Binding',           // Lux
};

// Map platform regions to regional routing clusters for Account API
const getRoutingRegion = (platform) => {
  const plat = platform.toLowerCase();
  if (['na1', 'br1', 'la1', 'la2'].includes(plat)) return 'americas';
  if (['euw1', 'eun1', 'tr1', 'ru'].includes(plat)) return 'europe';
  if (['kr', 'jp1'].includes(plat)) return 'asia';
  if (['oc1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'].includes(plat)) return 'sea';
  return 'americas'; // default fallback
};

const API_KEY = process.env.VITE_RIOT_API_KEY || '';

export const isApiKeyAvailable = () => {
  return API_KEY !== '';
};

// Main fetch wrapper that handles CORS proxies in development vs direct production fetch
const requestRiotApi = async (urlPath, region, group = 'platform') => {
  const isDev = import.meta.env.DEV;
  
  let fetchUrl = '';
  let headers = {
    'Accept': 'application/json',
  };

  if (isDev) {
    // In Dev: route through local Vite proxy and set target region in header
    fetchUrl = `/riot-api${urlPath}`;
    headers['x-riot-region'] = region;
    headers['X-Riot-Token'] = API_KEY;
  } else {
    // In Production: attempt direct connection (will trigger CORS block unless serverless or proxy configured)
    fetchUrl = `https://${region}.api.riotgames.com${urlPath}`;
    headers['X-Riot-Token'] = API_KEY;
  }

  const response = await fetch(fetchUrl, { headers });
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.status?.message || `API error (${response.status})`);
  }
  
  return response.json();
};

/**
 * Resolves a Riot ID (e.g. Garen#NA1) to account PUUID
 */
export const getAccountByRiotId = async (riotId, platform) => {
  const parts = riotId.split('#');
  if (parts.length !== 2) {
    throw new Error("Invalid Riot ID format. Use Name#Tag (e.g., BrandMain#NA1)");
  }
  
  const gameName = encodeURIComponent(parts[0].trim());
  const tagLine = encodeURIComponent(parts[1].trim());
  const routeRegion = getRoutingRegion(platform);

  const urlPath = `/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
  return requestRiotApi(urlPath, routeRegion, 'account');
};

/**
 * Fetches Summoner profile details by PUUID
 */
export const getSummonerByPuuid = async (puuid, platform) => {
  const urlPath = `/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  return requestRiotApi(urlPath, platform.toLowerCase(), 'platform');
};

/**
 * Fetches top Champion Masteries by PUUID
 */
export const getTopMasteriesByPuuid = async (puuid, platform, count = 5) => {
  const urlPath = `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`;
  return requestRiotApi(urlPath, platform.toLowerCase(), 'platform');
};
