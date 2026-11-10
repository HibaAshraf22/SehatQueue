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

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing information",
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (error: any) {
      Alert.alert(
        "Login failed",
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

        <Text style={styles.heading}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Login to your patient account
        </Text>

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
          placeholder="Enter your password"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{" "}
          </Text>
          <Link href={"/register" as any} style={styles.link}>
           Register
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
    marginBottom: 40,
  },
  heading: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#16324F",
  },
  subtitle: {
    color: "#64748B",
    marginTop: 7,
    marginBottom: 28,
  },
  label: {
    color: "#16324F",
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 15,
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
    marginTop: 28,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  footerText: {
    color: "#64748B",
  },
  link: {
    color: "#0F766E",
    fontWeight: "bold",
  },
});