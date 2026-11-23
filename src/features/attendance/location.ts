import * as Location from 'expo-location';

export const captureAttendanceLocation = async () => {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== Location.PermissionStatus.GRANTED) {
    throw new Error('LOCATION_PERMISSION_DENIED');
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) throw new Error('LOCATION_SERVICE_DISABLED');

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyMeters: position.coords.accuracy ?? null,
    capturedAt: new Date(position.timestamp).toISOString(),
  };
};
