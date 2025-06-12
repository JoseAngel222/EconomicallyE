import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, TrendingUp } from "lucide-react"

import "./footer.css"
export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-content">
                    {/* Logo y descripción */}
                    <div className="footer-section">
                        <div className="footer-logo">
                            <TrendingUp className="footer-logo-icon"/>
                            <h3 className="footer-brand">EconomicallyE</h3>
                        </div>
                        <p className="footer-description">
                            Tu plataforma para mejorar tu salud financiera y alcanzar tus sueños económicos.
                        </p>
                        <div className="social-links">
                            <a href="#" className="social-link" aria-label="Facebook">
                                <Facebook size={20}/>
                            </a>
                            <a href="#" className="social-link" aria-label="Twitter">
                                <Twitter size={20}/>
                            </a>
                            <a href="#" className="social-link" aria-label="Instagram">
                                <Instagram size={20}/>
                            </a>
                            <a href="#" className="social-link" aria-label="LinkedIn">
                                <Linkedin size={20}/>
                            </a>
                        </div>
                    </div>

                    {/* Enlaces rápidos */}
                    <div className="footer-section">
                        <h4 className="footer-title">Enlaces Rápidos</h4>
                        <ul className="footer-links">
                            <li>
                                <a href="#inicio">Inicio</a>
                            </li>
                            <li>
                                <a href="#herramientas">Herramientas</a>
                            </li>
                            <li>
                                <a href="#consejos">Consejos</a>
                            </li>
                            <li>
                                <a href="#dashboard">Dashboard</a>
                            </li>
                            <li>
                                <a href="#perfil">Mi Perfil</a>
                            </li>
                        </ul>
                    </div>

                    {/* Servicios */}
                    <div className="footer-section">
                        <h4 className="footer-title">Servicios</h4>
                        <ul className="footer-links">
                            <li>
                                <a href="#analisis">Análisis Financiero</a>
                            </li>
                            <li>
                                <a href="#inflacion">Monitor de Inflación</a>
                            </li>
                            <li>
                                <a href="#presupuesto">Gestión de Presupuesto</a>
                            </li>
                            <li>
                                <a href="#metas">Planificación de Metas</a>
                            </li>
                            <li>
                                <a href="#reportes">Reportes Personalizados</a>
                            </li>
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div className="footer-section">
                        <h4 className="footer-title">Contacto</h4>
                        <div className="contact-info">
                            <div className="contact-item">
                                <Mail size={16}/>
                                <span>info@economicallye.com</span>

                            </div>
                            <div className="contact-item">
                                <Phone size={16}/>
                                <span>+34 657 94 68 80</span>
                                <span>+34 640 87 93 74</span>
                            </div>
                            <div className="contact-item">
                                <MapPin size={16}/>
                                <span>Madrid, España</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Línea divisoria */}
                <div className="footer-divider"></div>

                {/* Copyright */}
                <div className="footer-bottom">
                    <div className="footer-bottom-content">
                        <p className="copyright">© 2024 EconomicallyE. Todos los derechos reservados.</p>
                        <div className="footer-bottom-links">
                            <a href="#privacidad">Política de Privacidad</a>
                            <a href="#terminos">Términos de Servicio</a>
                            <a href="#cookies">Política de Cookies</a>
                        </div>
                    </div>
                </div>
            </div>

        </footer>
    )
}
