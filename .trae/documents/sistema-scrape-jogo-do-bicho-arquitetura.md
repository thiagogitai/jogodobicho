## 1.Architecture design

```mermaid
graph TD
    A[User Browser] --> B[React Frontend]
    B --> C[Node.js Backend API]
    C --> D[Supabase Database]
    C --> E[Bull Queue Redis]
    C --> F[Evolution API v2]
    E --> G[Scrape Workers]
    G --> H[Proxy Pool Service]
    H --> I[External Sources]
    F --> J[WhatsApp/Telegram]

    subgraph "Frontend Layer"
        B
    end

    subgraph "Backend Layer"
        C
        G
        H
    end

    subgraph "Data Layer"
        D
        E
    end

    subgraph "External Services"
        F
        I
        J
    end
```

## 2.Technology Description

- Frontend: React@18 + TypeScript + TailwindCSS@3 + Vite
- Backend: Node.js@20 + Express@4 + TypeScript
- Database: Supabase (PostgreSQL)
- Queue System: Bull@4 + Redis
- Web Scraping: Puppeteer@21 + Cheerio
- Proxy Management: proxy-agent@6 + rotating-proxy@1
- Evolution API: REST client com axios
- Monitoramento: Winston@3 + Sentry

## 3.Route definitions

| Route | Purpose |
|-------|---------|
| / | Dashboard principal com estatísticas |
| /login | Página de autenticação do admin |
| /sources | Gerenciamento de fontes de scrape |
| /templates | Editor de templates de mensagens |
| /groups | Gerenciamento de grupos WhatsApp/Telegram |
| /schedules | Configuração de agendamentos |
| /results | Visualização e edição de resultados |
| /settings | Configurações do sistema |
| /logs | Visualização de logs e monitoramento |
| /api/auth/* | Endpoints de autenticação |
| /api/scrape/* | Controle de scraping |
| /api/evolution/* | Integração Evolution API |
| /api/results/* | Gerenciamento de resultados |
| /api/groups/* | Gerenciamento de grupos |
| /api/templates/* | Gerenciamento de templates |

## 4.API definitions

### 4.1 Authentication APIs

```
POST /api/auth/login
```

Request:
| Param Name | Param Type | isRequired | Description |
|------------|------------|------------|-------------|
| email | string | true | Email do administrador |
| password | string | true | Senha (hash bcrypt) |

Response:
| Param Name | Param Type | Description |
|------------|------------|-------------|
| token | string | JWT token para autenticação |
| user | object | Dados do usuário logado |

Example:
```json
{
  "email": "admin@jogodobicho.com",
  "password": "senha123"
}
```

### 4.2 Scrape APIs

```
POST /api/scrape/manual
```

Request:
| Param Name | Param Type | isRequired | Description |
|------------|------------|------------|-------------|
| source_id | string | true | ID da fonte de scrape |
| force_update | boolean | false | Forçar atualização mesmo se já existir |

Response:
| Param Name | Param Type | Description |
|------------|------------|-------------|
| job_id | string | ID do job criado |
| status | string | Status do scrape (pending/running/completed) |

### 4.3 Evolution API Integration

```
POST /api/evolution/send-message
```

Request:
| Param Name | Param Type | isRequired | Description |
|------------|------------|------------|-------------|
| group_id | string | true | ID do grupo WhatsApp/Telegram |
| template_id | string | true | ID do template de mensagem |
| result_data | object | true | Dados do resultado processados |

Response:
| Param Name | Param Type | Description |
|------------|------------|-------------|
| message_id | string | ID da mensagem enviada |
| status | string | Status do envio |

## 5.Server architecture diagram

```mermaid
graph TD
    A[API Gateway] --> B[Auth Middleware]
    B --> C[Scrape Controller]
    B --> D[Evolution Controller]
    B --> E[Results Controller]
    B --> F[Groups Controller]
    
    C --> G[Scrape Service]
    D --> H[Evolution Service]
    E --> I[Results Service]
    F --> J[Groups Service]
    
    G --> K[Proxy Pool]
    G --> L[Queue Manager]
    H --> M[Evolution API Client]
    I --> N[Supabase Repository]
    J --> N
    
    K --> O[External Sources]
    L --> P[Redis Bull Queue]
    M --> Q[WhatsApp/Telegram]

    subgraph "Controller Layer"
        C
        D
        E
        F
    end

    subgraph "Service Layer"
        G
        H
        I
        J
    end

    subgraph "Repository Layer"
        N
        K
        L
    end

    subgraph "External Layer"
        O
        P
        Q
    end
```

## 6.Data model

### 6.1 Data model definition

```mermaid
erDiagram
    USERS ||--o{ SCRAPE_SOURCES : manages
    USERS ||--o{ GROUPS : manages
    USERS ||--o{ TEMPLATES : creates
    SCRAPE_SOURCES ||--o{ SCRAPE_RESULTS : produces
    GROUPS ||--o{ SCHEDULES : has
    GROUPS ||--o{ MESSAGE_LOGS : receives
    TEMPLATES ||--o{ MESSAGE_LOGS : uses
    SCHEDULES ||--o{ SCRAPE_TASKS : triggers

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string name
        string role
        timestamp created_at
        timestamp updated_at
    }
    
    SCRAPE_SOURCES {
        uuid id PK
        uuid user_id FK
        string name
        string url
        json headers
        string selector_config
        boolean is_active
        integer priority
        timestamp last_scraped
        timestamp created_at
    }
    
    SCRAPE_RESULTS {
        uuid id PK
        uuid source_id FK
        date game_date
        string game_type
        string result_number
        string animal_name
        json raw_data
        boolean is_validated
        timestamp scraped_at
    }
    
    GROUPS {
        uuid id PK
        uuid user_id FK
        string platform
        string group_id
        string group_name
        string evolution_instance_id
        boolean is_active
        json settings
        timestamp created_at
    }
    
    TEMPLATES {
        uuid id PK
        uuid user_id FK
        string name
        string content
        json variables
        boolean is_default
        timestamp created_at
        timestamp updated_at
    }
    
    SCHEDULES {
        uuid id PK
        uuid group_id FK
        uuid template_id FK
        string frequency
        json time_config
        boolean is_active
        timestamp next_run
        timestamp created_at
    }
    
    SCRAPE_TASKS {
        uuid id PK
        uuid schedule_id FK
        string status
        json result_data
        string error_message
        integer retry_count
        timestamp started_at
        timestamp completed_at
    }
    
    MESSAGE_LOGS {
        uuid id PK
        uuid group_id FK
        uuid template_id FK
        uuid result_id FK
        string message_id
        string status
        json response_data
        timestamp sent_at
    }
    
    PROXY_POOL {
        uuid id PK
        string host
        integer port
        string username
        string password
        boolean is_active
        integer success_count
        integer fail_count
        timestamp last_used
        timestamp created_at
    }
```

### 6.2 Data Definition Language

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('master', 'admin', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scrape sources table
CREATE TABLE scrape_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    headers JSONB DEFAULT '{}',
    selector_config TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    last_scraped TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scrape results table
CREATE TABLE scrape_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES scrape_sources(id) ON DELETE CASCADE,
    game_date DATE NOT NULL,
    game_type VARCHAR(50) NOT NULL,
    result_number VARCHAR(10) NOT NULL,
    animal_name VARCHAR(50),
    raw_data JSONB NOT NULL,
    is_validated BOOLEAN DEFAULT false,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('whatsapp', 'telegram')),
    group_id VARCHAR(100) NOT NULL,
    group_name VARCHAR(200) NOT NULL,
    evolution_instance_id VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates table
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedules table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'custom')),
    time_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    next_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proxy pool table
CREATE TABLE proxy_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    username VARCHAR(100),
    password VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    success_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_scrape_results_game_date ON scrape_results(game_date);
CREATE INDEX idx_scrape_results_game_type ON scrape_results(game_type);
CREATE INDEX idx_groups_platform ON groups(platform);
CREATE INDEX idx_schedules_next_run ON schedules(next_run) WHERE is_active = true;
CREATE INDEX idx_proxy_pool_active ON proxy_pool(is_active) WHERE is_active = true;

-- Grant permissions
GRANT SELECT ON ALL TABLES TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES TO authenticated;
```

## 7.Integration Specifications

### 7.1 Evolution API v2 Configuration

```javascript
// Configuração base Evolution API
const evolutionConfig = {
  baseURL: process.env.EVOLUTION_API_URL,
  apiKey: process.env.EVOLUTION_API_KEY,
  instanceName: process.env.EVOLUTION_INSTANCE_NAME
};

// Endpoints utilizados
const endpoints = {
  sendText: '/message/sendText/{{instance}}',
  sendImage: '/message/sendImage/{{instance}}',
  createInstance: '/instance/create',
  connectionState: '/instance/connectionState/{{instance}}'
};
```

### 7.2 Proxy Rotation System

```javascript
// Configuração de proxy rotation
class ProxyRotationService {
  private proxyPool: Proxy[];
  private currentIndex: number = 0;
  
  async getNextProxy(): Promise<Proxy> {
    const proxy = this.proxyPool[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxyPool.length;
    return proxy;
  }
  
  async markProxyFailed(proxyId: string): Promise<void> {
    // Incrementar fail_count e desativar se necessário
  }
}
```

### 7.3 Message Template Variables

```javascript
// Variáveis disponíveis nos templates
const templateVariables = {
  '{data}': 'DD/MM/YYYY',
  '{hora}': 'HH:MM',
  '{resultado}': 'Número do resultado',
  '{bicho}': 'Nome do bicho',
  '{grupo}': 'Grupo do bicho',
  '{dezena}': 'Dezena do resultado',
  '{centena}': 'Centena do resultado'
};
```