export const auth = {
  getToken() {
    return localStorage.getItem("sms_token");
  },
  setToken(token) {
    localStorage.setItem("sms_token", token);
  },
  setUser(user) {
    localStorage.setItem("sms_user", JSON.stringify(user));
  },
  getUser() {
    try { return JSON.parse(localStorage.getItem("sms_user") || "null"); } catch { return null; }
  },
  clear() {
    localStorage.removeItem("sms_token");
    localStorage.removeItem("sms_user");
  }
};