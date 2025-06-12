"use client"
import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"
import "./LanguageSwitcher.css"

const LanguageSwitcher = () => {
    const { i18n } = useTranslation()

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng)
        // Opcional: enviar el cambio al backend
        // fetch(`/api/change-language?lang=${lng}`, { method: 'POST' });
    }

    const currentLanguage = i18n.language || "en"

    return (
        <div className="language-switcher">
            <Globe className="language-icon" size={20} />
            <select value={currentLanguage} onChange={(e) => changeLanguage(e.target.value)} className="language-select">
                <option value="en">English</option>
                <option value="es">Español</option>
            </select>
        </div>
    )
}

export default LanguageSwitcher
