import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/store/themeStore';

interface RoomType {
  type: string;
  price: string;
}

interface ReviewDetail {
  id: string;
  name: string;
  location: string;
  price: string;
  scout: string;
  scoutRole: string;
  scoutPhone: string;
  latitude: string;
  longitude: string;
  capturedAt: string;
  roomTypes: RoomType[];
  amenities: string[];
  facilities: string[];
  managerName: string;
  managerPhone: string;
  managerWhatsapp: string;
  managerEmail: string;
  image: any;
}

const REVIEWS: Record<string, ReviewDetail> = {
  '1': {
    id: '1',
    name: 'Hab3 Hostels (Annex B)',
    location: 'Madina, Accra',
    price: '₵ 4,500',
    scout: 'Kwame Mensah',
    scoutRole: 'Field Scout • Legon Sector',
    scoutPhone: '+233 24 000 0000',
    latitude: '5.6037',
    longitude: '-0.1870',
    capturedAt: 'Captured 2 hrs ago',
    roomTypes: [
      { type: '1 in a room', price: '₵ 4,500' },
      { type: '2 in a room', price: '₵ 3,800' },
      { type: '3 in a room', price: '₵ 3,200' },
    ],
    amenities: ['Free Water', 'Free Light', 'Security', 'Wifi'],
    facilities: ['Free Water', 'Free Light', 'Security', 'Wifi', 'Study Room'],
    managerName: 'Mr. Emmanuel Darko',
    managerPhone: '+233 24 111 2222',
    managerWhatsapp: '+233 24 111 2222',
    managerEmail: 'emmanuel.darko@episilion.com',
    image: require('../../assets/episilion_logo.png'),
  },
  '2': {
    id: '2',
    name: 'University Hall',
    location: 'KNUST, Kumasi',
    price: '₵ 3,200',
    scout: 'Sarah K.',
    scoutRole: 'Field Scout • Kumasi Sector',
    scoutPhone: '+233 20 333 4444',
    latitude: '6.6885',
    longitude: '-1.6244',
    capturedAt: 'Captured 5 hrs ago',
    roomTypes: [
      { type: '2 in a room', price: '₵ 3,200' },
      { type: '4 in a room', price: '₵ 2,400' },
    ],
    amenities: ['Bed', 'Mattress', 'Fan', 'Wardrobe'],
    facilities: ['Bed', 'Mattress', 'Fan', 'Wardrobe', 'Kitchen'],
    managerName: 'Mrs. Akosua Boateng',
    managerPhone: '+233 20 555 6666',
    managerWhatsapp: '+233 20 555 6666',
    managerEmail: 'akosua.boateng@episilion.com',
    image: require('../../assets/episilion_logo.png'),
  },
  '3': {
    id: '3',
    name: 'Campus View Lodge',
    location: 'Madina, Accra',
    price: '₵ 2,800',
    scout: 'John D.',
    scoutRole: 'Field Scout • Madina Sector',
    scoutPhone: '+233 27 777 8888',
    latitude: '5.6836',
    longitude: '-0.1667',
    capturedAt: 'Captured 1 day ago',
    roomTypes: [
      { type: '1 in a room', price: '₵ 2,800' },
      { type: '2 in a room', price: '₵ 2,200' },
    ],
    amenities: ['Free Water', 'DSTV Cable', 'Security'],
    facilities: ['Free Water', 'DSTV Cable', 'Security', 'Study Room'],
    managerName: 'Mr. Kofi Asante',
    managerPhone: '+233 27 999 0000',
    managerWhatsapp: '+233 27 999 0000',
    managerEmail: 'kofi.asante@episilion.com',
    image: require('../../assets/episilion_logo.png'),
  },
};

