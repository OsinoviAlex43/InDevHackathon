package by.osinovii.hacathonback.repositories;

import by.osinovii.hacathonback.entities.Guest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GuestRepository extends JpaRepository<Guest, Long> {
    List<Guest> findByLastName(String lastName);

    List<Guest> findByCheckInDate(java.time.LocalDate date);
}