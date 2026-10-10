import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

export type AlertVariant = 'error' | 'success' | 'warning' | 'info' | 'question';

export interface AlertButton {
  text?: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: (value?: string) => void;
}

export interface AlertOptions {
  variant?: AlertVariant;
  /** Tapping the backdrop dismisses the alert. Defaults to true. */
  cancelable?: boolean;
}

interface AlertState {
  title: string;
  message?: string;
  buttons: AlertButton[];
  variant: AlertVariant;
  cancelable: boolean;
  prompt?: { placeholder?: string; defaultValue?: string };
}

type IconName = keyof typeof Ionicons.glyphMap;

const VARIANT_META: Record<
  AlertVariant,
  { icon: IconName; colorKey: 'error' | 'success' | 'accent' | 'primary' }
> = {
  error: { icon: 'alert-circle', colorKey: 'error' },
  success: { icon: 'checkmark-circle', colorKey: 'success' },
  warning: { icon: 'warning', colorKey: 'accent' },
  info: { icon: 'information-circle', colorKey: 'primary' },
  question: { icon: 'help-circle', colorKey: 'primary' },
};

/** Picks a sensible variant from the wording when the caller does not specify one. */
function inferVariant(title: string, message?: string): AlertVariant {
  const text = `${title} ${message ?? ''}`.toLowerCase();
  if (/(error|failed|failure|denied|invalid|unable|cannot|blocked|unavailable)/.test(text)) {
    return 'error';
  }
  if (/(success|submitted|approved|published|saved|complete)/.test(text)) return 'success';
  if (/(warning|attention|careful|incomplete|required)/.test(text)) return 'warning';
  if (/(\?|confirm|are you sure|reject|delete|remove|log out)/.test(text)) return 'question';
  return 'info';
}

interface AppAlertContextValue {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ) => void;
  prompt: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    placeholder?: string,
    defaultValue?: string,
  ) => void;
}

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const colors = useThemeStore((state) => state.colors);
  const [state, setState] = useState<AlertState | null>(null);
  const [promptValue, setPromptValue] = useState('');

  const close = useCallback(() => setState(null), []);

  const alert = useCallback<AppAlertContextValue['alert']>(
    (title, message, buttons, options) => {
      setState({
        title,
        message,
        buttons: buttons?.length ? buttons : [{ text: 'OK' }],
        variant: options?.variant ?? inferVariant(title, message),
        cancelable: options?.cancelable ?? true,
      });
    },
    [],
  );

  const prompt = useCallback<AppAlertContextValue['prompt']>(
    (title, message, buttons, placeholder, defaultValue) => {
      setPromptValue(defaultValue ?? '');
      setState({
        title,
        message,
        buttons: buttons?.length ? buttons : [{ text: 'Cancel', style: 'cancel' }, { text: 'OK' }],
        variant: inferVariant(title, message),
        cancelable: true,
        prompt: { placeholder, defaultValue },
      });
    },
    [],
  );

  const value = useMemo(() => ({ alert, prompt }), [alert, prompt]);

  const handlePress = (button: AlertButton) => {
    const submitted = promptValue;
    close();
    button.onPress?.(submitted);
  };

  const meta = state ? VARIANT_META[state.variant] : null;
  const accent = meta ? colors[meta.colorKey] : colors.primary;
  const isStacked = (state?.buttons.length ?? 0) > 2;

  return (
    <AppAlertContext.Provider value={value}>
      {children}

      <Modal
        visible={state !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => state?.cancelable && close()}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.backdrop}
            onPress={() => state?.cancelable && close()}
          >
            {/* Stop taps inside the card from dismissing it. */}
            <TouchableOpacity activeOpacity={1} style={styles.cardWrapper}>
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                {meta && (
                  <View style={[styles.iconBadge, { backgroundColor: accent + '1A' }]}>
                    <Ionicons name={meta.icon} size={26} color={accent} />
                  </View>
                )}

                <Text style={[styles.title, { color: colors.text }]}>{state?.title}</Text>

                {state?.message ? (
                  <Text style={[styles.message, { color: colors.textSecondary }]}>
                    {state.message}
                  </Text>
                ) : null}

                {state?.prompt && (
                  <TextInput
                    value={promptValue}
                    onChangeText={setPromptValue}
                    placeholder={state.prompt.placeholder}
                    placeholderTextColor={colors.placeholder}
                    autoFocus
                    multiline
                    style={[
                      styles.promptInput,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                  />
                )}

                <View style={[styles.buttonGroup, isStacked && styles.buttonGroupStacked]}>
                  {state?.buttons.map((button, index) => {
                    const isCancel = button.style === 'cancel';
                    const isDestructive = button.style === 'destructive';
                    const isPrimary = !isCancel && !isDestructive;

                    return (
                      <TouchableOpacity
                        key={`${button.text ?? 'button'}-${index}`}
                        activeOpacity={0.85}
                        onPress={() => handlePress(button)}
                        style={[
                          styles.button,
                          isStacked && styles.buttonFullWidth,
                          isCancel && { borderWidth: 1, borderColor: colors.border },
                          isDestructive && { backgroundColor: colors.error },
                          isPrimary && { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.buttonText,
                            { color: isCancel ? colors.text : '#FFFFFF' },
                          ]}
                        >
                          {button.text ?? 'OK'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </AppAlertContext.Provider>
  );
}

/** Drop-in replacement for `Alert.alert` with a premium presentation. */
export function useAppAlert() {
  const context = useContext(AppAlertContext);
  if (!context) {
    throw new Error('useAppAlert must be used inside an AppAlertProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  promptInput: {
    width: '100%',
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    // 16px is the threshold below which iOS Safari zooms the page on focus.
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  buttonGroupStacked: {
    flexDirection: 'column-reverse',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonFullWidth: {
    flex: 0,
    width: '100%',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