export default function ReviewDetailScreen() {
  const colors = useThemeStore((state) => state.colors);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const review = REVIEWS[id ?? '1'] ?? REVIEWS['1'];
  const [activeImage, setActiveImage] = useState(0);

  const mapUri = `https://maps.googleapis.com/maps/api/staticmap?center=${review.latitude},${review.longitude}&zoom=15&size=600x400&maptype=roadmap&markers=color:red%7Clabel:C%7C${review.latitude},${review.longitude}&key=AIzaSyCkUOdZ5y7hMm0yrcCQoCvLwzdM6M8s5qk`;

  const openInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${review.latitude},${review.longitude}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Unable to open Google Maps.')
    );
  };

  const callNumber = (number: string) => {
    Linking.openURL(`tel:${number.replace(/\s/g, '')}`).catch(() =>
      Alert.alert('Error', 'Unable to place call.')
    );
  };

  const handleApprove = () => {
    Alert.alert('Approve & Publish', `Publish "${review.name}" to the public listing?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => router.back() },
    ]);
  };

  const handleReject = () => {
    Alert.alert('Reject Hostel', `Reject "${review.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Review Detail</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Row */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
            <Text style={styles.statusBadgeText}>NEW HOSTEL</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.statusBadgeText}>PENDING VERIFICATION</Text>
          </View>
        </View>

        {/* Photo Gallery */}
        <View style={styles.gallerySection}>
          <Image source={review.image} style={styles.mainImage} resizeMode="cover" />
        </View>

        {/* Scout Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.scoutRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {review.scout.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </Text>
            </View>
            <View style={styles.scoutInfo}>
              <Text style={[styles.scoutName, { color: colors.text }]}>{review.scout}</Text>
              <Text style={[styles.scoutRole, { color: colors.textSecondary }]}>
                {review.scoutRole}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.callButton, { backgroundColor: colors.success }]}
              onPress={() => callNumber(review.scoutPhone)}
            >
              <Ionicons name="call" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hostel Summary */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.hostelName, { color: colors.text }]}>{review.name}</Text>
            <View style={[styles.newBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
          <Text style={[styles.hostelLocation, { color: colors.textSecondary }]}>
            📍 {review.location}
          </Text>
          <Text style={[styles.hostelPrice, { color: colors.primary }]}>{review.price}</Text>

          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Text style={[styles.chipText, { color: colors.text }]}>
                {review.roomTypes.length} Room Types
              </Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Text style={[styles.chipText, { color: colors.text }]}>
                {review.amenities.length} Amenities
              </Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Text style={[styles.chipText, { color: colors.text }]}>1 Manager</Text>
            </View>
          </View>
        </View>

        {/* Coordinates & Location */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Coordinates & Location
            </Text>
            <View style={[styles.capturedBadge, { backgroundColor: colors.inputBackground }]}>
              <Text style={[styles.capturedText, { color: colors.textSecondary }]}>
                {review.capturedAt}
              </Text>
            </View>
          </View>

          <View style={styles.coordRow}>
            <View style={styles.coordItem}>
              <Text style={[styles.coordLabel, { color: colors.textSecondary }]}>LATITUDE</Text>
              <Text style={[styles.coordValue, { color: colors.text }]}>{review.latitude}</Text>
            </View>
            <View style={styles.coordItem}>
              <Text style={[styles.coordLabel, { color: colors.textSecondary }]}>LONGITUDE</Text>
              <Text style={[styles.coordValue, { color: colors.text }]}>{review.longitude}</Text>
            </View>
          </View>

          <View style={[styles.mapWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <Image
              source={{ uri: mapUri }}
              style={styles.mapImage}
              resizeMode="cover"
              onError={(error) =>
                console.warn('Map Image failed to load: ', error.nativeEvent.error)
              }
            />
          </View>

          <TouchableOpacity
            style={[styles.mapsButton, { borderColor: colors.primary }]}
            onPress={openInMaps}
          >
            <Ionicons name="navigate-outline" size={16} color={colors.primary} />
            <Text style={[styles.mapsButtonText, { color: colors.primary }]}>
              Open in Google Maps
            </Text>
          </TouchableOpacity>
        </View>

        {/* Room Types & Prices */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Room Types & Prices
            </Text>
            <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
              {review.roomTypes.length} options
            </Text>
          </View>
          {review.roomTypes.map((room, index) => (
            <View
              key={index}
              style={[
                styles.roomRow,
                index < review.roomTypes.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.divider,
                },
              ]}
            >
              <Text style={[styles.roomType, { color: colors.text }]}>{room.type}</Text>
              <Text style={[styles.roomPrice, { color: colors.primary }]}>{room.price}</Text>
            </View>
          ))}
        </View>

        {/* Amenities */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Amenities</Text>
            <View style={[styles.capturedBadge, { backgroundColor: colors.success }]}>
              <Text style={[styles.capturedText, { color: '#FFFFFF' }]}>
                {review.amenities.length} selected
              </Text>
            </View>
          </View>
          <View style={styles.amenityWrap}>
            {review.amenities.map((amenity, index) => (
              <View
                key={index}
                style={[styles.amenityChip, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              >
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={[styles.amenityText, { color: colors.text }]}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Verified Facilities */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Verified Facilities
            </Text>
            <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
              {review.facilities.length} verified
            </Text>
          </View>
          {review.facilities.map((facility, index) => (
            <View key={index} style={styles.facilityRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={[styles.facilityText, { color: colors.text }]}>{facility}</Text>
            </View>
          ))}
        </View>

        {/* Manager Contact */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
            Manager Contact
          </Text>
          <Text style={[styles.managerName, { color: colors.text }]}>
            {review.managerName}
          </Text>

          <TouchableOpacity
            style={[styles.contactRow, { borderColor: colors.border }]}
            onPress={() => callNumber(review.managerPhone)}
          >
            <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.contactText, { color: colors.text }]}>
              {review.managerPhone}
            </Text>
            <Text style={[styles.contactAction, { color: colors.primary }]}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactRow, { borderColor: colors.border }]}
            onPress={() =>
              Linking.openURL(`https://wa.me/${review.managerWhatsapp.replace(/\D/g, '')}`)
            }
          >
            <Ionicons name="logo-whatsapp" size={18} color={colors.success} />
            <Text style={[styles.contactText, { color: colors.text }]}>
              {review.managerWhatsapp}
            </Text>
            <Text style={[styles.contactAction, { color: colors.success }]}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactRow, { borderColor: colors.border }]}
            onPress={() => Linking.openURL(`mailto:${review.managerEmail}`)}
          >
            <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.contactText, { color: colors.text }]}>
              {review.managerEmail}
            </Text>
            <Text style={[styles.contactAction, { color: colors.primary }]}>Email</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.rejectButton, { borderColor: colors.error }]}
          onPress={handleReject}
        >
          <Ionicons name="close" size={18} color={colors.error} />
          <Text style={[styles.rejectText, { color: colors.error }]}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.approveButton, { backgroundColor: colors.success }]}
          onPress={handleApprove}
        >
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.approveText}>Approve & Publish</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gallerySection: {
    marginBottom: 14,
  },
  mainImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  thumbnailWrapper: {
    borderWidth: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 64,
    height: 48,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  scoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  scoutInfo: {
    flex: 1,
  },
  scoutName: {
    fontSize: 15,
    fontWeight: '700',
  },
  scoutRole: {
    fontSize: 12,
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  hostelName: {
    fontSize: 18,
    fontWeight: '700',
    flexShrink: 1,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  hostelLocation: {
    fontSize: 13,
    marginBottom: 6,
  },
  hostelPrice: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 12,
  },
  capturedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  capturedText: {
    fontSize: 10,
    fontWeight: '600',
  },
  coordRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  coordItem: {
    flex: 1,
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  coordValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  mapWrapper: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  mapsButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  roomType: {
    fontSize: 14,
    fontWeight: '500',
  },
  roomPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  amenityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  amenityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  facilityText: {
    fontSize: 14,
  },
  managerName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  contactText: {
    flex: 1,
    fontSize: 13,
  },
  contactAction: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  rejectText: {
    fontSize: 14,
    fontWeight: '700',
  },
  approveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  approveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
