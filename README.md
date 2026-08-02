# Rotación de primeros violines

Registro de la rotación de la fila de primeros violines: cuántos puntos acumuló cada músico
por temporada y quién entra primero cuando un concierto necesita menos violines.

Es una sola página estática (`index.html`) contra Supabase. No hay build ni dependencias
—ni siquiera un CDN externo: el cliente de Supabase está escrito a mano contra la API REST,
así la página carga aunque la red bloquee otros dominios.

Publicada en https://prog-collab.github.io/rotacion-violines/

## El puntaje es acumulativo

El total **no se reinicia** cada año: cada temporada arranca con el acumulado de la anterior.
La tabla muestra `Total <año>` (arrastre + lo de la temporada) y, al lado, la columna `Arrastre`
con lo que traía de antes. La rotación se decide por el total acumulado.

## Permisos

- **Cualquiera con el link ve la tabla**, sin ingresar.
- **Solo los emails cargados en `viol_editores`** pueden modificar puntajes, conciertos y músicos.
  Eso lo garantizan las políticas RLS de Postgres, no el navegador: aunque alguien edite el HTML,
  el servidor rechaza la escritura.
- Un editor da de alta a otro desde el botón **Editores**. El nuevo editor entra por
  **Ingresar → Crear / restablecer clave**, define su contraseña y ya puede editar.

## Licencias largas y reintegro

Cuando alguien se toma una licencia de larga duración se le carga el período desde el botón
**Licencias** (músico, desde, hasta — vacío si todavía no volvió). En los conciertos que caen
dentro del período su celda muestra **L** en vez de un puntaje, y esa persona queda fuera del
promedio que se calcula para los demás.

Al reintegrarse vuelve con **el puntaje que traía + el promedio de lo que sumaron los demás
durante su ausencia**. Eso lo calcula el botón **Calcular reintegro**: se elige el músico y las
dos fechas (se prellenan solas si tiene la licencia cargada) y sale el detalle concierto por
concierto, el promedio del período y el total con el que se reintegra.

El promedio se arma concierto por concierto: en cada uno se promedia a los músicos activos
de la fila, sin contar al ausente ni a quien también estuviera de licencia esa fecha, y después
se suman esos promedios. Así una licencia que arranca o termina en medio del período no
distorsiona el número. La calculadora **solo muestra** el resultado: los puntos se cargan a mano.

## Formación en el escenario

Abajo de la tabla hay un esquema visual de la fila: el director arriba y los **7 atriles**
en columna debajo (la cantidad se cambia con el campo *Atriles*, hasta 12), el 1 adelante.
Cada atril tiene sus **dos sillas**: la 1 es la de la derecha y la 2 la de la izquierda —
se dibujan en ese orden, así que el primer nombre de cada atril aparece a la derecha.
En el atril 1 las sillas se rotulan *concertino* y *suplente*.

La cantidad de atriles no se carga: sale de la gente que se sienta, dos por atril.

### Qué muestra el desplegable

- **Formación original (fila completa)** — todos, en el orden de la fila, incluidos los que
  están de licencia. Es la referencia de dónde va cada uno.
- **Un concierto ya tocado** — se sientan **los que tienen puntaje mayor a cero** en ese
  concierto, en el orden de la fila: los que no tocaron no ocupan silla y los demás se corren
  hacia adelante manteniendo el orden relativo. Estar de licencia cuenta igual que tener cero,
  así que tampoco aparece. Abajo se lista quiénes no tocaron. Esto sale de los puntajes, así
  que no hay nada que cargar ni que pueda quedar desactualizado.
- **Un concierto sin puntajes todavía** (el próximo) — ahí sí la formación es una decisión:
  los editores asignan los nombres desde el desplegable de cada silla y se guarda en
  `viol_formacion`. Nadie puede quedar sentado dos veces: si se elige a alguien que ya estaba
  en otro atril, esa silla se libera sola.

Arranca en el primer concierto que todavía no pasó. En la formación original, los que están
de licencia se marcan en naranja.

### Reacomodar un concierto

