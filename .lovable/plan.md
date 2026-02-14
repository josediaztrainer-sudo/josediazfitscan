

# JOSE DIAZ SCAN – MVP Web Premium 🔥

**Webapp responsive con estética fitness premium, escaneo IA de comidas y tracking de macros para pérdida de grasa.**

---

## 1. Diseño & Branding Premium
- Tema dark mode completo: negro profundo (#0A0A0A / #111111) con amarillo neón gold (#FFCC00 / #FFD700)
- Efecto glow sutil en logo, botones principales y elementos destacados
- Tipografías: Bebas Neue para títulos impactantes, Inter para cuerpo
- Frases motivadoras rotativas en pantallas clave: "ESCANEA. QUEMA. DOMINA." y más
- Diseño mobile-first responsive (se siente como app nativa en el celular)

## 2. Auth + Onboarding
- Login con email/contraseña y Google Sign-In
- Onboarding paso a paso: edad, sexo, peso (kg), altura (cm), nivel de actividad, objetivo
- Cálculo automático de TDEE (Mifflin-St Jeor) + macros personalizados
- Proteína objetivo: 2.2-2.6 g/kg, distribución 35-45% proteína, 30-40% carbos, 20-30% grasas
- Perfil de usuario con datos editables

## 3. Escaneo IA de Comidas (Feature Estrella)
- Captura con cámara del celular o subir foto de galería
- Análisis con Lovable AI (Gemini) optimizado para comida peruana y latina
- Prompt experto que identifica alimentos, estima porciones en gramos, calcula calorías y macros completos
- Resultados visuales con lista de alimentos detectados
- Slider para ajustar porciones después del análisis
- Guardar comida al diario con un toque

## 4. Dashboard / Diario Diario
- Barra circular animada de calorías (muestra restantes en grande)
- Gráfico dona de macros con colores (verde = proteína, prioridad visual alta)
- Lista de comidas del día con totales acumulados
- Alertas visuales rojas si excede calorías o macros
- Histórico semanal con gráficos de progreso

## 5. Coach IA Motivador
- Chat con IA estilo entrenador duro-motivador en español peruano
- Contexto automático del historial del usuario y sus metas
- Sugerencias personalizadas basadas en lo que comió hoy
- Tono: "Tu músculo te lo agradecerá" / "La grasa no negocia"

## 6. Sistema de Suscripción
- 7 días de trial gratuito completo al registrarse
- Pantalla premium con QR de Yape (número 960300099) para pago manual S/9.90/mes
- Campo para subir captura de pago como comprobante
- Flag en base de datos para verificación (aprobación manual inicial)
- Paywall que bloquea escaneo IA y coach después del trial

## 7. Backend (Lovable Cloud)
- Base de datos: perfiles de usuario, registros diarios, historial de escaneos, comprobantes de pago
- Edge functions para escaneo IA y coach IA (usando Lovable AI Gateway)
- Storage para fotos de comida y comprobantes de pago
- Seguridad con RLS: cada usuario solo ve sus datos

## Pantallas del MVP
1. **Splash** → Pantalla de carga con logo JOSE DIAZ SCAN + glow
2. **Login/Registro** → Auth con estética premium
3. **Onboarding** → Wizard de datos personales (4 pasos)
4. **Dashboard (Home)** → Calorías, macros, comidas del día, frase motivadora
5. **Escaneo** → Cámara/galería → Resultados IA → Ajustar → Guardar
6. **Coach Chat** → Conversación con IA motivadora
7. **Perfil** → Datos personales, objetivo, configuración
8. **Paywall** → Pantalla premium con QR Yape

