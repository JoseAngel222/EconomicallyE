"use client"

import { useEffect, useState } from "react"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import "./Progreso.css"
import ScrollNav from "../Components/Nav/ScrollNav.jsx"
import Footer from "../Components/Footer/footer.jsx"
import { Moon, Sun } from "lucide-react"
import LanguageSwitcher from "../Components/Idioma/LanguageSwitcher.jsx"

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

function Dashboard() {
    const { t, i18n } = useTranslation()
    const { id } = useParams()
    const navigate = useNavigate()
    const [hasCompletedFirstForm, setHasCompletedFirstForm] = useState(false)
    const [darkMode, setDarkMode] = useState(false)

    const [data, setData] = useState({
        fixedExpenses: [],
        variableExpenses: [],
        goals: [],
        advice: [],
        overview: {},
        income: 0,
    })
    const [loading, setLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState(id)
    const [progressReport, setProgressReport] = useState(null)
    const [reportLoading, setReportLoading] = useState(false)

    const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57", "#FF9FF3", "#54A0FF"]

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

    // Función para generar reporte de progreso
    const generateProgressReport = async (userId, adviceList) => {
        try {
            setReportLoading(true)
            const token = localStorage.getItem("token")

            console.log(`🔄 Generando reporte de progreso para usuario ${userId}...`)

            const response = await fetch(`https://economicallye-1.onrender.com/api/advice/progress/${userId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se pudo generar el reporte de progreso`)
            }

            const reportData = await response.json()
            console.log("✅ Reporte de progreso generado exitosamente:", reportData)

            return reportData
        } catch (error) {
            console.error("❌ Error al generar reporte de progreso:", error)
            throw error
        } finally {
            setReportLoading(false)
        }
    }

    // Función para manejar la lógica de reportes de progreso
    const handleProgressReportLogic = async (userId, adviceList) => {
        const STORAGE_KEY = `progressReport_${userId}`

        // Solo proceder si hay exactamente 2 o más consejos
        if (adviceList.length < 2) {
            console.log("📊 No hay suficientes consejos para generar reporte de progreso (mínimo 2)")
            setProgressReport(null)
            localStorage.removeItem(STORAGE_KEY)
            return
        }

        // Obtener los últimos dos consejos (más recientes)
        const latestAdvice = adviceList.slice(-2)
        const currentAdviceIds = latestAdvice.map((advice) => advice.id).sort()

        console.log("📋 Últimos dos consejos:", currentAdviceIds)

        // Verificar datos almacenados en localStorage
        const storedData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
        const storedAdviceIds = storedData.adviceIds || []
        const storedReport = storedData.report || null
        const lastGenerated = storedData.lastGenerated || null

        console.log("💾 Datos almacenados:", {
            storedAdviceIds,
            hasStoredReport: !!storedReport,
            lastGenerated,
        })

        // Verificar si los consejos han cambiado
        const adviceIdsChanged =
            storedAdviceIds.length !== currentAdviceIds.length ||
            !currentAdviceIds.every((id) => storedAdviceIds.includes(id))

        console.log("🔍 ¿Consejos cambiaron?", adviceIdsChanged)

        if (adviceIdsChanged || !storedReport) {
            console.log("🚀 Generando nuevo reporte de progreso...")

            try {
                const newReport = await generateProgressReport(userId, latestAdvice)

                // Guardar en localStorage
                const dataToStore = {
                    adviceIds: currentAdviceIds,
                    report: newReport,
                    lastGenerated: new Date().toISOString(),
                    adviceCount: adviceList.length,
                }

                localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore))
                setProgressReport(newReport)

                console.log("✅ Reporte guardado en localStorage")
            } catch (error) {
                console.error("❌ Error al generar reporte:", error)
                // En caso de error, usar reporte almacenado si existe
                if (storedReport) {
                    console.log("🔄 Usando reporte almacenado como fallback")
                    setProgressReport(storedReport)
                }
            }
        } else {
            console.log("📋 Usando reporte existente (no hay cambios)")
            setProgressReport(storedReport)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                let userId = currentUserId
                const token = localStorage.getItem("token")

                // Obtener ID de usuario si no está disponible
                if (!userId) {
                    const resUser = await fetch("https://economicallye-1.onrender.com/api/users/me", {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    const userData = await resUser.json()
                    userId = userData.id
                    setCurrentUserId(userId)
                }

                // Obtener historial de consejos
                const advicesRes = await fetch(`https://economicallye-1.onrender.com/api/advice/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })

                const advice = advicesRes.ok ? await advicesRes.json() : []
                console.log(`📊 Consejos obtenidos: ${advice.length}`)

                // Actualizar estado con los consejos
                setData((prev) => ({ ...prev, advice }))

                // Manejar lógica de reporte de progreso
                await handleProgressReportLogic(userId, advice)
            } catch (err) {
                console.error("❌ Error en fetchData:", err)
            } finally {
                setLoading(false)
            }
        }

        if (currentUserId) {
            fetchData()
        }
    }, [currentUserId])

    const calculateMetrics = () => {
        const totalFixedExpenses = data.fixedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
        const totalVariableExpenses = data.variableExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
        const totalExpenses = totalFixedExpenses + totalVariableExpenses
        const totalSavings = data.goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0)
        const totalGoalTargets = data.goals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0)
        const availableMoney = data.income - totalExpenses

        return {
            totalFixedExpenses,
            totalVariableExpenses,
            totalExpenses,
            totalSavings,
            totalGoalTargets,
            availableMoney,
            savingsRate: data.income > 0 ? (totalSavings / data.income) * 100 : 0,
        }
    }

    const prepareExpenseTypeData = () => {
        const metrics = calculateMetrics()
        return [
            { name: t("profile.dashboard.expenseTypes.fixedExpenses"), value: metrics.totalFixedExpenses, color: "#FF6B6B" },
            {
                name: t("profile.dashboard.expenseTypes.variableExpenses"),
                value: metrics.totalVariableExpenses,
                color: "#4ECDC4",
            },
            {
                name: t("profile.dashboard.expenseTypes.availableMoney"),
                value: Math.max(0, metrics.availableMoney),
                color: "#96CEB4",
            },
        ]
    }

    const prepareFixedExpensesData = () => {
        return data.fixedExpenses.map((exp) => ({
            name: exp.name || t("profile.dashboard.noName"),
            amount: exp.amount || 0,
            frequency: exp.frequency || "MONTHLY",
        }))
    }

    const prepareVariableExpensesTrend = () => {
        const months = [
            t("profile.dashboard.months.january"),
            t("profile.dashboard.months.february"),
            t("profile.dashboard.months.march"),
            t("profile.dashboard.months.april"),
            t("profile.dashboard.months.may"),
            t("profile.dashboard.months.june"),
        ]
        return months.map((month) => ({
            month,
            gastos: Math.random() * 800 + 200,
            presupuesto: 600,
        }))
    }

    const prepareGoalsProgress = () => {
        return data.goals.map((goal) => ({
            name: goal.name || t("profile.dashboard.goalWithoutDescription"),
            current: goal.currentAmount || 0,
            target: goal.targetAmount || 0,
            progress: goal.targetAmount > 0 ? ((goal.currentAmount || 0) / goal.targetAmount) * 100 : 0,
        }))
    }

    // Componente para mostrar el reporte de progreso
    const ProgressReportSection = () => {
        if (!progressReport || !progressReport.iaResult) {
            return null
        }

        const formatDate = (dateString) => {
            try {
                const date = new Date(dateString)
                const locale = i18n.language === "es" ? "es-ES" : "en-US"
                const options = {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }
                return date.toLocaleDateString(locale, options)
            } catch (error) {
                return t("profile.dashboard.dateNotAvailable")
            }
        }

        return (
            <div className="progress-report-section">
                <div className="report-header">
                    <h5>📈 {t("profile.dashboard.progressReportTitle")}</h5>
                    {reportLoading && <span className="loading-indicator">⏳ Generando...</span>}
                </div>
                <div className="report-content">
                    <div
                        className="report-text"
                        dangerouslySetInnerHTML={{ __html: formatFinancialReport(progressReport.iaResult) }}
                    ></div>
                    <div className="report-date">
                        <small className="text-muted">
                            {t("profile.dashboard.generatedOn", { date: formatDate(progressReport.recommendationDate) })}
                        </small>
                    </div>
                </div>
            </div>
        )
    }

    // Componente para mostrar el último consejo (si no hay reporte de progreso)
    const AIReportSection = ({ advice }) => {
        if (!advice || !advice.iaResult) {
            return null
        }

        const formatDate = (dateString) => {
            try {
                const date = new Date(dateString)
                const locale = i18n.language === "es" ? "es-ES" : "en-US"
                const options = {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }
                return date.toLocaleDateString(locale, options)
            } catch (error) {
                return t("profile.dashboard.dateNotAvailable")
            }
        }

        return (
            <div className="ai-report-section">
                <div className="report-header">
                    <h5>{t("profile.dashboard.aiReportTitle")}</h5>
                </div>
                <div className="report-content">
                    <div
                        className="report-text"
                        dangerouslySetInnerHTML={{ __html: formatFinancialReport(advice.iaResult) }}
                    ></div>
                    <div className="report-date">
                        <small className="text-muted">
                            {t("profile.dashboard.generatedOn", { date: formatDate(advice.recommendationDate) })}
                        </small>
                    </div>
                </div>
            </div>
        )
    }

    const handleNavigate = (path) => {
        navigate(path)
    }

    const metrics = calculateMetrics()

    if (loading) {
        return (
            <div className={`elegant-loading-container ${darkMode ? "dark-theme" : ""}`}>
                <div className="loading-content">
                    <div className="loading-spinner">
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                    </div>
                    <h3>{t("profile.dashboard.loading")}</h3>
                </div>
                <div className="loading-background">
                    <div className="floating-shape shape-1"></div>
                    <div className="floating-shape shape-2"></div>
                    <div className="floating-shape shape-3"></div>
                </div>
            </div>
        )
    }

    function formatFinancialReport(rawText) {
        if (!rawText) return ""

        let formatted = rawText.trim()

        formatted = formatted.replace(/### (.*?) ###/g, "<h2>$1</h2>")
        formatted = formatted.replace(/#### (.*?)(:?) ####/g, (_match, title) => {
            return `<h3>${title.trim()}</h3>`
        })
        formatted = formatted.replace(/^([A-ZÁÉÍÓÚÑ][^\n:]{3,40}):$/gm, "<h3>$1</h3>")
        formatted = formatted.replace(/((?:\d+\..+\n)+)/g, (match) => {
            const items = match
                .trim()
                .split("\n")
                .map((line) => {
                    const m = line.match(/^\d+\. (.+)/)
                    return m ? `<li>${m[1]}</li>` : ""
                })
                .join("")
            return `<ol>${items}</ol>`
        })
        formatted = formatted.replace(/((?:- .+\n)+)/g, (match) => {
            const items = match
                .trim()
                .split("\n")
                .map((line) => {
                    const m = line.match(/^- (.+)/)
                    return m ? `<li>${m[1]}</li>` : ""
                })
                .join("")
            return `<ul>${items}</ol>`
        })
        formatted = formatted.replace(/\n{2,}/g, "</p><p>")
        formatted = `<p>${formatted.replace(/\n/g, " ")}</p>`

        return formatted
    }

    const scrollNavLinks = [
        {
            href: "#inicio",
            label: t("profile.dashboard.navigation.home"),
            onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
        },
        ...(currentUserId
            ? [
                {
                    href: "Mi cuenta",
                    label: t("profile.dashboard.navigation.myAccount"),
                    onClick: () => navigate(`/perfil/${currentUserId}`),
                },
                {
                    href: "edit",
                    label: t("profile.dashboard.navigation.editInfo"),
                    onClick: () => navigate(`/perfil/${currentUserId}`),
                },
                ...(hasCompletedFirstForm
                    ? [
                        {
                            href: "#",
                            label: t("profile.dashboard.navigation.advice"),
                            onClick: () => navigate(`/consejos/${currentUserId}`),
                        },
                    ]
                    : []),
            ]
            : []),
    ]

    const getStatusText = (savingsRate) => {
        if (savingsRate >= 20) return t("profile.dashboard.statusExcellent")
        if (savingsRate >= 10) return t("profile.dashboard.statusGood")
        return t("profile.dashboard.statusImprovable")
    }

    return (
        <div className={`dashboard-container ${darkMode ? "dark-theme" : ""}`}>
            {/* Botón de modo oscuro flotante */}
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

            {/* Selector de idioma */}
            <LanguageSwitcher />

            {/* Formas de fondo */}
            <div className="background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            {/* ScrollNav */}
            <ScrollNav links={scrollNavLinks} user={currentUserId} />

            {/* Header */}
            <div className="dashboard-header">
                <h1 className="dashboard-title">{t("profile.dashboard.title")}</h1>
                <button className="back-button" onClick={() => navigate(`/perfil/${currentUserId}`)}>
                    {t("profile.dashboard.backToProfile")}
                </button>
            </div>

            {/* Métricas principales */}
            <div className="metrics-grid"></div>

            {/* Gráficos principales */}
            <div className="charts-grid">
                {/* Distribución de gastos */}
                <div className="chart-card">
                    <div className="chart-header expenses-header">
                        <h5>{t("profile.dashboard.expenseDistribution")}</h5>
                    </div>
                    <div className="chart-body">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={prepareExpenseTypeData()}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {prepareExpenseTypeData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Tendencias y progreso de metas */}
            <div className="charts-grid"></div>

            {/* Reporte de Progreso (si hay 2+ consejos) o Último Consejo */}
            {progressReport ? (
                <ProgressReportSection />
            ) : data.advice.length > 0 ? (
                <AIReportSection advice={data.advice[data.advice.length - 1]} />
            ) : null}

            {/* Información sobre reportes de progreso */}
            {data.advice.length === 1 && (
                <div className="info-section">
                    <div className="info-card">
                        <h5>📊 {t("profile.dashboard.progressReportInfo")}</h5>
                        <p>{t("profile.dashboard.progressReportDescription")}</p>
                    </div>
                </div>
            )}

            {/* Resumen financiero */}
            <div className="summary-section">
                <div className="summary-card">
                    <div className="summary-header">
                        <h5>{t("profile.dashboard.financialSummary")}</h5>
                    </div>
                    <div className="summary-body">
                        <div className="summary-grid">
                            <div className="summary-column">
                                <h6 className="summary-title current">{t("profile.dashboard.currentStatus")}</h6>
                                <ul className="summary-list">
                                    <li>
                                        <strong>{t("profile.dashboard.monthlyIncome")}:</strong> €{data.income.toLocaleString()}
                                    </li>
                                    <li>
                                        <strong>{t("profile.dashboard.fixedExpenses")}:</strong> €
                                        {metrics.totalFixedExpenses.toLocaleString()}
                                    </li>
                                    <li>
                                        <strong>{t("profile.dashboard.variableExpenses")}:</strong> €
                                        {metrics.totalVariableExpenses.toLocaleString()}
                                    </li>
                                    <li className={`balance ${metrics.availableMoney >= 0 ? "positive" : "negative"}`}>
                                        <strong>{t("profile.dashboard.balance")}:</strong> €{metrics.availableMoney.toLocaleString()}
                                    </li>
                                </ul>
                            </div>
                            <div className="summary-column">
                                <h6 className="summary-title goals">{t("profile.dashboard.savingsGoals")}</h6>
                                <ul className="summary-list">
                                    <li>
                                        <strong>{t("profile.dashboard.totalSaved")}:</strong> €{metrics.totalSavings.toLocaleString()}
                                    </li>
                                    <li>
                                        <strong>{t("profile.dashboard.totalTarget")}:</strong> €{metrics.totalGoalTargets.toLocaleString()}
                                    </li>
                                    <li>
                                        <strong>{t("profile.dashboard.overallProgress")}:</strong>{" "}
                                        {metrics.totalGoalTargets > 0
                                            ? ((metrics.totalSavings / metrics.totalGoalTargets) * 100).toFixed(1)
                                            : 0}
                                        %
                                    </li>
                                    <li>
                                        <strong>{t("profile.dashboard.numberOfGoals")}:</strong> {data.goals.length}
                                    </li>
                                </ul>
                            </div>
                            <div className="summary-column">
                                <h6 className="summary-title analysis">{t("profile.dashboard.analysis")}</h6>
                                <ul className="summary-list">
                                    <li>
                                        <strong>{t("profile.dashboard.savingsRate")}:</strong> {metrics.savingsRate.toFixed(1)}%
                                    </li>
                                    <li>
                                        <strong>{t("profile.dashboard.fixedExpensesPercentage")}:</strong>{" "}
                                        {data.income > 0 ? ((metrics.totalFixedExpenses / data.income) * 100).toFixed(1) : 0}%
                                    </li>
                                    <li>
                                        <strong>{t("profile.dashboard.variableExpensesPercentage")}:</strong>{" "}
                                        {data.income > 0 ? ((metrics.totalVariableExpenses / data.income) * 100).toFixed(1) : 0}%
                                    </li>
                                    <li
                                        className={`status ${
                                            metrics.savingsRate >= 20 ? "excellent" : metrics.savingsRate >= 10 ? "good" : "improvable"
                                        }`}
                                    >
                                        <strong>{t("profile.dashboard.status")}:</strong> {getStatusText(metrics.savingsRate)}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default Dashboard
