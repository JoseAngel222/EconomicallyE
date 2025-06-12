
export const ErrorDisplay = ({ error, success, className = "" }) => {
    if (!error && !success) return null

    return (
        <div className={`message-container ${className}`}>
            {error && (
                <div
                    className="error-message global-error"
                    style={{
                        color: "#dc3545",
                        backgroundColor: "#f8d7da",
                        border: "1px solid #f5c6cb",
                        borderRadius: "4px",
                        padding: "12px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <span className="error-icon">⚠️</span>
                    {error}
                </div>
            )}
            {success && (
                <div
                    className="success-message global-success"
                    style={{
                        color: "#155724",
                        backgroundColor: "#d4edda",
                        border: "1px solid #c3e6cb",
                        borderRadius: "4px",
                        padding: "12px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <span className="success-icon">✅</span>
                    {success}
                </div>
            )}
        </div>
    )
}

/**
 * Componente para mostrar errores de campo específicos
 */
export const FieldError = ({ error }) => {
    if (!error) return null

    return (
        <p
            className="field-error-message"
            style={{
                color: "#dc3545",
                fontSize: "0.875rem",
                marginTop: "0.25rem",
                marginBottom: "0",
                fontWeight: "500",
            }}
        >
            <span style={{ marginRight: "4px" }}>⚠️</span>
            {error}
        </p>
    )
}
