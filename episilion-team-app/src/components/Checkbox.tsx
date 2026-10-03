import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  status?: string;
}

export function Checkbox({ label, checked, onChange, status }: CheckboxProps) {
  const colors = useThemeStore((state) => state.colors);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => onChange(!checked)}
        style={[styles.checkbox, { borderColor: colors.border }]}
      >
        {checked && <View style={[styles.check, { backgroundColor: colors.success }]} />}
      </TouchableOpacity>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {status && (
          <Text style={[styles.status, { color: colors.success }]}>
            • {status}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  check: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  status: {
    fontSize: 12,
    marginTop: 2,
  },
});
