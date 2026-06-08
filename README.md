# Financial Tracker

A comprehensive personal finance management application built with Spring Boot and React. Track expenses, manage budgets, set financial goals, and gain insights into spending patterns with powerful analytics and visualization tools.

## Features

### Authentication & Security
- User registration and login with JWT authentication
- Two-Factor Authentication (2FA) with QR code setup
- Email verification and password reset functionality
- Secure session management with token-based authentication

### Transaction Management
- Add, edit, and delete transactions with detailed categorization
- Import transactions from CSV files for bulk data entry
- Advanced search and filtering with saved search capabilities
- Transaction tagging for better organization
- Recurring transactions with automated scheduling

### Analytics & Reporting
- Dashboard overview with key financial metrics
- Interactive charts showing expense/income trends
- Category-wise spending analysis with pie charts
- Monthly and weekly reports via email
- Comparative analytics across different time periods
- Balance tracking with historical data

### Budget & Goals
- Budget creation and tracking with spending limits
- Goal setting with progress monitoring
- Budget alerts and notifications when limits are exceeded
- Priority-based goal management

### Multi-Currency Support
- Currency conversion with real-time exchange rates
- Multi-currency transaction support
- Currency preference settings
- Exchange rate history tracking

### Notifications
- Email notifications for budget alerts and reminders
- Customizable notification settings
- Daily and weekly financial summaries
- Payment reminders for recurring expenses

### Internationalization
- Multi-language support (English, Ukrainian)
- Localized currency formats
- Theme customization (Light/Dark mode)

## Tech Stack

### Backend
- Java 17 with Spring Boot 3.5
- Spring Security for authentication and authorization
- Spring Data JPA with Hibernate
- PostgreSQL database
- Flyway for database migrations
- JWT for stateless authentication
- MapStruct for object mapping
- Lombok for reducing boilerplate code
- Apache POI for Excel file processing
- OpenCSV for CSV file handling
- Spring Mail for email functionality
- Spring Cache for performance optimization

### Frontend
- React 19 with modern hooks and context API
- Vite for fast development and building
- React Router v7 for client-side routing
- TanStack Query for server state management
- Chart.js with React Chart.js 2 for data visualization
- Axios for API communication
- i18next for internationalization
- Heroicons and Lucide React for icons
- Sonner for toast notifications

### Database
- PostgreSQL 15 for production
- H2 for testing
- Flyway migrations for version control

### Development Tools
- Maven for dependency management and building
- Docker Compose for local development environment
- ESLint for code quality
- Spring Boot DevTools for hot reloading

## Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- PostgreSQL 15 (or use Docker Compose)
- Maven 3.6 or higher

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/idenyskap/financial-tracker.git
   cd financial-tracker
   ```

2. Start PostgreSQL database
   ```bash
   docker-compose up -d
   ```

3. Configure application properties

   The application uses `application-dev.yml` for local development. Update database and email settings as needed:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/postgres
       username: postgres
       password: postgres
     mail:
       host: localhost
       port: 1025
   ```

4. Build and run the backend
   ```bash
   ./mvnw spring-boot:run
   ```

5. Install and run the frontend
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. Access the application
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - API Documentation: http://localhost:8080/swagger-ui/index.html

## Project Structure

```
financial-tracker/
├── src/main/java/                 # Backend source code
│   └── com/example/financial_tracker/
│       ├── config/                # Configuration classes (Security, Cache, CORS)
│       ├── controller/            # REST API endpoints
│       ├── dto/                   # Data transfer objects
│       ├── entity/                # JPA entities
│       ├── enumerations/          # Enum types (Currency, TransactionType, etc.)
│       ├── exception/             # Custom exceptions and global handler
│       ├── mapper/                # MapStruct mappers (Entity <-> DTO)
│       ├── repository/            # Data access layer (Spring Data JPA)
│       ├── scheduler/             # Scheduled tasks (recurring transactions)
│       ├── security/              # JWT filter and security config
│       ├── service/               # Business logic layer
│       ├── util/                  # Utility classes
│       └── validation/            # Custom validation annotations
├── src/main/resources/
│   ├── db/migration/              # Flyway migrations
│   └── templates/emails/          # Email templates (Thymeleaf)
├── frontend/
│   ├── src/
│   │   ├── components/            # React components (by feature)
│   │   ├── contexts/              # React contexts (Auth, Theme, Currency, Language)
│   │   ├── hooks/                 # Custom hooks
│   │   ├── locales/               # Translation files (en, uk)
│   │   ├── pages/                 # Page components
│   │   └── services/              # API services (Axios)
│   └── public/                    # Static assets
└── docker-compose.yml             # Docker configuration
```

