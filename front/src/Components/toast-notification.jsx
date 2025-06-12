"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export const useToast = () => {
    const [toasts, setToasts] = useState([])

    const addToast = (message, type = "info", duration = 5000) => {
        const id = Date.now() + Math.random()
        const toast = {
            id,
            message,
            type, // 'success', 'error', 'warning', 'info'
            duration,
        }

        setToasts((prev) => [...prev, toast])

        // Auto-remover después del tiempo especificado
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }

        return id
    }

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }

    const showSuccess = (message, duration = 4000) => addToast(message, "success", duration)
    const showError = (message, duration = 6000) => addToast(message, "error", duration)
    const showWarning = (message, duration = 5000) => addToast(message, "warning", duration)
    const showInfo = (message, duration = 4000) => addToast(message, "info", duration)

    const clearAll = () => setToasts([])

    return {
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        clearAll,
    }
}

/**
 * Componente individual de Toast
 */
const Toast = ({ toast, onRemove }) => {
    const getToastStyles = (type) => {
        const baseStyles = {
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: "300px",
            maxWidth: "500px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
        }

        switch (type) {
            case "success":
                return {
                    ...baseStyles,
                    backgroundColor: "#d4edda",
                    color: "#155724",
                    border: "1px solid #c3e6cb",
                }
            case "error":
                return {
                    ...baseStyles,
                    backgroundColor: "#f8d7da",
                    color: "#721c24",
                    border: "1px solid #f5c6cb",
                }
            case "warning":
                return {
                    ...baseStyles,
                    backgroundColor: "#fff3cd",
                    color: "#856404",
                    border: "1px solid #ffeaa7",
                }
            case "info":
            default:
                return {
                    ...baseStyles,
                    backgroundColor: "#d1ecf1",
                    color: "#0c5460",
                    border: "1px solid #bee5eb",
                }
        }
    }

    const getIcon = (type) => {
        switch (type) {
            case "success":
                return "✅"
            case "error":
                return "❌"
            case "warning":
                return "⚠️"
            case "info":
            default:
                return "ℹ️"
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={getToastStyles(toast.type)}
            onClick={() => onRemove(toast.id)}
        >
            <span className="toast-icon">{getIcon(toast.type)}</span>
            <span className="toast-message" style={{ flex: 1 }}>
        {toast.message}
      </span>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove(toast.id)
                }}
                style={{
                    background: "none",
                    border: "none",
                    fontSize: "16px",
                    cursor: "pointer",
                    opacity: 0.7,
                    padding: "0",
                    marginLeft: "8px",
                }}
            >
                ×
            </button>
        </motion.div>
    )
}

/**
 * Contenedor de notificaciones toast
 */
export const ToastContainer = ({ toasts, onRemove }) => {
    return (
        <div
            className="toast-container"
            style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                zIndex: 9999,
                pointerEvents: "none",
            }}
        >
            <AnimatePresence>
                {toasts.map((toast) => (
                    <div key={toast.id} style={{ pointerEvents: "auto" }}>
                        <Toast toast={toast} onRemove={onRemove} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    )
}
