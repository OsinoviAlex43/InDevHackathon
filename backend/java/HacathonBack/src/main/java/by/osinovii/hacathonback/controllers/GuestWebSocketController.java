package by.osinovii.hacathonback.controllers;

import by.osinovii.hacathonback.entities.Guest;
import by.osinovii.hacathonback.entities.Room;
import by.osinovii.hacathonback.services.GuestService;
import by.osinovii.hacathonback.services.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * WebSocket контроллер для гостей отеля с ограниченным доступом.
 * Гости могут получать информацию только о своей комнате и управлять простыми действиями
 * вроде открытия/закрытия двери.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class GuestWebSocketController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final GuestService guestService;
    private final RoomService roomService;
    
    /**
     * Получение информации о своей комнате
     * Гостю нужно предоставить свой ID и он получит данные только о своей комнате
     */
    @MessageMapping("/guest/my-room")
    public void getMyRoom(@Payload Map<String, Object> payload) {
        try {
            Long guestId = ((Number) payload.get("guestId")).longValue();
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            
            log.info("Гость с ID {} запрашивает информацию о своей комнате", guestId);
            
            Optional<Guest> guestOpt = guestService.findGuestById(guestId);
            if (guestOpt.isPresent()) {
                Guest guest = guestOpt.get();
                Room room = guest.getRoom();
                
                Map<String, Object> response = new HashMap<>();
                response.put("roomNumber", room.getRoomNumber());
                response.put("roomType", room.getRoomType());
                response.put("pricePerNight", room.getPricePerNight());
                response.put("checkInDate", guest.getCheckInDate());
                response.put("checkOutDate", guest.getCheckOutDate());
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/my-room",
                        response
                );
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Гость с ID " + guestId + " не найден");
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/error",
                        errorResponse
                );
            }
        } catch (Exception e) {
            log.error("Ошибка при получении информации о комнате гостя", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Ошибка при получении информации о комнате: " + e.getMessage());
            
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/error",
                    errorResponse
            );
        }
    }
    
    /**
     * Получение информации о госте
     * Гость может получить только свою информацию
     */
    @MessageMapping("/guest/my-info")
    public void getMyInfo(@Payload Map<String, Object> payload) {
        try {
            Long guestId = ((Number) payload.get("guestId")).longValue();
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            
            log.info("Гость с ID {} запрашивает свою информацию", guestId);
            
            Optional<Guest> guestOpt = guestService.findGuestById(guestId);
            if (guestOpt.isPresent()) {
                Guest guest = guestOpt.get();
                
                Map<String, Object> response = new HashMap<>();
                response.put("id", guest.getId());
                response.put("firstName", guest.getFirstName());
                response.put("lastName", guest.getLastName());
                response.put("email", guest.getEmail());
                response.put("phone", guest.getPhone());
                response.put("roomNumber", guest.getRoom().getRoomNumber());
                response.put("checkInDate", guest.getCheckInDate());
                response.put("checkOutDate", guest.getCheckOutDate());
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/my-info",
                        response
                );
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Гость с ID " + guestId + " не найден");
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/error",
                        errorResponse
                );
            }
        } catch (Exception e) {
            log.error("Ошибка при получении информации о госте", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Ошибка при получении информации: " + e.getMessage());
            
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/error",
                    errorResponse
            );
        }
    }
    
    /**
     * Открытие двери комнаты (симуляция)
     */
    @MessageMapping("/guest/door/open")
    public void openDoor(@Payload Map<String, Object> payload) {
        try {
            Long guestId = ((Number) payload.get("guestId")).longValue();
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            
            log.info("Гость с ID {} запрашивает открытие двери", guestId);
            
            Optional<Guest> guestOpt = guestService.findGuestById(guestId);
            if (guestOpt.isPresent()) {
                Guest guest = guestOpt.get();
                Room room = guest.getRoom();
                
                // Здесь была бы реальная логика открытия двери
                // Это заглушка с успешным ответом
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Дверь комнаты " + room.getRoomNumber() + " успешно открыта");
                response.put("doorStatus", "OPEN");
                response.put("timestamp", java.time.LocalDateTime.now().toString());
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/door-status",
                        response
                );
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Доступ запрещен: гость с ID " + guestId + " не найден");
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/error",
                        errorResponse
                );
            }
        } catch (Exception e) {
            log.error("Ошибка при открытии двери", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Ошибка при открытии двери: " + e.getMessage());
            
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/error",
                    errorResponse
            );
        }
    }
    
    /**
     * Закрытие двери комнаты (симуляция)
     */
    @MessageMapping("/guest/door/close")
    public void closeDoor(@Payload Map<String, Object> payload) {
        try {
            Long guestId = ((Number) payload.get("guestId")).longValue();
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            
            log.info("Гость с ID {} запрашивает закрытие двери", guestId);
            
            Optional<Guest> guestOpt = guestService.findGuestById(guestId);
            if (guestOpt.isPresent()) {
                Guest guest = guestOpt.get();
                Room room = guest.getRoom();
                
                // Здесь была бы реальная логика закрытия двери
                // Это заглушка с успешным ответом
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Дверь комнаты " + room.getRoomNumber() + " успешно закрыта");
                response.put("doorStatus", "CLOSED");
                response.put("timestamp", java.time.LocalDateTime.now().toString());
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/door-status",
                        response
                );
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Доступ запрещен: гость с ID " + guestId + " не найден");
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/error",
                        errorResponse
                );
            }
        } catch (Exception e) {
            log.error("Ошибка при закрытии двери", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Ошибка при закрытии двери: " + e.getMessage());
            
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/error",
                    errorResponse
            );
        }
    }
    
    /**
     * Запрос на продление проживания от гостя
     */
    @MessageMapping("/guest/request-extend-stay")
    public void requestExtendStay(@Payload Map<String, Object> payload) {
        try {
            Long guestId = ((Number) payload.get("guestId")).longValue();
            LocalDate newCheckOutDate = LocalDate.parse((String) payload.get("newCheckOutDate"));
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            
            log.info("Гость с ID {} запрашивает продление проживания до {}", guestId, newCheckOutDate);
            
            Optional<Guest> guestOpt = guestService.findGuestById(guestId);
            if (guestOpt.isPresent()) {
                Guest guest = guestOpt.get();
                
                // Проверка, что новая дата выезда позже текущей
                if (newCheckOutDate.isBefore(guest.getCheckOutDate()) || newCheckOutDate.isBefore(LocalDate.now())) {
                    throw new RuntimeException("Новая дата выезда должна быть позже текущей даты выезда и сегодняшнего дня");
                }
                
                // В реальном приложении здесь был бы запрос администратору на подтверждение
                // Отправка запроса администраторам
                Map<String, Object> extendRequest = new HashMap<>();
                extendRequest.put("guestId", guestId);
                extendRequest.put("guestName", guest.getFirstName() + " " + guest.getLastName());
                extendRequest.put("roomNumber", guest.getRoom().getRoomNumber());
                extendRequest.put("currentCheckOutDate", guest.getCheckOutDate());
                extendRequest.put("requestedCheckOutDate", newCheckOutDate);
                
                messagingTemplate.convertAndSend(
                        "/topic/admin/extend-stay-requests",
                        extendRequest
                );
                
                // Отправка подтверждения запрашивающему гостю
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Запрос на продление проживания успешно отправлен администрации");
                response.put("requestId", "REQ-" + System.currentTimeMillis()); // В реальной системе тут был бы нормальный ID запроса
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/extend-stay-request",
                        response
                );
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Гость с ID " + guestId + " не найден");
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/error",
                        errorResponse
                );
            }
        } catch (Exception e) {
            log.error("Ошибка при запросе продления проживания", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Ошибка при запросе продления проживания: " + e.getMessage());
            
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/error",
                    errorResponse
            );
        }
    }
    
    /**
     * Получение статуса климатической системы в комнате (заглушка)
     */
    @MessageMapping("/guest/climate")
    public void getClimateStatus(@Payload Map<String, Object> payload) {
        try {
            Long guestId = ((Number) payload.get("guestId")).longValue();
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            
            log.info("Гость с ID {} запрашивает статус климатической системы", guestId);
            
            Optional<Guest> guestOpt = guestService.findGuestById(guestId);
            if (guestOpt.isPresent()) {
                // Симуляция статуса климатической системы
                Map<String, Object> climateStatus = new HashMap<>();
                climateStatus.put("temperature", 22.5);
                climateStatus.put("humidity", 45);
                climateStatus.put("mode", "AUTO");
                climateStatus.put("isOn", true);
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/climate-status",
                        climateStatus
                );
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Гость с ID " + guestId + " не найден");
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/error",
                        errorResponse
                );
            }
        } catch (Exception e) {
            log.error("Ошибка при получении статуса климатической системы", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Ошибка при получении статуса климатической системы: " + e.getMessage());
            
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/error",
                    errorResponse
            );
        }
    }
    
    /**
     * Установка температуры в комнате (заглушка)
     */
    @MessageMapping("/guest/climate/set-temperature")
    public void setTemperature(@Payload Map<String, Object> payload) {
        try {
            Long guestId = ((Number) payload.get("guestId")).longValue();
            double temperature = ((Number) payload.get("temperature")).doubleValue();
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            
            log.info("Гость с ID {} устанавливает температуру {}°C", guestId, temperature);
            
            Optional<Guest> guestOpt = guestService.findGuestById(guestId);
            if (guestOpt.isPresent()) {
                Guest guest = guestOpt.get();
                
                // Симуляция установки температуры
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Температура в комнате " + guest.getRoom().getRoomNumber() + " установлена на " + temperature + "°C");
                response.put("temperature", temperature);
                response.put("timestamp", java.time.LocalDateTime.now().toString());
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/climate-update",
                        response
                );
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Гость с ID " + guestId + " не найден");
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/error",
                        errorResponse
                );
            }
        } catch (Exception e) {
            log.error("Ошибка при установке температуры", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Ошибка при установке температуры: " + e.getMessage());
            
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/error",
                    errorResponse
            );
        }
    }
} 