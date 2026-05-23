/**
 * Centralized Logger Service
 * 
 * Auto-disables debugging/verbose logs in production environment
 * while keeping warnings and errors active for diagnostic purposes.
 */

const IS_PROD = import.meta.env.PROD;

export const logger = {
    debug: (...args: any[]) => {
        if (!IS_PROD) {
            console.debug("🐛 [DEBUG]", ...args);
        }
    },
    
    log: (...args: any[]) => {
        if (!IS_PROD) {
            console.log("📝 [INFO]", ...args);
        }
    },
    
    warn: (...args: any[]) => {
        // Keep warnings in prod for troubleshooting but flag them
        console.warn("⚠️ [WARN]", ...args);
    },
    
    error: (...args: any[]) => {
        // Always log errors
        console.error("❌ [ERROR]", ...args);
    }
};
