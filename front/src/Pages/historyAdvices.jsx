"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import "./HistorialConsejos.css"
import ScrollNav from "../Components/Nav/ScrollNav.jsx"
import Footer from "../Components/Footer/footer.jsx"
import { Moon, Sun } from "lucide-react"
import LanguageSwitcher from "../Components/Idioma/LanguageSwitcher.jsx"

// Botón de modo oscuro
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

function HistorialConsejos() {
    const { t, i18n } = useTranslation()
    const [hasCompletedFirstForm, setHasCompletedFirstForm] = useState(false)
    const [darkMode, setDarkMode] = useState(false)

    const { userId } = useParams()
    const [consejos, setConsejos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

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

    useEffect(() => {
        const fetchConsejos = async () => {
            try {
                const token = localStorage.getItem("token")
                const response = await fetch(`https://economicallye-1.onrender.com/api/advice/${userId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (!response.ok) {
                    throw new Error(t("profile.advice.errorLoading", { status: response.status }))
                }

                const data = await response.json()
                setConsejos(data)
            } catch (error) {
                console.error(t("profile.advice.errorLoadingAdvice"), error)
                setError(error.message)
            } finally {
                setLoading(false)
            }
        }

        if (userId) {
            fetchConsejos()
        } else {
            setError(t("profile.advice.invalidUserId"))
            setLoading(false)
        }
    }, [userId, t])

    const handleGoBack = () => {
        navigate(`/perfil/${userId}`)
    }

    const parseAdvice = (text) => {
        if (!text) return <span>{t("profile.advice.noAdviceReceived")}</span>

        try {
            if (typeof text !== "string") {
                text = JSON.stringify(text)
            }

            const lines = text.split("\n")

            return lines.map((line, index) => {
                if (line.startsWith("### ") && line.endsWith(" ###")) {
                    return (
                        <h3 key={index} className="consejo-header3">
                            {line.slice(4, -4)}
                        </h3>
                    )
                } else if (line.startsWith("## ") && line.endsWith(" ##")) {
                    return (
                        <h2 key={index} className="consejo-header2">
                            {line.slice(3, -3)}
                        </h2>
                    )
                } else if (line.startsWith("#### ") && line.endsWith(" ####")) {
                    return (
                        <h4 key={index} className="consejo-header4">
                            {line.slice(5, -5)}
                        </h4>
                    )
                } else if (line.startsWith("### ")) {
                    return (
                        <h3 key={index} className="consejo-header3">
                            {line.slice(4)}
                        </h3>
                    )
                } else if (line.startsWith("## ")) {
                    return (
                        <h2 key={index} className="consejo-header2">
                            {line.slice(3)}
                        </h2>
                    )
                } else if (line.startsWith("#### ")) {
                    return (
                        <h4 key={index} className="consejo-header4">
                            {line.slice(5)}
                        </h4>
                    )
                } else if (line.startsWith("- ")) {
                    return (
                        <li key={index} className="consejo-item">
                            {line.slice(2)}
                        </li>
                    )
                } else if (line.includes("**")) {
                    const parts = line.split(/(\*\*.*?\*\*)/)
                    return (
                        <p key={index} className="consejo-text">
                            {parts.map((part, partIndex) => {
                                if (part.startsWith("**") && part.endsWith("**")) {
                                    return <strong key={partIndex}>{part.slice(2, -2)}</strong>
                                }
                                return part
                            })}
                        </p>
                    )
                } else if (line.trim() === "") {
                    return <br key={index} />
                } else {
                    return (
                        <p key={index} className="consejo-text">
                            {line}
                        </p>
                    )
                }
            })
        } catch (err) {
            console.error("Error al parsear el consejo:", err)
            return <span>{text}</span>
        }
    }

    // Función para formatear la fecha según el idioma actual
    const formatDate = (dateString) => {
        const date = new Date(dateString)
        const locale = i18n.language === "es" ? "es-ES" : "en-US"
        return date.toLocaleDateString(locale)
    }

    if (loading) {
        return (
            <div className={`loading-container ${darkMode ? "dark-theme" : ""}`}>
                <div className="spinner-container">
                    <div className="loading-spinner">
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                    </div>
                </div>
                <div className="loading-background">
                    <div className="floating-shape shape-1"></div>
                    <div className="floating-shape shape-2"></div>
                </div>
            </div>
        )
    }

    if (error) return <div className={`error-message ${darkMode ? "dark-theme" : ""}`}>Error: {error}</div>

    const scrollNavLinks = [
        {
            href: "#inicio",
            label: t("profile.advice.navigation.home"),
            onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
        },
        ...(userId
            ? [
                {
                    href: "Mi cuenta",
                    label: t("profile.advice.navigation.myAccount"),
                    onClick: () => navigate(`/perfil/${userId}`),
                },
                {
                    href: "edit",
                    label: t("profile.advice.navigation.editInfo"),
                    onClick: () => navigate(`/perfil/${userId}`),
                },
                ...(hasCompletedFirstForm
                    ? [
                        {
                            href: "#",
                            label: t("profile.advice.navigation.advice"),
                            onClick: () => navigate(`/consejos/${userId}`),
                        },
                    ]
                    : []),
            ]
            : []),
    ]

    return (
        <div className={`historial-container ${darkMode ? "dark-theme" : ""}`}>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

            <LanguageSwitcher />

            <div className="background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            {/* ScrollNav */}
            <ScrollNav links={scrollNavLinks} user={userId} />

            <div className="back-button-container">
                <h1 className="historial-title">{t("profile.advice.historyTitle")}</h1>
                <button onClick={handleGoBack} className="back-button">
                    {t("profile.advice.backToProfile")}
                </button>
            </div>

            {consejos.length === 0 ? (
                <div className="no-consejos-message">{t("profile.advice.noAdviceMessage")}</div>
            ) : (
                <div className="consejos-list">
                    {consejos.map((consejo, index) => (
                        <div key={consejo.id || index} className="consejo-card">
                            <div className="consejo-card-header">
                                <h5 className="consejo-card-title">
                                    {t("profile.advice.adviceNumber", { number: consejos.length - index })}
                                </h5>
                                {consejo.recommendationDate && (
                                    <small className="consejo-date">
                                        {t("profile.advice.date", { date: formatDate(consejo.recommendationDate) })}
                                    </small>
                                )}
                            </div>
                            <div className="consejo-card-body">
                                <div className="consejo-content">{parseAdvice(consejo.iaResult)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Footer />
        </div>
    )
}

export default HistorialConsejos
