"use client"

import { useState, useEffect } from "react"
import "./styles.css"
import "../Components/Footer/footer.css"
import { useNavigate } from "react-router-dom"
import FloatingShapes from "./Fondo/HeroGeometric.jsx"
import SpiralAnimation from "../Components/Logo/Logo"
import FinancialDashboard from "../Components/FinancialDashboard.jsx"
import Footer from "../Components/Footer/footer.jsx"
import { motion } from "framer-motion"
import Inflation from "../Components/Inflation/Inflation.jsx"
import { TrendingUp, DollarSign, PieChart, Target, Brain, BarChart3, Moon, Sun } from "lucide-react"
import ScrollNav from "../Components/Nav/ScrollNav.jsx"
import AuthModal from "../Components/NuevoModal/auth-modal.jsx"

import LanguageSwitcher from "../Components/Idioma/LanguageSwitcher.jsx";
import { useTranslation } from 'react-i18next';

const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 1,
            delay: 0.3 + i * 0.2,
            ease: [0.25, 0.4, 0.25, 1],
        },
    }),
}

const Homepage = () => {
    const { t } = useTranslation()
    const [modalOpen, setModalOpen] = useState(false)
    const [modalType, setModalType] = useState("login")
    const [user, setUser] = useState(null)
    const [graficoActivo, setGraficoActivo] = useState("gastos")
    const [hasCompletedFirstForm, setHasCompletedFirstForm] = useState(false)
    const [loadingAdviceHistory, setLoadingAdviceHistory] = useState(false)
    const [headerVisible, setHeaderVisible] = useState(true)
    const [darkMode, setDarkMode] = useState(false)
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
        const token = localStorage.getItem("token")
        if (token) {
            fetchUserData(token)
        }
    }, [])

    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 150
            setHeaderVisible(!scrolled)
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const fetchUserData = async (token) => {
        try {
            const res = await fetch("https://economicallye-1.onrender.com/api/users/me", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            if (res.ok) {
                const userData = await res.json()
                console.log("Usuario recibido:", userData)
                setUser(userData)
                checkUserAdviceHistory(userData.id)
            } else {
                console.error("Token inválido o expirado")
                signOut()
            }
        } catch (error) {
            console.error("Error al obtener datos del usuario:", error)
            signOut()
        }
    }

    const checkUserAdviceHistory = async (userId) => {
        setLoadingAdviceHistory(true)
        try {
            const token = localStorage.getItem("token")

            if (!token) {
                console.error("No se encontró token de autenticación")
                setHasCompletedFirstForm(false)
                return
            }

            const response = await fetch(`https://economicallye-1.onrender.com/api/advice/${userId}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const adviceHistory = await response.json()
                console.log("Historial de consejos:", adviceHistory)
                setHasCompletedFirstForm(adviceHistory.length > 0)
            } else {
                console.error("Error al obtener historial de consejos:", response.status)
                setHasCompletedFirstForm(false)
            }
        } catch (error) {
            console.error("Error al verificar historial de consejos:", error)
            setHasCompletedFirstForm(false)
        } finally {
            setLoadingAdviceHistory(false)
        }
    }

    const markFirstFormAsCompleted = () => {
        setHasCompletedFirstForm(true)
    }

    // Función modificada para abrir modal de login
    const openLoginModal = (e) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        setModalType("login")
        setModalOpen(true)
    }

    // Función modificada para abrir modal de register
    const openRegisterModal = (e) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        setModalType("register")
        setModalOpen(true)
    }

    const signOut = () => {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        setUser(null)
        setHasCompletedFirstForm(false)
        navigate("/")
    }

    const closeModal = (e) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        setModalOpen(false)
    }

    const handleStartNow = () => {
        if (user) {
            const section = document.getElementById("form")
            if (section) {
                section.scrollIntoView({ behavior: "smooth" })
            }
        } else {
            openRegisterModal() // Por defecto abre registro para "Comienza Ahora"
        }
    }

    // Configurar los enlaces para el ScrollNav
    const scrollNavLinks = [
        {
            href: "#inicio",
            label: "Inicio",
            onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
        },
        ...(user
            ? [
                {
                    href: "#MiCuenta",
                    label: "Mi Cuenta",
                    onClick: () => navigate(`/perfil/${user.id}`),
                },
                {
                    href: "#",
                    label: "Dashboard",
                    onClick: () => navigate(`/dashboard/${user.id}`),
                },
                ...(hasCompletedFirstForm
                    ? [
                        {
                            href: "#Consejos",
                            label: "Consejos",
                            onClick: () => navigate(`/consejos/${user.id}`),
                        },
                    ]
                    : []),
            ]
            : []),
        {
            href: "#herramientas",
            label: "Herramientas",
            onClick: () => {
                const section = document.querySelector(".financial-features")
                if (section) {
                    section.scrollIntoView({ behavior: "smooth" })
                }
            },
        },
    ]



    return (
        <div className="container">
            <button
                className="dark-mode-toggle"
                onClick={toggleDarkMode}
                aria-label={darkMode ? t("lightMode") : t("darkMode")}
            >
                {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>

            <LanguageSwitcher />

            {/* ScrollNav */}
            <ScrollNav
                links={[
                    {
                        href: "#inicio",
                        label: t("home"),
                        onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
                    },
                    ...(user
                        ? [
                            {
                                href: "#MiCuenta",
                                label: t("myAccount"),
                                onClick: () => navigate(`/perfil/${user.id}`),
                            },
                            {
                                href: "#",
                                label: t("dashboard"),
                                onClick: () => navigate(`/dashboard/${user.id}`),
                            },
                            ...(hasCompletedFirstForm
                                ? [
                                    {
                                        href: "#Consejos",
                                        label: t("advice"),
                                        onClick: () => navigate(`/consejos/${user.id}`),
                                    },
                                ]
                                : []),
                        ]
                        : []),
                    {
                        href: "#herramientas",
                        label: t("tools"),
                        onClick: () => {
                            const section = document.querySelector(".financial-features")
                            if (section) {
                                section.scrollIntoView({ behavior: "smooth" })
                            }
                        },
                    },
                ]}
                user={user}
                onSignOut={signOut}
                onOpenLogin={openLoginModal}
                onOpenRegister={openRegisterModal}
            />

            <FloatingShapes darkMode={darkMode} />

            <header className={`main-header ${headerVisible ? "header-visible" : "header-hidden"}`}>
                <div className="container-logo">
                    <SpiralAnimation />
                    <h3>EconomicallyE</h3>
                </div>
                {user && (
                    <div className="items">
                        <button onClick={() => navigate(`/perfil/${user.id}`)} className="header-nav-btn">
                            {t("account")}
                        </button>
                        <button onClick={() => navigate(`/dashboard/${user.id}`)} className="header-nav-btn">
                            {t("progress")}
                        </button>
                    </div>
                )}
                {!user && (
                    <div className="header-buttons">
                        <button onClick={openLoginModal} className="login-btn">
                            {t("login")}
                        </button>
                        <button onClick={openRegisterModal} className="register-btn">
                            {t("register")}
                        </button>
                    </div>
                )}
                {user && (
                    <div className="header-buttons">
                        <button onClick={signOut} className="sign-out-btn">
                            {t("signOut")}
                        </button>
                    </div>
                )}
            </header>


            <section className="content" id="inicio">
                <div>
                    <motion.h1 custom={0} initial="hidden" animate="visible" variants={fadeUpVariants}>
                        {user ? t("welcome", { name: user.name }) : t("welcomeGuest")}
                    </motion.h1>

                    <motion.h2 custom={1} initial="hidden" animate="visible" variants={fadeUpVariants}>
                        {user ? t("taglineUser") : t("tagline")}
                    </motion.h2>

                    <motion.p custom={2} initial="hidden" animate="visible" variants={fadeUpVariants}>
                        {user ? t("descriptionUser") : t("description")}
                    </motion.p>
                </div>
                <div className="cta-section">
                    <motion.button
                        onClick={handleStartNow}
                        className="btn btn-primary"
                        custom={1}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUpVariants}
                    >
                        {t("startNow")}
                    </motion.button>
                </div>
            </section>

            <section className="about-section">
                <motion.div className="about-container" custom={2} initial="hidden" animate="visible" variants={fadeUpVariants}>
                    <div className="about-header">
                        <h3>{t("whatIs")}</h3>
                        <p className="about-description">{t("aboutDescription")}</p>
                    </div>

                    <div className="about-features">
                        <motion.div
                            className="about-feature"
                            custom={3}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUpVariants}
                        >
                            <div className="about-icon">
                                <Brain className="w-6 h-6" />
                            </div>
                            <div className="about-text">
                                <h4>{t("aiTitle")}</h4>
                                <p>{t("aiDescription")}</p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="about-feature"
                            custom={4}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUpVariants}
                        >
                            <div className="about-icon">
                                <Target className="w-6 h-6" />
                            </div>
                            <div className="about-text">
                                <h4>{t("goalsTitle")}</h4>
                                <p>{t("goalsDescription")}</p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="about-feature"
                            custom={5}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUpVariants}
                        >
                            <div className="about-icon">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div className="about-text">
                                <h4>{t("trackingTitle")}</h4>
                                <p>{t("trackingDescription")}</p>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            <section className="financial-features" id="herramientas">
                <motion.div
                    className="features-container"
                    custom={6}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUpVariants}
                >
                    <div className="feature-header">
                        <h3>{t("featuresTitle")}</h3>
                        <p>{t("featuresSubtitle")}</p>
                    </div>

                    <div className="features-grid">
                        <motion.div
                            className="feature-card"
                            custom={7}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUpVariants}
                        >
                            <div className="feature-icon">
                                <DollarSign className="w-8 h-8"/>
                            </div>
                            <h4>{t("smartManagement")}</h4>
                            <p>{t("smartManagementDesc")}</p>
                        </motion.div>

                        <motion.div
                            className="feature-card"
                            custom={8}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUpVariants}
                        >
                            <div className="feature-icon">
                                <TrendingUp className="w-8 h-8"/>
                            </div>
                            <h4>{t("inflationMonitoring")}</h4>
                            <p>{t("inflationMonitoringDesc")}</p>
                            <div className="feature-demo">
                                <Inflation/>
                            </div>
                        </motion.div>

                        <motion.div
                            className="feature-card"
                            custom={9}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUpVariants}
                        >
                            <div className="feature-icon">
                                <PieChart className="w-8 h-8"/>
                            </div>
                            <h4>{t("savingsAssistant")}</h4>
                            <p>{t("savingsAssistantDesc")}</p>
                            <div className="feature-preview">
                                <div className="chart-placeholder">
                                    <div className="chart-bar" style={{height: "60%"}}></div>
                                    <div className="chart-bar" style={{height: "80%"}}></div>
                                    <div className="chart-bar" style={{height: "40%"}}></div>
                                    <div className="chart-bar" style={{height: "90%"}}></div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {user && loadingAdviceHistory && (
                <section className="information">
                    <div className="text-center p-4">
                        <p>{t("checkingProgress")}</p>
                    </div>
                </section>
            )}

            {user && !hasCompletedFirstForm && !loadingAdviceHistory && (
                <section className="information" id="form">
                    <div>
                        <FinancialDashboard onFormCompleted={markFirstFormAsCompleted}/>
                    </div>
                </section>
            )}

            {user && hasCompletedFirstForm && !loadingAdviceHistory && (
                <section className="information">
                    <div className="text-center p-4">
                        <h3>{t("adviceGenerated")}</h3>
                        <p>{t("viewAdviceHistory")}</p>
                        <button onClick={() => navigate(`/consejos/${user.id}`)} className="btn btn-primary mt-3">
                            {t("viewAdviceHistoryBtn")}
                        </button>
                    </div>
                </section>
            )}

            {modalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-content-new"
                        onClick={(e) => {
                            e.stopPropagation()
                        }}
                    >
                        <button className="modal-close" onClick={closeModal} aria-label="Cerrar modal">
                            &times;
                        </button>
                        <AuthModal closeModal={closeModal} initialMode={modalType}/>
                    </div>
                </div>
            )}

            <Footer/>
        </div>
    )
}

export default Homepage
