import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/app-themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';

type Props = {
  /** Local file of the photo already taken, or null. */
  photoUri: string | null;
  onCapture: (uri: string) => void;
  disabled?: boolean;
};

/**
 * The attendance selfie. It opens the **front camera only**: there is no camera switch, no gallery and
 * no file picker, so the photo is always a fresh picture of the person punching.
 */
export function SelfieCapture({ photoUri, onCapture, disabled }: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [taking, setTaking] = useState(false);
  const camera = useRef<CameraView>(null);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setReady(false);
    setOpen(true);
  };

  const shoot = async () => {
    if (!camera.current || taking || !ready) return;
    setTaking(true);
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.6, exif: false });
      if (picture?.uri) {
        onCapture(picture.uri);
        setOpen(false);
      }
    } finally {
      setTaking(false);
    }
  };

  const denied = permission && !permission.granted && !permission.canAskAgain;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: photoUri ? colors.successBorder : colors.border }]}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.thumb} accessibilityLabel="Your attendance photo" />
      ) : (
        <View style={[styles.thumb, styles.placeholder, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="camera-outline" size={26} color={colors.primaryText} />
        </View>
      )}

      <View style={styles.text}>
        <ThemedText weight="bold" style={{ color: colors.text, fontSize: 15 }}>
          {photoUri ? 'Photo ready' : 'Take your photo'}
        </ThemedText>
        <ThemedText style={{ color: denied ? colors.errorText : colors.textSecondary, fontSize: 12, lineHeight: 16 }}>
          {denied
            ? 'Camera access is off. Allow it in Settings.'
            : photoUri
              ? 'You can now swipe to record attendance.'
              : 'A photo of you is needed to check in or out.'}
        </ThemedText>
      </View>

      <Pressable
        onPress={denied ? () => void Linking.openSettings() : openCamera}
        disabled={disabled}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: photoUri ? colors.primaryLight : colors.primary, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        ]}
      >
        <ThemedText weight="bold" style={{ color: photoUri ? colors.primaryText : colors.onPrimary, fontSize: 13 }}>
          {denied ? 'Settings' : photoUri ? 'Retake' : 'Open camera'}
        </ThemedText>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <View style={styles.camera}>
          {/* facing is fixed to the front camera on purpose. */}
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing="front"
            mirror
            onCameraReady={() => setReady(true)}
          />

          <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
            <Pressable
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close camera"
              hitSlop={8}
              style={styles.close}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Pressable>
            <ThemedText weight="bold" style={styles.hint}>Look at the camera</ThemedText>
            <View style={styles.close} />
          </View>

          <View style={[styles.bottom, { paddingBottom: insets.bottom + 28 }]}>
            <Pressable
              onPress={shoot}
              disabled={!ready || taking}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
              style={({ pressed }) => [styles.shutter, { opacity: !ready || taking ? 0.5 : pressed ? 0.8 : 1 }]}
            >
              {taking ? <ActivityIndicator color="#16162B" /> : <View style={styles.shutterInner} />}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, padding: 6 },
  thumb: { width: 64, height: 64, borderRadius: 14 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 0 },
  button: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginRight: 4 },
  camera: { flex: 1, backgroundColor: '#000000' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  hint: { color: '#FFFFFF', fontSize: 15 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF' },
});
