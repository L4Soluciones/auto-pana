import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Camera,
  ChevronRight,
  X,
} from "lucide-react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  getDocuments,
  updateDocument,
  getDocumentDaysRemaining,
  Document,
  DocumentType,
} from "@/lib/storage";

const getDocumentIcon = (id: DocumentType) => {
  switch (id) {
    case "licencia":
      return FileText;
    case "cedula":
      return FileText;
    case "medico":
      return FileText;
    case "rcv":
      return FileText;
    case "impuesto_municipal":
      return FileText;
    case "certificado_saberes":
      return FileText;
    default:
      return FileText;
  }
};

function DocumentCard({
  document,
  onPress,
}: {
  document: Document;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const Icon = getDocumentIcon(document.id);
  const daysRemaining = getDocumentDaysRemaining(document.expirationDate);

  const getStatus = () => {
    if (daysRemaining === null) {
      return { status: "pending", color: theme.textSecondary, text: "Sin fecha" };
    }
    if (daysRemaining <= 0) {
      return { status: "expired", color: Colors.light.alertRed, text: "Vencido" };
    }
    if (daysRemaining < 15) {
      return { status: "warning", color: Colors.light.warningOrange, text: `${daysRemaining} dias` };
    }
    return { status: "good", color: Colors.light.success, text: `${daysRemaining} dias` };
  };

  const status = getStatus();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.documentCard,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: status.status === "warning" || status.status === "expired"
            ? status.color
            : "transparent",
          borderWidth: status.status === "warning" || status.status === "expired" ? 2 : 0,
        },
      ]}
    >
      <View style={styles.cardContent}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Icon color={theme.text} size={22} />
        </View>
        <View style={styles.cardInfo}>
          <ThemedText type="body" style={styles.documentName}>
            {document.name}
          </ThemedText>
          <View style={styles.statusRow}>
            {status.status === "expired" || status.status === "warning" ? (
              <AlertTriangle color={status.color} size={14} />
            ) : status.status === "good" ? (
              <CheckCircle color={status.color} size={14} />
            ) : (
              <Calendar color={status.color} size={14} />
            )}
            <ThemedText type="small" style={{ color: status.color }}>
              {status.text}
            </ThemedText>
          </View>
        </View>
        <ChevronRight color={theme.textSecondary} size={18} />
      </View>
    </Pressable>
  );
}

export default function PapelesScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const loadData = async () => {
    const docs = await getDocuments();
    setDocuments(docs);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleDocumentPress = (doc: Document) => {
    setSelectedDocument(doc);
    if (doc.expirationDate) {
      setTempDate(new Date(doc.expirationDate));
    } else {
      setTempDate(new Date());
    }
  };

  const handleDateChange = async (_: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate && selectedDocument) {
      setTempDate(selectedDate);
      await updateDocument(selectedDocument.id, {
        expirationDate: selectedDate.toISOString(),
      });
      await loadData();
      setSelectedDocument({
        ...selectedDocument,
        expirationDate: selectedDate.toISOString(),
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedDocument(null);
    setShowDatePicker(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="h2">Guantera Digital</ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Tus papeles al dia
          </ThemedText>
        </View>

        <View style={styles.documentsList}>
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onPress={() => handleDocumentPress(doc)}
            />
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={selectedDocument !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h3">{selectedDocument?.name}</ThemedText>
              <Pressable onPress={handleCloseModal} style={styles.closeButton}>
                <X color={theme.text} size={24} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.dateSection}>
                <ThemedText type="body" style={styles.sectionLabel}>
                  Fecha de Vencimiento
                </ThemedText>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={[
                    styles.dateButton,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <Calendar color={Colors.light.primary} size={20} />
                  <ThemedText type="body">
                    {selectedDocument?.expirationDate
                      ? new Date(selectedDocument.expirationDate).toLocaleDateString("es-VE")
                      : "Seleccionar fecha"}
                  </ThemedText>
                </Pressable>
              </View>

              {(showDatePicker || Platform.OS === "ios") && selectedDocument ? (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              ) : null}

              <View style={styles.photoSection}>
                <ThemedText type="body" style={styles.sectionLabel}>
                  Foto del Documento
                </ThemedText>
                <Pressable
                  style={[
                    styles.photoButton,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <Camera color={theme.textSecondary} size={32} />
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Subir Foto (Proximamente)
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Button
                onPress={handleCloseModal}
                style={styles.doneButton}
              >
                Listo
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  documentsList: {
    gap: Spacing.md,
  },
  documentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  documentName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["3xl"],
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalBody: {
    gap: Spacing.xl,
  },
  dateSection: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontWeight: "600",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  photoSection: {
    gap: Spacing.sm,
  },
  photoButton: {
    height: 120,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(0,0,0,0.1)",
  },
  modalFooter: {
    marginTop: Spacing.xl,
  },
  doneButton: {
    backgroundColor: Colors.light.primary,
  },
});
