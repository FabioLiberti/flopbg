const WORLD_CITIES = [
  // Italy
  { city: 'Rome', latitude: 41.9028, longitude: 12.4964, region: 'italy' },
  { city: 'Milan', latitude: 45.4642, longitude: 9.1900, region: 'italy' },
  { city: 'Naples', latitude: 40.8518, longitude: 14.2681, region: 'italy' },
  { city: 'Turin', latitude: 45.0705, longitude: 7.6868, region: 'italy' },
  { city: 'Florence', latitude: 43.7696, longitude: 11.2558, region: 'italy' },
  { city: 'Venice', latitude: 45.4408, longitude: 12.3155, region: 'italy' },
  { city: 'Bologna', latitude: 44.4949, longitude: 11.3426, region: 'italy' },
  { city: 'Palermo', latitude: 38.1157, longitude: 13.3615, region: 'italy' },
  { city: 'Genoa', latitude: 44.4056, longitude: 8.9463, region: 'italy' },
  { city: 'Bari', latitude: 41.1175, longitude: 16.8703, region: 'italy' },
  { city: 'Catania', latitude: 37.4979, longitude: 15.0878, region: 'italy' },
  { city: 'Verona', latitude: 45.4386, longitude: 10.9945, region: 'italy' },
  { city: 'Padua', latitude: 45.4060, longitude: 11.8776, region: 'italy' },
  { city: 'Cagliari', latitude: 39.2238, longitude: 9.1217, region: 'italy' },
  { city: 'Messina', latitude: 38.1938, longitude: 15.5540, region: 'italy' },
  { city: 'Brescia', latitude: 45.5419, longitude: 10.2118, region: 'italy' },
  // Europe (non-Italy)
  { city: 'London', latitude: 51.5074, longitude: -0.1278, region: 'europe' },
  { city: 'Paris', latitude: 48.8566, longitude: 2.3522, region: 'europe' },
  { city: 'Berlin', latitude: 52.5200, longitude: 13.4050, region: 'europe' },
  { city: 'Madrid', latitude: 40.4168, longitude: -3.7038, region: 'europe' },
  { city: 'Amsterdam', latitude: 52.3676, longitude: 4.9041, region: 'europe' },
  { city: 'Vienna', latitude: 48.2082, longitude: 16.3738, region: 'europe' },
  { city: 'Stockholm', latitude: 59.3293, longitude: 18.0686, region: 'europe' },
  { city: 'Zurich', latitude: 47.3769, longitude: 8.5417, region: 'europe' },
  { city: 'Warsaw', latitude: 52.2297, longitude: 21.0122, region: 'europe' },
  { city: 'Lisbon', latitude: 38.7223, longitude: -9.1393, region: 'europe' },
  { city: 'Athens', latitude: 37.9838, longitude: 23.7275, region: 'europe' },
  { city: 'Istanbul', latitude: 41.0082, longitude: 28.9784, region: 'europe' },
  // North America
  { city: 'New York', latitude: 40.7128, longitude: -74.0060, region: 'global' },
  { city: 'San Francisco', latitude: 37.7749, longitude: -122.4194, region: 'global' },
  { city: 'Toronto', latitude: 43.6532, longitude: -79.3832, region: 'global' },
  { city: 'Chicago', latitude: 41.8781, longitude: -87.6298, region: 'global' },
  { city: 'Los Angeles', latitude: 34.0522, longitude: -118.2437, region: 'global' },
  { city: 'Miami', latitude: 25.7617, longitude: -80.1918, region: 'global' },
  { city: 'Mexico City', latitude: 19.4326, longitude: -99.1332, region: 'global' },
  { city: 'Vancouver', latitude: 49.2827, longitude: -123.1207, region: 'global' },
  { city: 'Montreal', latitude: 45.5017, longitude: -73.5673, region: 'global' },
  // South America
  { city: 'São Paulo', latitude: -23.5505, longitude: -46.6333, region: 'global' },
  { city: 'Buenos Aires', latitude: -34.6037, longitude: -58.3816, region: 'global' },
  { city: 'Bogotá', latitude: 4.7110, longitude: -74.0721, region: 'global' },
  { city: 'Santiago', latitude: -33.4489, longitude: -70.6693, region: 'global' },
  { city: 'Lima', latitude: -12.0464, longitude: -77.0428, region: 'global' },
  // Asia
  { city: 'Tokyo', latitude: 35.6762, longitude: 139.6503, region: 'global' },
  { city: 'Beijing', latitude: 39.9042, longitude: 116.4074, region: 'global' },
  { city: 'Shanghai', latitude: 31.2304, longitude: 121.4737, region: 'global' },
  { city: 'Seoul', latitude: 37.5665, longitude: 126.9780, region: 'global' },
  { city: 'Mumbai', latitude: 19.0760, longitude: 72.8777, region: 'global' },
  { city: 'Singapore', latitude: 1.3521, longitude: 103.8198, region: 'global' },
  { city: 'Bangkok', latitude: 13.7563, longitude: 100.5018, region: 'global' },
  { city: 'Dubai', latitude: 25.2048, longitude: 55.2708, region: 'global' },
  { city: 'Hong Kong', latitude: 22.3193, longitude: 114.1694, region: 'global' },
  { city: 'Taipei', latitude: 25.0330, longitude: 121.5654, region: 'global' },
  { city: 'Jakarta', latitude: -6.2088, longitude: 106.8456, region: 'global' },
  { city: 'Delhi', latitude: 28.7041, longitude: 77.1025, region: 'global' },
  { city: 'Osaka', latitude: 34.6937, longitude: 135.5023, region: 'global' },
  // Africa
  { city: 'Cairo', latitude: 30.0444, longitude: 31.2357, region: 'global' },
  { city: 'Lagos', latitude: 6.5244, longitude: 3.3792, region: 'global' },
  { city: 'Nairobi', latitude: -1.2921, longitude: 36.8219, region: 'global' },
  { city: 'Cape Town', latitude: -33.9249, longitude: 18.4241, region: 'global' },
  { city: 'Casablanca', latitude: 33.5731, longitude: -7.5898, region: 'global' },
  { city: 'Johannesburg', latitude: -26.2041, longitude: 28.0473, region: 'global' },
  // Oceania
  { city: 'Sydney', latitude: -33.8688, longitude: 151.2093, region: 'global' },
  { city: 'Melbourne', latitude: -37.8136, longitude: 144.9631, region: 'global' },
  { city: 'Auckland', latitude: -36.8485, longitude: 174.7633, region: 'global' },
  { city: 'Brisbane', latitude: -27.4698, longitude: 153.0251, region: 'global' },
];

