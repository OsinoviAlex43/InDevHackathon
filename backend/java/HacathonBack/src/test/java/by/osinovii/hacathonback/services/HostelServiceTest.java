package by.osinovii.hacathonback.services;

import by.osinovii.hacathonback.entities.Guest;
import by.osinovii.hacathonback.entities.Room;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class HostelServiceTest {

    @Autowired
    private HostelService hostelService;

    @Test
    public void testGetAllRooms() {
        List<Room> rooms = hostelService.getAllRooms();
        assertNotNull(rooms);
        assertFalse(rooms.isEmpty());
        
        // Проверка, что в тестовых данных есть нужные номера
        boolean hasRoom101 = false;
        boolean hasRoom202 = false;
        
        for (Room room : rooms) {
            if ("101".equals(room.getRoomNumber())) {
                hasRoom101 = true;
            }
            if ("202".equals(room.getRoomNumber())) {
                hasRoom202 = true;
            }
        }
        
        assertTrue(hasRoom101, "Номер 101 должен присутствовать в БД");
        assertTrue(hasRoom202, "Номер 202 должен присутствовать в БД");
    }

    @Test
    public void testGetAllGuests() {
        List<Guest> guests = hostelService.getAllGuests();
        assertNotNull(guests);
        assertFalse(guests.isEmpty());
        
        // Проверка, что в тестовых данных есть гость Иванов
        boolean hasIvanov = false;
        
        for (Guest guest : guests) {
            if ("Иванов".equals(guest.getLastName())) {
                hasIvanov = true;
                assertEquals("Иван", guest.getFirstName());
                assertNotNull(guest.getRoom());
                assertNotNull(guest.getCheckInDate());
                assertNotNull(guest.getCheckOutDate());
                break;
            }
        }
        
        assertTrue(hasIvanov, "Гость Иванов должен присутствовать в БД");
    }

    @Test
    public void testSaveAndFindGuest() {
        // Сначала получим комнату для гостя
        List<Room> rooms = hostelService.getAllRooms();
        Room room = rooms.stream()
                .filter(r -> "AVAILABLE".equals(r.getStatus()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Нет доступных комнат для теста"));
        
        // Создаем нового гостя
        Guest newGuest = new Guest();
        newGuest.setFirstName("Тест");
        newGuest.setLastName("Тестов");
        newGuest.setEmail("test@test.ru");
        newGuest.setPhone("+7-999-000-00-00");
        newGuest.setRoom(room);
        newGuest.setCheckInDate(LocalDate.now());
        newGuest.setCheckOutDate(LocalDate.now().plusDays(3));
        
        // Сохраняем
        Guest savedGuest = hostelService.saveGuest(newGuest);
        assertNotNull(savedGuest.getId());
        
        // Пробуем найти по id
        Optional<Guest> foundGuest = hostelService.findGuestById(savedGuest.getId());
        assertTrue(foundGuest.isPresent());
        assertEquals("Тест", foundGuest.get().getFirstName());
        assertEquals("Тестов", foundGuest.get().getLastName());
    }
} 