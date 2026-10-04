import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Checkbox } from '../../src/components/Checkbox';
import { loginRequest } from '../../src/api/auth';

export default function LoginScreen() {
  const colors = useThemeStore((state) => state.colors);
  const colorScheme = useThemeStore((state) => state.colorScheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const setAuth = useAuthStore((state) => state.setAuth);

  // The WebView will automatically update when latitude/longitude change since we're using them in the source
  const [userType, setUserType] = useState<'Sub Admin' | 'Super Admin'>('Sub Admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.card }]}>
            <Image
              source={require('../../assets/episilion_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={[styles.badge, { backgroundColor: colors.success }]}>
            <Text style={styles.badgeText}>UPSA FIELD OPERATIONS</Text>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>Sign In to Team Portal</Text>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
              <Text style={styles.themeIcon}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Field Operations & Hostel Management
          </Text>
        </View>

        {/* User Type Toggle */}
        <View style={[styles.toggleContainer, { backgroundColor: colors.inputBackground }]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              userType === 'Sub Admin' && { backgroundColor: colors.success },
            ]}
            onPress={() => setUserType('Sub Admin')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: userType === 'Sub Admin' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Sub Admin
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              userType === 'Super Admin' && { backgroundColor: colors.success },
            ]}
            onPress={() => setUserType('Super Admin')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: userType === 'Super Admin' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Super Admin
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <View style={styles.passwordContainer}>
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={styles.forgotContainer}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={[styles.eyeText, { color: colors.textSecondary }]}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonSection}>
          <Button
            title={isLoading ? 'Signing In...' : 'Sign In'}
            onPress={async () => {
              if (!email.trim() || !password) {
                Alert.alert('Validation Error', 'Please enter both email and password');
                return;
              }

              setIsLoading(true);
              try {
                const response = await loginRequest(email.trim().toLowerCase(), password);
                
                // Extract user data from response
                const { token, user } = response;
                
                // Set authentication in store
                setAuth(
                  { 
                    id: user.id.toString(), 
                    email: user.email, 
                    name: user.full_name 
                  },
                  user.role,
                  token
                );
                
                // Navigate based on user role
                if (user.role === 'super_admin') {
                  router.replace('/(super-admin)');
                } else {
                  router.replace('/(sub-admin)');
                }
              } catch (error: any) {
                console.error('Login error:', error);
                let errorMessage = 'Login failed. Please try again.';
                
                if (error.response?.data?.message) {
                  errorMessage = error.response.data.message;
                } else if (error.message) {
                  errorMessage = error.message;
                }
                
                Alert.alert('Login Error', errorMessage);
              } finally {
                setIsLoading(false);
              }
            }}
            loading={isLoading}
            icon={!isLoading && <Text style={styles.arrowIcon}>→</Text>}
          />
        </View>

        {/* Provisioned Device Access */}
        {/* <View style={[styles.infoSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Provisioned Device Access
            </Text>
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Officer accounts are managed directly by Super Admin
          </Text>
          <Text style={[styles.infoEmail, { color: colors.primary }]}>
            admin@episilion.com.gh
          </Text>
          <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
            for credential resets or IMEI authorization
          </Text>
        </View> */}

        {/* Credential Presets */}
        <View style={styles.presetsSection}>
          <Text style={[styles.presetsTitle, { color: colors.textSecondary }]}>
            FAST FIELD CREDENTIAL PRESETS
          </Text>
          <View style={styles.presetItem}>
            <View style={[styles.presetDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.presetText, { color: colors.text }]}>
              Sub-Admin (Field Collector)
            </Text>
          </View>
          <View style={styles.presetItem}>
            <View style={[styles.presetDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.presetText, { color: colors.text }]}>
              Super Admin (Operations Lead)
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={[styles.locationSection, { borderTopColor: colors.divider }]}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={[styles.locationText, { color: colors.textSecondary }]}>
            Madina / UPSA Operational Cluster
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  titleSection: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  themeToggle: {
    padding: 8,
  },
  themeIcon: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 24,
  },
  passwordContainer: {
    position: 'relative',
  },
  forgotContainer: {
    position: 'absolute',
    right: 40,
    top: 0,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '500',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 30,
  },
  eyeText: {
    fontSize: 18,
  },
  buttonSection: {
    gap: 12,
    marginBottom: 24,
  },
  arrowIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  fingerprintIcon: {
    fontSize: 18,
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    marginBottom: 4,
  },
  infoEmail: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 12,
  },
  presetsSection: {
    marginBottom: 24,
  },
  presetsTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  presetText: {
    fontSize: 13,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  locationText: {
    fontSize: 12,
  },
});
