package by.osinovii.hacathonback.services;

import by.osinovii.hacathonback.entities.Room;
import by.osinovii.hacathonback.repositories.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomService {
    private final RoomRepository roomRepository;
    
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public Room saveRoom(Room room) {
        return roomRepository.save(room);
    }
    
    /**
     * Находит комнату по ID
     */
    public Optional<Room> findRoomById(Long roomId) {
        return getAllRooms()
                .stream()
                .filter(r -> r.getId().equals(roomId))
                .findFirst();
    }
    
    /**
     * Находит комнату по номеру
     */
    public Optional<Room> findRoomByNumber(String roomNumber) {
        return getAllRooms()
                .stream()
                .filter(r -> r.getRoomNumber().equals(roomNumber))
                .findFirst();
    }
    
    /**
     * Получает комнаты по статусу
     */
    public List<Room> getRoomsByStatus(String status) {
        return getAllRooms()
                .stream()
                .filter(room -> room.getStatus().equals(status))
                .collect(Collectors.toList());
    }
    
    /**
     * Получает доступные комнаты
     */
    public List<Room> getAvailableRooms() {
        return getRoomsByStatus("AVAILABLE");
    }
    
    /**
     * Получает занятые комнаты
     */
    public List<Room> getOccupiedRooms() {
        return getRoomsByStatus("OCCUPIED");
    }
    
    /**
     * Получает комнаты по типу
     */
    public List<Room> getRoomsByType(String type) {
        return getAllRooms()
                .stream()
                .filter(room -> room.getRoomType().equals(type))
                .collect(Collectors.toList());
    }
    
    /**
     * Получает комнаты по ценовому диапазону
     */
    public List<Room> getRoomsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        return getAllRooms()
                .stream()
                .filter(room -> {
                    BigDecimal price = room.getPricePerNight();
                    return price.compareTo(minPrice) >= 0 && price.compareTo(maxPrice) <= 0;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Обновляет статус комнаты
     */
    public Room updateRoomStatus(Long roomId, String newStatus) {
        log.info("Обновление статуса комнаты с ID {}: новый статус - {}", roomId, newStatus);
        
        Optional<Room> roomOpt = findRoomById(roomId);
        if (roomOpt.isEmpty()) {
            throw new RuntimeException("Комната с ID " + roomId + " не найдена");
        }
        
        Room room = roomOpt.get();
        room.setStatus(newStatus);
        return saveRoom(room);
    }
    
    /**
     * Обновляет цену комнаты
     */
    public Room updateRoomPrice(Long roomId, BigDecimal newPrice) {
        log.info("Обновление цены комнаты с ID {}: новая цена - {}", roomId, newPrice);
        
        Optional<Room> roomOpt = findRoomById(roomId);
        if (roomOpt.isEmpty()) {
            throw new RuntimeException("Комната с ID " + roomId + " не найдена");
        }
        
        Room room = roomOpt.get();
        room.setPricePerNight(newPrice);
        return saveRoom(room);
    }
}
