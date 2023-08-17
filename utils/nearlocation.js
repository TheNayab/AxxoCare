function calculateDistance(lat1, lon1, lat2, lon2) {
  const radius = 6371; // Earth's radius in kilometers

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

}

module.exports = calculateDistance;
