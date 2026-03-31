# REPORT SCRAPPER SERVICE

El objectivo de este servicio es leer el reporte en formato .csv que se descarga de la impresora y guardar los datos en la base de datos para cada uno de los usuarios.

## Formato del CSV

- El separador de campos es el caracter TAB
- Descripcion de filas
  - La fila 1 es el nombre de la impresora
  - La fila 2 es el numero de serie de la impresora
  - La fila 3 es la fecha y hora de generación del reporte
  - Las filas 4, 5 y 6 son nombres de cabeceras
  - La fila 7 es una fila espaciadora sin datos
  - Las filas 8 en adelante son los datos de los usuarios
- Las de columnas de datos de los usuarios:
  - Columna 1: Nombre del usuario
  - Columna 2: Total Counter
  - Columna 3: Total Large Size Counter
  - Columna 4: No. of Originals Counter
  - Columna 5: No. of Prints Counter
  - Columna 6: Duplex Print Counter
  - Columna 7: Total No. Pages Output
  - Columnas 8 a 12: Datos de copias A3 + A4
    - Columna 8: total
    - Columna 9: Full color
    - Columna 10: Black
    - Columna 11: 2 Color
    - Columna 12: Single Color
  - Columnas 13 a 17: Datos de copias A3
    - Columna 13: total
    - Columna 14: Full color
    - Columna 15: Black
    - Columna 16: 2 Color
    - Columna 17: Single Color
  - Columnas 18 a 21: Datos de impresiones A3 + A4
    - Columna 18: total
    - Columna 19: Full color
    - Columna 20: Black
    - Columna 21: 2 Color
  - Columnas 22 a 25: Datos de impresiones A3
    - Columna 22: total
    - Columna 23: Full color
    - Columna 24: Black
    - Columna 25: 2 Color
  - Columnas 26 hacia adelante: Son datos ignorados.

### csv example

```CSV
Machine Name    C224e 
Serial No.    A5C4021034327 
Date    31/3/2026 10:36 
User Name Total Counter Total Large Size Counter No. of Originals Counter No. of Prints Counter Duplex Print Counter Total No. Pages Output Copy          Printer        Color        Scan / Fax       
       Total     Large Size     Total    Large Size    Total    Large Size    Total    Large Size   
       Total Full Color Black 2 Color Single Color Total Full Color Black 2 Color Single Color Total Full Color Black 2 Color Total Full Color Black 2 Color Full Color Black 2 Color Single Color Full Color Black 2 Color Single Color Print(Full Color) Print(Black) Scans Fax TX Print(Full Color) Print(Black) Scans 
                                        
Martiño 13 0 13 11 2 13 2 2 0 0 0 0 0 0 0 0 11 4 7 0 0 0 0 0 6 7 0 0 0 0 0 0 0 0 294 0 0 0 0 
Maria 51 5 46 35 11 46 0 0 0 0 0 0 0 0 0 0 51 26 25 0 5 5 0 0 26 25 0 0 5 0 0 0 0 0 28 0 0 0 0 
```

## Calculo de copias para cada usuario

Para el calculo de las copias realizadas por el usuario se deben tener en cuenta los siguientes campos y caculos:

- `a4Color` = (Index 8 - (Index 13 *2)) + (Index 18 - (Index 22* 2))
- `a4Bw` = (Index 9 - (Index 14 *2)) + (Index 19 - (Index 23* 2))
- `a3Color` = (Index 13 + Index 22) (si no es Planb)
- `a3Bw` = (Index 14 + Index 23) (si no es Planb)

### Implementación Técnica

La lógica de scraping se basa en una lectura síncrona en `utf16le` y el uso del separador TAB. El script CLI permite validar rápidamente nuevas exportaciones de la impresora.

```bash
# Ejecución manual desde el root:
npx tsx core/scripts/parse-report.ts <PATH_AL_REPORTE>
```

El nombre de los usuarios en case senstive.
