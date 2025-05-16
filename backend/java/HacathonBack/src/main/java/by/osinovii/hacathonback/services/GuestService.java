package by.osinovii.hacathonback.services;

import by.osinovii.hacathonback.entities.Guest;
import by.osinovii.hacathonback.entities.Room;
import by.osinovii.hacathonback.repositories.GuestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GuestService {
    private final GuestRepository guestRepository;
    private final RoomService roomService;

    public List<Guest> getAllGuests() {
        return guestRepository.findAll();
    }

    public Optional<Guest> findGuestById(Long id) {
        return guestRepository.findById(id);
    }

    public Guest saveGuest(Guest guest) {
        return guestRepository.save(guest);
    }
    
    /**
     * Заселение нового гостя
     */
    public Guest checkInGuest(String firstName, String lastName, String email, String phone, 
                              String roomNumber, LocalDate checkOutDate) {
        log.info("Заселение нового гостя {} {} в комнату {}", firstName, lastName, roomNumber);
        
        // Поиск комнаты
        Optional<Room> roomOpt = roomService.findRoomByNumber(roomNumber);
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
        LocalDate finalCheckOutDate = checkOutDate != null ? checkOutDate : LocalDate.now().plusDays(3);
        newGuest.setCheckOutDate(finalCheckOutDate);
        
        // Сохранение гостя
        Guest savedGuest = saveGuest(newGuest);
        
        // Обновление статуса комнаты
        room.setStatus("OCCUPIED");
        roomService.saveRoom(room);
        
        return savedGuest;
    }
    
    /**
     * Выселение гостя
     */
    public Map<String, Object> checkOutGuest(Long guestId) {
        log.info("Выселение гостя с ID {}", guestId);
        
        // Поиск гостя
        Optional<Guest> guestOpt = findGuestById(guestId);
        if (guestOpt.isEmpty()) {
            throw new RuntimeException("Гость с ID " + guestId + " не найден");
        }
        
        Guest guest = guestOpt.get();
        Room room = guest.getRoom();
        
        // Обновление даты выселения
        guest.setCheckOutDate(LocalDate.now());
        saveGuest(guest);
        
        // Обновление статуса комнаты
        room.setStatus("AVAILABLE");
        roomService.saveRoom(room);
        
        // Возвращаем информацию о выселении
        Map<String, Object> checkoutInfo = new HashMap<>();
        checkoutInfo.put("guestId", guestId);
        checkoutInfo.put("guestName", guest.getFirstName() + " " + guest.getLastName());
        checkoutInfo.put("roomId", room.getId());
        checkoutInfo.put("roomNumber", room.getRoomNumber());
        checkoutInfo.put("checkOutDate", LocalDate.now().toString());
        
        return checkoutInfo;
    }
    
    /**
     * Продление проживания гостя
     */
    public Guest extendStay(Long guestId, LocalDate newCheckOutDate) {
        log.info("Продление проживания гостя с ID {} до {}", guestId, newCheckOutDate);
        
        Optional<Guest> guestOpt = findGuestById(guestId);
        if (guestOpt.isEmpty()) {
            throw new RuntimeException("Гость с ID " + guestId + " не найден");
        }
        
        Guest guest = guestOpt.get();
        
        // Проверка, что новая дата выезда позже текущей
        if (newCheckOutDate.isBefore(guest.getCheckOutDate()) || newCheckOutDate.isBefore(LocalDate.now())) {
            throw new RuntimeException("Новая дата выезда должна быть позже текущей даты выезда и сегодняшнего дня");
        }
        
        // Обновление даты выезда
        guest.setCheckOutDate(newCheckOutDate);
        return saveGuest(guest);
    }
    
    /**
     * Получение гостей, заселенных сегодня
     */
    public List<Guest> getGuestsCheckedInToday() {
        LocalDate today = LocalDate.now();
        return getAllGuests().stream()
                .filter(guest -> guest.getCheckInDate().equals(today))
                .collect(Collectors.toList());
    }
    
    /**
     * Получение гостей, выселяющихся сегодня
     */
    public List<Guest> getGuestsCheckingOutToday() {
        LocalDate today = LocalDate.now();
        return getAllGuests().stream()
                .filter(guest -> guest.getCheckOutDate().equals(today))
                .collect(Collectors.toList());
    }
    
    /**
     * Получение гостей по комнате
     */
    public List<Guest> getGuestsByRoom(String roomNumber) {
        return getAllGuests().stream()
                .filter(guest -> guest.getRoom().getRoomNumber().equals(roomNumber))
                .collect(Collectors.toList());
    }
    
    /**
     * Поиск гостей по параметрам
     */
    public List<Guest> searchGuests(String searchTerm, String searchField) {
        List<Guest> guests = getAllGuests();
        
        // Выбор поля для поиска
        switch (searchField) {
            case "lastName":
                return guests.stream()
                        .filter(g -> g.getLastName().toLowerCase().contains(searchTerm.toLowerCase()))
                        .collect(Collectors.toList());
            case "firstName":
                return guests.stream()
                        .filter(g -> g.getFirstName().toLowerCase().contains(searchTerm.toLowerCase()))
                        .collect(Collectors.toList());
            case "email":
                return guests.stream()
                        .filter(g -> g.getEmail() != null && g.getEmail().toLowerCase().contains(searchTerm.toLowerCase()))
                        .collect(Collectors.toList());
            case "phone":
                return guests.stream()
                        .filter(g -> g.getPhone() != null && g.getPhone().contains(searchTerm))
                        .collect(Collectors.toList());
            case "roomNumber":
                return guests.stream()
                        .filter(g -> g.getRoom().getRoomNumber().contains(searchTerm))
                        .collect(Collectors.toList());
            default:
                return guests.stream()
                        .filter(g -> 
                                g.getLastName().toLowerCase().contains(searchTerm.toLowerCase()) ||
                                g.getFirstName().toLowerCase().contains(searchTerm.toLowerCase()) ||
                                (g.getEmail() != null && g.getEmail().toLowerCase().contains(searchTerm.toLowerCase())) ||
                                (g.getPhone() != null && g.getPhone().contains(searchTerm))
                        )
                        .collect(Collectors.toList());
        }
    }
}
