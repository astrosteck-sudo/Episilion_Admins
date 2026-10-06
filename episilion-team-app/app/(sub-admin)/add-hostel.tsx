import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../../src/store/themeStore";
import { router } from "expo-router";
import { Input } from "../../src/components/Input";
import { Button } from "../../src/components/Button";
import { createHostel } from "../../src/api/hostels";
import { useAppAlert } from "../../src/components/AppAlert";

export default function AddHostelScreen() {
  const colors = useThemeStore((state) => state.colors);
  const { alert } = useAppAlert();
  const [sectionsCompleted, setSectionsCompleted] = useState(0);
  const [hostelName, setHostelName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [roomTypes, setRoomTypes] = useState<{ type: string; price: string }[]>(
    [],
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [managerName, setManagerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [locationError, setLocationError] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const webViewRef = useRef(null);

  const takePhoto = async () => {
    let { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Permission Denied", "Camera permission is required to take photos.");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission Denied", "Media library permission is required to select photos.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const amenities = [
    "Bed",
    "Mattress",
    "Free Water",
    "Free Light",
    "Security",
    "DSTV Cable",
    "Study Room",
    "Wifi",
    "Kitchen",
    "Wardrobe",
    "Fan",
  ];

  /** Phone numbers must be exactly 10 digits. */
  const PHONE_LENGTH = 10;

  const sanitizePhone = (value: string) => value.replace(/\D/g, "").slice(0, PHONE_LENGTH);

  const phoneError =
    phoneNumber.length > 0 && phoneNumber.length !== PHONE_LENGTH
      ? `Phone number must be exactly ${PHONE_LENGTH} digits`
      : "";

  const whatsappError =
    whatsappNumber.length > 0 && whatsappNumber.length !== PHONE_LENGTH
      ? `WhatsApp number must be exactly ${PHONE_LENGTH} digits`
      : "";

  useEffect(() => {
    // Request location and camera permissions when component mounts
    (async () => {
      let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== "granted") {
        setLocationError("Permission to access location was denied");
      }
      
      let { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== "granted") {
        alert("Permission Denied", "Camera permission is required to take photos.");
      }
      
      let { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaLibraryStatus !== "granted") {
        alert("Permission Denied", "Media library permission is required to select photos.");
      }
    })();
  }, []);

  useEffect(() => {
    // Show map when both coordinates are available
    if (latitude && longitude) {
      setShowMap(true);
    }
  }, [latitude, longitude]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    );
  };

  const addRoomType = () => {
    setRoomTypes([...roomTypes, { type: "", price: "" }]);
  };

  const removeRoomType = (index: number) => {
    setRoomTypes(roomTypes.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const missing: string[] = [];
    if (!hostelName.trim()) missing.push("Hostel name");
    if (!latitude.trim() || !longitude.trim()) missing.push("Location & coordinates");
    if (!roomTypes.some((r) => r.type.trim())) missing.push("At least one room type");
    if (!managerName.trim()) missing.push("Manager name");
    if (!phoneNumber.trim()) missing.push("Phone number");
    if (!photo) missing.push("A property photo");

    if (missing.length) {
      alert("Incomplete form", `Please complete:\n• ${missing.join("\n• ")}`);
      return;
    }

    if (phoneNumber.length !== PHONE_LENGTH) {
      alert("Invalid phone number", `The phone number must be exactly ${PHONE_LENGTH} digits.`);
      return;
    }

    if (whatsappNumber.length > 0 && whatsappNumber.length !== PHONE_LENGTH) {
      alert(
        "Invalid WhatsApp number",
        `The WhatsApp number must be exactly ${PHONE_LENGTH} digits.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createHostel({
        name: hostelName.trim(),
        latitude: latitude.trim(),
        longitude: longitude.trim(),
        roomTypes: roomTypes.filter((r) => r.type.trim()),
        amenities: selectedAmenities,
        managerName: managerName.trim(),
        phone: phoneNumber.trim(),
        whatsapp: whatsappNumber.trim() || undefined,
        email: email.trim() || undefined,
        photoUri: photo as string,
      });

      alert(
        "Submitted for approval",
        `"${result?.hostel?.name ?? hostelName}" has been sent to the super admin for review.`,
        [{ text: "OK", onPress: () => router.replace("/(sub-admin)") }],
      );

      setHostelName("");
      setLatitude("");
      setLongitude("");
      setRoomTypes([]);
      setSelectedAmenities([]);
      setManagerName("");
      setPhoneNumber("");
      setWhatsappNumber("");
      setEmail("");
      setPhoto(null);
      setShowMap(false);
      setSectionsCompleted(0);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Could not submit the hostel. Please try again.";
      alert("Submission failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={[styles.breadcrumb, { color: colors.textSecondary }]}>
            New Hostel Form {">"} Universal
          </Text>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {sectionsCompleted} of 6 sections (
            {Math.round((sectionsCompleted / 6) * 100)}%)
          </Text>
        </View>

        {/* Section 1: Hostel Name */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionNumber,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="business-outline" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Hostel Name
            </Text>
          </View>
          <Input
            label="Official Registration Name"
            placeholder="e.g. Htc Towers"
            value={hostelName}
            onChangeText={setHostelName}
          />
          <View style={[styles.tag, { backgroundColor: colors.success }]}>
            <Text style={styles.tagText}>RECOMMENDED</Text>
          </View>
        </View>

        {/* Section 2: Location & Coordinates */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionNumber,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="location-outline" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Location & Coordinates
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.gpsButton, { backgroundColor: colors.success }]}
            onPress={async () => {
              let { status } =
                await Location.requestForegroundPermissionsAsync();
              if (status !== "granted") {
                setLocationError("Permission to access location was denied");
                alert(
                  "Permission Denied",
                  "Unable to access location. Please enable location permissions in settings.",
                );
                return;
              }

              try {
                let locationData = await Location.getCurrentPositionAsync({});
                setLatitude(String(locationData.coords.latitude));
                setLongitude(String(locationData.coords.longitude));
                setLocationError("");
                setShowMap(true);
              } catch (error) {
                setLocationError("Failed to get current location");
                alert(
                  "Location Error",
                  "Could not retrieve current location. Please try again.",
                );
                console.error("Location error:", error);
              }
            }}
          >
            <Ionicons name="navigate" size={17} color="#FFFFFF" />
            <Text style={styles.gpsButtonText}>Use my current GPS</Text>
          </TouchableOpacity>
          <View style={styles.coordinatesRow}>
            <View style={styles.coordinateItem}>
              <Text
                style={[
                  styles.coordinateLabel,
                  { color: colors.textSecondary },
                ]}
              >
                LATITUDE
              </Text>
              <TextInput
                style={[
                  styles.coordinateInput,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={latitude}
                onChangeText={(text) => {
                  setLatitude(text);
                  if (text && longitude) {
                    setShowMap(true);
                  }
                }}
                placeholder="e.g. 5.6037"
                placeholderTextColor={colors.placeholder}
              />
            </View>
            <View style={styles.coordinateItem}>
              <Text
                style={[
                  styles.coordinateLabel,
                  { color: colors.textSecondary },
                ]}
              >
                LONGITUDE
              </Text>
              <TextInput
                style={[
                  styles.coordinateInput,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={longitude}
                onChangeText={(text) => {
                  setLongitude(text);
                  if (latitude && text) {
                    setShowMap(true);
                  }
                }}
                placeholder="e.g. -0.1870"
                placeholderTextColor={colors.placeholder}
              />
            </View>
          </View>
          {locationError ? (
            <View
              style={[
                styles.mapPlaceholder,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Text style={{ color: "#ff4444", fontSize: 12 }}>
                {locationError}
              </Text>
            </View>
          ) : showMap && latitude && longitude ? (
            <View
              style={[
                styles.mapPlaceholder,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  height: 200,
                  overflow: "hidden",
                },
              ]}
            >
              <Image
                source={{
                  uri: `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x400&maptype=roadmap&markers=color:red%7Clabel:C%7C${latitude},${longitude}&key=AIzaSyCkUOdZ5y7hMm0yrcCQoCvLwzdM6M8s5qk`,
                }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
                onError={(error) => {
                  console.warn(
                    "Map Image failed to load: ",
                    error.nativeEvent.error,
                  );
                }}
              />
            </View>
          ) : (
            <View
              style={[
                styles.mapPlaceholder,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.mapText, { color: colors.textSecondary }]}>
                Map Preview
              </Text>
            </View>
          )}
        </View>

        {/* Section 3: Room Types & Prices */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionNumber,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="pricetags-outline" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Room Types & Prices
            </Text>
          </View>
          {roomTypes.map((room, index) => (
            <View key={index} style={styles.roomTypeRow}>
              <TextInput
                style={[
                  styles.roomTypeInput,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="TYPE OF ROOM"
                placeholderTextColor={colors.placeholder}
                value={room.type}
                onChangeText={(text) => {
                  const updated = [...roomTypes];
                  updated[index].type = text;
                  setRoomTypes(updated);
                }}
              />
              <TextInput
                style={[
                  styles.priceInput,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="₵ 0.00"
                placeholderTextColor={colors.placeholder}
                value={room.price}
                onChangeText={(text) => {
                  const updated = [...roomTypes];
                  updated[index].price = text;
                  setRoomTypes(updated);
                }}
              />
              <TouchableOpacity
                onPress={() => removeRoomType(index)}
                style={[styles.deleteButton, { backgroundColor: colors.inputBackground }]}
                hitSlop={6}
              >
                <Ionicons name="trash-outline" size={17} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addRoomButton} onPress={addRoomType}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.addRoomText, { color: colors.primary }]}>
              Add another room type
            </Text>
          </TouchableOpacity>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>
              Allow Semester Installments?
            </Text>
            <View style={[styles.toggle, { backgroundColor: colors.primary }]}>
              <Text style={styles.toggleText}>ON</Text>
            </View>
          </View>
        </View>

        {/* Section 4: Facilities & Amenities */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionNumber,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Facilities & Amenities
            </Text>
          </View>
          <View style={styles.amenitiesGrid}>
            {amenities.map((amenity) => (
              <TouchableOpacity
                key={amenity}
                style={[
                  styles.amenityButton,
                  selectedAmenities.includes(amenity)
                    ? { backgroundColor: colors.success }
                    : {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                      },
                ]}
                onPress={() => toggleAmenity(amenity)}
              >
                <Text
                  style={[
                    styles.amenityText,
                    {
                      color: selectedAmenities.includes(amenity)
                        ? "#FFFFFF"
                        : colors.text,
                    },
                  ]}
                >
                  {amenity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[
              styles.customAmenityInput,
              {
                backgroundColor: colors.inputBackground,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Add custom amenity"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        {/* Section 5: Hostel Manager */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionNumber,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="person-outline" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Hostel Manager
            </Text>
          </View>
          <Input
            label="Contact Person/Name"
            placeholder="Enter manager name"
            value={managerName}
            onChangeText={setManagerName}
          />
          <Input
            label="Phone Number"
            placeholder="e.g. 0244123456"
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(sanitizePhone(text))}
            keyboardType="numeric"
            error={phoneError}
          />
          <Input
            label="Whatsapp Booking Number"
            placeholder="e.g. 0244123456"
            value={whatsappNumber}
            onChangeText={(text) => setWhatsappNumber(sanitizePhone(text))}
            keyboardType="numeric"
            error={whatsappError}
          />
          <Input
            label="Email Address"
            placeholder="Enter email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
        </View>

        {/* Section 6: Property Photos */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionNumber,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="images-outline" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Property Photos
            </Text>
          </View>
          <Text
            style={[styles.photoRequirement, { color: colors.textSecondary }]}
          >
            Min 1 required (Sub-admin limit: 1 photo)
          </Text>
          {photo ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => setPhoto(null)}
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoUploadContainer}>
              <TouchableOpacity
                style={[
                  styles.photoUploadButton,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={takePhoto}
              >
                <View style={[styles.photoUploadIconWrap, { backgroundColor: colors.primary + "1A" }]}>
                  <Ionicons name="camera-outline" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.photoUploadText, { color: colors.text }]}>
                  Take Photo
                </Text>
                <Text style={[styles.photoUploadHint, { color: colors.textSecondary }]}>
                  Use the camera
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.photoUploadButton,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={pickImage}
              >
                <View style={[styles.photoUploadIconWrap, { backgroundColor: colors.secondary + "1A" }]}>
                  <Ionicons name="images-outline" size={24} color={colors.secondary} />
                </View>
                <Text style={[styles.photoUploadText, { color: colors.text }]}>
                  Gallery
                </Text>
                <Text style={[styles.photoUploadHint, { color: colors.textSecondary }]}>
                  Choose an existing photo
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.daylightCheckbox}>
            <Text style={[styles.checkboxText, { color: colors.text }]}>
              Clear daylight photos boost audit approval capacity
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.footer}>
          <Button
            title={
              isSubmitting
                ? "Submitting..."
                : "Submit For Approval (Complete & Submit)"
            }
            onPress={handleSubmit}
            loading={isSubmitting}
          />
          <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
            Required fields must be completed before submission.
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  backText: {
    fontSize: 24,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  progressContainer: {
    marginBottom: 20,
  },
  breadcrumb: {
    fontSize: 12,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionNumber: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  gpsButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  gpsButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  coordinatesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  coordinateItem: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  coordinateInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  mapPlaceholder: {
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapText: {
    fontSize: 14,
  },
  roomTypeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  roomTypeInput: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  priceInput: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addRoomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    marginBottom: 12,
  },
  addRoomText: {
    fontSize: 14,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleLabel: {
    fontSize: 14,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  amenityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  amenityText: {
    fontSize: 12,
    fontWeight: "500",
  },
  customAmenityInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  photoRequirement: {
    fontSize: 12,
    marginBottom: 12,
  },
  photoUploadContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  photoUploadButton: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  photoUploadIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  photoUploadText: {
    fontSize: 13,
    fontWeight: "600",
  },
  photoUploadHint: {
    fontSize: 11,
    textAlign: "center",
  },
  photoPreview: {
    position: "relative",
    marginBottom: 12,
  },
  photoImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  daylightCheckbox: {
    marginTop: 8,
  },
  checkboxText: {
    fontSize: 12,
  },
  footer: {
    marginTop: 16,
  },
  footerNote: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
