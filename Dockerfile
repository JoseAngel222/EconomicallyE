# Usa una imagen base con Java 17
FROM eclipse-temurin:21-jdk

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia todo el proyecto al contenedor
COPY . .

# Da permisos al wrapper para evitar errores de ejecución
RUN chmod +x mvnw

# Ejecuta el build con Maven Wrapper (puede tardar un poco)
RUN ./mvnw clean package -DskipTests

# Expone el puerto en el que corre la app
EXPOSE 8080

# Comando para ejecutar la app
CMD ["java", "-jar", "target/EconomicallyE-0.0.1-SNAPSHOT.jar"]
