import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function RegisterScreen() {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Missing information", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password);
    } catch (error: any) {
      Alert.alert(
        "Registration failed",
        error.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>SehatQueue</Text>
        <Text style={styles.tagline}>Less Waiting. Better Care.</Text>

        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.subtitle}>Register as a new patient</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor="#94A3B8"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Create a password"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{" "}
          </Text>
          <Link href={"/login" as any} style={styles.link}>
            Login
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    width: "100%",
  },
  logo: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0F766E",
    textAlign: "center",
  },
  tagline: {
    color: "#64748B",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 35,
  },
  heading: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#16324F",
  },
  subtitle: {
    color: "#64748B",
    marginTop: 7,
    marginBottom: 20,
  },
  label: {
    color: "#16324F",
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 14,
    color: "#16324F",
    fontSize: 15,
  },
  button: {
    backgroundColor: "#0F766E",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 23,
  },
  footerText: {
    color: "#64748B",
  },
  link: {
    color: "#0F766E",
    fontWeight: "bold",
  },
});