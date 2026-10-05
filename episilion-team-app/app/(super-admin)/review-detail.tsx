import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/store/themeStore';
import { getHostel, approveHostel, rejectHostel, type HostelDetailResponse } from '../../src/api/hostels';

const PLACEHOLDER_IMAGE = require('../../assets/episilion_logo.png');

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
  images: string[];
  status: string;
}

const formatCedis = (value: number | null | undefined) =>
  value === null || value === undefined ? 'N/A' : `₵ ${Number(value).toLocaleString()}`;

/** Human friendly "captured X ago" label from an ISO timestamp. */
const timeAgo = (iso: string | null | undefined) => {
  if (!iso) return 'Just now';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes < 60) return `Captured ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Captured ${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `Captured ${days} day${days === 1 ? '' : 's'} ago`;
};

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** Flattens the API response into the shape the screen renders. */
function toReviewDetail(data: HostelDetailResponse): ReviewDetail {
  const { hostel, location, contact, rooms, amenities, furnishing, media } = data;
  const scoutName = hostel.submitted_by_name || 'Unknown scout';

  const roomTypes: RoomType[] = rooms.map((room) => ({
    type: room.room_type || 'Room',
    price: formatCedis(room.price),
  }));

  const images = media.length
    ? media.map((item) => item.url)
    : hostel.main_image
      ? [hostel.main_image]
      : [];

  const minPrice = rooms.reduce<number | null>(
    (min, room) => (room.price !== null && (min === null || room.price < min) ? room.price : min),
    null
  );

  return {
    id: hostel.hostel_id,
    name: hostel.name,
    location:
      [hostel.directions, hostel.university].filter(Boolean).join(', ') || 'Location not provided',
    price: roomTypes.length
      ? minPrice !== null
        ? `From ${formatCedis(minPrice)}`
        : roomTypes[0].price
      : 'N/A',
    scout: scoutName,
    scoutRole: `Field Scout • Submitted by ${hostel.submitted_by_email || 'team member'}`,
    scoutPhone: contact?.phone || '',
    latitude: location?.latitude !== null && location?.latitude !== undefined ? String(location.latitude) : '',
    longitude:
      location?.longitude !== null && location?.longitude !== undefined ? String(location.longitude) : '',
    capturedAt: timeAgo(hostel.created_at),
    roomTypes,
    amenities,
    facilities: furnishing,
    managerName: contact?.manager_name || 'Not provided',
    managerPhone: contact?.phone || '',
    managerWhatsapp: contact?.whatsapp || contact?.phone || '',
    managerEmail: contact?.email || '',
    images,
    status: hostel.status,
  };
}

export default function ReviewDetailScreen() {
  const colors = useThemeStore((state) => state.colors);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  const load = useCallback(async () => {
    if (!id) {
      setError('No hostel selected.');
      setIsLoading(false);
      return;
    }
    try {
      setError('');
      setIsLoading(true);
      const data = await getHostel(String(id));
      setReview(toReviewDetail(data));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load hostel');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const mapUri = review?.latitude && review?.longitude
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${review.latitude},${review.longitude}&zoom=15&size=600x400&maptype=roadmap&markers=color:red%7Clabel:C%7C${review.latitude},${review.longitude}&key=AIzaSyCkUOdZ5y7hMm0yrcCQoCvLwzdM6M8s5qk`
    : null;

  const openInMaps = () => {
    if (!review) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${review.latitude},${review.longitude}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open Google Maps.'));
  };

  const callNumber = (number: string) => {
    if (!number) return;
    Linking.openURL(`tel:${number.replace(/\s/g, '')}`).catch(() =>
      Alert.alert('Error', 'Unable to place call.')
    );
  };

  const runDecision = async (decision: 'approve' | 'reject', reason?: string) => {
    if (!review || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (decision === 'approve') {
        await approveHostel(review.id);
      } else {
        await rejectHostel(review.id, reason as string);
      }
      Alert.alert(
        decision === 'approve' ? 'Approved & Published' : 'Hostel Rejected',
        decision === 'approve'
          ? `"${review.name}" is now live on the public listing.`
          : `"${review.name}" was rejected and the scout has been notified.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert(
        'Action failed',
        err?.response?.data?.message || err?.message || 'Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = () => {
    if (!review) return;
    Alert.alert('Approve & Publish', `Publish "${review.name}" to the public listing?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => runDecision('approve') },
    ]);
  };

  const handleReject = () => {
    if (!review) return;
    if (Platform.OS === 'ios' && typeof Alert.prompt === 'function') {
      Alert.prompt(
        'Reject Hostel',
        `Why is "${review.name}" being rejected?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: (reason?: string) => runDecision('reject', reason?.trim() || 'Rejected by super admin'),
          },
        ],
        'plain-text'
      );
      return;
    }
    Alert.alert('Reject Hostel', `Reject "${review.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => runDecision('reject', 'Rejected by super admin') },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Review Detail</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Loading hostel details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !review) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Review Detail</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.stateBox}>
          <Text style={[styles.stateText, { color: colors.error }]}>
            {error || 'Hostel not found'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={load}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.statusBadgeText}>{review.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Photo Gallery */}
        <View style={styles.gallerySection}>
          <Image
            source={
              review.images.length ? { uri: review.images[activeImage] } : PLACEHOLDER_IMAGE
            }
            style={styles.mainImage}
            resizeMode="cover"
          />
          {review.images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailRow}
            >
              {review.images.map((uri, index) => (
                <TouchableOpacity
                  key={uri}
                  onPress={() => setActiveImage(index)}
                  style={[
                    styles.thumbnailWrapper,
                    {
                      borderColor: index === activeImage ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Image source={{ uri }} style={styles.thumbnail} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Scout Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.scoutRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{initialsOf(review.scout)}</Text>
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
            {mapUri ? (
              <Image
                source={{ uri: mapUri }}
                style={styles.mapImage}
                resizeMode="cover"
                onError={(error) =>
                  console.warn('Map Image failed to load: ', error.nativeEvent.error)
                }
              />
            ) : (
              <View style={styles.mapPlaceholder}>
                <Text style={[styles.stateText, { color: colors.textSecondary }]}>
                  No coordinates were submitted for this hostel.
                </Text>
              </View>
            )}
          </View>

          {mapUri && (
            <TouchableOpacity
              style={[styles.mapsButton, { borderColor: colors.primary }]}
              onPress={openInMaps}
            >
              <Ionicons name="navigate-outline" size={16} color={colors.primary} />
              <Text style={[styles.mapsButtonText, { color: colors.primary }]}>
                Open in Google Maps
              </Text>
            </TouchableOpacity>
          )}
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
          style={[styles.rejectButton, { borderColor: colors.error, opacity: isSubmitting ? 0.5 : 1 }]}
          onPress={handleReject}
          disabled={isSubmitting}
        >
          <Ionicons name="close" size={18} color={colors.error} />
          <Text style={[styles.rejectText, { color: colors.error }]}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.approveButton, { backgroundColor: colors.success, opacity: isSubmitting ? 0.6 : 1 }]}
          onPress={handleApprove}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.approveText}>Approve & Publish</Text>
            </>
          )}
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
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  stateBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  stateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
