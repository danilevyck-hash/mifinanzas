// In-memory store for password reset codes
// Works in Node.js runtime (not edge) where module state persists between requests
const resetCodes = new Map<string, { code: string; expires: number }>();

export { resetCodes };
