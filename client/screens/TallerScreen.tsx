import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  Wrench,
  Plus,
  DollarSign,
  FileText,
  Trash2,
  X,
  AlertCircle,
  Volume2,
  Calendar,
  Gauge,
} from "lucide-react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  getExpenses,
  addExpense,
  deleteExpense,
  getCurrentMonthTotal,
  Expense,
  Fault,
  getSelectedVehicle,
  addVehicleFault,
  deleteVehicleFault,
  Vehicle,
} from "@/lib/storage";

const EXPENSE_CATEGORIES = [
  "Gasolina",
  "Repuestos",
  "Aceite",
  "Cauchos",
  "Frenos",
  "Lavado",
  "Seguro",
  "Otro",
];

function ExpenseItem({
  expense,
  onDelete,
}: {
  expense: Expense;
  onDelete: () => void;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.expenseItem, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={styles.expenseContent}>
        <View
          style={[
            styles.expenseIcon,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <DollarSign color={Colors.light.primary} size={18} />
        </View>
        <View style={styles.expenseInfo}>
          <ThemedText type="body" style={styles.expenseDescription}>
            {expense.description}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {new Date(expense.date).toLocaleDateString("es-VE")}
          </ThemedText>
        </View>
        <View style={styles.expenseRight}>
          <ThemedText type="body" style={styles.expenseAmount}>
            ${expense.amount.toLocaleString()}
          </ThemedText>
          <Pressable onPress={onDelete} style={styles.deleteButton}>
            <Trash2 color={Colors.light.alertRed} size={18} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function FaultItem({
  fault,
  onDelete,
}: {
  fault: Fault;
  onDelete: () => void;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.faultItem, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={styles.faultContent}>
        <View
          style={[
            styles.faultIcon,
            { backgroundColor: Colors.light.alertRed + "20" },
          ]}
        >
          <AlertCircle color={Colors.light.alertRed} size={18} />
        </View>
        <View style={styles.faultInfo}>
          <ThemedText type="body" style={styles.faultDescription}>
            {fault.description}
          </ThemedText>
          <View style={styles.faultMeta}>
            <View style={styles.faultMetaItem}>
              <Calendar color={theme.textSecondary} size={12} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {new Date(fault.date).toLocaleDateString("es-VE")}
              </ThemedText>
            </View>
            <View style={styles.faultMetaItem}>
              <Gauge color={theme.textSecondary} size={12} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {fault.km.toLocaleString()} km
              </ThemedText>
            </View>
          </View>
        </View>
        <Pressable onPress={onDelete} style={styles.deleteButton}>
          <Trash2 color={Colors.light.alertRed} size={18} />
        </Pressable>
      </View>
    </View>
  );
}

export default function TallerScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showFaultModal, setShowFaultModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"gastos" | "ruiditos">("gastos");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [faultDescription, setFaultDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    const expenseData = await getExpenses();
    const vehicle = await getSelectedVehicle();
    setExpenses(expenseData);
    setSelectedVehicle(vehicle);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const monthTotal = getCurrentMonthTotal(expenses);
  const faults = selectedVehicle?.faults || [];
  const currentKm = selectedVehicle?.currentKm || 0;

  const handleAddExpense = async () => {
    if (!amount || !description) return;

    setIsSaving(true);
    await addExpense({
      amount: parseFloat(amount),
      description,
      date: new Date().toISOString(),
    });
    await loadData();
    setAmount("");
    setDescription("");
    setShowExpenseModal(false);
    setIsSaving(false);
  };

  const handleAddFault = async () => {
    if (!faultDescription.trim() || !selectedVehicle) return;

    setIsSaving(true);
    await addVehicleFault(selectedVehicle.id, {
      description: faultDescription.trim(),
      date: new Date().toISOString(),
      km: currentKm,
    });
    await loadData();
    setFaultDescription("");
    setShowFaultModal(false);
    setIsSaving(false);
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
    await loadData();
  };

  const handleDeleteFault = async (id: string) => {
    if (!selectedVehicle) return;
    await deleteVehicleFault(selectedVehicle.id, id);
    await loadData();
  };

  const handleCategorySelect = (category: string) => {
    setDescription(category);
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
          <View style={styles.headerTop}>
            <Wrench color={theme.text} size={28} />
            <ThemedText type="h2">El Taller</ThemedText>
          </View>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Gastos y Ruiditos {selectedVehicle ? `de ${selectedVehicle.name}` : ""}
          </ThemedText>
        </View>

        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => setActiveTab("gastos")}
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === "gastos"
                    ? Colors.light.primary
                    : theme.backgroundDefault,
              },
            ]}
          >
            <DollarSign
              color={activeTab === "gastos" ? "#000" : theme.text}
              size={18}
            />
            <ThemedText
              type="body"
              style={{
                color: activeTab === "gastos" ? "#000" : theme.text,
                fontWeight: activeTab === "gastos" ? "600" : "400",
              }}
            >
              Gastos
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("ruiditos")}
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === "ruiditos"
                    ? Colors.light.primary
                    : theme.backgroundDefault,
              },
            ]}
          >
            <Volume2
              color={activeTab === "ruiditos" ? "#000" : theme.text}
              size={18}
            />
            <ThemedText
              type="body"
              style={{
                color: activeTab === "ruiditos" ? "#000" : theme.text,
                fontWeight: activeTab === "ruiditos" ? "600" : "400",
              }}
            >
              Los Ruiditos
            </ThemedText>
          </Pressable>
        </View>

        {activeTab === "gastos" ? (
          <>
            <View
              style={[styles.summaryCard, { backgroundColor: Colors.light.primary }]}
            >
              <ThemedText type="small" style={styles.summaryLabel}>
                Gasto Total del Mes
              </ThemedText>
              <ThemedText type="hero" style={styles.summaryAmount}>
                ${monthTotal.toLocaleString()}
              </ThemedText>
            </View>

            <Pressable
              onPress={() => setShowExpenseModal(true)}
              style={[styles.addButton, { backgroundColor: theme.backgroundDefault }]}
            >
              <Plus color={Colors.light.primary} size={24} />
              <ThemedText type="body" style={{ color: Colors.light.primary, fontWeight: "600" }}>
                Agregar Gasto
              </ThemedText>
            </Pressable>

            {expenses.length > 0 ? (
              <View style={styles.listSection}>
                <ThemedText type="h4" style={styles.sectionTitle}>
                  Historial
                </ThemedText>
                {expenses.map((expense) => (
                  <ExpenseItem
                    key={expense.id}
                    expense={expense}
                    onDelete={() => handleDeleteExpense(expense.id)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <FileText color={theme.textSecondary} size={48} />
                <ThemedText
                  type="body"
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  No hay gastos registrados
                </ThemedText>
              </View>
            )}
          </>
        ) : (
          <>
            <View
              style={[styles.infoCard, { backgroundColor: Colors.light.warningOrange + "20" }]}
            >
              <AlertCircle color={Colors.light.warningOrange} size={24} />
              <View style={styles.infoCardContent}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  Registra los ruiditos
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Anota cualquier cosa rara que sientas en tu carro para mostrarselo al mecanico
                </ThemedText>
              </View>
            </View>

            <Pressable
              onPress={() => setShowFaultModal(true)}
              style={[styles.addButton, { backgroundColor: theme.backgroundDefault, borderColor: Colors.light.alertRed }]}
            >
              <Plus color={Colors.light.alertRed} size={24} />
              <ThemedText type="body" style={{ color: Colors.light.alertRed, fontWeight: "600" }}>
                Reportar Falla
              </ThemedText>
            </Pressable>

            {faults.length > 0 ? (
              <View style={styles.listSection}>
                <ThemedText type="h4" style={styles.sectionTitle}>
                  Historial de Fallas
                </ThemedText>
                {faults.map((fault) => (
                  <FaultItem
                    key={fault.id}
                    fault={fault}
                    onDelete={() => handleDeleteFault(fault.id)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Volume2 color={theme.textSecondary} size={48} />
                <ThemedText
                  type="body"
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  No hay ruiditos reportados
                </ThemedText>
                <ThemedText
                  type="small"
                  style={[styles.emptySubtext, { color: theme.textSecondary }]}
                >
                  Todo bien con tu nave!
                </ThemedText>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showExpenseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExpenseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <KeyboardAwareScrollViewCompat
              contentContainerStyle={styles.modalScroll}
            >
              <View style={styles.modalHeader}>
                <ThemedText type="h3">Nuevo Gasto</ThemedText>
                <Pressable
                  onPress={() => setShowExpenseModal(false)}
                  style={styles.closeButton}
                >
                  <X color={theme.text} size={24} />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.inputSection}>
                  <ThemedText type="body" style={styles.inputLabel}>
                    Monto ($)
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundDefault,
                        color: theme.text,
                        borderColor: amount ? Colors.light.primary : theme.border,
                      },
                    ]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                    value={amount}
                    onChangeText={(text) =>
                      setAmount(text.replace(/[^0-9.]/g, ""))
                    }
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.inputSection}>
                  <ThemedText type="body" style={styles.inputLabel}>
                    Descripcion
                  </ThemedText>
                  <View style={styles.categoriesGrid}>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => handleCategorySelect(cat)}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor:
                              description === cat
                                ? Colors.light.primary
                                : theme.backgroundDefault,
                          },
                        ]}
                      >
                        <ThemedText
                          type="small"
                          style={{
                            color: description === cat ? "#000" : theme.text,
                            fontWeight: description === cat ? "600" : "400",
                          }}
                        >
                          {cat}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundDefault,
                        color: theme.text,
                        borderColor: description ? Colors.light.primary : theme.border,
                      },
                    ]}
                    placeholder="O escribe algo diferente..."
                    placeholderTextColor={theme.textSecondary}
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <Button
                  onPress={handleAddExpense}
                  disabled={!amount || !description || isSaving}
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor:
                        amount && description
                          ? Colors.light.primary
                          : theme.backgroundSecondary,
                    },
                  ]}
                >
                  {isSaving ? "Guardando..." : "Agregar Gasto"}
                </Button>
              </View>
            </KeyboardAwareScrollViewCompat>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFaultModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFaultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <KeyboardAwareScrollViewCompat
              contentContainerStyle={styles.modalScroll}
            >
              <View style={styles.modalHeader}>
                <ThemedText type="h3">Reportar Ruidito</ThemedText>
                <Pressable
                  onPress={() => setShowFaultModal(false)}
                  style={styles.closeButton}
                >
                  <X color={theme.text} size={24} />
                </Pressable>
              </View>

              <View style={styles.faultModalInfo}>
                <View style={styles.faultModalRow}>
                  <Calendar color={theme.textSecondary} size={16} />
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {new Date().toLocaleDateString("es-VE")}
                  </ThemedText>
                </View>
                <View style={styles.faultModalRow}>
                  <Gauge color={theme.textSecondary} size={16} />
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {currentKm.toLocaleString()} km
                  </ThemedText>
                </View>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.inputSection}>
                  <ThemedText type="body" style={styles.inputLabel}>
                    Que sientes?
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: theme.backgroundDefault,
                        color: theme.text,
                        borderColor: faultDescription ? Colors.light.alertRed : theme.border,
                      },
                    ]}
                    placeholder="Ej: Ruido en la rueda derecha al caer en huecos..."
                    placeholderTextColor={theme.textSecondary}
                    value={faultDescription}
                    onChangeText={setFaultDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <Button
                  onPress={handleAddFault}
                  disabled={!faultDescription.trim() || isSaving}
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor: faultDescription.trim()
                        ? Colors.light.alertRed
                        : theme.backgroundSecondary,
                    },
                  ]}
                >
                  {isSaving ? "Guardando..." : "Reportar Falla"}
                </Button>
              </View>
            </KeyboardAwareScrollViewCompat>
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
    marginBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  tabContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  summaryCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryLabel: {
    color: "rgba(0,0,0,0.6)",
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  summaryAmount: {
    color: "#000000",
    letterSpacing: -2,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  infoCardContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.light.primary,
    marginBottom: Spacing.xl,
  },
  listSection: {
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  expenseItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  expenseContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontWeight: "600",
    marginBottom: 2,
  },
  expenseRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  expenseAmount: {
    fontWeight: "700",
    color: Colors.light.primary,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  faultItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  faultContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  faultIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  faultInfo: {
    flex: 1,
  },
  faultDescription: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  faultMeta: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  faultMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
    fontWeight: "600",
  },
  emptySubtext: {
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
  },
  modalScroll: {
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalBody: {
    marginBottom: Spacing.xl,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 2,
  },
  textArea: {
    minHeight: 120,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    fontSize: 16,
    borderWidth: 2,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  modalFooter: {
    marginTop: "auto",
  },
  saveButton: {
    height: Spacing.buttonHeight,
  },
  faultModalInfo: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  faultModalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
});
