import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/app-themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { DateField } from '@/features/attendance/components/DateField';
import { fromIsoDate, type RangePreset } from '@/features/attendance/utils';

export type DateRange = { from: string; to: string };

type Props = {
  draft: DateRange;
  onDraftChange: (range: DateRange) => void;
  onSearch: () => void;
  onPreset: (preset: RangePreset) => void;
  activePreset: RangePreset | null;
  searching: boolean;
};

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: 'last7', label: 'Last 7 days' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
];

export function DateRangeFilter({ draft, onDraftChange, onSearch, onPreset, activePreset, searching }: Props) {
  const { colors } = useAppTheme();
  const invalid = draft.from > draft.to;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Segmented control: the quick ranges are mutually exclusive, so they read as one control. */}
      <View style={[styles.segment, { backgroundColor: colors.surfaceSecondary }]} accessibilityRole="tablist">
        {PRESETS.map((preset) => {
          const active = activePreset === preset.key;
          return (
            <Pressable
              key={preset.key}
              onPress={() => onPreset(preset.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[
                styles.option,
                active && { backgroundColor: colors.primary },
              ]}
            >
              <ThemedText
                weight={active ? 'bold' : 'semiBold'}
                style={[styles.optionText, { color: active ? colors.onPrimary : colors.textSecondary }]}
                numberOfLines={1}
              >
                {preset.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.fields}>
        <DateField
          label="From"
          value={draft.from}
          maximumDate={fromIsoDate(draft.to)}
          onChange={(from) => onDraftChange({ ...draft, from })}
        />
        <DateField
          label="To"
          value={draft.to}
          minimumDate={fromIsoDate(draft.from)}
          onChange={(to) => onDraftChange({ ...draft, to })}
        />
      </View>

      {invalid ? (
        <ThemedText style={[styles.error, { color: colors.errorText }]}>
          “From” must be on or before “To”.
        </ThemedText>
      ) : null}

      <Pressable
        onPress={onSearch}
        disabled={invalid || searching}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.search,
          { backgroundColor: invalid ? colors.border : colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        {searching ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <>
            <Ionicons name="search" size={18} color={invalid ? colors.textMuted : colors.onPrimary} />
            <ThemedText weight="bold" style={{ color: invalid ? colors.textMuted : colors.onPrimary }}>
              Show records
            </ThemedText>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 20, padding: 12, gap: 12 },
  segment: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4 },
  option: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 11, paddingVertical: 9 },
  optionText: { fontSize: 13 },
  fields: { flexDirection: 'row', gap: 10 },
  error: { fontSize: 13 },
  search: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 13 },
});
