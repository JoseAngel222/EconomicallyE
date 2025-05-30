package es.jose.economicallye.Mapper;

import es.jose.economicallye.Dto.GoalDTO;
import es.jose.economicallye.Entity.Goal;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;


@Mapper(componentModel = "spring")
public interface GoalMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(target = "relatedExpenseIds", expression = "java(goal.getRelatedExpenses() != null ? goal.getRelatedExpenses().stream().map(e -> e.getId()).collect(java.util.stream.Collectors.toSet()) : null)")
    GoalDTO toDto(Goal goal);

    @Mapping(source = "userId", target = "user.id")
    @Mapping(target = "relatedExpenses", ignore = true) // opcional, puedes luego mapear esto si lo necesitas
    Goal toEntity(GoalDTO dto);

    List<GoalDTO> toDtoList(List<Goal> goals);
    List<Goal> toEntityList(List<GoalDTO> goals);
}