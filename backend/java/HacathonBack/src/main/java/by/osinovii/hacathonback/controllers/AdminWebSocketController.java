package by.osinovii.hacathonback.controllers;

import by.osinovii.hacathonback.entities.Guest;
import by.osinovii.hacathonback.entities.Room;
import by.osinovii.hacathonback.services.AdminService;
import by.osinovii.hacathonback.services.GuestService;
import by.osinovii.hacathonback.services.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * WebSocket контроллер для администраторов отеля.
 * Администраторы имеют полный доступ ко всем данным и функциям управления отелем.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class AdminWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;
    private final GuestService guestService;
    private final AdminService adminService;

    /**
     * Получение списка всех комнат
     */
    @MessageMapping("/admin/rooms")
    @SendTo("/topic/admin/rooms")
    public List<Room> getAllRooms() {
        log.info("Администратор запрашивает список всех комнат");
        return roomService.getAllRooms();
    }

    /**
     * Получение списка всех гостей
     */
    @MessageMapping("/admin/guests")
    @SendTo("/topic/admin/guests")
    public List<Guest> getAllGuests() {
        log.info("Администратор запрашивает список всех гостей");
        return guestService.getAllGuests();
    }

    /**
     * Получение статистики отеля
     */
    @MessageMapping("/admin/stats")
    @SendTo("/topic/admin/stats")
    public Map<String, Object> getHotelStats() {
        log.info("Администратор запрашивает статистику отеля");
        return adminService.getHotelStats();
    }

    /**
     * Получение списка комнат по статусу
     */
    @MessageMapping("/admin/rooms/by-status")
    @SendTo("/topic/admin/rooms-by-status")
    public List<Room> getRoomsByStatus(@Payload Map<String, Object> payload) {
        try {
            String status = (String) payload.get("status");
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            
            log.info("Администратор запрашивает комнаты со статусом: {}", status);
            
            List<Room> filteredRooms = roomService.getRoomsByStatus(status);
            
            return filteredRooms;
        } catch (Exception e) {
            log.error("Ошибка при получении комнат по статусу", e);
            handleError(payload, "Ошибка при получении комнат по статусу: " + e.getMessage());
        }
    }

    /**
     * Изменение статуса комнаты
     */
    @MessageMapping("/admin/room/update-status")
    public void updateRoomStatus(@Payload Map<String, Object> payload) {
        try {
            Long roomId = ((Number) payload.get("roomId")).longValue();
            String newStatus = (String) payload.get("status");
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            
            log.info("Администратор изменяет статус комнаты с ID {}: новый статус - {}", roomId, newStatus);
            
            Room updatedRoom = roomService.updateRoomStatus(roomId, newStatus);
            
            // Отправка уведомления всем администраторам
            messagingTemplate.convertAndSend("/topic/admin/room-updated", updatedRoom);
            
            // Отправка подтверждения запрашивающему администратору
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Статус комнаты " + updatedRoom.getRoomNumber() + " успешно обновлен");
            response.put("room", updatedRoom);
            
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/admin/room-update-result",
                    response
            );
        } catch (Exception e) {
            log.error("Ошибка при обновлении статуса комнаты", e);
            handleError(payload, "Ошибка при обновлении статуса комнаты: " + e.getMessage());
        }
    }

    /**
     * Изменение цены комнаты
     */
    @MessageMapping("/admin/room/update-price")
    public void updateRoomPrice(@Payload Map<String, Object> payload) {
        try {
            Long roomId = ((Number) payload.get("roomId")).longValue();
            BigDecimal newPrice = new BigDecimal(payload.get("price").toString());
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            
            log.info("Администратор изменяет цену комнаты с ID {}: новая цена - {}", roomId, newPrice);
            
            Room updatedRoom = roomService.updateRoomPrice(roomId, newPrice);
            
            // Отправка уведомления всем администраторам
            messagingTemplate.convertAndSend("/topic/admin/room-price-updated", updatedRoom);
            
            // Отправка подтверждения запрашивающему администратору
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Цена комнаты " + updatedRoom.getRoomNumber() + " успешно обновлена");
            response.put("room", updatedRoom);
            
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/admin/room-update-result",
                    response
            );
        } catch (Exception e) {
            log.error("Ошибка при обновлении цены комнаты", e);
            handleError(payload, "Ошибка при обновлении цены комнаты: " + e.getMessage());
        }
    }

    /**
     * Заселение нового гостя администратором
     */
    @MessageMapping("/admin/guest/check-in")
    public void checkInGuest(@Payload Map<String, Object> payload) {
        try {
            // Извлечение данных о госте
            String firstName = (String) payload.get("firstName");
            String lastName = (String) payload.get("lastName");
            String email = (String) payload.get("email");
            String phone = (String) payload.get("phone");
            String roomNumber = (String) payload.get("roomNumber");
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            
            log.info("Администратор заселяет нового гостя {} {} в комнату {}", firstName, lastName, roomNumber);
            
            // Дата выезда
            LocalDate checkOutDate = payload.containsKey("checkOutDate") 
                    ? LocalDate.parse((String) payload.get("checkOutDate")) 
                    : null;
            
            // Вызов сервиса для заселения гостя
            Guest savedGuest = guestService.checkInGuest(firstName, lastName, email, phone, roomNumber, checkOutDate);
            
            // Отправка уведомления всем администраторам
            messagingTemplate.convertAndSend("/topic/admin/guest-checked-in", savedGuest);
            
            // Отправка подтверждения запрашивающему администратору
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Гость " + firstName + " " + lastName + " успешно заселен в комнату " + roomNumber);
            response.put("guest", savedGuest);
            response.put("room", savedGuest.getRoom());
            
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/admin/check-in-result",
                    response
            );
        } catch (Exception e) {
            log.error("Ошибка при заселении гостя администратором", e);
            handleError(payload, "Ошибка при заселении гостя: " + e.getMessage());
        }
    }

    /**
     * Выселение гостя администратором
     */
    @MessageMapping("/admin/guest/check-out")
    public void checkOutGuest(@Payload Map<String, Object> payload) {
        try {
            Long guestId = ((Number) payload.get("guestId")).longValue();
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            
            log.info("Администратор выселяет гостя с ID {}", guestId);
            
            // Вызов сервиса для выселения гостя
            Map<String, Object> checkoutInfo = guestService.checkOutGuest(guestId);
            
            // Отправка уведомления всем администраторам
            messagingTemplate.convertAndSend("/topic/admin/guest-checked-out", checkoutInfo);
            
            // Отправка подтверждения запрашивающему администратору
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Гость " + checkoutInfo.get("guestName") + " успешно выселен из комнаты " + checkoutInfo.get("roomNumber"));
            response.put("checkoutInfo", checkoutInfo);
            
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/admin/check-out-result",
                    response
            );
        } catch (Exception e) {
            log.error("Ошибка при выселении гостя администратором", e);
            handleError(payload, "Ошибка при выселении гостя: " + e.getMessage());
        }
    }

    /**
     * Обработка запросов гостей на продление проживания
     */
    @MessageMapping("/admin/approve-extend-stay")
    public void approveExtendStay(@Payload Map<String, Object> payload) {
        try {
            Long guestId = ((Number) payload.get("guestId")).longValue();
            LocalDate newCheckOutDate = LocalDate.parse((String) payload.get("newCheckOutDate"));
            boolean approved = (boolean) payload.get("approved");
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            String adminComment = (String) payload.getOrDefault("comment", "");
            
            log.info("Администратор {} запрос на продление проживания гостя с ID {} до {}", 
                    approved ? "одобряет" : "отклоняет", guestId, newCheckOutDate);
            
            // Обработка запроса через сервис
            Map<String, Object> result = adminService.processExtendStayRequest(guestId, newCheckOutDate, approved, adminComment);
            
            // Отправка уведомлений администраторам
            String notificationTopic = approved ? 
                    "/topic/admin/guest-stay-extended" : 
                    "/topic/admin/guest-stay-extension-rejected";
            
            messagingTemplate.convertAndSend(notificationTopic, result);
            
            // Отправка подтверждения запрашивающему администратору
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/admin/extend-stay-result",
                    result
            );
            
            // Отправка уведомления гостю (если гость онлайн)
            Map<String, Object> guestNotification = new HashMap<>();
            guestNotification.put("success", approved);
            guestNotification.put("message", approved ? 
                    "Ваш запрос на продление проживания одобрен" : 
                    "Ваш запрос на продление проживания отклонен");
            
            if (approved) {
                guestNotification.put("newCheckOutDate", newCheckOutDate.toString());
                guestNotification.put("roomNumber", result.get("roomNumber"));
            } else {
                guestNotification.put("reason", adminComment);
            }
            
            messagingTemplate.convertAndSendToUser(
                    "guest-" + guestId,
                    "/queue/extend-stay-response",
                    guestNotification
            );
        } catch (Exception e) {
            log.error("Ошибка при обработке запроса на продление проживания", e);
            handleError(payload, "Ошибка при обработке запроса на продление проживания: " + e.getMessage());
        }
    }

    /**
     * Получение всех запросов на продление проживания
     */
    @MessageMapping("/admin/extend-stay-requests")
    @SendTo("/topic/admin/extend-stay-requests")
    public List<Map<String, Object>> getExtendStayRequests() {
        log.info("Администратор запрашивает список запросов на продление проживания");
        return adminService.getExtendStayRequests();
    }

    /**
     * Поиск гостей по фамилии
     */
    @MessageMapping("/admin/guests/search")
    public void searchGuests(@Payload Map<String, Object> payload) {
        try {
            String searchTerm = (String) payload.get("searchTerm");
            String searchField = (String) payload.getOrDefault("searchField", "lastName");
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            
            log.info("Администратор ищет гостей по полю {}: {}", searchField, searchTerm);
            
            List<Guest> results = guestService.searchGuests(searchTerm, searchField);
            
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/admin/guest-search-results",
                    results
            );
        } catch (Exception e) {
            log.error("Ошибка при поиске гостей", e);
            handleError(payload, "Ошибка при поиске гостей: " + e.getMessage());
        }
    }

    /**
     * Общие методы обработки ошибок
     */
    private void handleError(Map<String, Object> payload, String errorMessage) {
        String requesterId = payload.getOrDefault("requesterId", "0").toString();
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("message", errorMessage);
        
        messagingTemplate.convertAndSendToUser(
                requesterId,
                "/queue/admin/error",
                errorResponse
        );
    }
} 