type AlertButton = { text?: string; onPress?: () => void; style?: string };
/** React Native Web does not implement Alert.alert. Use actual browser dialogs
 * for every destructive action rather than silently ignoring the request.
 */
export const appAlerts = {
  alert(title: string, description?: string, buttons?: AlertButton[]) {
    const message = [title, description].filter(Boolean).join("\n\n");
    if (!buttons?.length) { window.alert(message); return; }
    const affirmative = buttons.findLast(button => button.style !== "cancel");
    if (!affirmative) { window.alert(message); return; }
    if (window.confirm(message)) affirmative.onPress?.();
    else buttons.find(button => button.style === "cancel")?.onPress?.();
  }
};
