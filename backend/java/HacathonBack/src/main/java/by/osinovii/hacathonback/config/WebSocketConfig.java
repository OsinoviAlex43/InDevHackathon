package by.osinovii.hacathonback.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.converter.MessageConverter;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Префикс для топиков, на которые будут подписываться клиенты
        config.enableSimpleBroker("/topic", "/queue");
        
        // Префиксы для маршрутизации сообщений к контроллерам
        config.setApplicationDestinationPrefixes("/app");
        
        // Маршрутизация персональных сообщений
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Основной эндпоинт для подключения WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
                
        // Дополнительный эндпоинт для гостей отеля
        registry.addEndpoint("/guest-ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
    
    @Override
    public boolean configureMessageConverters(List<MessageConverter> messageConverters) {
        // Добавляем конвертер для поддержки нового формата сообщений
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        messageConverters.add(converter);
        return false;
    }
}

