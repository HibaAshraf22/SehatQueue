
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import {
  Stethoscope,
  CalendarDays,
  Clock,
  Search,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/api";

export default function HomeScreen() {
  const { user, token } = useAuth();
  const router = useRouter();

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [queueCardY, setQueueCardY] = useState(0);

  const [appointment, setAppointment] = useState<any>(null);
  const [queueInfo, setQueueInfo] = useState<any>(null);
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const getPakistanDateString = (value: string | Date) => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  };

  const fetchQueueData = useCallback(async () => {
    if (!user?.id || !token) {
      setLoading(false);
      return;
    }

    try {
      setError("");

      const appointmentResponse = await fetch(
        `${API_URL}/api/appointments/patient/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const appointmentData = await appointmentResponse.json();

      if (!appointmentResponse.ok) {
        throw new Error(
          appointmentData.message || "Failed to load appointments"
        );
      }

      const appointments = Array.isArray(appointmentData)
        ? appointmentData
        : appointmentData.appointments || [];

      const today = getPakistanDateString(new Date());

      const activeAppointments = appointments
        .filter(
          (item: any) =>
            item.status === "waiting" || item.status === "called"
        )
        .filter(
          (item: any) =>
            getPakistanDateString(item.appointmentDate) >= today
        )
        .sort(
          (a: any, b: any) =>
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime()
        );

      const nextAppointment = activeAppointments[0] || null;

      setAppointment(nextAppointment);

      if (!nextAppointment) {
        setQueueInfo(null);
        setIsUpcoming(false);
        return;
      }

      const appointmentDate = getPakistanDateString(
        nextAppointment.appointmentDate
      );

      if (appointmentDate > today) {
        setIsUpcoming(true);
        setQueueInfo(null);
        return;
      }

      setIsUpcoming(false);

      const queueResponse = await fetch(
        `${API_URL}/api/queue/patient/${nextAppointment._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const queueData = await queueResponse.json();

      if (!queueResponse.ok) {
        throw new Error(
          queueData.message || "Failed to load queue status"
        );
      }

      setQueueInfo(queueData);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQueueData();
  };

  const formatDate = (date: string) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-PK", {
      timeZone: "Asia/Karachi",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const patientsAhead = Math.max(
    0,
    Number(queueInfo?.patientsBeforeYou) || 0
  );

  const estimatedWaitingMinutes = patientsAhead * 10;

  const formatWaitingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#0F766E"]}
        />
      }>

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>SehatQueue</Text>
          <Text style={styles.tagline}>Less Waiting. Better Care.</Text>
        </View>

        <TouchableOpacity
        style={styles.profile}
        onPress={() => router.push("/(tabs)/profile")}
        activeOpacity={0.7}
      >
  <Text style={styles.profileText}>
    {user?.name?.trim()?.charAt(0).toUpperCase() || "P"}
  </Text>
</TouchableOpacity>
      </View>

      <View style={styles.welcome}>
        <Text style={styles.welcomeTitle}>
          Welcome, {user?.name || "Patient"}!
        </Text>
        <Text style={styles.welcomeText}>
          Find doctors and manage your hospital appointments easily.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>What would you like to do?</Text>

      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/(tabs)/doctors")}
          activeOpacity={0.7}
        >
          <Search size={28} color="#0F766E" />
          <Text style={styles.cardTitle}>Find Doctors</Text>
          <Text style={styles.cardText}>Explore available doctors</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/(tabs)/doctors")}
          activeOpacity={0.7}
        >
          <CalendarDays size={28} color="#0F766E" />
          <Text style={styles.cardTitle}>Book Appointment</Text>
          <Text style={styles.cardText}>Schedule your visit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            scrollRef.current?.scrollTo({
              y: queueCardY,
              animated: true,
            })
          }
          activeOpacity={0.7}
        >
          <Clock size={28} color="#0F766E" />
          <Text style={styles.cardTitle}>Track Queue</Text>
          <Text style={styles.cardText}>Check your token status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/(tabs)/appointments")}
          activeOpacity={0.7}
        >
          <Stethoscope size={28} color="#0F766E" />
          <Text style={styles.cardTitle}>My Appointments</Text>
          <Text style={styles.cardText}>View your appointments</Text>
        </TouchableOpacity>
      </View>

      <View
        style={styles.queueCard}
        onLayout={(event) =>
          setQueueCardY(event.nativeEvent.layout.y)
        }
      >
        <Text style={styles.queueTitle}>Your Queue Status</Text>

        {loading ? (
          <Text style={styles.queueMessage}>
            Loading your appointment...
          </Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : !appointment ? (
          <Text style={styles.queueMessage}>
            You don't have an upcoming active appointment right now.
          </Text>
        ) : (
          <>
            <Text style={styles.doctorName}>
              {appointment.doctor?.name || "Doctor"}
            </Text>

            <Text style={styles.department}>
              {appointment.department?.name || "Department"}
            </Text>

            <Text style={styles.detailText}>
              Appointment Date: {formatDate(appointment.appointmentDate)}
            </Text>

            <View style={styles.queueDivider} />

            {isUpcoming ? (
              <>
                <View style={styles.upcomingToken}>
                  <Text style={styles.queueNumber}>
                    {appointment.tokenNumber ?? "-"}
                  </Text>
                  <Text style={styles.queueLabel}>Your Token</Text>
                </View>

                <View style={styles.upcomingStatusBox}>
                  <Text style={styles.upcomingStatusText}>
                    UPCOMING APPOINTMENT
                  </Text>
                </View>

                <Text style={styles.upcomingMessage}>
                  Your queue tracking will start on your appointment date.
                  Please check back on that day for live queue updates.
                </Text>
              </>
            ) : (
              <>
                <View style={styles.queueRow}>
                  <View style={styles.queueItem}>
                    <Text style={styles.queueNumber}>
                      {queueInfo?.yourToken ?? appointment.tokenNumber ?? "-"}
                    </Text>
                    <Text style={styles.queueLabel}>Your Token</Text>
                  </View>

                  <View style={styles.queueItem}>
                    <Text style={styles.queueNumber}>
                      {queueInfo?.nowServing ?? 0}
                    </Text>
                    <Text style={styles.queueLabel}>Now Serving</Text>
                  </View>

                  <View style={styles.queueItem}>
                    <Text style={styles.queueNumber}>
                      {patientsAhead}
                    </Text>
                    <Text style={styles.queueLabel}>Ahead of You</Text>
                  </View>
                </View>

                <View style={styles.statusBox}>
                  <Text style={styles.statusText}>
                    Status:{" "}
                    {(queueInfo?.status || appointment.status || "waiting").toUpperCase()}
                  </Text>
                </View>

                <View style={styles.estimatedTimeBox}>
                  <Clock size={22} color="#0F766E" />

                  <View style={styles.estimatedTimeContent}>
                    <Text style={styles.estimatedTimeLabel}>
                      Estimated Waiting Time
                    </Text>

                    <Text style={styles.estimatedTimeValue}>
                      About {formatWaitingTime(estimatedWaitingMinutes)}
                    </Text>

                    <Text style={styles.estimatedTimeNote}>
                      Based on 10 minutes per patient. Actual time may vary.
                    </Text>
                  </View>
                </View>
              </>
            )}
          </>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Your Healthcare, Simplified</Text>
        <Text style={styles.infoText}>
          Book appointments online and follow your queue status without
          unnecessary waiting.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#16324F",
    paddingTop: 55,
    paddingBottom: 22,
    paddingHorizontal: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "bold",
  },
  tagline: {
    color: "#CBD5E1",
    fontSize: 12,
    marginTop: 4,
  },
  profile: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#0F766E",
    justifyContent: "center",
    alignItems: "center",
  },
  profileText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  welcome: {
    backgroundColor: "#0F766E",
    margin: 18,
    padding: 22,
    borderRadius: 16,
  },
  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "bold",
  },
  welcomeText: {
    color: "#E0F2F1",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
  },
  sectionTitle: {
    color: "#16324F",
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginBottom: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    width: "46%",
    margin: "2%",
    padding: 17,
    borderRadius: 14,
    minHeight: 145,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: {
    color: "#16324F",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 13,
  },
  cardText: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  queueCard: {
    backgroundColor: "#FFFFFF",
    margin: 18,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  queueTitle: {
    color: "#16324F",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  queueMessage: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
  },
  doctorName: {
    color: "#16324F",
    fontSize: 17,
    fontWeight: "bold",
  },
  department: {
    color: "#0F766E",
    fontSize: 13,
    marginTop: 4,
  },
  detailText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 10,
  },
  queueDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 16,
  },
  queueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  queueItem: {
    alignItems: "center",
    flex: 1,
  },
  queueNumber: {
    color: "#0F766E",
    fontSize: 23,
    fontWeight: "bold",
  },
  queueLabel: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 5,
    textAlign: "center",
  },
  statusBox: {
    backgroundColor: "#E6F4F1",
    padding: 11,
    borderRadius: 8,
    marginTop: 17,
  },
  statusText: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  estimatedTimeBox: {
    backgroundColor: "#E6F4F1",
    padding: 14,
    borderRadius: 10,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  estimatedTimeContent: {
    flex: 1,
  },
  estimatedTimeLabel: {
    color: "#16324F",
    fontSize: 12,
    fontWeight: "600",
  },
  estimatedTimeValue: {
    color: "#0F766E",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
  estimatedTimeNote: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 4,
    lineHeight: 15,
  },
  upcomingToken: {
    alignItems: "center",
    paddingVertical: 5,
  },
  upcomingStatusBox: {
    backgroundColor: "#E0F2FE",
    padding: 11,
    borderRadius: 8,
    marginTop: 17,
  },
  upcomingStatusText: {
    color: "#0369A1",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  upcomingMessage: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 12,
  },
  info: {
    backgroundColor: "#E6F4F1",
    margin: 18,
    padding: 18,
    borderRadius: 14,
    marginBottom: 30,
  },
  infoTitle: {
    color: "#0F766E",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
});
