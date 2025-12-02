# Propsail - Login con 2FA

Backend NestJS minimalista enfocado en la historia US-LOGIN-002 del documento `auth-login-2fa-spec.md`: validación del token 2FA y emisión de un JWT.

## Stack

- NestJS 11 + TypeScript.
- Prisma ORM con MariaDB/MySQL.
- @nestjs/jwt para emitir el `accessToken` cuando el reto 2FA es válido.
- Servicios concentrados en `AuthService` + Prisma para resolver exclusivamente la validación 2FA.

## Estructura del proyecto

```
propsail-backend/
|-- prisma/
|   |-- schema.prisma
|   `-- migrations/
|-- src/
|   |-- main.ts
|   |-- app.module.ts
|   |-- config/
|   |   `-- app-config.module.ts
|   |-- common/
|   |-- core/
|   |-- infra/
|   |   `-- database/       # PrismaService
|   `-- modules/
|       `-- auth/
`-- test/
    |-- e2e/
    `-- unit/               # pendiente
```

## Puesta en marcha

1. Copia `.env.example` a `.env` y define `DATABASE_URL`, `JWT_SECRET` y (opcional) `JWT_EXPIRES_IN_SECONDS`.
2. Instala dependencias: `npm install`.
3. Genera Prisma Client y aplica la migración inicial: `npx prisma migrate deploy`.
4. Ejecuta la API:
   - Desarrollo: `npm run start:dev`.
   - Producción: `npm run start:prod`.

## Endpoints disponibles

| Método + ruta          | Descripción                                                   | Body esperado                               |
| ---------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| `POST /auth/verify-2fa`| Segundo factor: valida el token y entrega un JWT.             | `{ challengeId, token }`                    |

> Nota: los retos 2FA (`TwoFactorToken`) se asumen creados externamente (semilla, proceso previo o pruebas) y los usuarios ya existen en la base de datos; este backend s??lo implementa la validaci??n del segundo factor.

### Detalle del flujo `POST /auth/verify-2fa`

1. Se recibe `challengeId` + `token` (exactamente 6 dígitos).
2. El backend busca el reto, valida que pertenezca a un usuario activo y que no esté expirado ni usado.
3. Si es correcto:
   - Marca `used=true` en `TwoFactorToken`.
   - Genera un JWT `accessToken` con `sub=user.id`, firmado con `JWT_SECRET` y vigencia configurable (`JWT_EXPIRES_IN_SECONDS`, 900 s por defecto).
   - Responde `{ accessToken, expiresIn, tokenType }`.
4. Si falla alguna validación se responde **401** con `Token inválido o expirado`.

### Roadmap inmediato

- US-LOGIN-002: listo. `/auth/verify-2fa` valida el token, marca el reto como usado y emite `accessToken`.
- Próximo paso sugerido: agregar generación/reenvío de tokens 2FA (US-LOGIN-001/003) o bloqueo por intentos fallidos (US-LOGIN-004).


