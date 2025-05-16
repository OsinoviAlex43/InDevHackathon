package by.osinovii.hacathonback.controllers;

import by.osinovii.hacathonback.entities.Guest;
import by.osinovii.hacathonback.entities.Room;
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
import java.util.stream.Collectors;

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
        List<Guest> guests = guestService.getAllGuests();
        List<Room> rooms = roomService.getAllRooms();
        
        long availableRooms = rooms.stream()
                .filter(room -> "AVAILABLE".equals(room.getStatus()))
                .count();
        long occupiedRooms = rooms.stream()
                .filter(room -> "OCCUPIED".equals(room.getStatus()))
                .count();
        long maintenanceRooms = rooms.stream()
                .filter(room -> "MAINTENANCE".equals(room.getStatus()))
                .count();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalGuests", guests.size());
        stats.put("totalRooms", rooms.size());
        stats.put("availableRooms", availableRooms);
        stats.put("occupiedRooms", occupiedRooms);
        stats.put("maintenanceRooms", maintenanceRooms);
        stats.put("occupancyRate", 
                rooms.isEmpty() ? 0 : 
                    (double) occupiedRooms / rooms.size() * 100);
        
        // Дополнительная статистика для администраторов
        stats.put("averageStayDuration", calculateAverageStay(guests));
        stats.put("guestsCheckingOutToday", countGuestsCheckingOutToday(guests));
        stats.put("guestsCheckedInToday", countGuestsCheckedInToday(guests));
        stats.put("totalRevenue", calculateTotalRevenue(guests));
        
        return stats;
    }

    /**
     * Получение списка комнат по статусу
     */
    @MessageMapping("/admin/rooms/by-status")
    public void getRoomsByStatus(@Payload Map<String, Object> payload) {
        try {
            String status = (String) payload.get("status");
            String requesterId = payload.getOrDefault("requesterId", "0").toString();
            
            log.info("Администратор запрашивает комнаты со статусом: {}", status);
            
            List<Room> filteredRooms = roomService.getAllRooms()
                    .stream()
                    .filter(room -> room.getStatus().equals(status))
                    .collect(Collectors.toList());
            
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/rooms-by-status",
                    filteredRooms
            );
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
            
            // Поиск комнаты
            Optional<Room> roomOpt = findRoomById(roomId);
            if (roomOpt.isPresent()) {
                Room room = roomOpt.get();
                
                // Обновление статуса
                room.setStatus(newStatus);
                Room updatedRoom = roomService.saveRoom(room);
                
                // Отправка уведомления всем администраторам
                messagingTemplate.convertAndSend("/topic/admin/room-updated", updatedRoom);
                
                // Отправка подтверждения запрашивающему администратору
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Статус комнаты " + room.getRoomNumber() + " успешно обновлен");
                response.put("room", updatedRoom);
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/admin/room-update-result",
                        response
                );
            } else {
                throw new RuntimeException("Комната с ID " + roomId + " не найдена");
            }
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
            
            // Поиск комнаты
            Optional<Room> roomOpt = findRoomById(roomId);
            if (roomOpt.isPresent()) {
                Room room = roomOpt.get();
                
                // Обновление цены
                room.setPricePerNight(newPrice);
                Room updatedRoom = roomService.saveRoom(room);
                
                // Отправка уведомления всем администраторам
                messagingTemplate.convertAndSend("/topic/admin/room-price-updated", updatedRoom);
                
                // Отправка подтверждения запрашивающему администратору
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Цена комнаты " + room.getRoomNumber() + " успешно обновлена");
                response.put("room", updatedRoom);
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/admin/room-update-result",
                        response
                );
            } else {
                throw new RuntimeException("Комната с ID " + roomId + " не найдена");
            }
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
            
            // Поиск комнаты
            Optional<Room> roomOpt = roomService.getAllRooms()
                    .stream()
                    .filter(r -> r.getRoomNumber().equals(roomNumber))
                    .findFirst();
            
            if (roomOpt.isEmpty()) {
                throw new RuntimeException("Комната с номером " + roomNumber + " не найдена");
            }
            
            Room room = roomOpt.get();
            
            // Проверка доступности комнаты
            if (!"AVAILABLE".equals(room.getStatus())) {
                throw new RuntimeException("Комната " + roomNumber + " недоступна для заселения (текущий статус: " + room.getStatus() + ")");
            }
            
            // Создание нового гостя
            Guest newGuest = new Guest();
            newGuest.setFirstName(firstName);
            newGuest.setLastName(lastName);
            newGuest.setEmail(email);
            newGuest.setPhone(phone);
            newGuest.setRoom(room);
            newGuest.setCheckInDate(LocalDate.now());
            
            // Дата выезда
            LocalDate checkOutDate = payload.containsKey("checkOutDate") 
                    ? LocalDate.parse((String) payload.get("checkOutDate")) 
                    : LocalDate.now().plusDays(3);
            newGuest.setCheckOutDate(checkOutDate);
            
            // Сохранение гостя
            Guest savedGuest = guestService.saveGuest(newGuest);
            
            // Обновление статуса комнаты
            room.setStatus("OCCUPIED");
            roomService.saveRoom(room);
            
            // Отправка уведомления всем администраторам
            messagingTemplate.convertAndSend("/topic/admin/guest-checked-in", savedGuest);
            
            // Отправка подтверждения запрашивающему администратору
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Гость " + firstName + " " + lastName + " успешно заселен в комнату " + roomNumber);
            response.put("guest", savedGuest);
            response.put("room", room);
            
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
            
            // Поиск гостя
            Optional<Guest> guestOpt = guestService.findGuestById(guestId);
            if (guestOpt.isEmpty()) {
                throw new RuntimeException("Гость с ID " + guestId + " не найден");
            }
            
            Guest guest = guestOpt.get();
            Room room = guest.getRoom();
            
            // Обновление даты выселения
            guest.setCheckOutDate(LocalDate.now());
            guestService.saveGuest(guest);
            
            // Обновление статуса комнаты
            room.setStatus("AVAILABLE");
            roomService.saveRoom(room);
            
            // Отправка уведомления всем администраторам
            Map<String, Object> checkoutInfo = new HashMap<>();
            checkoutInfo.put("guestId", guestId);
            checkoutInfo.put("guestName", guest.getFirstName() + " " + guest.getLastName());
            checkoutInfo.put("roomId", room.getId());
            checkoutInfo.put("roomNumber", room.getRoomNumber());
            checkoutInfo.put("checkOutDate", LocalDate.now().toString());
            
            messagingTemplate.convertAndSend("/topic/admin/guest-checked-out", checkoutInfo);
            
            // Отправка подтверждения запрашивающему администратору
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Гость " + guest.getFirstName() + " " + guest.getLastName() + " успешно выселен из комнаты " + room.getRoomNumber());
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
            
            // Поиск гостя
            Optional<Guest> guestOpt = guestService.findGuestById(guestId);
            if (guestOpt.isEmpty()) {
                throw new RuntimeException("Гость с ID " + guestId + " не найден");
            }
            
            Guest guest = guestOpt.get();
            
            if (approved) {
                // Обновление даты выезда
                guest.setCheckOutDate(newCheckOutDate);
                Guest updatedGuest = guestService.saveGuest(guest);
                
                // Отправка уведомления всем администраторам
                Map<String, Object> adminNotification = new HashMap<>();
                adminNotification.put("guestId", guestId);
                adminNotification.put("guestName", guest.getFirstName() + " " + guest.getLastName());
                adminNotification.put("roomNumber", guest.getRoom().getRoomNumber());
                adminNotification.put("newCheckOutDate", newCheckOutDate);
                adminNotification.put("approvedBy", requesterId);
                
                messagingTemplate.convertAndSend("/topic/admin/guest-stay-extended", adminNotification);
                
                // Отправка подтверждения запрашивающему администратору
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Запрос на продление проживания одобрен");
                response.put("guest", updatedGuest);
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/admin/extend-stay-result",
                        response
                );
                
                // Отправка уведомления гостю (если гость онлайн)
                Map<String, Object> guestNotification = new HashMap<>();
                guestNotification.put("success", true);
                guestNotification.put("message", "Ваш запрос на продление проживания одобрен");
                guestNotification.put("newCheckOutDate", newCheckOutDate.toString());
                guestNotification.put("roomNumber", guest.getRoom().getRoomNumber());
                
                messagingTemplate.convertAndSendToUser(
                        "guest-" + guestId,
                        "/queue/extend-stay-response",
                        guestNotification
                );
            } else {
                // Запрос отклонен
                // Отправка уведомления всем администраторам
                Map<String, Object> adminNotification = new HashMap<>();
                adminNotification.put("guestId", guestId);
                adminNotification.put("guestName", guest.getFirstName() + " " + guest.getLastName());
                adminNotification.put("roomNumber", guest.getRoom().getRoomNumber());
                adminNotification.put("requestedCheckOutDate", newCheckOutDate);
                adminNotification.put("rejectedBy", requesterId);
                adminNotification.put("reason", adminComment);
                
                messagingTemplate.convertAndSend("/topic/admin/guest-stay-extension-rejected", adminNotification);
                
                // Отправка подтверждения запрашивающему администратору
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Запрос на продление проживания отклонен");
                response.put("guest", guest);
                
                messagingTemplate.convertAndSendToUser(
                        requesterId,
                        "/queue/admin/extend-stay-result",
                        response
                );
                
                // Отправка уведомления гостю (если гость онлайн)
                Map<String, Object> guestNotification = new HashMap<>();
                guestNotification.put("success", false);
                guestNotification.put("message", "Ваш запрос на продление проживания отклонен");
                guestNotification.put("reason", adminComment);
                
                messagingTemplate.convertAndSendToUser(
                        "guest-" + guestId,
                        "/queue/extend-stay-response",
                        guestNotification
                );
            }
        } catch (Exception e) {
            log.error("Ошибка при обработке запроса на продление проживания", e);
            handleError(payload, "Ошибка при обработке запроса на продление проживания: " + e.getMessage());
        }
    }

    /**
     * Получение всех запросов на продление проживания (заглушка, в реальной системе сохранялись бы в БД)
     */
    @MessageMapping("/admin/extend-stay-requests")
    @SendTo("/topic/admin/extend-stay-requests")
    public List<Map<String, Object>> getExtendStayRequests() {
        log.info("Администратор запрашивает список запросов на продление проживания");
        
        // Заглушка - в реальном приложении запросы должны храниться в БД
        // Здесь создаем несколько примеров запросов
        List<Map<String, Object>> requests = List.of(
                createExtendStayRequest(1L, "Иван Иванов", "101", LocalDate.now().plusDays(1), LocalDate.now().plusDays(5)),
                createExtendStayRequest(2L, "Мария Петрова", "202", LocalDate.now().plusDays(2), LocalDate.now().plusDays(7))
        );
        
        return requests;
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
            
            List<Guest> guests = guestService.getAllGuests();
            List<Guest> results;
            
            // Выбор поля для поиска
            switch (searchField) {
                case "lastName":
                    results = guests.stream()
                            .filter(g -> g.getLastName().toLowerCase().contains(searchTerm.toLowerCase()))
                            .collect(Collectors.toList());
                    break;
                case "firstName":
                    results = guests.stream()
                            .filter(g -> g.getFirstName().toLowerCase().contains(searchTerm.toLowerCase()))
                            .collect(Collectors.toList());
                    break;
                case "email":
                    results = guests.stream()
                            .filter(g -> g.getEmail() != null && g.getEmail().toLowerCase().contains(searchTerm.toLowerCase()))
                            .collect(Collectors.toList());
                    break;
                case "phone":
                    results = guests.stream()
                            .filter(g -> g.getPhone() != null && g.getPhone().contains(searchTerm))
                            .collect(Collectors.toList());
                    break;
                case "roomNumber":
                    results = guests.stream()
                            .filter(g -> g.getRoom().getRoomNumber().contains(searchTerm))
                            .collect(Collectors.toList());
                    break;
                default:
                    results = guests.stream()
                            .filter(g -> 
                                    g.getLastName().toLowerCase().contains(searchTerm.toLowerCase()) ||
                                    g.getFirstName().toLowerCase().contains(searchTerm.toLowerCase()) ||
                                    (g.getEmail() != null && g.getEmail().toLowerCase().contains(searchTerm.toLowerCase())) ||
                                    (g.getPhone() != null && g.getPhone().contains(searchTerm))
                            )
                            .collect(Collectors.toList());
            }
            
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

    /**
     * Вспомогательные методы для статистики
     */
    private double calculateAverageStay(List<Guest> guests) {
        return guests.stream()
                .mapToLong(guest -> {
                    LocalDate checkIn = guest.getCheckInDate();
                    LocalDate checkOut = guest.getCheckOutDate();
                    return java.time.temporal.ChronoUnit.DAYS.between(checkIn, checkOut);
                })
                .average()
                .orElse(0);
    }

    private int countGuestsCheckingOutToday(List<Guest> guests) {
        LocalDate today = LocalDate.now();
        return (int) guests.stream()
                .filter(guest -> guest.getCheckOutDate().equals(today))
                .count();
    }

    private int countGuestsCheckedInToday(List<Guest> guests) {
        LocalDate today = LocalDate.now();
        return (int) guests.stream()
                .filter(guest -> guest.getCheckInDate().equals(today))
                .count();
    }

    private BigDecimal calculateTotalRevenue(List<Guest> guests) {
        return guests.stream()
                .map(guest -> {
                    Room room = guest.getRoom();
                    BigDecimal pricePerNight = room.getPricePerNight();
                    long nights = java.time.temporal.ChronoUnit.DAYS.between(
                            guest.getCheckInDate(), 
                            guest.getCheckOutDate());
                    return pricePerNight.multiply(BigDecimal.valueOf(nights));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Создание примера запроса на продление проживания (заглушка)
     */
    private Map<String, Object> createExtendStayRequest(
            Long guestId, String guestName, String roomNumber, 
            LocalDate currentCheckOutDate, LocalDate requestedCheckOutDate) {
        Map<String, Object> request = new HashMap<>();
        request.put("requestId", "REQ-" + System.currentTimeMillis() + "-" + guestId);
        request.put("guestId", guestId);
        request.put("guestName", guestName);
        request.put("roomNumber", roomNumber);
        request.put("currentCheckOutDate", currentCheckOutDate);
        request.put("requestedCheckOutDate", requestedCheckOutDate);
        request.put("requestedAt", java.time.LocalDateTime.now().minusHours(1).toString());
        request.put("status", "PENDING");
        return request;
    }

    /**
     * Находит комнату по ID
     */
    private Optional<Room> findRoomById(Long roomId) {
        return roomService.getAllRooms()
                .stream()
                .filter(r -> r.getId().equals(roomId))
                .findFirst();
    }
} 