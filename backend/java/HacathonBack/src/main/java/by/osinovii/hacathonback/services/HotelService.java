package by.osinovii.hacathonback.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Сервис для управления симуляцией IoT-устройств и другими функциями отеля
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HotelService {
    
    private final GuestService guestService;
    private final RoomService roomService;
    
    /**
     * Симуляция открытия двери
     */
    public Map<String, Object> simulateDoorOpen(Long guestId, String roomNumber) {
        log.info("Симуляция открытия двери для гостя с ID {} в комнате {}", guestId, roomNumber);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Дверь комнаты " + roomNumber + " успешно открыта");
        response.put("doorStatus", "OPEN");
        response.put("timestamp", LocalDateTime.now().toString());
        
        return response;
    }
    
    /**
     * Симуляция закрытия двери
     */
    public Map<String, Object> simulateDoorClose(Long guestId, String roomNumber) {
        log.info("Симуляция закрытия двери для гостя с ID {} в комнате {}", guestId, roomNumber);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Дверь комнаты " + roomNumber + " успешно закрыта");
        response.put("doorStatus", "CLOSED");
        response.put("timestamp", LocalDateTime.now().toString());
        
        return response;
    }
    
    /**
     * Получение статуса климатической системы (симуляция)
     */
    public Map<String, Object> getClimateStatus(Long guestId, String roomNumber) {
        log.info("Запрос статуса климатической системы для гостя с ID {} в комнате {}", guestId, roomNumber);
        
        Map<String, Object> climateStatus = new HashMap<>();
        climateStatus.put("temperature", 22.5);
        climateStatus.put("humidity", 45);
        climateStatus.put("mode", "AUTO");
        climateStatus.put("isOn", true);
        
        return climateStatus;
    }
    
    /**
     * Установка температуры в комнате (симуляция)
     */
    public Map<String, Object> setTemperature(Long guestId, String roomNumber, double temperature) {
        log.info("Установка температуры {}°C для гостя с ID {} в комнате {}", temperature, guestId, roomNumber);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Температура в комнате " + roomNumber + " установлена на " + temperature + "°C");
        response.put("temperature", temperature);
        response.put("timestamp", LocalDateTime.now().toString());
        
        return response;
    }
    
    /**
     * Создание запроса на продление проживания
     */
    public Map<String, Object> createExtendStayRequest(Long guestId, String requesterId) {
        log.info("Создание запроса на продление проживания для гостя с ID {}", guestId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Запрос на продление проживания успешно отправлен администрации");
        response.put("requestId", "REQ-" + System.currentTimeMillis());
        
        return response;
    }
} 