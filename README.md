# 🚚 Transport API

## 📋 Опис

Transport API надає можливості для:
- Управління транспортними засобами (CRUD операції)
- Створення та управління маршрутами
- Workflow управління станами маршрутів
- Призначення транспортних засобів маршрутам

## 🛠 Технології

### Development
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

### 🌐 Production розгортання

#### Технології production середовища
- **Server**: AWS EC2 Ubuntu
- **Database**: Heroku PostgreSQL 
- **Reverse Proxy**: Caddy
- **Process Manager**: systemd

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

## 📮 Postman колекція


1. **Імпорт колекції**
   - Відкрити Postman
   - Натиснути **Import** (або `Ctrl+O`)
   - Виберати файл `postman/Transport-API.postman_collection.json`


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

Запустити тести:
```bash
npm test
```

## 🎯 Потенційні покращення

### 🏗️ Архітектурні покращення

#### Декоплінг модулів
Поточна архітектура може бути покращена через:

```typescript
// Замість прямих залежностей

interface IVehicleService {
  create(data: CreateVehicleDto): Promise<Vehicle>;
  findAll(): Promise<Vehicle[]>;
}

@Injectable()
class VehicleController {
  constructor(private vehicleService: IVehicleService) {}
}
```

#### Доменно-орієнтована архітектура (DDD)
```
src/
├── domains/
│   ├── vehicles/
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── controllers/
│   └── routes/
│       ├── entities/
│       ├── repositories/
│       ├── services/
│       └── controllers/
├── shared/
│   ├── infrastructure/
│   ├── interfaces/
│   └── utils/
```

### ☁️ AWS Infrastructure покращення

#### 1. Virtual Private Cloud (VPC)
```yaml
#### 1. Краще створити власну VPC:

#### 2. AWS Secrets Manager
# Замість environment variables в plaintext

#### 3. Route53 для DNS

#### 4. Application Load Balancer
# Замість Caddy можна використовувати ALB

#### 5. RDS для бази даних


