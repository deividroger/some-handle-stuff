# some-handle-stuff

API de tarefas em Go com arquitetura ports and adapters, Postgres e Swagger.

## Estrutura

```
docker-compose.yml                           api + postgres
src/api/cmd/api                              composition root
src/api/internal/core/{domain,ports,service} regras de negócio (sem dependência de adapters)
src/api/internal/adapters/inbound/httpapi    adapter HTTP
src/api/internal/adapters/outbound/postgres  repositório pgx + migrations embutidas
src/api/internal/adapters/outbound/idgen     gerador de IDs
src/api/docs/                                Swagger gerado (swag)
src/todo-ui                                  frontend React + TypeScript (Vite)
```

## Rodando com Docker

```
docker compose up --build
```

- UI (React): http://localhost:3000 (nginx faz proxy de `/api/*` para a API)
- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger/index.html
- Migrations rodam automaticamente na inicialização da API.

Variáveis opcionais: copie `.env.example` para `.env`.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | /healthz | health check |
| GET | /tasks | lista tarefas |
| POST | /tasks | cria tarefa `{"title": "..."}` |
| GET | /tasks/{id} | busca tarefa |
| POST | /tasks/{id}/complete | conclui tarefa |
| DELETE | /tasks/{id} | remove tarefa |

## Desenvolvimento

Frontend (`src/todo-ui`): `npm test` (Vitest + Testing Library), `npm run test:watch`, `npm run lint`, `npm run build`.

API, dentro de `src/api`:

```
go test ./...
go run github.com/swaggo/swag/cmd/swag@latest init -g cmd/api/main.go --parseDependency --parseInternal   # regenera docs/
DATABASE_URL=postgres://tasks:tasks@localhost:5432/tasks?sslmode=disable go run ./cmd/api
```
