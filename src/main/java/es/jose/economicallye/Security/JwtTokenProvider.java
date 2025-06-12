package es.jose.economicallye.Security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.io.StringReader;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private int jwtExpirationMs;

    private SecretKey getSigningKey() {
        try {
            // Verifica que la variable jwtSecret está establecida
            if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
                throw new IllegalArgumentException("La clave JWT (app.jwt.secret) no está configurada. Revisa application.properties");
            }

            byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);

            // Valida la longitud de la clave
            if (keyBytes.length < 32) { // 256 bits para HS256
                throw new IllegalArgumentException("La clave JWT debe tener al menos 256 bits (32 bytes). " +
                        "Longitud actual: " + (keyBytes.length * 8) + " bits. Usa una cadena más robusta.");
            }

            return Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Error al crear la clave de firma JWT: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Error inesperado al crear la clave de firma JWT", e);
        }
    }

    // Versión que incluye el ID de usuario
    public String generateToken(UserDetails userDetails, Long userId, String name, String Username) {
        System.out.println("Generando token para usuario con ID: " + userId);

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("id", userId) // Añade el ID como claim
                .claim("name",name)
                .claim("username",Username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();

    }

    // Versión original

    /*
    public String generateToken(UserDetails userDetails) {
        return generateToken(userDetails, null);
    }

     */

    public Long extractUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return claims.get("id", Long.class);
        } catch (Exception e) {
            throw new RuntimeException("Error al extraer el id del usuario del token", e);
        }
    }

    public String extractUserName(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.get("username", String.class); // nombre real
        } catch (Exception e) {
            throw new RuntimeException("Error al extraer el nombre del usuario del token", e);
        }
    }

    public String extractUserEmail(String token) {
        try {
            return extractAllClaims(token).getSubject();
        }catch (Exception e){
            throw new RuntimeException("Error al extraer el email del usuario del token", e);
        }
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            System.out.println("Token inválido: " + e.getMessage());
            return false;
        }
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}