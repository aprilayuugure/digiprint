package com.spring.digiprint.configurations;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {
    private final AuthenticationProvider authProvider;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfiguration(AuthenticationProvider authProvider,
                                 JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.authProvider = authProvider;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/works").hasAnyRole("ARTIST", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/works/*").hasAnyRole("ARTIST", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/works/*").hasAnyRole("ARTIST", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/likes/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/likes/*").authenticated()
                        .requestMatchers(HttpMethod.POST, "/follows/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/follows/*").authenticated()
                        .requestMatchers(HttpMethod.GET, "/follows/me/following").authenticated()
                        .requestMatchers(HttpMethod.GET, "/favorites/status").permitAll()
                        .requestMatchers(HttpMethod.GET, "/favorites/list").authenticated()
                        .requestMatchers(HttpMethod.POST, "/favorites/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/favorites/*").authenticated()
                        .requestMatchers(HttpMethod.GET, "/me/artist-application").authenticated()
                        .requestMatchers(HttpMethod.POST, "/me/apply-artist").authenticated()
                        .requestMatchers(HttpMethod.GET, "/me/dashboard").hasRole("ARTIST")
                        .requestMatchers(HttpMethod.GET, "/me/admin/dashboard").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/me/admin/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/orders/search").authenticated()
                        .requestMatchers(HttpMethod.GET, "/orders/*").authenticated()
                        .requestMatchers(HttpMethod.POST, "/orders").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/orders/draft/*").authenticated()
                        .requestMatchers(HttpMethod.POST, "/orders/attachments").authenticated()
                        .requestMatchers(HttpMethod.POST, "/orders/items/*/completed-deliverables/upload")
                                .hasAnyRole("ARTIST", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/orders/items/*/completed-deliverables")
                                .hasAnyRole("ARTIST", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/orders/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/comments").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/comments/*").authenticated()
                        .requestMatchers(HttpMethod.POST, "/tags").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/tags/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/tags/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/tags/merge").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/commissions").hasAnyRole("ARTIST", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/commissions/*/attachments").hasAnyRole("ARTIST", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/commissions/*").hasAnyRole("ARTIST", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/commissions/*").hasAnyRole("ARTIST", "ADMIN")
                        .anyRequest().permitAll()
                )
                .headers(headers ->
                        headers.frameOptions(frame -> frame.disable())
                )
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authProvider)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
        // Cho phép thêm header Range để video/audio/PDF load qua CORS
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Range"));
        config.setExposedHeaders(List.of("Content-Range"));

        UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();

        s.registerCorsConfiguration("/**", config);

        return (CorsConfigurationSource) s;
    }
}
