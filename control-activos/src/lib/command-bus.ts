export const APP_COMMAND_EVENT = "assetone:command";
const PENDING_COMMAND_KEY = "assetone:pending-command";

export type AppCommand =
  | "new-asset"
  | "export-assets"
  | "import-assets"
  | "new-assignment"
  | "new-user"
  | "new-contract";

const VALID_COMMANDS: AppCommand[] = [
  "new-asset",
  "export-assets",
  "import-assets",
  "new-assignment",
  "new-user",
  "new-contract",
];

export function isAppCommand(value: string | null | undefined): value is AppCommand {
  return typeof value === "string" && VALID_COMMANDS.includes(value as AppCommand);
}

export function dispatchAppCommand(command: AppCommand) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(APP_COMMAND_EVENT, { detail: { command } }));
}

export function setPendingAppCommand(command: AppCommand) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PENDING_COMMAND_KEY, command);
}

export function consumePendingAppCommand(): AppCommand | null {
  if (typeof window === "undefined") {
    return null;
  }

  const command = window.sessionStorage.getItem(PENDING_COMMAND_KEY);
  if (!isAppCommand(command)) {
    return null;
  }

  window.sessionStorage.removeItem(PENDING_COMMAND_KEY);
  return command;
}
