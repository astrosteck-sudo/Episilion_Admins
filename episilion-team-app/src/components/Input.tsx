import React from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface InputProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  rightAction?: React.ReactNode;
  onRightActionPress?: () => void;
  /** Validation message shown beneath the field; also tints the border. */
  error?: string;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  rightAction,
  onRightActionPress,
  error,
}: InputProps) {
  const colors = useThemeStore((state) => state.colors);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.inputBackground,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
        {rightAction && (
          <TouchableOpacity onPress={onRightActionPress} style={styles.rightAction}>
            {rightAction}
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    // 16px is the threshold below which iOS Safari zooms the page on focus.
    fontSize: 16,
  },
  rightAction: {
    marginLeft: 8,
  },
  error: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 2,
  },
});
