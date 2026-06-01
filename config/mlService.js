const LOCAL_ML_SERVICE_URL = "http://127.0.0.1:8000";
const PRODUCTION_ML_SERVICE_URL =
  "https://ai-career-guidance-platform-ml-service-mwdv.onrender.com";

const stripTrailingSlash = (url) => url.replace(/\/+$/, "");

const getMlServiceUrl = () => {
  const configuredUrl = process.env.ML_SERVICE_URL?.trim();
  const isHostedRuntime = process.env.NODE_ENV === "production" || process.env.VERCEL || process.env.RENDER;
  const defaultUrl =
    isHostedRuntime
      ? PRODUCTION_ML_SERVICE_URL
      : LOCAL_ML_SERVICE_URL;

  return stripTrailingSlash(configuredUrl || defaultUrl);
};

const ML_SERVICE_URL = getMlServiceUrl();

const buildMlServiceUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${ML_SERVICE_URL}${normalizedPath}`;
};

module.exports = {
  ML_SERVICE_URL,
  buildMlServiceUrl,
};
