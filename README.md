# 🚚 Transport API

## 📋 Опис

Transport API надає можливості для:
- Управління транспортними засобами (CRUD операції)
- Створення та управління маршрутами
- Workflow управління станами маршрутів
- Призначення транспортних засобів маршрутам

## 🛠 Технології

- **Backend**: Node.js, Express.js, TypeScript
- **База даних**: PostgreSQL з Prisma ORM
- **Документація**: Swagger/OpenAPI 3.0
- **Контейнеризація**: Docker, Docker Compose

## 🚀 Швидкий запуск

### Локальне розгортання

1. **Клонуйте репозиторій**

2. **Встановіть залежності**
```bash
npm install
```

3. **Запустіть з Docker**
```bash
docker-compose up --build
```

4. **API буде доступне за адресою:**
- API: http://localhost:3000
- Swagger UI: http://localhost:3000/api-docs


## 📚 API Документація

API документація доступна через Swagger UI: http://localhost:3000/api-docs

### Основні ендпоінти

#### Транспортні засоби
- `GET /vehicles` - Отримати всі транспортні засоби
- `POST /vehicles` - Створити новий транспортний засіб
- `PUT /vehicles/:id` - Оновити транспортний засіб
- `DELETE /vehicles/:id` - Видалити транспортний засіб

#### Маршрути
- `GET /routes` - Отримати всі маршрути
- `POST /routes` - Створити новий маршрут
- `PUT /routes/:id` - Оновити маршрут
- `DELETE /routes/:id` - Видалити маршрут

#### Workflow операції
- `POST /routes/:id/assign-vehicle` - Призначити транспортний засіб
- `POST /routes/:id/start` - Почати виконання маршруту
- `POST /routes/:id/complete` - Завершити маршрут
- `POST /routes/:id/cancel` - Скасувати маршрут
- `GET /routes/:id/transitions` - Отримати доступні переходи стану

## 🔐 Аутентифікація

API використовує API Key аутентифікацію. Додайте заголовок:
```
X-API-Key: your-api-key
```

## 📊 Структура проекту

```
transport-api/
├── src/
│   ├── api/
│   │   ├── handlers/          # Бізнес логіка
│   │   └── routers/           # Express маршрути
│   ├── app/
│   │   ├── routes/            # Логіка маршрутів
│   │   └── vehicles/          # Логіка транспортних засобів
│   ├── config/
│   │   └── swagger.ts         # Конфігурація Swagger
│   ├── docs/                  # API документація
│   ├── lib/                   # Утиліти (Prisma, OSRM)
│   ├── middleware/            # Middleware (auth, rate limiting)
│   └── models/                # TypeScript типи
├── prisma/
│   ├── schema.prisma          # Схема бази даних
│   ├── migrations/            # Міграції
│   └── seed.ts               # Заповнення тестовими даними
├── docker-compose.yml         # Docker конфігурація
└── Dockerfile                 # Docker образ
```

## 🗄 База даних

Проект використовує PostgreSQL з наступними основними таблицями:

- **Vehicle** - Транспортні засоби (номер, тип, вантажопідйомність, поточне місцезнаходження)
- **Route** - Маршрути (початкова/кінцева точка, дистанція, стан, призначений транспорт)

### Стани маршруту
- `PENDING` - Очікує призначення
- `ASSIGNED` - Призначено транспорт  
- `IN_PROGRESS` - Виконується
- `COMPLETED` - Завершено
- `CANCELLED` - Скасовано

## 🧪 Тестування

Запустіть тести:
```bash
npm test
```
