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
              <Text style={[styles.statHint, { color: colors.textSecondary }]}>
                Awaiting your audit
              </Text>
            </View>
            <View style={[styles.statCountBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.statCountText}>3</Text>
            </View>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.statIconText}>✏️</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Update Requests</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>2 waiting</Text>
              <Text style={[styles.statHint, { color: colors.textSecondary }]}>
                Pending changes to review
              </Text>
            </View>
            <View style={[styles.statCountBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.statCountText}>2</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'All items' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            onPress={() => setActiveFilter('All items')}
          >
            <Text style={[styles.filterText, activeFilter === 'All items' ? { color: '#FFFFFF' } : { color: colors.text }]}>All items</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'Today' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            onPress={() => setActiveFilter('Today')}
          >
            <Text style={[styles.filterText, activeFilter === 'Today' ? { color: '#FFFFFF' } : { color: colors.text }]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'Update Requests' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            onPress={() => setActiveFilter('Update Requests')}
          >
            <Text style={[styles.filterText, activeFilter === 'Update Requests' ? { color: '#FFFFFF' } : { color: colors.text }]}>Update Requests</Text>
          </TouchableOpacity>
        </View>

        {/* Hostel List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>New Entries</Text>
        </View>

        {hostels.map((hostel) => (
          <TouchableOpacity
            key={hostel.id}
            activeOpacity={0.85}
            onPress={() => router.push(`/(super-admin)/review-detail?id=${hostel.id}`)}
            style={[styles.hostelCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.hostelImageWrapper}>
              <Image source={hostel.image} style={styles.hostelImage} />
              {hostel.isNew && (
                <View style={[styles.newBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>

            <View style={styles.hostelBody}>
              <Text style={[styles.hostelName, { color: colors.text }]}>{hostel.name}</Text>
              <Text style={[styles.hostelLocation, { color: colors.textSecondary }]}>
                📍 {hostel.location}
              </Text>

              <View style={styles.hostelMetaRow}>
                <View style={styles.hostelMetaItem}>
                  <Text style={[styles.hostelMetaLabel, { color: colors.textSecondary }]}>
                    PRICE
                  </Text>
                  <Text style={[styles.hostelPrice, { color: colors.primary }]}>
                    {hostel.price}
                  </Text>
                </View>
                <View style={[styles.hostelMetaDivider, { backgroundColor: colors.border }]} />
                <View style={styles.hostelMetaItem}>
                  <Text style={[styles.hostelMetaLabel, { color: colors.textSecondary }]}>
                    SCOUT
                  </Text>
                  <Text style={[styles.hostelScout, { color: colors.text }]}>
                    {hostel.scout}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.auditButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/(super-admin)/review-detail?id=${hostel.id}`)}
              >
                <Text style={styles.auditButtonText}>Audit Hostel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
  statsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
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
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statHint: {
    fontSize: 12,
    marginTop: 2,
  },
  statCountBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statCountText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  hostelImageWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  hostelImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  hostelBody: {
    gap: 4,
  },
  hostelName: {
    fontSize: 17,
    fontWeight: '700',
  },
  newBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hostelLocation: {
    fontSize: 13,
    marginBottom: 8,
  },
  hostelMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  hostelMetaItem: {
    flex: 1,
  },
  hostelMetaDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 12,
  },
  hostelMetaLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hostelPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  hostelScout: {
    fontSize: 14,
    fontWeight: '600',
  },
  auditButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  auditButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

