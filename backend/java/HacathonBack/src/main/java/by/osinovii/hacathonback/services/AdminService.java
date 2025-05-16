package by.osinovii.hacathonback.services;

import by.osinovii.hacathonback.entities.Admin;
import by.osinovii.hacathonback.entities.Guest;
import by.osinovii.hacathonback.entities.Room;
import by.osinovii.hacathonback.repositories.AdminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {
    private final AdminRepository adminRepository;
    private final GuestService guestService;
    private final RoomService roomService;

    /**
     * Получение статистики отеля
     */
    public Map<String, Object> getHotelStats() {
        log.info("Запрос статистики отеля");
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
     * Обработка запроса на продление проживания
     */
    public Map<String, Object> processExtendStayRequest(Long guestId, LocalDate newCheckOutDate, boolean approved, String adminComment) {
        log.info("Администратор {} запрос на продление проживания гостя с ID {} до {}", 
                approved ? "одобряет" : "отклоняет", guestId, newCheckOutDate);
        
        // Поиск гостя
        Optional<Guest> guestOpt = guestService.findGuestById(guestId);
        if (guestOpt.isEmpty()) {
            throw new RuntimeException("Гость с ID " + guestId + " не найден");
        }
        
        Guest guest = guestOpt.get();
        Map<String, Object> result = new HashMap<>();
        
        if (approved) {
            // Обновление даты выезда
            Guest updatedGuest = guestService.extendStay(guestId, newCheckOutDate);
            
            result.put("success", true);
            result.put("message", "Запрос на продление проживания одобрен");
            result.put("guest", updatedGuest);
        } else {
            // Запрос отклонен
            result.put("success", false);
            result.put("message", "Запрос на продление проживания отклонен");
            result.put("guest", guest);
            result.put("reason", adminComment);
        }
        
        return result;
    }
    
    /**
     * Имитация запросов на продление проживания (для примера, в реальной системе хранились бы в БД)
     */
    public List<Map<String, Object>> getExtendStayRequests() {
        log.info("Запрос списка запросов на продление проживания");
        
        // Заглушка - в реальном приложении запросы должны храниться в БД
        return List.of(
                createExtendStayRequest(1L, "Иван Иванов", "101", LocalDate.now().plusDays(1), LocalDate.now().plusDays(5)),
                createExtendStayRequest(2L, "Мария Петрова", "202", LocalDate.now().plusDays(2), LocalDate.now().plusDays(7))
        );
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
}