## API Documentation

The application includes comprehensive API documentation using OpenAPI 3:
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

## Database Schema

Key entities managed by the application:
- **Users** - User accounts with authentication details
- **Transactions** - Financial transactions with categories and tags
- **Categories** - Transaction categories (Income/Expense)
- **Budgets** - Spending limits with period tracking
- **Goals** - Financial goals with progress tracking
- **Recurring Transactions** - Automated transaction scheduling
- **Saved Searches** - User-defined search filters
- **Exchange Rates** - Multi-currency support with real-time rates

## Testing

**Backend** — JUnit 5, Mockito and Spring Boot Test. Integration tests use
**Testcontainers** (spins up a real PostgreSQL in Docker), so Docker must be
running. Service-layer coverage spans budgets, categories, currency, goals,
recurring transactions, transactions and users.

```bash
./mvnw test     # runs the full suite
```

**Frontend** — no unit-test framework is configured yet; only ESLint:

```bash
cd frontend
npm run lint
```

## Deployment

### Infrastructure

The application is deployed on **AWS EC2** (t3.micro, Ubuntu 24.04):
- **Nginx** — reverse proxy, serves frontend static files
- **Docker** — backend runs in a Docker container on port 8080
- **PostgreSQL 16** — database running locally on the same instance
- **Elastic IP** — static public IP address

### CI/CD

Automated deployment via **GitHub Actions**. On every push to `main`:
1. Builds the backend JAR (Maven)
2. Builds the frontend (Vite)
3. Copies artifacts to EC2 via SCP
4. Builds Docker image and restarts the container

Workflow: `.github/workflows/deploy.yml`

### Manual Deployment

1. Build the frontend
   ```bash
   cd frontend
   npm run build
   ```

2. Build the backend
   ```bash
   mvn clean package -DskipTests
   ```

3. Copy to server
   ```bash
   scp target/financial_tracker-0.0.1-SNAPSHOT.jar ubuntu@<EC2_IP>:~/app.jar
   scp -r frontend/dist ubuntu@<EC2_IP>:~/frontend-dist
   ```

4. On the server
   ```bash
   sudo rm -rf /var/www/html/* && sudo cp -r ~/frontend-dist/* /var/www/html/
   docker build -t financial-tracker .
   docker stop financial-tracker || true
   docker rm financial-tracker || true
   docker run -d --name financial-tracker --restart unless-stopped --network host \
     -e SPRING_PROFILES_ACTIVE=prod \
     -e SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/financial_tracker \
     -e SPRING_DATASOURCE_USERNAME=<db_user> \
     -e SPRING_DATASOURCE_PASSWORD=<db_password> \
     financial-tracker
   ```

### Environment Variables

See [`.env.example`](.env.example) for a copy-paste template. Required/optional
variables (set as environment variables or via secrets in CI):

- `SPRING_PROFILES_ACTIVE` - Active Spring profile (`dev` | `prod`)
- `DATABASE_URL` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` - PostgreSQL connection
  (the deploy pipeline passes the equivalent `SPRING_DATASOURCE_*` variables)
- `JWT_SECRET` - Secret key for JWT token signing
- `CORS_ORIGIN` - Frontend origin allowed by CORS (exact, no trailing slash)
- `FRONTEND_URL` - Frontend base URL (used in email links)
- `MAIL_USERNAME` / `MAIL_PASSWORD` - SMTP credentials
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth2 sign-in
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `AWS_S3_BUCKET` -
  S3 file storage (S3 is enabled only when an access key is provided)
- `REDIS_HOST` / `REDIS_PORT` - Redis cache

Frontend build var (set at build time): `VITE_API_URL` - API base URL
(e.g. `https://your-domain/api/v1`).

## Security Features

- JWT-based authentication with secure token handling
- Password encryption using BCrypt
- CORS protection with configurable origins
- Input validation and sanitization
- SQL injection prevention through JPA
- Two-factor authentication for enhanced security
- Secure email verification workflow

## Performance Optimizations

- Database indexing on frequently queried columns
- Spring Cache for expensive operations
- Lazy loading for JPA relationships
- Query optimization with custom repository methods
- Frontend code splitting and lazy loading
