# INITIALIZE DB SERVICE

Este servicio asegura que la base de datos de Magma esté correctamente inicializada con un usuario administrador por defecto.

## Responsabilidades

- **Verificación**: Comprueba si el usuario con `username: "admin"` ya existe en el sistema.
- **Provisión**: Crea el usuario `admin` con el rol de administrador y credenciales por defecto si no se encuentra.

## Lógica de Inicialización

1. Buscar usuario `admin` mediante `usersRepository`.
2. Si no existe:
    - Generar UUID único.
    - Hashear la contraseña `m4gm4` usando `argon2`.
    - Asignar roles y campos obligatorios (`printUser`, `nexudusUser`).
    - Persistir en la base de datos.

## Consideraciones de Seguridad

- La contraseña por defecto `m4gm4` debe ser cambiada tras el primer acceso.
- El servicio se ejecuta una sola vez durante el arranque de la aplicación.
