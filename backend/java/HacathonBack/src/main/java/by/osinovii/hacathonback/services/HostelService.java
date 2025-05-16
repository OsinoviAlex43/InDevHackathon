package by.osinovii.hacathonback.services;

import by.osinovii.hacathonback.entities.Guest;
import by.osinovii.hacathonback.entities.Room;
import by.osinovii.hacathonback.repositories.GuestRepository;
import by.osinovii.hacathonback.repositories.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HostelService {

    private final GuestRepository guestRepository;
    private final RoomRepository roomRepository;

    public HostelService(GuestRepository guestRepository, RoomRepository roomRepository) {
        this.guestRepository = guestRepository;
        this.roomRepository = roomRepository;
    }

    public List<Guest> getAllGuests() {
        return guestRepository.findAll();
    }

    public Optional<Guest> findGuestById(Long id) {
        return guestRepository.findById(id);
    }

    public Guest saveGuest(Guest guest) {
        return guestRepository.save(guest);
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public Room saveRoom(Room room) {
        return roomRepository.save(room);
    }
}
