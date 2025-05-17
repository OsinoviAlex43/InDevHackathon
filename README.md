# Система умного контроля доступа и освещения

Проект разработан в рамках хакатона организованного InDevSolutions.

## Описание проекта

Система представляет собой платформу для управления доступом в помещения и контроля освещения с использованием современных технологий IoT и веб-интерфейса. Проект объединяет различные компоненты:

- React-приложение для управления системой
- Java Spring Boot бэкенд для обработки бизнес-логики и хранения данных
- Python FastAPI сервис для взаимодействия с IoT-устройствами

## Структура проекта

```
InDevHackathon/
├── frontend/
│   └── web/              # React приложение на TypeScript с Vite
├── backend/
│   ├── java/             # Spring Boot бэкенд с PostgreSQL
│   └── py/               # FastAPI сервис для управления устройствами
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

### Backend (Java)
- Spring Boot 3.4
- Spring Data JPA
- PostgreSQL
- WebSocket
- Lombok

### Backend (Python)
- FastAPI
- Uvicorn
- Bleak (для Bluetooth Low Energy соединений)
- Protocol Buffers

## Функциональность

- Управление доступом в помещения (открытие/закрытие дверей)
- Контроль освещения в помещениях (включение/выключение)
- Аутентификация и авторизация
- Сбор и визуализация данных о использовании помещений
- Взаимодействие с IoT-устройствами через Bluetooth Low Energy

## Запуск проекта

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

