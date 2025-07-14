import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface FilterChip {
  id: string;
  label: string;
  count?: number;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selectedChip: string;
  onChipPress: (chipId: string) => void;
}

export function FilterChips({ chips, selectedChip, onChipPress }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {chips.map((chip) => (
        <TouchableOpacity
          key={chip.id}
          style={[
            styles.chip,
            selectedChip === chip.id && styles.chipSelected,
          ]}
          onPress={() => onChipPress(chip.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chipText,
              selectedChip === chip.id && styles.chipTextSelected,
            ]}
          >
            {chip.label}
            {chip.count !== undefined && ` (${chip.count})`}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
});
