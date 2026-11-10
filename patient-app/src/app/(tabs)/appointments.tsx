
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/api";

const STATUS_COLORS: Record<string, string> = {
  waiting: "#D97706",
  called: "#0F766E",
  completed: "#16A34A",
  "no-show": "#DC2626",
  cancelled: "#DC2626",
};

export default function AppointmentsScreen() {
  const { user, token } = useAuth();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/appointments/patient/${user.id}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load appointments");
      }

      const appointmentList = Array.isArray(data)
        ? data
        : data.appointments || [];

      setAppointments(appointmentList);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleCancelAppointment = (appointmentId: string) => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setCancellingId(appointmentId);
              setError("");

              const response = await fetch(
                `${API_URL}/api/appointments/${appointmentId}/cancel`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  data.message || "Failed to cancel appointment"
                );
              }

              setAppointments((previous) =>
                previous.map((appointment) =>
                  appointment._id === appointmentId
                    ? { ...appointment, status: "cancelled" }
                    : appointment
                )
              );

              Alert.alert(
                "Success",
                "Your appointment has been cancelled successfully."
              );
            } catch (err: any) {
              Alert.alert(
                "Cancellation Failed",
                err.message || "Something went wrong"
              );
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderAppointment = ({ item }: { item: any }) => {
    const doctorName =
      typeof item.doctor === "object"
        ? item.doctor?.name
        : "Doctor";

    const departmentName =
      typeof item.department === "object"
        ? item.department?.name
        : "Department";

    const status = item.status || "waiting";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>
              {doctorName || "Doctor"}
            </Text>

            <Text style={styles.department}>
              {departmentName || "Department"}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[status] || "#64748B" },
            ]}
          >
            <Text style={styles.statusText}>
              {status.replace("-", " ")}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View>
            <Text style={styles.detailLabel}>Appointment Date</Text>
            <Text style={styles.detailValue}>
              {formatDate(item.appointmentDate)}
            </Text>
          </View>

          <View style={styles.tokenBox}>
            <Text style={styles.detailLabel}>Token Number</Text>
            <Text style={styles.tokenNumber}>
              #{item.tokenNumber}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.sourceText}>
            Source: {item.source || "online"}
          </Text>
        </View>

        {status === "waiting" && (
          <Pressable
            style={[
              styles.cancelButton,
              cancellingId === item._id && styles.disabledButton,
            ]}
            disabled={cancellingId === item._id}
            onPress={() => handleCancelAppointment(item._id)}
          >
            {cancellingId === item._id ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Text style={styles.cancelButtonText}>
                Cancel Appointment
              </Text>
            )}
          </Pressable>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>
          Loading your appointments...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Appointments</Text>

      <Text style={styles.subtitle}>
        View your bookings and track your appointment status.
      </Text>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={renderAppointment}
        contentContainerStyle={
          appointments.length === 0
            ? styles.emptyContainer
            : styles.listContainer
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0F766E"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>
              No Appointments Yet
            </Text>

            <Text style={styles.emptyText}>
              Your booked appointments will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
    paddingTop: 55,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#16324F",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 7,
    marginBottom: 22,
  },
  listContainer: {
    paddingBottom: 25,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  doctorInfo: {
    flex: 1,
    marginRight: 8,
  },
  doctorName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#16324F",
  },
  department: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 15,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16324F",
  },
  tokenBox: {
    alignItems: "flex-end",
  },
  tokenNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F766E",
  },
  footer: {
    marginTop: 14,
  },
  sourceText: {
    fontSize: 12,
    color: "#64748B",
    textTransform: "capitalize",
  },
  cancelButton: {
    marginTop: 15,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16324F",
  },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },
  error: {
    color: "#DC2626",
    marginBottom: 12,
  },
});
