package by.osinovii.hacathonback.controllers;

import by.osinovii.hacathonback.entities.Guest;
import by.osinovii.hacathonback.entities.Room;
import by.osinovii.hacathonback.services.GuestService;
import by.osinovii.hacathonback.services.HotelService;
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
    private final HotelService hotelService;
    
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
            handleError(payload, "Ошибка при получении информации о комнате: " + e.getMessage());
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
            handleError(payload, "Ошибка при получении информации: " + e.getMessage());
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
                
                // Вызов сервиса для симуляции открытия двери
                Map<String, Object> response = hotelService.simulateDoorOpen(guestId, room.getRoomNumber());
                
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
            handleError(payload, "Ошибка при открытии двери: " + e.getMessage());
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
                
                // Вызов сервиса для симуляции закрытия двери
                Map<String, Object> response = hotelService.simulateDoorClose(guestId, room.getRoomNumber());
                
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
            handleError(payload, "Ошибка при закрытии двери: " + e.getMessage());
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
                
                // Создание запроса через сервис
                Map<String, Object> response = hotelService.createExtendStayRequest(guestId, requesterId);
                
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
            handleError(payload, "Ошибка при запросе продления проживания: " + e.getMessage());
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
                Guest guest = guestOpt.get();
                String roomNumber = guest.getRoom().getRoomNumber();
                
                // Получение статуса через сервис
                Map<String, Object> climateStatus = hotelService.getClimateStatus(guestId, roomNumber);
                
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
            handleError(payload, "Ошибка при получении статуса климатической системы: " + e.getMessage());
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
                String roomNumber = guest.getRoom().getRoomNumber();
                
                // Установка температуры через сервис
                Map<String, Object> response = hotelService.setTemperature(guestId, roomNumber, temperature);
                
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
            handleError(payload, "Ошибка при установке температуры: " + e.getMessage());
        }
    }
    
    /**
     * Общий метод обработки ошибок
     */
    private void handleError(Map<String, Object> payload, String errorMessage) {
        String requesterId = payload.getOrDefault("requesterId", "0").toString();
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("message", errorMessage);
        
        messagingTemplate.convertAndSendToUser(
                requesterId,
                "/queue/error",
                errorResponse
        );
    }
} 