Sobre un concierto con puntajes, un editor puede **arrastrar una tarjeta** a otra silla o
**arrastrar la cabecera del atril** para llevarlo entero, con sus dos músicos.

No es un intercambio: el que se mueve se saca de su lugar y se mete en el destino, y **la fila
se corre**. Si alguien del atril 2 baja al 4, los que estaban en el medio avanzan un lugar; si
sube, retroceden. Un atril llevado más atrás hace subir un puesto a los que quedan delante.
La cantidad de atriles es siempre la justa para la gente que toca esa fecha.

En pantalla táctil funciona tocando primero lo que se mueve y después el destino; un toque
suelto en el gráfico no mueve nada.

Lo movido se guarda en `viol_formacion` y pasa a mandar sobre lo derivado de los puntajes.
**Volver a la formación original** borra esos movimientos y la formación vuelve a salir de
quién tocó.

Las columnas que son un **ajuste de puntaje** y no un concierto (el redondeo del 30/7/26, la
columna de ajuste de la planilla 2025) quedan fuera del desplegable: suman en la tabla pero no
tienen formación. Se marcan con la casilla *Es un ajuste de puntaje* del diálogo de concierto
(`viol_conciertos.ajuste`).

### Quién entra y dónde se sienta

Son dos decisiones distintas:

- **Quién entra** lo decide la rotación: los de menor puntaje acumulado. El que está de
  licencia no ocupa silla: la suya se libera y la fila se corre.
- **Dónde se sienta** lo decide el **orden de la fila completa** (`viol_musicos.orden_fila`):
  nadie se adelanta a quien tenía delante.

Para el concierto que todavía no tocó, **Armar por rotación** sienta a los mejor posicionados
hasta cubrir los violines que pide el campo *Se necesitan N violines* del panel de rotación,
ubicándolos por orden de fila. **Fijar orden de la fila** toma la formación que se está viendo
y la guarda como el nuevo orden base. **Vaciar** borra la formación de ese concierto.

El orden base cargado (fila completa) es: Raúl · Pablo · Marian · Miguel · Julieta · Fabián ·
Ana · Fernanda · Diego · Juan Samuel · Ronald · Margarita · Gaspar · Martín.

Las formaciones decididas a mano se guardan en `viol_formacion` (PK: concierto + atril + silla).

## Escala de puntaje (desde 2026)

| Puntos | Caso |
|---|---|
| 1 | Concierto + su semana de ensayo |
| 0,5 | Medio programa, o alguna obra del concierto |
| 2 | Concierto con 2 semanas de ensayo |
| 0 | No participó |

La temporada 2025 quedó cargada con la escala vieja (incluye valores de 0,75), tal cual la planilla original.

2025 tiene además una columna **"Ajuste planilla original"**: los totales por músico se tomaron de la
planilla, pero el detalle concierto por concierto se leyó de una captura de pantalla y en 6 filas no
cerraba. El ajuste absorbe esa diferencia para que el total coincida exacto. Cuando aparezca el detalle
real, se corrigen esas celdas y el ajuste vuelve a 0.

## Uso

- **Temporada**: cambia el año que se muestra. El total y el ranking se calculan por temporada.
- **Ordenar por → Puntaje**: deja arriba a los que menos tocaron.
- **Ordenar por → Por atril**: muestra la tabla en el orden de la fila completa (`orden_fila`),
  el mismo que usa el esquema del escenario.
- **Próxima rotación**: se pone cuántos violines se necesitan y marca a los que entran. Abajo
  de la lista se aclara hasta qué concierto están sumados los puntos, que es el último con
  puntajes cargados.
- **+ Concierto** deja los puntajes cargados de una: se le da el puntaje del concierto a los
  N de menor puntaje acumulado (N sale del campo *Violines*, que arranca en el del panel de
  rotación), salteando a los que están de licencia. El puntaje por cabeza se propone según las
  semanas de ensayo —2 semanas, 2 puntos— y las celdas siguen editándose a mano como siempre.
  La casilla se puede destildar para crear el concierto vacío.
- Editando: click en el encabezado de una columna (tiene un ✎) para editar o borrar ese concierto;
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
