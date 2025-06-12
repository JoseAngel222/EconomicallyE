package es.jose.economicallye.Service;

import es.jose.economicallye.Dto.AdviceDTO;
import es.jose.economicallye.Dto.FinancialQuestionnaireDTO;

import java.util.List;

public interface AdviceService {
    AdviceDTO generateAdvice(FinancialQuestionnaireDTO questionnaire);
    List<AdviceDTO> getAdviceHistory(Long userId);
    AdviceDTO generateProgressReport(Long userId);
}