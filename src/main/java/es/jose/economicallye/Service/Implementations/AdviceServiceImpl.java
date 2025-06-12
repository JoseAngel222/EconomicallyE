package es.jose.economicallye.Service.Implementations;

import es.jose.economicallye.Dto.AdviceDTO;
import es.jose.economicallye.Dto.FinancialQuestionnaireDTO;
import es.jose.economicallye.Entity.*;
import es.jose.economicallye.Exception.UserNotFoundException;
import es.jose.economicallye.Mapper.AdviceMapper;
import es.jose.economicallye.Repository.*;
import es.jose.economicallye.Service.AIService;
import es.jose.economicallye.Service.AdviceService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.util.DigestUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdviceServiceImpl implements AdviceService {
    private final UserRepository userRepository;
    private final FixedExpenseRepository fixedExpenseRepository;
    private final VariableExpenseRepository variableExpenseRepository;
    private final GoalRepository goalRepository;
    private final AdviceRepository adviceRepository;
    private final AdviceMapper adviceMapper;
    private final AIService aiService;
    private final LocaleResolver localeResolver;
    private final HttpServletRequest request;

    @Override
    public AdviceDTO generateAdvice(FinancialQuestionnaireDTO questionnaire) {
        if (questionnaire.getUserId() == null) {
            throw new IllegalArgumentException(localeResolver.resolveLocale(request).getLanguage().equals("es")
                    ? "El ID de usuario no puede ser nulo"
                    : "User ID cannot be null");
        }

        User user = userRepository.findById(questionnaire.getUserId())
                .orElseThrow(() -> new UserNotFoundException(
                        localeResolver.resolveLocale(request).getLanguage().equals("es")
                                ? "Usuario no encontrado con ID: " + questionnaire.getUserId()
                                : "User not found with ID: " + questionnaire.getUserId()));

        List<FixedExpense> currentFixedExpenses = fixedExpenseRepository.findByUserId(user.getId());
        List<VariableExpense> currentVariableExpenses = variableExpenseRepository.findByUserId(user.getId());
        List<Goal> currentGoals = goalRepository.findByUserId(user.getId());

        // Validación: El usuario debe tener al menos una meta
        if (currentGoals.isEmpty()) {
            return buildErrorAdvice(user.getId(),
                    localeResolver.resolveLocale(request).getLanguage().equals("es")
                            ? "Debes tener al menos una meta de ahorro configurada para poder generar un consejo financiero."
                            : "You must have at least one savings goal configured to generate financial advice.");
        }

        // Validación: El usuario debe tener ingresos mensuales
        if (user.getMonthlyIncome() == null || user.getMonthlyIncome() <= 0) {
            return buildErrorAdvice(user.getId(),
                    localeResolver.resolveLocale(request).getLanguage().equals("es")
                            ? "Debes configurar tus ingresos mensuales antes de generar un consejo financiero."
                            : "You must configure your monthly income before generating financial advice.");
        }

        Optional<Advice> lastAdvice = adviceRepository.findTopByUserIdOrderByRecommendationDateDesc(user.getId());

        // Validación 1: Verificar si hay cambios en los datos del usuario
        boolean dataChanged = lastAdvice.isEmpty() ||
                hasUserDataChanged(lastAdvice.get(), user, currentFixedExpenses,
                        currentVariableExpenses, currentGoals);

        // Validación 2: Verificar si el último consejo fue hace menos de 1 semana
        boolean isTooRecent = lastAdvice.isPresent() &&
                lastAdvice.get().getRecommendationDate()
                        .isAfter(LocalDateTime.now().minusSeconds(5));

        if (lastAdvice.isPresent()) {
            if (!dataChanged) {
                return buildErrorAdvice(user.getId(),
                        localeResolver.resolveLocale(request).getLanguage().equals("es")
                                ? "Debes actualizar tu información financiera antes de recibir un nuevo consejo."
                                : "You must update your financial information before receiving new advice.");
            }

            if (isTooRecent) {
                return buildErrorAdvice(user.getId(),
                        localeResolver.resolveLocale(request).getLanguage().equals("es")
                                ? "Debes esperar al menos una semana desde tu último consejo para recibir uno nuevo."
                                : "You must wait at least one week from your last advice to receive a new one.");
            }
        }

        // Generar el consejo
        Locale locale = localeResolver.resolveLocale(request);
        System.out.println(" Locale detectado: " + locale);
        System.out.println(" Idioma: " + locale.getLanguage());
        System.out.println(" Accept-Language header: " + request.getHeader("Accept-Language"));
        String prompt = buildPrompt(user, currentFixedExpenses, currentVariableExpenses,
                currentGoals, questionnaire.getPlannedSavings(), locale);

        // Log del prompt que se envía a la IA
        logPromptDetails(prompt, locale);

        String iaResult;
        try {
            iaResult = aiService.getAIRecommendation(prompt);
        } catch (Exception e) {
            iaResult = locale.getLanguage().equals("es")
                    ? "No se pudo generar un consejo en este momento. Inténtalo más tarde."
                    : "Could not generate advice at this time. Please try again later.";
        }

        String dataHash = calculateUserDataHash(user, currentFixedExpenses, currentVariableExpenses, currentGoals);
        String adviceWithHash = "[DATAHASH:" + dataHash + "]\n" + iaResult;

        Advice advice = Advice.builder()
                .user(user)
                .iaResult(iaResult)
                .recommendationDate(LocalDateTime.now())
                .dataHash(dataHash)
                .build();

        advice = adviceRepository.save(advice);
        return adviceMapper.toDto(advice);
    }

    private AdviceDTO buildErrorAdvice(Long userId, String message) {
        return AdviceDTO.builder()
                .userId(userId)  // Aseguramos que siempre tenga userId
                .iaResult(message)
                .recommendationDate(LocalDateTime.now())
                .build();
    }

    private boolean hasUserDataChanged(Advice lastAdvice, User user,
                                       List<FixedExpense> currentFixed,
                                       List<VariableExpense> currentVariable,
                                       List<Goal> currentGoals) {
        String currentHash = calculateUserDataHash(user, currentFixed, currentVariable, currentGoals);
        String lastHash = lastAdvice.getDataHash();
        return !currentHash.equals(lastHash);
    }

    private String calculateUserDataHash(User user,
                                         List<FixedExpense> fixedExpenses,
                                         List<VariableExpense> variableExpenses,
                                         List<Goal> goals) {
        StringBuilder dataSnapshot = new StringBuilder();

        // Incluir datos del usuario
        dataSnapshot.append(user.getId())
                .append(user.getMonthlyIncome());

        // Incluir gastos fijos
        fixedExpenses.stream()
                .sorted(Comparator.comparing(FixedExpense::getId))
                .forEach(fe -> dataSnapshot.append(fe.getId()).append(fe.getName())
                        .append(fe.getAmount()).append(fe.getFrequency()));

        // Incluir gastos variables
        variableExpenses.stream()
                .sorted(Comparator.comparing(VariableExpense::getId))
                .forEach(ve -> dataSnapshot.append(ve.getId()).append(ve.getName())
                        .append(ve.getAmount()).append(ve.getExpenseDate()));

        // Incluir metas
        goals.stream()
                .sorted(Comparator.comparing(Goal::getId))
                .forEach(g -> dataSnapshot.append(g.getId()).append(g.getDescription())
                        .append(g.getTargetAmount()).append(g.getSavedAmount())
                        .append(g.getDeadline()));

        return DigestUtils.md5DigestAsHex(dataSnapshot.toString().getBytes());
    }

    private void logPromptDetails(String prompt, Locale locale) {
        System.out.println("=== ENVIANDO A IA ===");
        System.out.println("Idioma: " + (locale.getLanguage().equals("es") ? "Español" : "Inglés"));
        System.out.println("Datos enviados:");
        System.out.println(prompt);
        System.out.println("=====================");
    }



    private String extractDataHashFromAdvice(Advice advice) {
        String iaResult = advice.getIaResult();
        int startIndex = iaResult.indexOf("[DATAHASH:") + 10;
        int endIndex = iaResult.indexOf("]", startIndex);

        if (startIndex >= 10 && endIndex > startIndex) {
            return iaResult.substring(startIndex, endIndex);
        }
        return "";
    }

    @Override
    public List<AdviceDTO> getAdviceHistory(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException(localeResolver.resolveLocale(request).getLanguage().equals("es")
                    ? "El ID de usuario no puede ser nulo"
                    : "User ID cannot be null");
        }

        userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(localeResolver.resolveLocale(request).getLanguage().equals("es")
                        ? "Usuario no encontrado con ID: " + userId
                        : "User not found with ID: " + userId));

        return adviceRepository.findByUserIdOrderByRecommendationDateDesc(userId).stream()
                .map(adviceMapper::toDto)
                .collect(Collectors.toList());
    }

    private String buildPrompt(User user, List<FixedExpense> fixedExpenses,
                               List<VariableExpense> variableExpenses,
                               List<Goal> goals, Double plannedSavings, Locale locale) {
        StringBuilder prompt = new StringBuilder();
        String dataHash = calculateUserDataHash(user, fixedExpenses, variableExpenses, goals);

        boolean isSpanish = locale.getLanguage().equals("es");


        if (isSpanish) {
            prompt.append("Por favor, responde completamente en español.\n\n");
        } else {
            prompt.append(" (IMPORTANT) Please respond entirely in English.\n\n");
        }

        prompt.append("Eres un asesor financiero experto con un enfoque en coaching financiero. Tu objetivo es proporcionar recomendaciones extremadamente prácticas y personalizadas que ayuden al usuario a optimizar sus finanzas sin caer en recortes innecesarios.\n\n");

        prompt.append("### CONTEXTO CLAVE QUE DEBES CONSIDERAR ###\n");
        prompt.append("- El usuario tiene ingresos mensuales estables de ").append(user.getMonthlyIncome()).append(" €.\n");
        prompt.append("- Después de cubrir sus gastos fijos y variables conocidos, le quedan aproximadamente ").append(calculateRemainingMoney(user, fixedExpenses, variableExpenses)).append(" € mensuales libres.\n");
        prompt.append("- Esto significa que, si bien hay margen para pequeños ajustes, el usuario **ya está en una buena posición para ahorrar** sin tener que hacer grandes sacrificios.\n");
        prompt.append("- No insistas en eliminar todos los gastos si no es necesario. En su lugar, **enseña cómo organizar y aprovechar mejor su dinero libre** para alcanzar sus metas.\n");
        prompt.append("- El objetivo principal no es solo reducir, sino **equilibrar**: mantener calidad de vida, reducir gastos innecesarios solo cuando tenga sentido y planificar activamente el ahorro.\n");
        prompt.append("- Ten en cuenta que hay gastos que no están detallados (como comida o transporte), por lo que no asumas que el dinero restante está 100% disponible.\n\n");

        prompt.append("### INSTRUCCIONES PRINCIPALES ###\n");
        prompt.append("1. Analiza cada categoría de gastos para detectar oportunidades realistas de ahorro (solo si son necesarias).\n");
        prompt.append("2. Proporciona alternativas concretas que permitan mantener o mejorar la calidad de vida mientras se ahorra mejor.\n");
        prompt.append("3. Calcula y sugiere cómo podría distribuir su dinero libre de forma más estratégica.\n");
        prompt.append("4. Propón un plan para alcanzar sus metas de ahorro dentro del plazo estimado sin recurrir a recortes drásticos.\n");
        prompt.append("5. Explica el impacto a corto y largo plazo de cada recomendación.\n");
        prompt.append("6. Usa un tono motivador, práctico y realista. Evita generalidades o consejos repetitivos.\n\n");

        prompt.append("### DATOS DEL USUARIO ###\n");
        prompt.append("Nombre: ").append(user.getName()).append("\n");
        prompt.append("Ingresos mensuales: ").append(user.getMonthlyIncome()).append(" €\n");

        prompt.append("\n### GASTOS FIJOS ###\n");
        fixedExpenses.forEach(fe -> prompt.append("- ").append(fe.getName())
                .append(": ").append(fe.getAmount()).append(" € (").append(fe.getFrequency()).append("). Descripción: ").append(fe.getDescription()).append("\n"));

        prompt.append("\n### GASTOS VARIABLES DEL ÚLTIMO MES ###\n");
        variableExpenses.forEach(ve -> prompt.append("- ").append(ve.getName())
                .append(": ").append(ve.getAmount()).append(" € (").append(ve.getExpenseDate()).append("). Descripción: ").append(Optional.ofNullable(ve.getDescription()).orElse("Sin descripción")).append("\n"));

        prompt.append("\n### OBJETIVOS DE AHORRO ###\n");
        goals.forEach(g -> prompt.append("- ").append(g.getDescription())
                .append(": Meta = ").append(g.getTargetAmount()).append(" €, Ahorrado = ").append(g.getSavedAmount())
                .append(" €, Fecha límite = ").append(g.getDeadline()).append("\n"));

        if (plannedSavings != null) {
            prompt.append("\nAhorro mensual planificado: ").append(plannedSavings).append(" €\n");
        }

        prompt.append("\n### ESTRUCTURA OBLIGATORIA DE RESPUESTA ###\n");
        prompt.append("- Análisis de situación actual\n");
        prompt.append("- Posibilidades de optimización (no necesariamente recortes)\n");
        prompt.append("- Estrategias de ahorro práctico\n");
        prompt.append("- Plan de acción mensual para alcanzar las metas\n");
        prompt.append("- Consejo final inspirador y realista\n\n");

        prompt.append("Recuerda: tu función como asesor es ayudarle a usar mejor su dinero, no solo a reducir por reducir. Ayuda a construir un equilibrio entre disfrutar el presente y planificar bien el futuro.");

        return prompt.toString();
    }

    private double calculateRemainingMoney(User user, List<FixedExpense> fixedExpenses, List<VariableExpense> variableExpenses) {
        double totalFixed = fixedExpenses.stream().mapToDouble(FixedExpense::getAmount).sum();
        double totalVariable = variableExpenses.stream().mapToDouble(VariableExpense::getAmount).sum();
        return user.getMonthlyIncome() - totalFixed - totalVariable;
    }

    @Override
    public AdviceDTO generateProgressReport(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException(localeResolver.resolveLocale(request).getLanguage().equals("es")
                    ? "El ID de usuario no puede ser nulo"
                    : "User ID cannot be null");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(
                        localeResolver.resolveLocale(request).getLanguage().equals("es")
                                ? "Usuario no encontrado con ID: " + userId
                                : "User not found with ID: " + userId));

        List<Advice> adviceHistory = adviceRepository.findByUserIdOrderByRecommendationDateDesc(userId);

        if (adviceHistory.size() < 2) {
            return AdviceDTO.builder()
                    .userId(userId)
                    .iaResult(localeResolver.resolveLocale(request).getLanguage().equals("es")
                            ? "Necesitas al menos 2 análisis previos para generar un reporte de progreso."
                            : "You need at least 2 previous analyses to generate a progress report.")
                    .recommendationDate(LocalDateTime.now())
                    .build();
        }

        Locale locale = localeResolver.resolveLocale(request);
        String progressPrompt = buildProgressPrompt(user, adviceHistory);
        String progressAnalysis;
        try {
            progressAnalysis = aiService.getAIRecommendation(progressPrompt);
        } catch (Exception e) {
            progressAnalysis = locale.getLanguage().equals("es")
                    ? "No se pudo generar el reporte de progreso en este momento. Inténtalo más tarde."
                    : "Could not generate progress report at this time. Please try again later.";
        }

        Advice progressAdvice = new Advice();
        progressAdvice.setUser(user);
        progressAdvice.setIaResult(progressAnalysis);
        progressAdvice.setRecommendationDate(LocalDateTime.now());
        progressAdvice = adviceRepository.save(progressAdvice);

        return adviceMapper.toDto(progressAdvice);
    }

    private String buildProgressPrompt(User user, List<Advice> adviceHistory) {
        Locale locale = localeResolver.resolveLocale(request);
        StringBuilder prompt = new StringBuilder();

        if (locale.getLanguage().equals(new Locale("es").getLanguage())) {
            prompt.append("Por favor, responde completamente en español.\n\n");
        } else {
            prompt.append("Please respond entirely in English.\n\n");
        }

        prompt.append("Eres un asesor financiero experto en seguimiento de progreso financiero. Analiza el historial de recomendaciones financieras de este usuario.\n\n");

        prompt.append("### INFORMACIÓN DEL USUARIO ###\n");
        prompt.append("Nombre: ").append(user.getName()).append("\n");
        prompt.append("Ingresos mensuales: ").append(user.getMonthlyIncome()).append(" €\n\n");

        prompt.append("### HISTORIAL DE RECOMENDACIONES ###\n");
        for (int i = 0; i < Math.min(adviceHistory.size(), 3); i++) {
            Advice advice = adviceHistory.get(i);
            prompt.append("Recomendación ").append(i + 1).append(" (").append(advice.getRecommendationDate()).append("):\n");
            prompt.append(advice.getIaResult()).append("\n\n");
        }

        prompt.append("### TAREA ###\n");
        prompt.append("1. Evalúa el progreso del usuario basándote en recomendaciones anteriores.\n");
        prompt.append("2. Identifica mejoras logradas y áreas que requieren más atención.\n");
        prompt.append("3. Calcula el porcentaje de implementación de consejos previos.\n");
        prompt.append("4. Proporciona motivación y estrategias actualizadas.\n");
        prompt.append("5. Destaca logros específicos y áreas de oportunidad.\n");

        return prompt.toString();
    }
}