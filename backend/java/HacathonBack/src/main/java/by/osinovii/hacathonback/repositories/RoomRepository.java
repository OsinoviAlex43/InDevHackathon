package by.osinovii.hacathonback.repositories;

import by.osinovii.hacathonback.entities.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByRoomNumber(String name);

    Optional<Room> findByStatus(String status);
}
