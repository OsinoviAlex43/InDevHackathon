# 🚪💡 Система умного контроля доступа и освещения

*Разработано для хакатона от InDevSolutions*

## 📝 Описание проекта

Интеллектуальная платформа для управления доступом в помещения и контроля освещения с использованием современных технологий:

- 🌐 **Веб-интерфейс** для удобного управления системой
- ⚙️ **Микросервисная архитектура** с разделением ответственности

## 🗂 Структура проекта

```text
InDevHackathon/
├── frontend/              # React-приложение (TypeScript + Vite)
│   ├── public/            # Статические ресурсы
│   └── src/               # Исходный код приложения
├── backend/
│   ├── java/              # Spring Boot (REST API + WebSocket)
│   └── py/                # FastAPI (IoT Gateway)
└── docs/                  # Документация
```
## Технологии

### Frontend
- React 19
- TypeScript
- Material UI 7
- MobX для управления состоянием
- Chart.js для визуализации данных
- React Router для навигации
- WebSocket для обмена данными в реальном времени

<p align="left"> <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react" alt="React"> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"> <img src="https://img.shields.io/badge/Material_UI-0081CB?style=for-the-badge&logo=mui" alt="Material UI"> <img src="https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chart.js" alt="Chart.js"> </p>

### Backend (Java)
- Spring Boot 3.4
- Spring Data JPA
- PostgreSQL
- WebSocket
- Lombok
  
<p align="left"> <img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring" alt="Spring Boot"> <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql" alt="PostgreSQL"> <img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=websocket" alt="WebSocket"> </p>

### Backend (Python)
- FastAPI
- Uvicorn
- Bleak (для Bluetooth Low Energy соединений)
- Protocol Buffers
  
<p align="left"> <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi" alt="FastAPI"> <img src="https://img.shields.io/badge/BLE-0082FC?style=for-the-badge&logo=bluetooth" alt="Bluetooth LE"> <img src="https://img.shields.io/badge/Protobuf-3178C6?style=for-the-badge&logo=protobuf" alt="Protocol Buffers"> </p>

## Функциональность

- Управление доступом в помещения (открытие/закрытие дверей)
- Контроль освещения в помещениях (включение/выключение)
- Сбор и визуализация данных о использовании помещений
- Взаимодействие с IoT-устройствами через Bluetooth Low Energy


### Frontend
```bash
cd InDevHackathon/frontend/web
npm install
npm run dev
```



### Backend (Java)
```bash
cd InDevHackathon/backend/java/HacathonBack
./mvnw spring-boot:run
```

### Backend (Python)
```bash
cd InDevHackathon/backend/py
pip install -r requirements.txt
uvicorn main:app --reload
```

## Авторы

Команда разработчиков для хакатона InDevSolutions-Все контрибьюторы

