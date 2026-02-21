const WORLD_CITIES = [
  // Europe
  { city: 'London', latitude: 51.5074, longitude: -0.1278 },
  { city: 'Paris', latitude: 48.8566, longitude: 2.3522 },
  { city: 'Berlin', latitude: 52.5200, longitude: 13.4050 },
  { city: 'Rome', latitude: 41.9028, longitude: 12.4964 },
  { city: 'Madrid', latitude: 40.4168, longitude: -3.7038 },
  { city: 'Amsterdam', latitude: 52.3676, longitude: 4.9041 },
  { city: 'Vienna', latitude: 48.2082, longitude: 16.3738 },
  { city: 'Stockholm', latitude: 59.3293, longitude: 18.0686 },
  { city: 'Zurich', latitude: 47.3769, longitude: 8.5417 },
  { city: 'Warsaw', latitude: 52.2297, longitude: 21.0122 },
  { city: 'Lisbon', latitude: 38.7223, longitude: -9.1393 },
  { city: 'Athens', latitude: 37.9838, longitude: 23.7275 },
  // North America
  { city: 'New York', latitude: 40.7128, longitude: -74.0060 },
  { city: 'San Francisco', latitude: 37.7749, longitude: -122.4194 },
  { city: 'Toronto', latitude: 43.6532, longitude: -79.3832 },
  { city: 'Chicago', latitude: 41.8781, longitude: -87.6298 },
  { city: 'Los Angeles', latitude: 34.0522, longitude: -118.2437 },
  { city: 'Miami', latitude: 25.7617, longitude: -80.1918 },
  { city: 'Mexico City', latitude: 19.4326, longitude: -99.1332 },
  { city: 'Vancouver', latitude: 49.2827, longitude: -123.1207 },
  { city: 'Montreal', latitude: 45.5017, longitude: -73.5673 },
  // South America
  { city: 'São Paulo', latitude: -23.5505, longitude: -46.6333 },
  { city: 'Buenos Aires', latitude: -34.6037, longitude: -58.3816 },
  { city: 'Bogotá', latitude: 4.7110, longitude: -74.0721 },
  { city: 'Santiago', latitude: -33.4489, longitude: -70.6693 },
  { city: 'Lima', latitude: -12.0464, longitude: -77.0428 },
  // Asia
  { city: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
  { city: 'Beijing', latitude: 39.9042, longitude: 116.4074 },
  { city: 'Shanghai', latitude: 31.2304, longitude: 121.4737 },
  { city: 'Seoul', latitude: 37.5665, longitude: 126.9780 },
  { city: 'Mumbai', latitude: 19.0760, longitude: 72.8777 },
  { city: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  { city: 'Bangkok', latitude: 13.7563, longitude: 100.5018 },
  { city: 'Dubai', latitude: 25.2048, longitude: 55.2708 },
  { city: 'Hong Kong', latitude: 22.3193, longitude: 114.1694 },
  { city: 'Taipei', latitude: 25.0330, longitude: 121.5654 },
  { city: 'Jakarta', latitude: -6.2088, longitude: 106.8456 },
  { city: 'Delhi', latitude: 28.7041, longitude: 77.1025 },
  { city: 'Osaka', latitude: 34.6937, longitude: 135.5023 },
  { city: 'Istanbul', latitude: 41.0082, longitude: 28.9784 },
  // Africa
  { city: 'Cairo', latitude: 30.0444, longitude: 31.2357 },
  { city: 'Lagos', latitude: 6.5244, longitude: 3.3792 },
  { city: 'Nairobi', latitude: -1.2921, longitude: 36.8219 },
  { city: 'Cape Town', latitude: -33.9249, longitude: 18.4241 },
  { city: 'Casablanca', latitude: 33.5731, longitude: -7.5898 },
  { city: 'Johannesburg', latitude: -26.2041, longitude: 28.0473 },
  // Oceania
  { city: 'Sydney', latitude: -33.8688, longitude: 151.2093 },
  { city: 'Melbourne', latitude: -37.8136, longitude: 144.9631 },
  { city: 'Auckland', latitude: -36.8485, longitude: 174.7633 },
  { city: 'Brisbane', latitude: -27.4698, longitude: 153.0251 },
];

export const getRandomCity = (existingCities = []) => {
  const available = WORLD_CITIES.filter(c => !existingCities.includes(c.city));
  const pool = available.length > 0 ? available : WORLD_CITIES;
  return pool[Math.floor(Math.random() * pool.length)];
};

/**
 * Distributes types for new nodes based on proportion config,
 * considering the types already assigned to existing nodes.
 *
 * @param {number} newCount - Number of new nodes to create
 * @param {Array} existingNodes - Current nodes array
 * @param {Object} proportionConfig - e.g. { strong: { proportion: 0.3 }, medium: { proportion: 0.5 }, weak: { proportion: 0.2 } }
 * @param {string} typeKey - 'client_type' or 'dynamism_type'
 * @returns {string[]} Array of type strings for the new nodes
 */
export const distributeTypes = (newCount, existingNodes, proportionConfig, typeKey) => {
  const totalCount = existingNodes.length + newCount;
  const types = Object.keys(proportionConfig);

  // Count existing assignments
  const existingCounts = {};
  types.forEach(type => {
    existingCounts[type] = existingNodes.filter(n => n[typeKey] === type).length;
  });

  // Calculate how many of each type we need for the new nodes
  const result = [];
  let assigned = 0;

  types.forEach((type, i) => {
    if (i === types.length - 1) {
      // Last type gets all remaining
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

  // Shuffle to avoid predictable ordering
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
