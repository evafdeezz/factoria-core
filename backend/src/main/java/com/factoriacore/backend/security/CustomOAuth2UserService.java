package com.factoriacore.backend.security;

import com.factoriacore.backend.models.User;
import com.factoriacore.backend.repositories.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import java.util.Optional;

/**
 * Servicio encargado de cargar los datos del usuario autenticado con OAuth2.
 *
 * Primero obtiene la información que devuelve el proveedor externo, como Google.
 * Después comprueba si ese usuario ya existe en la base de datos de la aplicación.
 * Si existe, lo adapta a nuestro modelo de seguridad usando AppUserDetails.
 */
@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauthUser = delegate.loadUser(userRequest);

        String email = oauthUser.getAttribute("email");
        if (email == null) return oauthUser;

        // Buscamos si el usuario de OAuth2 ya está registrado en nuestra base de datos
        Optional<User> userOpt = userRepository.findByEmail(email);
        return userOpt
                .map(user -> (OAuth2User) new AppUserDetails(user, oauthUser.getAttributes()))
                .orElse(oauthUser);
    }
}