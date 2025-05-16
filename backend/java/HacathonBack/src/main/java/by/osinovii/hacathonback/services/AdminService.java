package by.osinovii.hacathonback.services;

import by.osinovii.hacathonback.repositories.AdminRepository;
import by.osinovii.hacathonback.repositories.GuestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final AdminRepository adminRepository;


}
