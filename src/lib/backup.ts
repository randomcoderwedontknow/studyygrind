import { DATA_VERSION, STORE_KEY } from "../data/constants";
import { migrateStore } from "./migrations";
import type { AppStore } from "../types";

export type BackupPayload = {
  schema: "studygrind-backup";
  exportedAt: string;
  dataVersion: number;
  store: AppStore;
};

export function buildBackupPayload(store: AppStore): BackupPayload {
  const safe: AppStore = {
    ...store,
    users: Object.fromEntries(
      Object.entries(store.users).map(([k, u]) => [
        k,
        { ...u, password: "" },
      ]),
    ),
  };
  return {
    schema: "studygrind-backup",
    exportedAt: new Date().toISOString(),
    dataVersion: DATA_VERSION,
    store: safe,
  };
}

export function parseBackupJson(text: string): BackupPayload {
  const raw = JSON.parse(text) as Partial<BackupPayload>;
  if (raw.schema !== "studygrind-backup" || !raw.store) {
    throw new Error("Not a StudyGrind backup file.");
  }
  return {
    schema: "studygrind-backup",
    exportedAt: raw.exportedAt ?? new Date().toISOString(),
    dataVersion: raw.dataVersion ?? DATA_VERSION,
    store: migrateStore(raw.store),
  };
}

export function downloadBackup(store: AppStore): void {
  const payload = buildBackupPayload(store);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `studygrind-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function readBackupFile(file: File): Promise<BackupPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(parseBackupJson(String(reader.result ?? "")));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export { STORE_KEY };
