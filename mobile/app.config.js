const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://bet-prediction-api.onrender.com";

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl: API_URL,
  },
});
