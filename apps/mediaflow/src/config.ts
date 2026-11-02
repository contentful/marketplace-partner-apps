// BACKEND_URL differs per build target and comes from .env.<mode> (development, staging, app2, production).
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const MEDIAFLOW_BASE_URL = "https://api.mediaflow.com/1/";
export const MEDIAFLOW_CDN_ID = 2; // Mediaflow's bunny-cdn id. Ask Mediaflow for alternatives if necessary.
