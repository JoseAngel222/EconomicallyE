"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import "./Perfil.css"
import ScrollNav from "../Components/Nav/ScrollNav.jsx"
import Footer from "../Components/Footer/footer.jsx"
import { motion, AnimatePresence } from "framer-motion"
import { Moon, Sun } from "lucide-react"
import { fetchWithErrorHandling, useErrorHandler } from "../Components/utils/error-handler.js"
import { FieldError } from "../Components/ErrorDisplay.jsx"
import { useToast, ToastContainer } from "../Components/toast-notification.jsx"
import LanguageSwitcher from "../Components/Idioma/LanguageSwitcher.jsx"

const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            delay: 0.1 + i * 0.1,
            ease: [0.25, 0.4, 0.25, 1],
        },
    }),
}

// Componente del Modal de Carga
const LoadingModal = ({ isVisible, onClose }) => {
    const { t } = useTranslation()

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="loading-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="loading-modal-content"
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <div className="loading-modal-header">
                            <div className="loading-brain-icon">
                                <div className="brain-wave"></div>
                                <div className="brain-wave"></div>
                                <div className="brain-wave"></div>
                            </div>
                        </div>

                        <div className="loading-modal-body">
                            <h3>{t("profile.generatingAdvice")}</h3>
                            <p>Nuestro asistente está analizando tu situación financiera...</p>

                            <div className="loading-steps">
                                <div className="loading-step active">
                                    <div className="step-icon">📊</div>
                                    <span>{t("profile.analyzingIncome")}</span>
                                </div>
                                <div className="loading-step active">
                                    <div className="step-icon">💰</div>
                                    <span>{t("profile.evaluatingExpenses")}</span>
                                </div>
                                <div className="loading-step active">
                                    <div className="step-icon">🎯</div>
                                    <span>{t("profile.reviewingGoals")}</span>
                                </div>
                                <div className="loading-step">
                                    <div className="step-icon">🤖</div>
                                    <span>{t("profile.generatingRecommendations")}</span>
                                </div>
                            </div>

                            <div className="progress-bar-container">
                                <div className="progress-bar">
                                    <div className="progress-fill"></div>
                                </div>
                            </div>
                        </div>

                        <div className="loading-particles">
                            <div className="particle"></div>
                            <div className="particle"></div>
                            <div className="particle"></div>
                            <div className="particle"></div>
                            <div className="particle"></div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// Componente del botón de modo oscuro
function DarkModeToggle({ darkMode, toggleDarkMode }) {
    const { t } = useTranslation()

    return (
        <button
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            aria-label={darkMode ? t("profile.accessibility.lightMode") : t("profile.accessibility.darkMode")}
        >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
    )
}

export default function PerfilEditable() {
    const { t } = useTranslation()

    // Hook para notificaciones toast
    const toastFunctions = useToast()

    // Hook personalizado para manejo de errores (ahora con toast integrado)
    const { errors, setFieldError, clearFieldError, clearAllErrors, setSuccess, handleApiError, setGlobalError } =
        useErrorHandler(toastFunctions)

    // Estados principales
    const [overview, setOverview] = useState(null)
    const [hasCompletedFirstForm, setHasCompletedFirstForm] = useState(false)
    const [user, setUser] = useState(null)
    const [userId, setUserId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [darkMode, setDarkMode] = useState(false)
    const navigate = useNavigate()

    // Estado para el modal de carga del consejo
    const [generatingAdvice, setGeneratingAdvice] = useState(false)

    // Estados de edición
    const [editingIncome, setEditingIncome] = useState(false)
    const [editingFixed, setEditingFixed] = useState(false)
    const [editingVariable, setEditingVariable] = useState(false)
    const [editingGoals, setEditingGoals] = useState(false)

    // Estados de datos editables
    const [monthlyIncome, setMonthlyIncome] = useState(0)
    const [fixedExpenses, setFixedExpenses] = useState([])
    const [variableExpenses, setVariableExpenses] = useState([])
    const [goals, setGoals] = useState([])

    // Opciones de frecuencia traducidas
    const frequencyOptions = [
        { value: "MONTHLY", label: t("profile.frequencies.MONTHLY") },
        { value: "WEEKLY", label: t("profile.frequencies.WEEKLY") },
        { value: "YEARLY", label: t("profile.frequencies.YEARLY") },
        { value: "DAILY", label: t("profile.frequencies.DAILY") },
    ]

    // Inicializar tema oscuro desde localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem("darkMode")
        if (savedTheme) {
            setDarkMode(JSON.parse(savedTheme))
        }
    }, [])

    // Aplicar tema oscuro al body
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add("dark-theme")
        } else {
            document.body.classList.remove("dark-theme")
        }
        localStorage.setItem("darkMode", JSON.stringify(darkMode))
    }, [darkMode])

    const toggleDarkMode = () => {
        setDarkMode(!darkMode)
    }

    // Función mejorada para cargar datos con manejo de errores
    const loadDataWithErrorHandling = async (url, context) => {
        try {
            const token = localStorage.getItem("token")
            const response = await fetchWithErrorHandling(url, {
                headers: { Authorization: `Bearer ${token}` },
            })
            return await response.json()
        } catch (error) {
            console.warn(`Error al cargar ${context}:`, error.message)
            handleApiError(error, t("profile.messages.errorLoadingData", { context }))
            return []
        }
    }

    // Cargar datos iniciales con mejor manejo de errores
    useEffect(() => {
        const fetchOverview = async () => {
            try {
                clearAllErrors()
                const token = localStorage.getItem("token")

                // Obtener usuario actual
                const userResponse = await fetchWithErrorHandling(`https://economicallye-1.onrender.com/api/users/me`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                })

                const userData = await userResponse.json()
                const currentUserId = userData.id
                setUserId(currentUserId)

                // Obtener overview
                const overviewResponse = await fetchWithErrorHandling(
                    `https://economicallye-1.onrender.com/api/overview/${currentUserId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    },
                )

                const overviewData = await overviewResponse.json()

                // Cargar datos detallados con manejo de errores individual
                const [detailedFixedExpenses, detailedVariableExpenses, detailedGoals] = await Promise.all([
                    loadDataWithErrorHandling(
                        `https://economicallye-1.onrender.com/api/fixed-expenses/${currentUserId}`,
                        "gastos fijos",
                    ),
                    loadDataWithErrorHandling(
                        `https://economicallye-1.onrender.com/api/variable-expenses/${currentUserId}`,
                        "gastos variables",
                    ),
                    loadDataWithErrorHandling(`https://economicallye-1.onrender.com/api/goals/${currentUserId}`, "metas"),
                ])

                const enhancedOverview = {
                    ...overviewData,
                    fixedExpenses: detailedFixedExpenses.length > 0 ? detailedFixedExpenses : overviewData.fixedExpenses || [],
                    variableExpenses:
                        detailedVariableExpenses.length > 0 ? detailedVariableExpenses : overviewData.variableExpenses || [],
                    goals: detailedGoals.length > 0 ? detailedGoals : overviewData.goals || [],
                }

                setOverview(enhancedOverview)
                setMonthlyIncome(enhancedOverview.monthlyIncome || 0)
                setFixedExpenses(enhancedOverview.fixedExpenses || [])
                setVariableExpenses(enhancedOverview.variableExpenses || [])
                setGoals(enhancedOverview.goals || [])
            } catch (error) {
                handleApiError(error, t("profile.messages.errorLoadingProfile"))
            } finally {
                setLoading(false)
            }
        }

        fetchOverview()
    }, [])

    // Función mejorada para guardar ingreso
    const saveIncome = async () => {
        setSaving(true)
        clearAllErrors()

        try {
            const token = localStorage.getItem("token")
            const response = await fetchWithErrorHandling(`https://economicallye-1.onrender.com/api/users/${userId}/income`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ monthlyIncome }),
            })

            setOverview((prev) => ({ ...prev, monthlyIncome }))
            setEditingIncome(false)
            localStorage.setItem("monthlyIncome", monthlyIncome.toString())
            setSuccess(t("profile.messages.incomeUpdated"))
        } catch (error) {
            // Manejar errores de validación específicos para el ingreso
            if (error.fieldErrors) {
                if (error.fieldErrors.monthlyIncome) {
                    setFieldError("monthlyIncome", error.fieldErrors.monthlyIncome)
                }
            }
            handleApiError(error, t("profile.messages.errorSaving") + " el ingreso")
        } finally {
            setSaving(false)
        }
    }

    // Función mejorada para guardar items individuales
    const saveItem = async (type, item) => {
        const token = localStorage.getItem("token")
        let endpoint = ""
        if (type === "fixed") endpoint = "fixed-expenses"
        else if (type === "variable") endpoint = "variable-expenses"
        else if (type === "goal") endpoint = "goals"

        let method = "PUT"
        let url = `https://economicallye-1.onrender.com/api/${endpoint}/${item.id}`

        if (item.id >= 1000000000000) {
            method = "POST"
            url = `https://economicallye-1.onrender.com/api/${endpoint}`
            const { id, ...itemWithoutId } = item
            item = { ...itemWithoutId, userId }
        }

        try {
            const response = await fetchWithErrorHandling(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(item),
            })

            return await response.json()
        } catch (error) {
            // Si hay errores de campo específicos, mapearlos con el ID del item
            if (error.fieldErrors) {
                const mappedErrors = {}
                Object.keys(error.fieldErrors).forEach((field) => {
                    mappedErrors[`${type}_${item.id}_${field}`] = error.fieldErrors[field]
                })
                // Usar setFieldError para establecer los errores mapeados
                Object.entries(mappedErrors).forEach(([field, message]) => {
                    setFieldError(field, message)
                })
            }
            throw error
        }
    }

    // Función mejorada para guardar todos los items
    const saveAllItems = async (type) => {
        setSaving(true)
        clearAllErrors()

        try {
            let items = []
            if (type === "fixed") items = fixedExpenses
            else if (type === "variable") items = variableExpenses
            else if (type === "goal") items = goals

            // Validar items básicos antes de enviar
            const validItems = items.filter((item) => {
                return item.name || (type === "goal" ? item.targetAmount : item.amount)
            })

            // Guardar items uno por uno para capturar errores específicos
            const savedItems = []
            let hasErrors = false

            let firstErrorMessage = null

            for (const item of validItems) {
                try {
                    const savedItem = await saveItem(type, item)
                    savedItems.push(savedItem)
                } catch (error) {
                    hasErrors = true
                    console.error(`Error saving item ${item.id}:`, error)
                    // Los errores de campo ya se establecieron en saveItem

                    // Guardar el primer mensaje de error relevante para mostrar en el toast
                    if (!firstErrorMessage && error?.message) {
                        firstErrorMessage = error.message
                    }
                }
            }

            // Si hay errores, no actualizar el estado y mostrar mensaje
            if (hasErrors) {
                const fallback = t("profile.messages.someItemsNotSaved")
                setGlobalError(firstErrorMessage || fallback)
                return
            }

            // Si todo se guardó correctamente, actualizar estado
            if (type === "fixed") {
                setFixedExpenses(savedItems)
                setEditingFixed(false)
            } else if (type === "variable") {
                setVariableExpenses(savedItems)
                setEditingVariable(false)
            } else if (type === "goal") {
                setGoals(savedItems)
                setEditingGoals(false)
            }

            // Actualizar overview
            setOverview((prev) => ({
                ...prev,
                [type === "fixed" ? "fixedExpenses" : type === "variable" ? "variableExpenses" : "goals"]: savedItems,
            }))

            setSuccess(t("profile.messages.changesSaved"))
        } catch (error) {
            handleApiError(error, t("profile.messages.errorSaving") + ` ${type}`)
        } finally {
            setSaving(false)
        }
    }

    // Función mejorada para eliminar items
    const deleteItem = async (type, id) => {
        if (id >= 1000000000000) {
            // Item temporal, solo remover del estado
            if (type === "fixed") setFixedExpenses((prev) => prev.filter((e) => e.id !== id))
            else if (type === "variable") setVariableExpenses((prev) => prev.filter((e) => e.id !== id))
            else if (type === "goal") setGoals((prev) => prev.filter((e) => e.id !== id))
            return
        }

        try {
            const token = localStorage.getItem("token")
            let endpoint = ""
            if (type === "fixed") endpoint = "fixed-expenses"
            else if (type === "variable") endpoint = "variable-expenses"
            else if (type === "goal") endpoint = "goals"

            await fetchWithErrorHandling(`https://economicallye-1.onrender.com/api/${endpoint}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })

            if (type === "fixed") setFixedExpenses((prev) => prev.filter((e) => e.id !== id))
            else if (type === "variable") setVariableExpenses((prev) => prev.filter((e) => e.id !== id))
            else if (type === "goal") setGoals((prev) => prev.filter((e) => e.id !== id))

            setSuccess(t("profile.messages.itemDeleted"))
        } catch (error) {
            handleApiError(error, t("profile.messages.errorDeleting"))
        }
    }

    const addItem = (type) => {
        clearAllErrors() // Limpiar errores al añadir nuevo item
        const tempId = Date.now()

        if (type === "fixed") {
            setFixedExpenses((prev) => [
                ...prev,
                {
                    id: tempId,
                    name: "",
                    amount: 0,
                    frequency: "MONTHLY",
                    description: "",
                    userId,
                },
            ])
        } else if (type === "variable") {
            setVariableExpenses((prev) => [
                ...prev,
                {
                    id: tempId,
                    name: "",
                    amount: 0,
                    expenseDate: new Date().toISOString().split("T")[0],
                    description: "",
                    userId,
                },
            ])
        } else if (type === "goal") {
            setGoals((prev) => [
                ...prev,
                {
                    id: tempId,
                    name: "",
                    targetAmount: 0,
                    savedAmount: 0,
                    description: "",
                    deadline: "",
                    userId,
                },
            ])
        }
    }

    const updateField = (type, id, field, value) => {
        // Limpiar error del campo cuando se actualiza
        clearFieldError(`${type}_${id}_${field}`)

        if (type === "fixed") {
            setFixedExpenses((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
        } else if (type === "variable") {
            setVariableExpenses((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
        } else if (type === "goal") {
            setGoals((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
        }
    }

    // Función mejorada para generar consejo
    const handleGenerateAdvice = async () => {
        setGeneratingAdvice(true)
        clearAllErrors()

        try {
            const token = localStorage.getItem("token")

            if (!overview || !userId) {
                setGlobalError(t("profile.messages.insufficientData"))
                return
            }

            const requestData = {
                userId: userId,
                income: overview.monthlyIncome || 0,
                goals: (overview.goals || []).map((goal) => ({
                    id: goal.id,
                    name: goal.name || "",
                    description: goal.description || "",
                    targetAmount: goal.targetAmount || 0,
                    currentAmount: goal.currentAmount || 0,
                    targetDate: goal.targetDate || null,
                })),
                fixedExpenses: (overview.fixedExpenses || []).map((expense) => ({
                    id: expense.id,
                    name: expense.name || expense.description || "",
                    amount: expense.amount || 0,
                    category: expense.category || "",
                })),
                variableExpenses: (overview.variableExpenses || []).map((expense) => ({
                    id: expense.id,
                    name: expense.name || expense.description || "",
                    amount: expense.amount || 0,
                    category: expense.category || "",
                    date: expense.date || null,
                })),
            }

            console.log("🚀 Enviando datos para generar consejo:", requestData)

            const response = await fetchWithErrorHandling(`https://economicallye-1.onrender.com/api/advice`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(requestData),
            })

            const result = await response.json()
            console.log("📋 Respuesta del servidor:", result)

            // Verificar si la respuesta contiene un mensaje de error de validación
            if (
                result.iaResult &&
                (result.iaResult.includes("Debes actualizar tu información financiera") ||
                    result.iaResult.includes("You must update your financial information") ||
                    result.iaResult.includes("Debes esperar al menos") ||
                    result.iaResult.includes("You must wait at least") ||
                    result.iaResult.includes("Debes tener al menos una meta") ||
                    result.iaResult.includes("You must have at least one") ||
                    result.iaResult.includes("Debes configurar tus ingresos") ||
                    result.iaResult.includes("You must configure your monthly income"))
            ) {
                // Es un mensaje de error de validación, no un consejo válido
                setGlobalError(result.iaResult)
                console.log("❌ Error de validación:", result.iaResult)
                return
            }

            // Si llegamos aquí, el consejo se generó correctamente
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setSuccess(t("profile.messages.adviceGenerated"))
            navigate(`/consejos/${userId}`)
        } catch (error) {
            console.error("💥 Error al generar consejo:", error)
            handleApiError(error, t("profile.messages.errorGeneratingAdvice"))
        } finally {
            setGeneratingAdvice(false)
        }
    }

    // Calcular totales
    const totalFixed = fixedExpenses.reduce((sum, e) => sum + (e?.amount || 0), 0)
    const totalVariable = variableExpenses.reduce((sum, e) => sum + (e?.amount || 0), 0)
    const totalExpenses = totalFixed + totalVariable
    const totalSavings = monthlyIncome - totalExpenses

    const [globalError, setGlobalErrorState] = useState(null)

    if (loading) {
        return (
            <div className={`elegant-loading-container ${darkMode ? "dark-theme" : ""}`}>
                <div className="loading-content">
                    <div className="loading-spinner">
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                    </div>
                    <h3>{t("profile.loading")}</h3>
                </div>
                <div className="loading-background">
                    <div className="floating-shape shape-1"></div>
                    <div className="floating-shape shape-2"></div>
                    <div className="floating-shape shape-3"></div>
                </div>
            </div>
        )
    }

    if (globalError && !overview) {
        return (
            <div className={`elegant-error-container ${darkMode ? "dark-theme" : ""}`}>
                <div className="error-content">
                    <div className="error-icon">⚠️</div>
                    <h2>{t("profile.error")}</h2>
                    <p>{globalError}</p>
                    <button className="elegant-btn primary" onClick={() => window.location.reload()}>
                        {t("profile.retry")}
                    </button>
                </div>
            </div>
        )
    }

    // Configurar los enlaces para el ScrollNav
    const scrollNavLinks = [
        {
            href: "#inicio",
            label: t("profile.navigation.home"),
            onClick: () => navigate("/"),
        },
        {
            href: "#consejos",
            label: t("profile.navigation.viewAdvice"),
            onClick: () => navigate(`/consejos/${userId}`),
        },
        {
            href: "#dashboard",
            label: t("profile.navigation.dashboard"),
            onClick: () => navigate(`/dashboard/${userId}`),
        },
        {
            href: "#generar",
            label: t("profile.navigation.generateAdvice"),
            onClick: handleGenerateAdvice,
        },
    ]

    return (
        <div className={`dashboard-container ${darkMode ? "dark-theme" : ""}`}>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

            <LanguageSwitcher />

            <LoadingModal isVisible={generatingAdvice} />

            <ToastContainer toasts={toastFunctions.toasts} onRemove={toastFunctions.removeToast} />

            <div className="background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            {/* ScrollNav */}
            <ScrollNav links={scrollNavLinks} user={userId} />

            {/* Header */}
            <motion.header className="elegant-header" initial="hidden" animate="visible" variants={fadeUpVariants} custom={0}>
                <div className="header-content">
                    <div className="welcome-section">
                        <h1 className="welcome-title">{t("profile.welcome", { name: overview?.name })}</h1>
                        <p className="welcome-subtitle">{t("profile.subtitle")}</p>
                    </div>
                    <div className="header-actions">
                        <button className="elegant-btn primary" onClick={() => navigate(`/consejos/${userId}`)}>
                            <span className="btn-icon"></span>
                            {t("profile.viewAdvice")}
                        </button>
                        <button className="elegant-btn secondary" onClick={handleGenerateAdvice}>
                            <span className="btn-icon"></span>
                            {t("profile.generateAdvice")}
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Resumen económico */}
            <motion.section
                className="economic-overview"
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                custom={1}
            >
                <h2 className="section-title">
                    <span className="title-icon"></span>
                    {t("profile.financialSummary")}
                </h2>
                <div className="overview-grid">
                    <div className="overview-card income">
                        <div className="card-header">
                            <div className="card-icon"></div>
                            <h3>{t("profile.income")}</h3>
                        </div>
                        <div className="card-value">€{monthlyIncome.toLocaleString()}</div>
                        <div className="card-label">{t("profile.monthly")}</div>
                    </div>

                    <div className="overview-card expenses">
                        <div className="card-header">
                            <div className="card-icon"></div>
                            <h3>{t("profile.expenses")}</h3>
                        </div>
                        <div className="card-value">€{totalExpenses.toLocaleString()}</div>
                        <div className="card-label">{t("profile.total")}</div>
                    </div>

                    <div className={`overview-card ${totalSavings >= 0 ? "savings" : "deficit"}`}>
                        <div className="card-header">
                            <div className="card-icon">{totalSavings >= 0 ? "" : ""}</div>
                            <h3>{totalSavings >= 0 ? t("profile.savings") : t("profile.deficit")}</h3>
                        </div>
                        <div className="card-value">€{Math.abs(totalSavings).toLocaleString()}</div>
                        <div className="card-label">{t("profile.estimated")}</div>
                    </div>

                    <div className="overview-card percentage">
                        <div className="card-header">
                            <div className="card-icon"></div>
                            <h3>{t("profile.savingsPercentage")}</h3>
                        </div>
                        <div className="card-value">
                            {monthlyIncome > 0 ? ((totalSavings / monthlyIncome) * 100).toFixed(1) : "0.0"}%
                        </div>
                        <div className="card-label">{t("profile.ofIncome")}</div>
                    </div>
                </div>
            </motion.section>

            {/* Ingreso Mensual */}
            <motion.section
                className="income-section"
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                custom={2}
            >
                <div className="elegant-card">
                    <div className="card-header">
                        <h3>
                            <span className="header-icon"></span>
                            {t("profile.monthlyIncome")}
                        </h3>
                        <button className="elegant-btn outline" onClick={() => setEditingIncome(!editingIncome)}>
                            {editingIncome ? t("profile.cancel") : t("profile.edit")}
                        </button>
                    </div>
                    <div className="card-content">
                        {editingIncome ? (
                            <div className="edit-form">
                                <div className="form-group">
                                    <label>{t("profile.amount")}</label>
                                    <input
                                        type="number"
                                        className="elegant-input"
                                        value={monthlyIncome}
                                        onChange={(e) => setMonthlyIncome(Number.parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                    <FieldError error={errors.monthlyIncome} />
                                </div>
                                <div className="form-actions">
                                    <button className="elegant-btn primary" onClick={saveIncome} disabled={saving}>
                                        {saving ? t("profile.saving") : t("profile.save")}
                                    </button>
                                    <button
                                        className="elegant-btn outline"
                                        onClick={() => {
                                            setMonthlyIncome(overview?.monthlyIncome || 0)
                                            setEditingIncome(false)
                                            clearAllErrors()
                                        }}
                                    >
                                        {t("profile.cancel")}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="income-display">
                                <div className="amount-display">€{monthlyIncome.toLocaleString()}</div>
                                <div className="amount-label">{t("profile.perMonth")}</div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.section>

            {/* Gastos */}
            <motion.section
                className="expenses-section"
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                custom={3}
            >
                <div className="expenses-grid">
                    {/* Gastos Fijos */}
                    <div className="elegant-card fixed-expenses">
                        <div className="card-header">
                            <h3>
                                <span className="header-icon"></span>
                                {t("profile.fixedExpenses")}
                            </h3>
                            <div className="header-actions">
                                <span className="total-badge">€{totalFixed.toLocaleString()}</span>
                                {editingFixed && (
                                    <button className="elegant-btn success small" onClick={() => addItem("fixed")}>
                                        {t("profile.add")}
                                    </button>
                                )}
                                <button className="elegant-btn outline small" onClick={() => setEditingFixed(!editingFixed)}>
                                    {editingFixed ? t("profile.cancel") : t("profile.edit")}
                                </button>
                            </div>
                        </div>
                        <div className="card-content">
                            {editingFixed ? (
                                <div className="edit-form">
                                    <div className="expense-list">
                                        {fixedExpenses.map((expense) => (
                                            <div key={expense.id} className="expense-edit-item">
                                                <div className="expense-inputs">
                                                    <div className="input-group">
                                                        <input
                                                            type="text"
                                                            className="elegant-input"
                                                            value={expense.name || ""}
                                                            onChange={(e) => updateField("fixed", expense.id, "name", e.target.value)}
                                                            placeholder={t("profile.expenseName")}
                                                        />
                                                        <FieldError error={errors[`fixed_${expense.id}_name`]} />
                                                    </div>

                                                    <div className="input-group">
                                                        <input
                                                            type="number"
                                                            className="elegant-input"
                                                            value={expense.amount || ""}
                                                            onChange={(e) =>
                                                                updateField("fixed", expense.id, "amount", Number.parseFloat(e.target.value) || 0)
                                                            }
                                                            placeholder="0.00"
                                                        />
                                                        <FieldError error={errors[`fixed_${expense.id}_amount`]} />
                                                    </div>

                                                    <div className="input-group">
                                                        <select
                                                            className="elegant-select"
                                                            value={expense.frequency || "MONTHLY"}
                                                            onChange={(e) => updateField("fixed", expense.id, "frequency", e.target.value)}
                                                        >
                                                            {frequencyOptions.map((option) => (
                                                                <option key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <FieldError error={errors[`fixed_${expense.id}_frequency`]} />
                                                    </div>

                                                    <div className="input-group">
                                                        <input
                                                            type="text"
                                                            className="elegant-input"
                                                            value={expense.description || ""}
                                                            onChange={(e) => updateField("fixed", expense.id, "description", e.target.value)}
                                                            placeholder={t("profile.description")}
                                                        />
                                                        <FieldError error={errors[`fixed_${expense.id}_description`]} />
                                                    </div>
                                                </div>
                                                <button className="elegant-btn danger small" onClick={() => deleteItem("fixed", expense.id)}>
                                                    {t("profile.delete")}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="form-actions">
                                        <button className="elegant-btn primary" onClick={() => saveAllItems("fixed")} disabled={saving}>
                                            {saving ? t("profile.saving") : t("profile.saveChanges")}
                                        </button>
                                        <button
                                            className="elegant-btn outline"
                                            onClick={() => {
                                                setFixedExpenses(overview?.fixedExpenses || [])
                                                setEditingFixed(false)
                                                clearAllErrors()
                                            }}
                                        >
                                            {t("profile.cancel")}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="expense-list-display">
                                    {fixedExpenses.length > 0 ? (
                                        fixedExpenses.map((expense, index) => (
                                            <div key={expense?.id || index} className="expense-display-item">
                                                <div className="expense-info">
                                                    <div className="expense-name">
                                                        {expense?.name || expense?.description || `Gasto fijo #${index + 1}`}
                                                    </div>
                                                    {expense?.frequency && (
                                                        <div className="expense-frequency">
                                                            {frequencyOptions.find((f) => f.value === expense.frequency)?.label || expense.frequency}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="expense-amount">€{expense?.amount || 0}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-data">
                                            <div className="no-data-icon"></div>
                                            <p>{t("profile.noFixedExpenses")}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gastos Variables */}
                    <div className="elegant-card variable-expenses">
                        <div className="card-header">
                            <h3>
                                <span className="header-icon"></span>
                                {t("profile.variableExpenses")}
                            </h3>
                            <div className="header-actions">
                                <span className="total-badge">€{totalVariable.toLocaleString()}</span>
                                {editingVariable && (
                                    <button className="elegant-btn success small" onClick={() => addItem("variable")}>
                                        {t("profile.add")}
                                    </button>
                                )}
                                <button className="elegant-btn outline small" onClick={() => setEditingVariable(!editingVariable)}>
                                    {editingVariable ? t("profile.cancel") : t("profile.edit")}
                                </button>
                            </div>
                        </div>
                        <div className="card-content">
                            {editingVariable ? (
                                <div className="edit-form">
                                    <div className="expense-list">
                                        {variableExpenses.map((expense) => (
                                            <div key={expense.id} className="expense-edit-item">
                                                <div className="expense-inputs">
                                                    <div className="input-group">
                                                        <input
                                                            type="text"
                                                            className="elegant-input"
                                                            value={expense.name || ""}
                                                            onChange={(e) => updateField("variable", expense.id, "name", e.target.value)}
                                                            placeholder={t("profile.expenseName")}
                                                        />
                                                        <FieldError error={errors[`variable_${expense.id}_name`]} />
                                                    </div>

                                                    <div className="input-group">
                                                        <input
                                                            type="number"
                                                            className="elegant-input"
                                                            value={expense.amount || ""}
                                                            onChange={(e) =>
                                                                updateField("variable", expense.id, "amount", Number.parseFloat(e.target.value) || 0)
                                                            }
                                                            placeholder="0.00"
                                                        />
                                                        <FieldError error={errors[`variable_${expense.id}_amount`]} />
                                                    </div>

                                                    <div className="input-group">
                                                        <input
                                                            type="date"
                                                            className="elegant-input"
                                                            value={expense.expenseDate || ""}
                                                            onChange={(e) => updateField("variable", expense.id, "expenseDate", e.target.value)}
                                                        />
                                                        <FieldError error={errors[`variable_${expense.id}_expenseDate`]} />
                                                    </div>

                                                    <div className="input-group">
                                                        <input
                                                            type="text"
                                                            className="elegant-input"
                                                            value={expense.description || ""}
                                                            onChange={(e) => updateField("variable", expense.id, "description", e.target.value)}
                                                            placeholder={t("profile.description")}
                                                        />
                                                        <FieldError error={errors[`variable_${expense.id}_description`]} />
                                                    </div>
                                                </div>

                                                <button className="elegant-btn danger small" onClick={() => deleteItem("variable", expense.id)}>
                                                    {t("profile.delete")}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="form-actions">
                                        <button className="elegant-btn primary" onClick={() => saveAllItems("variable")} disabled={saving}>
                                            {saving ? t("profile.saving") : t("profile.saveChanges")}
                                        </button>
                                        <button
                                            className="elegant-btn outline"
                                            onClick={() => {
                                                setVariableExpenses(overview?.variableExpenses || [])
                                                setEditingVariable(false)
                                                clearAllErrors()
                                            }}
                                        >
                                            {t("profile.cancel")}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="expense-list-display">
                                    {variableExpenses.length > 0 ? (
                                        variableExpenses.map((expense, index) => (
                                            <div key={expense?.id || index} className="expense-display-item">
                                                <div className="expense-info">
                                                    <div className="expense-name">
                                                        {expense?.name || expense?.description || `Gasto variable #${index + 1}`}
                                                    </div>
                                                    {expense?.expenseDate && (
                                                        <div className="expense-date">{new Date(expense.expenseDate).toLocaleDateString()}</div>
                                                    )}
                                                </div>
                                                <div className="expense-amount">€{expense?.amount || 0}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-data">
                                            <div className="no-data-icon"></div>
                                            <p>{t("profile.noVariableExpenses")}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Metas de Ahorro */}
            <motion.section className="goals-section" initial="hidden" animate="visible" variants={fadeUpVariants} custom={4}>
                <div className="elegant-card goals">
                    <div className="card-header">
                        <h3>
                            <span className="header-icon"></span>
                            {t("profile.savingsGoals")}
                        </h3>
                        <div className="header-actions">
                            {editingGoals && (
                                <button className="elegant-btn success small" onClick={() => addItem("goal")}>
                                    {t("profile.add")}
                                </button>
                            )}
                            <button className="elegant-btn outline small" onClick={() => setEditingGoals(!editingGoals)}>
                                {editingGoals ? t("profile.cancel") : t("profile.edit")}
                            </button>
                        </div>
                    </div>
                    <div className="card-content">
                        {editingGoals ? (
                            <div className="edit-form">
                                <div className="goals-list">
                                    {goals.map((goal) => (
                                        <div key={goal.id} className="goal-edit-item">
                                            <div className="goal-inputs">
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className="elegant-input"
                                                        value={goal.name || ""}
                                                        onChange={(e) => updateField("goal", goal.id, "name", e.target.value)}
                                                        placeholder={t("profile.goalName")}
                                                    />
                                                    <FieldError error={errors[`goal_${goal.id}_name`]} />
                                                </div>

                                                <div className="input-group">
                                                    <input
                                                        type="number"
                                                        className="elegant-input"
                                                        value={goal.targetAmount || ""}
                                                        onChange={(e) =>
                                                            updateField("goal", goal.id, "targetAmount", Number.parseFloat(e.target.value) || 0)
                                                        }
                                                        placeholder={t("profile.target")}
                                                    />
                                                    <FieldError error={errors[`goal_${goal.id}_targetAmount`]} />
                                                </div>

                                                <div className="input-group">
                                                    <input
                                                        type="number"
                                                        className="elegant-input"
                                                        value={goal.currentAmount || ""}
                                                        onChange={(e) =>
                                                            updateField("goal", goal.id, "currentAmount", Number.parseFloat(e.target.value) || 0)
                                                        }
                                                        placeholder={t("profile.current")}
                                                    />
                                                    <FieldError error={errors[`goal_${goal.id}_currentAmount`]} />
                                                </div>

                                                <div className="input-group">
                                                    <input
                                                        type="date"
                                                        className="elegant-input"
                                                        value={goal.deadline || ""}
                                                        onChange={(e) => updateField("goal", goal.id, "deadline", e.target.value)}
                                                    />
                                                    <FieldError error={errors[`goal_${goal.id}_deadline`]} />
                                                </div>

                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className="elegant-input"
                                                        value={goal.description || ""}
                                                        onChange={(e) => updateField("goal", goal.id, "description", e.target.value)}
                                                        placeholder={t("profile.description")}
                                                    />
                                                    <FieldError error={errors[`goal_${goal.id}_description`]} />
                                                </div>
                                            </div>
                                            <button className="elegant-btn danger small" onClick={() => deleteItem("goal", goal.id)}>
                                                {t("profile.delete")}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="form-actions">
                                    <button className="elegant-btn primary" onClick={() => saveAllItems("goal")} disabled={saving}>
                                        {saving ? t("profile.saving") : t("profile.saveChanges")}
                                    </button>
                                    <button
                                        className="elegant-btn outline"
                                        onClick={() => {
                                            setGoals(overview?.goals || [])
                                            setEditingGoals(false)
                                            clearAllErrors()
                                        }}
                                    >
                                        {t("profile.cancel")}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="goals-display">
                                {goals.length > 0 ? (
                                    <div className="goals-grid">
                                        {goals.map((goal) => {
                                            const currentAmount = goal?.currentAmount || 0
                                            const targetAmount = goal?.targetAmount || 1
                                            const progress = (currentAmount / targetAmount) * 100
                                            const progressCapped = Math.min(progress, 100)
                                            return (
                                                <div key={goal?.id || Math.random()} className="goal-display-item">
                                                    <div className="goal-header">
                                                        <h4>{goal?.name || "Meta sin nombre"}</h4>
                                                        <span
                                                            className={`progress-badge ${
                                                                progress >= 100 ? "complete" : progress >= 50 ? "medium" : "low"
                                                            }`}
                                                        >
                              {progressCapped.toFixed(1)}%
                            </span>
                                                    </div>
                                                    {goal?.description && <p className="goal-description">{goal.description}</p>}
                                                    <div className="progress-container">
                                                        <div
                                                            className={`progress-fill ${
                                                                progress >= 100 ? "complete" : progress >= 50 ? "medium" : "low"
                                                            }`}
                                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="goal-footer">
                            <span className="goal-amounts">
                              €{currentAmount.toLocaleString()} / €{targetAmount.toLocaleString()}
                            </span>
                                                        {goal?.deadline && (
                                                            <span className="goal-date">{new Date(goal.deadline).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="no-data">
                                        <div className="no-data-icon"></div>
                                        <h4>{t("profile.noGoals")}</h4>
                                        <p>{t("profile.noGoalsDescription")}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.section>

            <Footer />
        </div>
    )
}