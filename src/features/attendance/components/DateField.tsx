import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/app-themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatTableDate, fromIsoDate, toIsoDate } from '@/features/attendance/utils';

type Props = {
  label: string;
  /** `YYYY-MM-DD` */
  value: string;
  onChange: (value: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

export function DateField({ label, value, onChange, minimumDate, maximumDate }: Props) {
  const { colors } = useAppTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState<Date>(() => fromIsoDate(value));

  const open = () => {
    const current = fromIsoDate(value);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event: DateTimePickerEvent, picked?: Date) => {
          if (event.type === 'set' && picked) onChange(toIsoDate(picked));
        },
      });
      return;
    }
    setIosDraft(current);
    setIosOpen(true);
  };

  return (
    <>
      <View style={styles.wrap}>
        <ThemedText style={[styles.label, { color: colors.textSecondary }]} weight="semiBold">
          {label}
        </ThemedText>
        <Pressable
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={`${label} date, ${formatTableDate(value)}. Tap to change.`}
          style={({ pressed }) => [
            styles.field,
            {
              backgroundColor: colors.inputBackground,
              borderColor: pressed ? colors.primary : colors.inputBorder,
            },
          ]}
        >
          <ThemedText style={styles.value} weight="bold">{formatTableDate(value)}</ThemedText>
          <Ionicons name="calendar-outline" size={18} color={colors.primaryText} />
        </Pressable>
      </View>

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="fade" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setIosOpen(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => undefined}>
              <DateTimePicker
                value={iosDraft}
                mode="date"
                display="inline"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                accentColor={colors.primary}
                onChange={(_, picked) => picked && setIosDraft(picked)}
              />
              <Pressable
                style={[styles.done, { backgroundColor: colors.primary }]}
                onPress={() => {
                  onChange(toIsoDate(iosDraft));
                  setIosOpen(false);
                }}
              >
                <ThemedText weight="bold" style={{ color: colors.onPrimary }}>Apply date</ThemedText>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 6 },
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  label: { fontSize: 13 },
  value: { fontSize: 16, fontVariant: ['tabular-nums'] },
  backdrop: { flex: 1, justifyContent: 'center', padding: 20 },
  sheet: { borderRadius: 20, padding: 12, gap: 8 },
  done: { alignItems: 'center', borderRadius: 14, paddingVertical: 13 },
});
