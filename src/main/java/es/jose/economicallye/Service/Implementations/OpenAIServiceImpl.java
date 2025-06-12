package es.jose.economicallye.Service.Implementations;

import es.jose.economicallye.Service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OpenAIServiceImpl implements AIService {
    private final RestTemplate restTemplate;

    @Value("${openai.api.url}")
    private String apiUrl;

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.model}")
    private String model;

    @Override
    public String getAIRecommendation(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(
                Map.of("role", "user", "content", prompt)
        ));
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 1300);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, Map.class);

            // Procesar siempre el cuerpo, incluso si status no es 2xx
            if (response != null && response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object choicesObj = response.getBody().get("choices");
                if (choicesObj instanceof List choices && !choices.isEmpty()) {
                    Object firstChoice = choices.get(0);
                    if (firstChoice instanceof Map firstChoiceMap) {
                        Object messageObj = firstChoiceMap.get("message");
                        if (messageObj instanceof Map messageMap) {
                            Object content = messageMap.get("content");
                            if (content instanceof String) {
                                return (String) content;
                            }
                        }
                    }
                }
                // Si choices existe pero está vacío, devolver mensaje informativo
                return "La API de OpenAI no devolvió recomendaciones. Intente cambiar el prompt o revisar los parámetros del modelo.";
            } else if (response != null && response.getBody() != null && response.getBody().containsKey("error")) {
                Map error = (Map) response.getBody().get("error");
                String message = error.getOrDefault("message", "Error desconocido").toString();
                System.err.println("Error de OpenAI: " + message);
                throw new RuntimeException("Error de OpenAI: " + message);
            } else {
                System.err.println("Respuesta inesperada de OpenAI: " + (response != null ? response.toString() : "null"));
                throw new RuntimeException("Respuesta inesperada de OpenAI.");
            }
        } catch (HttpStatusCodeException httpEx) {
            String responseBody = httpEx.getResponseBodyAsString();
            System.err.println("HTTP error al comunicarse con OpenAI API: " + httpEx.getStatusCode() +
                    " - Body: " + responseBody);
            throw new RuntimeException("Error HTTP al comunicarse con OpenAI API: " + httpEx.getStatusCode(), httpEx);
        } catch (RestClientException rce) {
            System.err.println("Problema de red o RestClient al comunicarse con OpenAI API: " + rce.getMessage());
            throw new RuntimeException("Problema de red o RestTemplate en la comunicación con OpenAI API", rce);
        } catch (Exception e) {
            System.err.println("Error general en la comunicación con OpenAI API: " + e.getMessage());
            throw new RuntimeException("Error general en la comunicación con OpenAI API", e);
        }
    }

}