import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../src/store/themeStore';
import { router } from 'expo-router';

export default function SuperAdminHomeScreen() {
  const colors = useThemeStore((state) => state.colors);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const colorScheme = useThemeStore((state) => state.colorScheme);
  const [activeFilter, setActiveFilter] = useState('All items');

  const hostels = [
    {
      id: 1,
      name: 'Premier Heights Annex',
      location: 'Legon, Accra',
      price: '₵ 4,500',
      scout: 'Emmanuel A.',
      image: require('../../assets/episilion_logo.png'),
      isNew: true,
    },
    {
      id: 2,
      name: 'University Hall',
      location: 'KNUST, Kumasi',
      price: '₵ 3,200',
      scout: 'Sarah K.',
      image: require('../../assets/episilion_logo.png'),
      isNew: true,
    },
    {
      id: 3,
      name: 'Campus View Lodge',
      location: 'Madina, Accra',
      price: '₵ 2,800',
      scout: 'John D.',
      image: require('../../assets/episilion_logo.png'),
      isNew: true,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../assets/episilion_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.greeting, { color: colors.text }]}>Welcome back, Deon</Text>
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>5 items waiting for review</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Text style={styles.themeIcon}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.success }]}>
              <Text style={styles.statIconText}>🏠</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>New Hostels</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>3 in queue</Text>
            </View>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.statIconText}>✏️</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Update Requests</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>2 waiting</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search hostels..."
            placeholderTextColor={colors.placeholder}
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'All items' ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            onPress={() => setActiveFilter('All items')}
          >
            <Text style={[styles.filterText, activeFilter === 'All items' ? { color: '#FFFFFF' } : { color: colors.text }]}>All items</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'Today' ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            onPress={() => setActiveFilter('Today')}
          >
            <Text style={[styles.filterText, activeFilter === 'Today' ? { color: '#FFFFFF' } : { color: colors.text }]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'This Week' ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            onPress={() => setActiveFilter('This Week')}
          >
            <Text style={[styles.filterText, activeFilter === 'This Week' ? { color: '#FFFFFF' } : { color: colors.text }]}>This Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'Legon Area' ? { backgroundColor: colors.primary } : { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            onPress={() => setActiveFilter('Legon Area')}
          >
            <Text style={[styles.filterText, activeFilter === 'Legon Area' ? { color: '#FFFFFF' } : { color: colors.text }]}>Legon Area</Text>
          </TouchableOpacity>
        </View>

        {/* Hostel List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>New Entries</Text>
        </View>

        {hostels.map((hostel) => (
          <View
            key={hostel.id}
            style={[styles.hostelCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Image source={hostel.image} style={styles.hostelImage} />
            <View style={styles.hostelInfo}>
              <View style={styles.hostelHeader}>
                <Text style={[styles.hostelName, { color: colors.text }]}>{hostel.name}</Text>
                <View style={[styles.newBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>
              <Text style={[styles.hostelLocation, { color: colors.textSecondary }]}>
                📍 {hostel.location}
              </Text>
              <Text style={[styles.hostelPrice, { color: colors.primary }]}>
                {hostel.price}
              </Text>
              <Text style={[styles.hostelScout, { color: colors.textSecondary }]}>
                Scout: {hostel.scout}
              </Text>
            </View>
            <TouchableOpacity style={[styles.auditButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.auditButtonText}>Audit</Text>
            </TouchableOpacity>
          </View>
        ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backText: {
    fontSize: 24,
    fontWeight: '600',
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 50,
    height: 50,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
  },
  notificationBadge: {
    marginTop: 4,
  },
  notificationText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
  },
  themeToggle: {
    padding: 8,
  },
  themeIcon: {
    fontSize: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconText: {
    fontSize: 24,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  hostelCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  hostelImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  hostelInfo: {
    flex: 1,
  },
  hostelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hostelName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  hostelLocation: {
    fontSize: 13,
    marginBottom: 4,
  },
  hostelPrice: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  hostelScout: {
    fontSize: 12,
  },
  auditButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  auditButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

