package com.factoriacore.backend.security;

import com.factoriacore.backend.models.User;
import com.factoriacore.backend.repositories.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.Optional;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private static final String FRONTEND_BASE_URL = "http://localhost:3000";

    private final UserRepository userRepository;

    public OAuth2AuthenticationSuccessHandler(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String email = oauthUser.getAttribute("email");
        String fullName = oauthUser.getAttribute("name");
        String givenName = oauthUser.getAttribute("given_name");
        String familyName = oauthUser.getAttribute("family_name");
        String googleId = oauthUser.getAttribute("sub");
        String pictureUrl = oauthUser.getAttribute("picture");

        HttpSession session = request.getSession(true);
        String mode = (String) session.getAttribute("OAUTH_MODE");

        if (email == null || email.isBlank()) {
            clearOAuthSession(session);
            response.sendRedirect(FRONTEND_BASE_URL + "/login?tab=login&error=EMAIL_NOT_AVAILABLE");
            return;
        }

        Optional<User> existingUserOpt = userRepository.findByEmail(email);

        if ("register".equals(mode)) {
            if (existingUserOpt.isPresent()) {
                clearOAuthSession(session);
                response.sendRedirect(FRONTEND_BASE_URL + "/login?tab=login&error=EMAIL_ALREADY_EXISTS");
                return;
            }

            session.setAttribute("OAUTH_PENDING_EMAIL", email);
            session.setAttribute("OAUTH_PENDING_FULL_NAME", fullName);
            session.setAttribute("OAUTH_PENDING_GIVEN_NAME", givenName);
            session.setAttribute("OAUTH_PENDING_FAMILY_NAME", familyName);
            session.setAttribute("OAUTH_PENDING_PROVIDER", "google");
            session.setAttribute("OAUTH_PENDING_PROVIDER_USER_ID", googleId);
            session.setAttribute("OAUTH_PENDING_PICTURE_URL", pictureUrl);

            response.sendRedirect(FRONTEND_BASE_URL + "/register/complete");
            return;
        }

        if ("login".equals(mode)) {
            if (existingUserOpt.isEmpty()) {
                clearOAuthSession(session);
                response.sendRedirect(FRONTEND_BASE_URL + "/login?tab=login&error=USER_NOT_FOUND");
                return;
            }

            User user = existingUserOpt.get();

            user.setFullName(fullName != null && !fullName.isBlank() ? fullName : user.getFullName());
            user.setGivenName(givenName);
            user.setFamilyName(familyName);
            user.setGoogleId(googleId);
            user.setPictureUrl(pictureUrl);

            userRepository.save(user);

            clearOAuthSession(session);
            response.sendRedirect(FRONTEND_BASE_URL + "/auth/callback");
            return;
        }

        if (existingUserOpt.isPresent()) {
            User user = existingUserOpt.get();

            user.setFullName(fullName != null && !fullName.isBlank() ? fullName : user.getFullName());
            user.setGivenName(givenName);
            user.setFamilyName(familyName);
            user.setGoogleId(googleId);
            user.setPictureUrl(pictureUrl);

            userRepository.save(user);

            clearOAuthSession(session);
            response.sendRedirect(FRONTEND_BASE_URL + "/auth/callback");
        } else {
            session.setAttribute("OAUTH_PENDING_EMAIL", email);
            session.setAttribute("OAUTH_PENDING_FULL_NAME", fullName);
            session.setAttribute("OAUTH_PENDING_GIVEN_NAME", givenName);
            session.setAttribute("OAUTH_PENDING_FAMILY_NAME", familyName);
            session.setAttribute("OAUTH_PENDING_PROVIDER", "google");
            session.setAttribute("OAUTH_PENDING_PROVIDER_USER_ID", googleId);
            session.setAttribute("OAUTH_PENDING_PICTURE_URL", pictureUrl);

            response.sendRedirect(FRONTEND_BASE_URL + "/register/complete");
        }
    }

    private void clearOAuthSession(HttpSession session) {
        session.removeAttribute("OAUTH_MODE");
        session.removeAttribute("OAUTH_PENDING_EMAIL");
        session.removeAttribute("OAUTH_PENDING_FULL_NAME");
        session.removeAttribute("OAUTH_PENDING_GIVEN_NAME");
        session.removeAttribute("OAUTH_PENDING_FAMILY_NAME");
        session.removeAttribute("OAUTH_PENDING_PROVIDER");
        session.removeAttribute("OAUTH_PENDING_PROVIDER_USER_ID");
        session.removeAttribute("OAUTH_PENDING_PICTURE_URL");
    }
}