export const getRandomCity = (existingCities = [], view = 'global') => {
  const regionCities = getCitiesByView(view);
  const available = regionCities.filter(c => !existingCities.includes(c.city));
  const pool = available.length > 0 ? available : regionCities;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const getCitiesByView = (view) => {
  if (view === 'national') return WORLD_CITIES.filter(c => c.region === 'italy');
  if (view === 'europe') return WORLD_CITIES.filter(c => c.region === 'europe' || c.region === 'italy');
  return WORLD_CITIES;
};

export const getNodeCityNames = (view) => {
  return getCitiesByView(view).map(c => c.city);
};

/**
 * Distributes types for new nodes based on proportion config,
 * considering the types already assigned to existing nodes.
 */
export const distributeTypes = (newCount, existingNodes, proportionConfig, typeKey) => {
  const totalCount = existingNodes.length + newCount;
  const types = Object.keys(proportionConfig);

  const existingCounts = {};
  types.forEach(type => {
    existingCounts[type] = existingNodes.filter(n => n[typeKey] === type).length;
  });

  const result = [];
  let assigned = 0;

  types.forEach((type, i) => {
    if (i === types.length - 1) {
      const remaining = newCount - assigned;
      for (let j = 0; j < remaining; j++) result.push(type);
    } else {
      const targetTotal = Math.round(totalCount * (proportionConfig[type].proportion || 0));
      const needed = Math.max(0, targetTotal - (existingCounts[type] || 0));
      const toAdd = Math.min(needed, newCount - assigned);
      for (let j = 0; j < toAdd; j++) result.push(type);
      assigned += toAdd;
    }
  });

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

/**
 * Picks the best type for a single new node to balance proportions.
 */
export const pickTypeForNewNode = (existingNodes, proportionConfig, typeKey) => {
  const totalCount = existingNodes.length + 1;
  let bestType = Object.keys(proportionConfig)[0];
  let maxDeficit = -Infinity;

  for (const [type, config] of Object.entries(proportionConfig)) {
    const targetCount = totalCount * (config.proportion || 0);
    const currentCount = existingNodes.filter(n => n[typeKey] === type).length;
    const deficit = targetCount - currentCount;
    if (deficit > maxDeficit) {
      maxDeficit = deficit;
      bestType = type;
    }
  }

  return bestType;
};

export default WORLD_CITIES;
