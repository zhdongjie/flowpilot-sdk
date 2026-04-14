export const detectIntent = (text: string): string => {
  if (!text) {
    return "unknown";
  }
  if (text.includes("开卡") || text.includes("开户")) {
    return "open_account";
  }
  return "unknown";
};
