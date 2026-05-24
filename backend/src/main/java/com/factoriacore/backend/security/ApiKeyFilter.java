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
 * Filtro de seguridad que protege los endpoints de n8n mediante una API Key.
 *
 * Cada petición a /api/n8n/** debe incluir el header X-API-Key. Si la clave
 * no está configurada en el servidor o no coincide con la recibida, la petición
 * se rechaza antes de llegar al controlador.
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

        // Solo se valida la API Key en las rutas reservadas para n8n
        if (!path.startsWith(N8N_PATH_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Evitamos aceptar peticiones si la clave no está configurada
        if (expectedApiKey == null || expectedApiKey.isBlank()) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"N8N API key not configured on server\"}");
            return;
        }

        // Comprobamos la clave enviada en el header de la petición
        String providedKey = request.getHeader(API_KEY_HEADER);
        if (providedKey == null || !providedKey.equals(expectedApiKey)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"Invalid or missing API key\"}");
            return;
        }

        // La petición ya está validada y puede continuar
        filterChain.doFilter(request, response);
    }
}