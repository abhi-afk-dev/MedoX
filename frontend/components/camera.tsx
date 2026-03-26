import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useState, useRef } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CameraModalProps {
  isVisible: boolean;
  onClose: () => void;
  onPictureTaken: (uri: string) => void;
}

export default function CameraModal({
  isVisible,
  onClose,
  onPictureTaken,
}: CameraModalProps) {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isTaking, setIsTaking] = useState(false);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <Modal visible={isVisible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.message}>
            We need your permission to show the camera
          </Text>
          <View style={styles.permitButtons}>
            <Button onPress={requestPermission} title="Grant Permission" />
            <Button onPress={onClose} title="Cancel" color="red" />
          </View>
        </View>
      </Modal>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  async function takePicture() {
    if (cameraRef.current && !isTaking) {
      setIsTaking(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        });
        if (photo?.uri) {
          onPictureTaken(photo.uri);
          onClose();
        }
      } catch (e) {
        console.error("Failed to take picture:", e);
      } finally {
        setIsTaking(false);
      }
    }
  }

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse" size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              {isTaking ? (
                <ActivityIndicator color="black" />
              ) : (
                <View style={styles.captureInner} />
              )}
            </TouchableOpacity>

            <View style={{ width: 40 }} />
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  permissionContainer: {
    flex: 1,
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#09090b",
  },
  permitButtons: {
    gap:20,
    flexDirection:"row",
  },
  message: {
    textAlign: "center",
    paddingBottom: 20,
    color: "white",
    fontSize: 16,
  },
  camera: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: "flex-start",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 40,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingTop: 20,
  },
  iconButton: {
    padding: 10,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "black",
    backgroundColor: "white",
  },
});
