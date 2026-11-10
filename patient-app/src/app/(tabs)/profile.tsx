
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || "P"}
          </Text>
        </View>

        <Text style={styles.name}>
          {user?.name || "Patient"}
        </Text>

        <Text style={styles.email}>
          {user?.email || "No email available"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>{user?.name || "N/A"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email Address</Text>
          <Text style={styles.value}>{user?.email || "N/A"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Account Type</Text>
          <Text style={styles.value}>Patient</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>SehatQueue · Less Waiting. Better Care.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#0F766E",
    alignItems: "center",
    paddingVertical: 35,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 85,
    height: 85,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#0F766E",
  },
  name: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  email: {
    fontSize: 14,
    color: "#E0F2F1",
    marginTop: 5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16324F",
    marginBottom: 18,
  },
  infoRow: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 5,
  },
  value: {
    fontSize: 15,
    color: "#16324F",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DC2626",
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 25,
    marginBottom: 30,
  },
});
