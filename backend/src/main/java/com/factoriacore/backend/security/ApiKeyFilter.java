package com.factoriacore.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro que protege los endpoints /api/n8n/** con una API Key.
 *
 * n8n debe enviar el header:  X-API-Key: <tu-clave>
 *
 * Configura la clave en application.properties:
 *   n8n.api-key=tu-clave-secreta-aqui
 *
 * O como variable de entorno:
 *   N8N_API_KEY=tu-clave-secreta-aqui
 */
@Component
public class ApiKeyFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String N8N_PATH_PREFIX = "/api/n8n";

    @Value("${n8n.api-key:#{null}}")
    private String expectedApiKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Solo aplicar a rutas de n8n
        if (!path.startsWith(N8N_PATH_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Si no hay API key configurada, rechazar todo (seguridad por defecto)
        if (expectedApiKey == null || expectedApiKey.isBlank()) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"N8N API key not configured on server\"}");
            return;
        }

        // Verificar el header
        String providedKey = request.getHeader(API_KEY_HEADER);
        if (providedKey == null || !providedKey.equals(expectedApiKey)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"Invalid or missing API key\"}");
            return;
        }

        // API key válida, continuar
        filterChain.doFilter(request, response);
    }
}