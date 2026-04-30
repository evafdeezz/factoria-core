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

        // Si el usuario ya existe en BD devolvemos AppUserDetails con nuestro User
        // Si no existe (flujo de registro) devolvemos el OAuth2User genérico —
        // OAuth2AuthenticationSuccessHandler se encarga del resto
        Optional<User> userOpt = userRepository.findByEmail(email);
        return userOpt
                .map(user -> (OAuth2User) new AppUserDetails(user, oauthUser.getAttributes()))
                .orElse(oauthUser);
    }
}