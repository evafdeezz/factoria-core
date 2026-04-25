package com.factoriacore.backend.config;

import com.factoriacore.backend.security.ApiKeyFilter;
import com.factoriacore.backend.security.CustomOAuth2UserService;
import com.factoriacore.backend.security.OAuth2AuthenticationSuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler successHandler;
    private final ApiKeyFilter apiKeyFilter;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public SecurityConfig(CustomOAuth2UserService customOAuth2UserService,
                          OAuth2AuthenticationSuccessHandler successHandler,
                          ApiKeyFilter apiKeyFilter) {
        this.customOAuth2UserService = customOAuth2UserService;
        this.successHandler = successHandler;
        this.apiKeyFilter = apiKeyFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .addFilterBefore(apiKeyFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/error",
                                "/api/health",
                                "/oauth2/**",
                                "/login/**",
                                "/api/auth/oauth/login",
                                "/api/auth/oauth/register/start"
                        ).permitAll()
                        .requestMatchers("/api/n8n/**").permitAll()
                        .requestMatchers(
                                "/api/auth/me",
                                "/api/auth/logout",
                                "/api/auth/oauth/pending",
                                "/api/auth/oauth/register"
                        ).authenticated()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "No autenticado")
                        )
                )
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(successHandler)
                        .failureHandler((request, response, exception) ->
                                response.sendRedirect(frontendUrl + "/login?oauthError=google_auth_failed"))
                )
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler((request, response, authentication) ->
                                response.setStatus(HttpServletResponse.SC_OK))
                );

        return http.build();
    }
}