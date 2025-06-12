"use client"

import { useEffect, useState } from "react"
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
    console.log("[DASHBOARD] Componente Dashboard montado/re-renderizado")

    const { t, i18n } = useTranslation()
    const params = useParams()
    const navigate = useNavigate()

    // Extraer el ID de diferentes maneras posibles
    const urlId = params.id || params.userId

    console.log("[DASHBOARD] useParams completo:", params)
    console.log("[DASHBOARD] urlId extraído:", urlId)
    console.log("[DASHBOARD] URL actual:", window.location.href)
    console.log("[DASHBOARD] pathname:", window.location.pathname)

    // También intentar extraer el ID directamente de la URL como fallback
    const pathSegments = window.location.pathname.split("/")
    const fallbackId = pathSegments[pathSegments.length - 1]
    console.log("[DASHBOARD] fallbackId desde URL:", fallbackId)

    const finalId = urlId || fallbackId

    console.log("[DASHBOARD] ID final a usar:", finalId)

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
    const [currentUserId, setCurrentUserId] = useState(finalId)
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

    const signOut = () => {
        localStorage.removeItem("token")
        navigate("/")
    }

    // Función para generar reporte de progreso
    const generateProgressReport = async (userId, adviceList) => {
        try {
            console.log("🔄 [API] Iniciando generateProgressReport...")
            console.log("🔄 [API] userId:", userId, "adviceList:", adviceList)

            setReportLoading(true)
            const token = localStorage.getItem("token")

            console.log(`🔄 [API] Generando reporte de progreso para usuario ${userId}...`)

            const response = await fetch(`https://economicallye-1.onrender.com/api/advice/progress/${userId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            console.log("📡 [API] Respuesta /progress status:", response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ [API] Error response body:", errorText)
                throw new Error(`Error ${response.status}: No se pudo generar el reporte de progreso - ${errorText}`)
            }

            const reportData = await response.json()
            console.log("✅ [API] Reporte de progreso generado exitosamente:", reportData)

            return reportData
        } catch (error) {
            console.error("[API] Error al generar reporte de progreso:", error)
            //console.error("[API] Stack trace:", error.stack)
            throw error
        } finally {
            console.log("[API] Finalizando generateProgressReport")
            setReportLoading(false)
        }
    }


    const handleProgressReportLogic = async (userId, adviceList) => {
        console.log("[PROGRESS] Iniciando handleProgressReportLogic...")
        console.log("[PROGRESS] userId:", userId, "adviceList.length:", adviceList.length)

        const STORAGE_KEY = `progressReport_${userId}`


        if (adviceList.length < 2) {
            console.log("[PROGRESS] No hay suficientes consejos para generar reporte de progreso (mínimo 2)")
            setProgressReport(null)
            localStorage.removeItem(STORAGE_KEY)
            return
        }

        // Obtener los últimos dos consejos (más recientes) y ordenarlos por ID
        const sortedAdvice = [...adviceList].sort((a, b) => b.id - a.id)
        const latestAdvice = sortedAdvice.slice(0, 2)
        const currentAdviceIds = latestAdvice.map((advice) => advice.id).sort((a, b) => b - a) // Orden descendente para IDs más recientes

        console.log("[PROGRESS] Consejos ordenados por ID (desc):", sortedAdvice.map(a => a.id))
        console.log("[PROGRESS] Últimos dos consejos seleccionados:", currentAdviceIds)

        // Verificar datos almacenados en localStorage
        const storedData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
        const storedAdviceIds = storedData.adviceIds || []
        const storedReport = storedData.report || null
        const lastGenerated = storedData.lastGenerated || null

        console.log("[PROGRESS] Datos almacenados:", {
            storedAdviceIds,
            hasStoredReport: !!storedReport,
            lastGenerated,
        })


        const adviceIdsChanged =
            storedAdviceIds.length !== currentAdviceIds.length ||
            !storedAdviceIds.every((id, index) => id === currentAdviceIds[index])

        console.log("[PROGRESS] ¿Consejos cambiaron?", adviceIdsChanged)
        console.log("[PROGRESS] IDs almacenados:", storedAdviceIds)
        console.log("[PROGRESS] IDs actuales:", currentAdviceIds)

        const fiveMinutesAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString()
        const shouldRefreshByTime = !lastGenerated || lastGenerated < fiveMinutesAgo

        console.log("[PROGRESS] ¿Debería refrescar por tiempo?", shouldRefreshByTime)

        if (adviceIdsChanged || !storedReport || shouldRefreshByTime) {
            console.log("[PROGRESS] Generando nuevo reporte de progreso...")

            try {
                const newReport = await generateProgressReport(userId, latestAdvice)

                // Guardar en localStorage
                const dataToStore = {
                    adviceIds: currentAdviceIds,
                    report: newReport,
                    lastGenerated: new Date().toISOString(),
                    adviceCount: adviceList.length,
                    latestAdviceDetails: latestAdvice.map(a => ({ id: a.id, date: a.recommendationDate }))
                }

                localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore))
                setProgressReport(newReport)

                console.log("[PROGRESS] Reporte guardado en localStorage")
            } catch (error) {
                console.error("[PROGRESS] Error al generar reporte:", error)
                // En caso de error, limpiar caché y usar reporte almacenado si existe
                if (storedReport && !adviceIdsChanged) {
                    console.log("[PROGRESS] Usando reporte almacenado como fallback")
                    setProgressReport(storedReport)
                } else {
                    console.log("[PROGRESS] No hay reporte válido disponible")
                    setProgressReport(null)
                    localStorage.removeItem(STORAGE_KEY)
                }
            }
        } else {
            console.log("Usando reporte existente (no hay cambios)")
            setProgressReport(storedReport)
        }

        console.log("handleProgressReportLogic completado")
    }

    const forceRefreshReport = async () => {
        if (!currentUserId || data.advice.length < 2) return

        console.log("Forzando actualización del reporte...")

        const STORAGE_KEY = `progressReport_${currentUserId}`
        localStorage.removeItem(STORAGE_KEY)

        // Regenerar reporte
        await handleProgressReportLogic(currentUserId, data.advice)
    }

    useEffect(() => {
        const fetchData = async () => {
            console.log("Iniciando fetchData...")
            console.log(" currentUserId:", currentUserId)
            console.log(" finalId:", finalId)

            setLoading(true)
            try {
                let userId = currentUserId || finalId // Usar finalId como fallback
                const token = localStorage.getItem("token")

                console.log("Token encontrado:", !!token)
                console.log("userId inicial:", userId)

                // Obtener ID de usuario si no está disponible
                if (!userId) {
                    console.log("No hay userId, obteniendo desde /api/users/me...")

                    try {
                        const resUser = await fetch("https://economicallye-1.onrender.com/api/users/me", {
                            headers: { Authorization: `Bearer ${token}` },
                        })

                        console.log(" Respuesta /users/me status:", resUser.status)

                        if (!resUser.ok) {
                            throw new Error(`Error ${resUser.status}: ${resUser.statusText}`)
                        }

                        const userData = await resUser.json()
                        console.log("Datos de usuario obtenidos:", userData)

                        userId = userData.id
                        setCurrentUserId(userId)
                        console.log("userId establecido:", userId)
                    } catch (userError) {
                        console.error("Error obteniendo usuario:", userError)
                        throw userError
                    }
                }

                console.log(`Obteniendo consejos para usuario: ${userId}`)

                // Obtener historial de consejos
                try {
                    const advicesRes = await fetch(`https://economicallye-1.onrender.com/api/advice/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })

                    console.log("Respuesta /advice status:", advicesRes.status)

                    if (!advicesRes.ok) {
                        console.warn(" Error obteniendo consejos:", advicesRes.status, advicesRes.statusText)
                    }

                    const advice = advicesRes.ok ? await advicesRes.json() : []
                    console.log(`Consejos obtenidos: ${advice.length}`)
                    console.log("Consejos:", advice)


                    // Obtener datos financieros del usuario
                    try {
                        console.log(` Obteniendo datos financieros para usuario: ${userId}`)

                        // Obtener overview del usuario
                        const overviewRes = await fetch(`https://economicallye-1.onrender.com/api/overview/${userId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        })

                        if (overviewRes.ok) {
                            const overviewData = await overviewRes.json()
                            console.log(" Overview obtenido:", overviewData)

                            // Obtener datos detallados en paralelo
                            const [fixedExpensesRes, variableExpensesRes, goalsRes] = await Promise.all([
                                fetch(`https://economicallye-1.onrender.com/api/fixed-expenses/${userId}`, {
                                    headers: { Authorization: `Bearer ${token}` },
                                }),
                                fetch(`https://economicallye-1.onrender.com/api/variable-expenses/${userId}`, {
                                    headers: { Authorization: `Bearer ${token}` },
                                }),
                                fetch(`https://economicallye-1.onrender.com/api/goals/${userId}`, {
                                    headers: { Authorization: `Bearer ${token}` },
                                }),
                            ])

                            const fixedExpenses = fixedExpensesRes.ok ? await fixedExpensesRes.json() : []
                            const variableExpenses = variableExpensesRes.ok ? await variableExpensesRes.json() : []
                            const goals = goalsRes.ok ? await goalsRes.json() : []

                            console.log("Datos financieros obtenidos:", {
                                income: overviewData.monthlyIncome,
                                fixedExpenses: fixedExpenses.length,
                                variableExpenses: variableExpenses.length,
                                goals: goals.length,
                            })

                            // Actualizar estado con todos los datos financieros
                            setData((prev) => ({
                                ...prev,
                                advice,
                                income: overviewData.monthlyIncome || 0,
                                fixedExpenses: fixedExpenses || [],
                                variableExpenses: variableExpenses || [],
                                goals: goals || [],
                                overview: overviewData || {},
                            }))
                        } else {
                            console.warn(" Error obteniendo overview:", overviewRes.status)
                            // Solo actualizar con los consejos si no se puede obtener el overview
                            setData((prev) => ({ ...prev, advice }))
                        }
                    } catch (financialError) {
                        console.error(" Error obteniendo datos financieros:", financialError)
                        // En caso de error, al menos actualizar con los consejos
                        setData((prev) => ({ ...prev, advice }))
                    }

                    // Manejar lógica de reporte de progreso
                    console.log("Iniciando lógica de reporte de progreso...")
                    await handleProgressReportLogic(userId, advice)
                    console.log(" Lógica de reporte completada")
                } catch (adviceError) {
                    console.error(" Error obteniendo consejos:", adviceError)
                    // No lanzar error, continuar con array vacío
                    setData((prev) => ({ ...prev, advice: [] }))
                }
            } catch (err) {
                console.error(" Error general en fetchData:", err)
                console.error(" Stack trace:", err.stack)
            } finally {
                console.log(" Finalizando fetchData, estableciendo loading = false")
                setLoading(false)
            }
        }

        // Ejecutar siempre que tengamos un ID (del parámetro o del estado)
        const shouldExecute = currentUserId || finalId
        //console.log(" ¿Debería ejecutar fetchData?", shouldExecute)
        console.log(" currentUserId:", currentUserId, "finalId:", finalId)

        if (shouldExecute) {
            console.log(" Ejecutando fetchData...")
            fetchData()
        } else {
            console.log(" No se ejecuta fetchData - no hay ID disponible")
            setLoading(false)
        }
    }, [currentUserId, finalId])

    // Añadir después de los otros useEffect
    useEffect(() => {
        // Timeout de seguridad para evitar carga infinita
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn("Timeout de seguridad - forzando fin de carga")
                setLoading(false)
            }
        }, 15000) // 15 segundos

        return () => clearTimeout(timeoutId)
    }, [loading])

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
                    <h3>📈 {t("profile.progressReportTitle")}</h3>
                    <div className="report-actions">
                        {reportLoading && <span className="loading-indicator">⏳ Generando...</span>}
                        <button className="elegant-btn outline small" onClick={forceRefreshReport} disabled={reportLoading}>
                            🔄 Actualizar
                        </button>
                    </div>
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

    // Función mejorada para formatear el reporte financiero
    function formatFinancialReport(rawText) {
        if (!rawText) return ""

        console.log(" Texto original:", rawText)

        try {
            let formatted = rawText.trim()

            // Procesar títulos con ### ###
            formatted = formatted.replace(/### (.*?) ###/g, "<h2>$1</h2>")

            // Procesar títulos con #### ####
            formatted = formatted.replace(/#### (.*?) ####/g, "<h3>$1</h3>")

            // Procesar títulos que terminan con dos puntos (formato alternativo)
            formatted = formatted.replace(/^([A-ZÁÉÍÓÚÑ][^\n:]{3,40}):$/gm, "<h3>$1</h3>")

            // Procesar listas numeradas (mantener intactas)
            formatted = formatted.replace(/((?:^\d+\..+$\n?)+)/gm, (match) => {
                const items = match
                    .trim()
                    .split("\n")
                    .map((line) => {
                        const m = line.match(/^\d+\. (.+)/)
                        return m ? `<li>${m[1]}</li>` : ""
                    })
                    .filter((item) => item !== "")
                    .join("")
                return `<ol>${items}</ol>`
            })

            // Procesar listas con guiones (mantener intactas)
            formatted = formatted.replace(/((?:^- .+$\n?)+)/gm, (match) => {
                const items = match
                    .trim()
                    .split("\n")
                    .map((line) => {
                        const m = line.match(/^- (.+)/)
                        return m ? `<li>${m[1]}</li>` : ""
                    })
                    .filter((item) => item !== "")
                    .join("")
                return `<ul>${items}</ul>`
            })

            // Dividir en párrafos (pero preservar los elementos HTML ya creados)
            const lines = formatted.split("\n")
            const processedLines = []

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim()

                // Si la línea ya es HTML (empieza con < y termina con >), mantenerla
                if (line.match(/^<[^>]+>.*<\/[^>]+>$/) || line.match(/^<(h[1-6]|ol|ul|li)>/)) {
                    processedLines.push(line)
                }
                // Si es una línea vacía, agregar separación
                else if (line === "") {
                    if (processedLines.length > 0 && !processedLines[processedLines.length - 1].match(/^<\/?(h[1-6]|ol|ul)>/)) {
                        processedLines.push("</p><p>")
                    }
                }
                // Si es texto normal, agregarlo
                else if (line.length > 0) {
                    processedLines.push(line)
                }
            }

            // Unir todo y envolver en párrafos
            let result = processedLines.join(" ")

            // Limpiar espacios múltiples
            result = result.replace(/\s+/g, " ")

            // Asegurar que el contenido esté envuelto en párrafos
            if (!result.startsWith("<")) {
                result = `<p>${result}</p>`
            }

            // Limpiar párrafos vacíos
            result = result.replace(/<p>\s*<\/p>/g, "")
            result = result.replace(/<p>\s*<\/p><p>/g, "<p>")

            console.log("🔧 [FORMAT] Texto formateado:", result)

            return result
        } catch (error) {
            // En caso de error, devolver el texto original con formato básico
            return `<p>${rawText.replace(/\n/g, "<br>")}</p>`
        }
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
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

            <LanguageSwitcher />

            <div className="background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            <ScrollNav
                links={scrollNavLinks}
                user={currentUserId}
                onSignOut={signOut}
                onOpenLogin={() => navigate("/")}
                onOpenRegister={() => navigate("/")}
            />

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
                {/*
                Distribución de gastos
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
                */}
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
