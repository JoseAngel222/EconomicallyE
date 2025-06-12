import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import Backend from "i18next-http-backend"

import enTranslations from "./locales/en/translation.json"
import esTranslations from "./locales/es/translation.json"

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: "en",
        debug: process.env.NODE_ENV === "development",

        resources: {
            en: {
                translation: enTranslations,
            },
            es: {
                translation: esTranslations,
            },
        },

        interpolation: {
            escapeValue: false,
        },

        detection: {
            order: ["localStorage", "navigator", "htmlTag"],
            caches: ["localStorage"],
        },

        backend: {
            loadPath: "/locales/{{lng}}.json",
        },
    })

export default i18n
