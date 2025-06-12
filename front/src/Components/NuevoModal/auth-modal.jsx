"use client"

import { useState, useEffect } from "react"
import "./auth-modal.css"

/**
 * Auth Modal Component
 * @param {Object} props
 * @param {Function} props.closeModal - Función para cerrar el modal
 * @param {string} props.initialMode - Modo inicial: 'login' o 'register'
 */
export default function AuthModal({ closeModal, initialMode = "login" }) {
    const [isActive, setIsActive] = useState(initialMode === "register")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")

    // Actualizar el estado cuando cambie el initialMode
    useEffect(() => {
        setIsActive(initialMode === "register")
    }, [initialMode])

    // Login form state
    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
    })

    // Register form state
    const [registerData, setRegisterData] = useState({
        name: "",
        email: "",
        password: "",
        registrationDate: new Date().toISOString().split("T")[0],
        monthlyIncome: 0,
    })

    const handleLoginChange = (e) => {
        const { name, value } = e.target
        setLoginData({
            ...loginData,
            [name]: value,
        })
    }

    const handleRegisterChange = (e) => {
        const { name, value } = e.target
        setRegisterData({
            ...registerData,
            [name]: name === "monthlyIncome" ? Number.parseFloat(value) : value,
        })
    }

    const handleLoginSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            console.log("Making login request...")

            const res = await fetch("https://economicallye-1.onrender.com/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    email: loginData.email,
                    password: loginData.password,
                }),
            })

            console.log("Login response status:", res.status)

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                console.log("Login error data:", errorData)
                throw new Error(errorData.message || "Credenciales incorrectas")
            }

            const data = await res.json()
            console.log("Login successful, data received:", data)

            // Store token and user data
            localStorage.setItem("token", data.token)
            localStorage.setItem("user", JSON.stringify(data.user))

            console.log("Data stored in localStorage")

            // Close modal if provided
            if (closeModal) {
                console.log("Closing modal...")
                closeModal()
            }

            // Force page reload to update state
            console.log("Reloading page...")
            window.location.reload()
        } catch (err) {
            console.error("Login error:", err)
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegisterSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage("")
        setError("")

        try {
            console.log("Registering user:", registerData);

            const response = await fetch("https://economicallye-1.onrender.com/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(registerData),
            });

            console.log("Registration response status:", response.status);

            if (response.ok) {
                const text = await response.text();
                const newUser = text ? JSON.parse(text) : null;
                setMessage(
                    newUser ? `Usuario registrado correctamente. ID: ${newUser.id}` : "Usuario registrado correctamente."
                );

                setTimeout(() => {
                    showLogin();
                }, 1500);
            } else {
                // Intentar extraer el mensaje del backend como JSON o como texto
                let errorMessage = "Error desconocido";
                let errorText = await response.text();

                try {
                    const data = JSON.parse(errorText);
                    errorMessage = data.message || errorText;
                } catch {
                    errorMessage = errorText;
                }


                console.error("Respuesta de error del backend:", errorMessage);
                setError(`Error: ${errorMessage}`);

            }
        } catch (error) {
            console.error("Registration error:", error);
            setError(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }

    }

    const showRegister = () => {
        setIsActive(true)
        setError("")
        setMessage("")
    }

    const showLogin = () => {
        setIsActive(false)
        setError("")
        setMessage("")
    }

    return (
        <div className="auth-modal-wrapper">
            <div className={`container ${isActive ? "active" : ""}`}>
                <div className="curved-shape"></div>
                <div className="curved-shape2"></div>

                {/* Login Form */}
                <div className="login-container Login">
                    <h2 className="animation" style={{ "--D": 0, "--S": 21 }}>
                        Iniciar sesión
                    </h2>
                    <form onSubmit={handleLoginSubmit}>
                        <div className="form-group animation" style={{ "--D": 1, "--S": 22 }}>
                            <input
                                type="email"
                                name="email"
                                value={loginData.email}
                                onChange={handleLoginChange}

                                disabled={isLoading}
                            />
                            <label>Email</label>
                            <i className="bx bxs-user"></i>
                        </div>

                        <div className="form-group animation" style={{ "--D": 2, "--S": 23 }}>
                            <input
                                type="password"
                                name="password"
                                value={loginData.password}
                                onChange={handleLoginChange}

                                disabled={isLoading}
                            />
                            <label>Password</label>
                            <i className="bx bxs-lock-alt"></i>
                        </div>

                        <div className="form-group animation" style={{ "--D": 3, "--S": 24 }}>
                            <button type="submit" className="btn" disabled={isLoading}>
                                {isLoading ? "Cargando..." : "Entrar"}
                            </button>
                        </div>

                        {error && (
                            <p className="error-message" style={{ color: "red", display: "block" }}>
                                {error}
                            </p>
                        )}

                        <div className="auth-switch animation" style={{ "--D": 4, "--S": 25 }}>
                            <p>
                                {"¿No tienes cuenta? "}
                                <button type="button" className="SignUpLink" onClick={showRegister} disabled={isLoading}>
                                    Regístrate
                                </button>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Login Info Content */}
                <div className="info-content Login">
                    <h2 className="animation" style={{ "--D": 0, "--S": 20 }}>
                        Bienvenido
                    </h2>
                    <p className="animation" style={{ "--D": 1, "--S": 21 }}>
                        Inicia sesión para acceder a tu cuenta y gestionar tus finanzas personales. Controla tus gastos, establece
                        metas de ahorro y mejora tu salud financiera.
                    </p>
                </div>

                {/* Register Form */}
                <div className="login-container Register">
                    <h2 className="animation" style={{ "--li": 17, "--S": 0 }}>
                        Regístrate
                    </h2>
                    <form onSubmit={handleRegisterSubmit}>
                        <div className="form-group animation" style={{ "--li": 18, "--S": 1 }}>
                            <input
                                type="text"
                                name="name"
                                value={registerData.name}
                                onChange={handleRegisterChange}

                                disabled={isLoading}
                            />
                            <label>Nombre</label>
                            <i className="bx bxs-user"></i>
                        </div>

                        <div className="form-group animation" style={{ "--li": 19, "--S": 2 }}>
                            <input
                                type="email"
                                name="email"
                                value={registerData.email}
                                onChange={handleRegisterChange}

                                disabled={isLoading}
                            />
                            <label>Email</label>
                            <i className="bx bxs-envelope"></i>
                        </div>

                        <div className="form-group animation" style={{ "--li": 20, "--S": 3 }}>
                            <input
                                type="password"
                                name="password"
                                value={registerData.password}
                                onChange={handleRegisterChange}

                                disabled={isLoading}
                            />
                            <label>Password</label>
                            <i className="bx bxs-lock-alt"></i>
                        </div>

                        <div className="form-group animation" style={{ "--li": 21, "--S": 4 }}>
                            <input
                                type="number"
                                name="monthlyIncome"
                                value={registerData.monthlyIncome}
                                onChange={handleRegisterChange}

                                disabled={isLoading}
                            />
                            <label>Ingreso Mensual</label>
                            <i className="bx bx-money"></i>
                        </div>

                        <div className="form-group animation" style={{ "--li": 22, "--S": 5 }}>
                            <button type="submit" className="btn" disabled={isLoading}>
                                {isLoading ? "Registrando..." : "Registrar"}
                            </button>
                        </div>

                        {message && (
                            <p className="success-message" style={{ color: "green", display: "block" }}>
                                {message}
                            </p>
                        )}

                        {error && (
                            <p className="error-message" style={{ color: "red", display: "block" }}>
                                {error}
                            </p>
                        )}

                        <div className="auth-switch animation" style={{ "--li": 23, "--S": 6 }}>
                            <p>
                                {"¿Ya tienes cuenta? "}
                                <button type="button" className="SignInLink" onClick={showLogin} disabled={isLoading}>
                                    Login
                                </button>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Register Info Content */}
                <div className="info-content Register">
                    <h2 className="animation" style={{ "--li": 17, "--S": 0 }}>
                        Únete a nosotros
                    </h2>
                    <p className="animation" style={{ "--li": 18, "--S": 1 }}>
                        Crea una cuenta para comenzar a gestionar tus finanzas personales. Registrarte te permitirá acceder a todas
                        las herramientas para controlar tus gastos y mejorar tu situación financiera.
                    </p>
                </div>
            </div>
        </div>
    )
}
