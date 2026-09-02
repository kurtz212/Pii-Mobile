import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme/colors";
import { EspaceResponse, getEspacesPublic } from "../../services/espaces.service";

interface Props {
  visible: boolean;
  espaceType: "agence_cargo" | "transitaire";
  selectedIds: string[];
  onChangeSelection: (ids: string[]) => void;
  onClose: () => void;
}

export function AgencySelectorModal({ visible, espaceType, selectedIds, onChangeSelection, onClose }: Props) {
  const [agencies, setAgencies] = useState<EspaceResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await getEspacesPublic(espaceType);
        if (!cancelled) setAgencies(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [visible, espaceType]);

  function toggleAgency(id: string) {
    if (selectedIds.includes(id)) {
      onChangeSelection(selectedIds.filter((x) => x !== id));
    } else {
      onChangeSelection([...selectedIds, id]);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Choisir les agences</Text>
            <Ionicons name="close" size={20} color={colors.textSecondary} onPress={onClose} />
          </View>

          <Pressable
            style={[styles.allOption, selectedIds.length === 0 && styles.allOptionActive]}
            onPress={() => onChangeSelection([])}
          >
            <Ionicons
              name={selectedIds.length === 0 ? "radio-button-on" : "radio-button-off"}
              size={18}
              color={colors.accent}
            />
            <Text style={styles.allOptionText}>Toutes les agences</Text>
          </Pressable>

          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.lg }} />
          ) : (
            <FlatList
              data={agencies}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <Pressable style={styles.agencyRow} onPress={() => toggleAgency(item.id)}>
                    <Ionicons
                      name={checked ? "checkbox" : "square-outline"}
                      size={18}
                      color={checked ? colors.accent : colors.textMuted}
                    />
                    <Text style={styles.agencyName}>{item.name}</Text>
                    {item.location && <Text style={styles.agencyLocation}>{item.location}</Text>}
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>Aucune agence trouvée.</Text>}
            />
          )}

          <Pressable style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>
              {selectedIds.length === 0
                ? "Diffuser à toutes"
                : `Valider (${selectedIds.length} sélectionnée${selectedIds.length > 1 ? "s" : ""})`}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  box: { backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: "80%" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  title: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  allOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  allOptionActive: { backgroundColor: colors.accentBg },
  allOptionText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  agencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  agencyName: { fontSize: 13, color: colors.textPrimary, flex: 1 },
  agencyLocation: { fontSize: 11, color: colors.textMuted },
  emptyText: { fontSize: 12, color: colors.textMuted, textAlign: "center", paddingVertical: spacing.lg },
  doneButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: spacing.md,
  },
  doneButtonText: { fontSize: 13, fontWeight: "600", color: colors.onAccent },
});