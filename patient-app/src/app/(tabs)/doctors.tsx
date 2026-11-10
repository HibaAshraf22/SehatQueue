
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";

const HOSPITAL_ID = "6ae1e0982680c6ba837e0f45";

type Doctor = {
  _id: string;
  name: string;
  specialization: string;
  department: {
    _id: string;
    name: string;
  } | null;
  isAvailable: boolean;
  consultationStart: string;
  consultationEnd: string;
  workingDays: string[];
};

type BookingDate = {
  value: string;
  label: string;
  day: string;
};

export default function DoctorsScreen() {
  const { user } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState<string | null>(null);

  const fetchDoctors = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/doctors/hospital/${HOSPITAL_ID}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load doctors");
      }

      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doctor) => {
    const query = search.toLowerCase();

    return (
      doctor.name.toLowerCase().includes(query) ||
      doctor.specialization.toLowerCase().includes(query) ||
      doctor.department?.name.toLowerCase().includes(query)
    );
  });

  const getAvailableDates = (doctor: Doctor): BookingDate[] => {
  const dates: BookingDate[] = [];
  const workingDays = doctor.workingDays || [];

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const dayNumber = Number(parts.find((p) => p.type === "day")?.value);

  const today = new Date(Date.UTC(year, month - 1, dayNumber));

  for (let i = 0; i <= 7; i++) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() + i);

    const day = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }).format(date);

    if (workingDays.includes(day)) {
      const dateYear = date.getUTCFullYear();
      const dateMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
      const dateDay = String(date.getUTCDate()).padStart(2, "0");

      const dateString = `${dateYear}-${dateMonth}-${dateDay}`;

      dates.push({
        value: `${dateString}T12:00:00.000+05:00`,
        day,
        label: new Intl.DateTimeFormat("en-US", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }).format(date),
      });
    }
  }

  return dates;
};

  const handleBooking = async (doctor: Doctor) => {
    if (!user?.id) {
      Alert.alert("Login required", "Please log in again to book.");
      return;
    }

    if (!doctor.isAvailable) {
      Alert.alert("Unavailable", "This doctor is currently unavailable.");
      return;
    }

    if (!selectedDate) {
      Alert.alert("Select a date", "Please select an appointment date.");
      return;
    }

    if (!doctor.department?._id) {
      Alert.alert("Error", "Doctor department information is missing.");
      return;
    }

    try {
      setBookingDoctor(doctor._id);

      const response = await fetch(`${API_URL}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient: user.id,
          hospital: HOSPITAL_ID,
          department: doctor.department._id,
          doctor: doctor._id,
          appointmentDate: selectedDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Appointment booking failed");
      }

      Alert.alert(
        "Appointment Confirmed!",
        `Doctor: ${doctor.name}\nToken Number: ${data.appointment.tokenNumber}\nStatus: ${data.appointment.status}`,
        [
          {
            text: "OK",
            onPress: () => {
              setSelectedDoctor(null);
              setSelectedDate("");
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        "Booking Failed",
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setBookingDoctor(null);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchDoctors();
          }}
          colors={["#0F766E"]}
        />
      }
    >
      <Text style={styles.heading}>Find Doctors</Text>

      <Text style={styles.subtitle}>
        Browse doctors, check availability and book appointments.
      </Text>

      <TextInput
        style={styles.search}
        placeholder="Search doctor or department..."
        placeholderTextColor="#94A3B8"
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0F766E"
          style={styles.loader}
        />
      ) : error ? (
        <View style={styles.messageBox}>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.retry} onPress={fetchDoctors}>
            Try Again
          </Text>
        </View>
      ) : filteredDoctors.length === 0 ? (
        <View style={styles.messageBox}>
          <Text style={styles.empty}>
            {search ? "No matching doctors found." : "No doctors available."}
          </Text>
        </View>
      ) : (
        filteredDoctors.map((doctor) => {
          const isExpanded = selectedDoctor === doctor._id;
          const availableDates = getAvailableDates(doctor);

          return (
            <View key={doctor._id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {doctor.name.charAt(0)}
                  </Text>
                </View>

                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{doctor.name}</Text>
                  <Text style={styles.specialization}>
                    {doctor.specialization}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.detail}>
                Department: {doctor.department?.name || "Not specified"}
              </Text>

              <Text style={styles.detail}>
                Consultation: {doctor.consultationStart} -{" "}
                {doctor.consultationEnd}
              </Text>

              <Text style={styles.detail}>
                Working days:{" "}
                {doctor.workingDays?.join(", ") || "Schedule not added"}
              </Text>

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: doctor.isAvailable
                        ? "#16A34A"
                        : "#DC2626",
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.status,
                    {
                      color: doctor.isAvailable ? "#15803D" : "#DC2626",
                    },
                  ]}
                >
                  {doctor.isAvailable ? "Available" : "Currently Unavailable"}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.bookingButton,
                  !doctor.isAvailable && styles.disabledButton,
                ]}
                disabled={!doctor.isAvailable}
                onPress={() => {
                  if (isExpanded) {
                    setSelectedDoctor(null);
                    setSelectedDate("");
                  } else {
                    setSelectedDoctor(doctor._id);
                    setSelectedDate("");
                  }
                }}
              >
                <Text style={styles.bookingText}>
                  {!doctor.isAvailable
                    ? "Currently Unavailable"
                    : isExpanded
                      ? "Close Booking"
                      : "Book Appointment"}
                </Text>
              </TouchableOpacity>

              {isExpanded && doctor.isAvailable && (
                <View style={styles.dateSection}>
                  <Text style={styles.dateHeading}>
                    Select Appointment Date
                  </Text>

                  <Text style={styles.dateSubtitle}>
                    Choose a working day within the next 7 days.
                  </Text>

                  {availableDates.length === 0 ? (
                    <Text style={styles.empty}>
                      No working dates available in the next 7 days.
                    </Text>
                  ) : (
                    <View style={styles.dateGrid}>
                      {availableDates.map((date) => {
                        const isSelected = selectedDate === date.value;

                        return (
                          <TouchableOpacity
                            key={date.value}
                            style={[
                              styles.dateButton,
                              isSelected && styles.selectedDate,
                            ]}
                            onPress={() => setSelectedDate(date.value)}
                          >
                            <Text
                              style={[
                                styles.dateDay,
                                isSelected && styles.selectedDateText,
                              ]}
                            >
                              {date.day.slice(0, 3)}
                            </Text>

                            <Text
                              style={[
                                styles.dateLabel,
                                isSelected && styles.selectedDateText,
                              ]}
                            >
                              {date.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      (!selectedDate || bookingDoctor === doctor._id) &&
                        styles.disabledButton,
                    ]}
                    disabled={!selectedDate || bookingDoctor === doctor._id}
                    onPress={() => handleBooking(doctor)}
                  >
                    {bookingDoctor === doctor._id ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.bookingText}>
                        Confirm Appointment
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 35,
  },
  heading: {
    fontSize: 27,
    fontWeight: "700",
    color: "#16324F",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 7,
    marginBottom: 22,
  },
  search: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 14,
    marginBottom: 20,
    color: "#16324F",
  },
  loader: {
    marginTop: 45,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 17,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#CCFBF1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 23,
    fontWeight: "700",
    color: "#0F766E",
  },
  doctorInfo: {
    marginLeft: 13,
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16324F",
  },
  specialization: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 15,
  },
  detail: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 9,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  status: {
    fontSize: 13,
    fontWeight: "600",
  },
  bookingButton: {
    backgroundColor: "#0F766E",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: "#94A3B8",
  },
  bookingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  dateSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 17,
  },
  dateHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16324F",
  },
  dateSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
    marginBottom: 14,
  },
  dateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  dateButton: {
    width: "30%",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  selectedDate: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },
  dateDay: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  dateLabel: {
    fontSize: 14,
    color: "#16324F",
    fontWeight: "700",
    marginTop: 4,
  },
  selectedDateText: {
    color: "#FFFFFF",
  },
  confirmButton: {
    backgroundColor: "#0F766E",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },
  messageBox: {
    alignItems: "center",
    marginTop: 40,
  },
  empty: {
    color: "#64748B",
    fontSize: 14,
  },
  error: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  retry: {
    color: "#0F766E",
    fontWeight: "700",
    marginTop: 12,
  },
});
