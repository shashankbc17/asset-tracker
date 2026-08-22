# Stage 1: Build the Spring Boot Application
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# Copy Maven files
COPY pom.xml .
COPY mvnw* .
COPY .mvn .mvn

# Copy Source code
COPY src src

# Build executable jar
RUN mvn clean package -DskipTests

# Stage 2: Minimal Runtime image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["java", "-jar", "app.jar"]
