package by.osinovii.hacathonback.controllers;

import by.osinovii.hacathonback.entities.Guest;
import by.osinovii.hacathonback.entities.Room;
import by.osinovii.hacathonback.services.HostelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class HotelTestController {

    private final HostelService hostelService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "Сервис отеля работает нормально");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/guests")
    public ResponseEntity<List<Guest>> getAllGuests() {
        List<Guest> guests = hostelService.getAllGuests();
        return ResponseEntity.ok(guests);
    }

    @GetMapping("/guest/{id}")
    public ResponseEntity<Guest> getGuestById(@PathVariable Long id) {
        return hostelService.findGuestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/rooms")
    public ResponseEntity<List<Room>> getAllRooms() {
        List<Room> rooms = hostelService.getAllRooms();
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getHotelStats() {
        List<Guest> guests = hostelService.getAllGuests();
        List<Room> rooms = hostelService.getAllRooms();
        
        long availableRooms = rooms.stream()
                .filter(room -> "AVAILABLE".equals(room.getStatus()))
                .count();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalGuests", guests.size());
        stats.put("totalRooms", rooms.size());
        stats.put("availableRooms", availableRooms);
        stats.put("occupancyRate", 
                rooms.isEmpty() ? 0 : 
                    (double) (rooms.size() - availableRooms) / rooms.size() * 100);
        
        return ResponseEntity.ok(stats);
    }
} 