# Rotación de primeros violines

Registro de la rotación de la fila de primeros violines: cuántos puntos acumuló cada músico
por temporada y quién entra primero cuando un concierto necesita menos violines.

Es una sola página estática (`index.html`) contra Supabase. No hay build ni dependencias:
se puede abrir el archivo directamente o publicarlo en GitHub Pages.

## Permisos

- **Cualquiera con el link ve la tabla**, sin ingresar.
- **Solo los emails cargados en `viol_editores`** pueden modificar puntajes, conciertos y músicos.
  Eso lo garantizan las políticas RLS de Postgres, no el navegador: aunque alguien edite el HTML,
  el servidor rechaza la escritura.
- Un editor da de alta a otro desde el botón **Editores**. El nuevo editor entra por
  **Ingresar → Crear / restablecer clave**, define su contraseña y ya puede editar.

## Escala de puntaje (desde 2026)

| Puntos | Caso |
|---|---|
| 1 | Concierto + su semana de ensayo |
| 0,5 | Medio programa, o alguna obra del concierto |
| 2 | Concierto con 2 semanas de ensayo |
| 0 | No participó |

La temporada 2025 quedó cargada con la escala vieja (incluye valores de 0,75), tal cual la planilla original.

## Uso

- **Temporada**: cambia el año que se muestra. El total y el ranking se calculan por temporada.
- **Ordenar por → Puntaje**: deja arriba a los que menos tocaron.
- **Próxima rotación**: se pone cuántos violines se necesitan y marca a los que entran.
- Editando: click en el encabezado de una columna para editar o borrar ese concierto;
  doble click en el nombre de un músico para renombrarlo o darlo de baja de la fila.
- **Exportar CSV** baja la temporada visible para abrirla en Excel.

## Publicar en GitHub Pages

```bash
git remote add origin https://github.com/USUARIO/rotacion-violines.git
git push -u origin main
```

Después, en el repo: **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.
En un par de minutos queda en `https://USUARIO.github.io/rotacion-violines/`.

El repo tiene que ser público para que Pages funcione en la cuenta gratuita. Eso deja a la vista
la URL del proyecto y la *publishable key* de Supabase: es lo esperado, son datos públicos por diseño
y lo que protege los datos es RLS.

## Base de datos

Proyecto Supabase `camerino-giustozzi` (`grswqigekcopfrozcxqj`). Tablas:

- `viol_musicos` — nombre, orden en la planilla, activo
- `viol_conciertos` — temporada, fecha, etiqueta corta, título, semanas de ensayo, orden
- `viol_participaciones` — puntos de cada músico en cada concierto (PK: concierto + músico)
- `viol_editores` — emails con permiso de edición
