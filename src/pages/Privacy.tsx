import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Shield, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 pb-12 pt-6">
      <div className="mx-auto max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 text-muted-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Volver
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="font-display text-3xl tracking-wide text-foreground">
              POLÍTICA DE PRIVACIDAD
            </h1>
          </div>

          <p className="text-xs text-muted-foreground">
            Última actualización: 3 de abril de 2026
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">1. Información General</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">JOSE DIAZ FIT SCAN</strong> (en adelante, "la Plataforma", "nosotros" o "nuestro") es una aplicación de asesoría fitness y nutrición personalizada operada por Jose Diaz. Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos su información personal cuando utiliza nuestra plataforma.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Al registrarse y usar JOSE DIAZ FIT SCAN, usted acepta las prácticas descritas en esta política. Le recomendamos leerla detenidamente.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">2. Datos que Recopilamos</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">Recopilamos los siguientes tipos de datos personales:</p>
            <ul className="ml-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Datos de registro:</strong> nombre completo, dirección de correo electrónico, número de teléfono y contraseña cifrada.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Datos biométricos y de salud:</strong> edad, sexo, peso, altura, nivel de actividad física, porcentaje de grasa corporal estimado, y fotos de progreso físico.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Datos nutricionales:</strong> escaneos de alimentos, registros de comidas, planes de dieta personalizados y objetivos calóricos.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Datos de uso:</strong> interacciones con el coach virtual, rutinas de entrenamiento guardadas, conversaciones dentro de la aplicación e imágenes compartidas en el chat.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Datos técnicos:</strong> dirección IP, tipo de dispositivo, sistema operativo, navegador y datos de análisis de uso.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">3. Uso de la Información</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">Utilizamos sus datos personales para:</p>
            <ul className="ml-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Crear y gestionar su cuenta de usuario.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Calcular planes nutricionales y de entrenamiento personalizados basados en sus datos físicos y objetivos.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Proveer asesoramiento fitness y nutricional a través del coach virtual con inteligencia artificial.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Analizar fotografías de alimentos para estimar valores nutricionales.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Hacer seguimiento de su progreso físico a lo largo del tiempo.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Mejorar continuamente nuestros servicios y la experiencia del usuario.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Enviar comunicaciones relacionadas con el servicio (actualizaciones, recordatorios, notificaciones).</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">4. Inteligencia Artificial y Procesamiento de Datos</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              JOSE DIAZ FIT SCAN utiliza modelos de inteligencia artificial para proporcionar asesoramiento personalizado. Las imágenes y textos enviados al coach virtual son procesados por modelos de IA para generar respuestas relevantes. Estos datos se procesan de forma segura y no se comparten con terceros para fines comerciales.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">5. Almacenamiento y Seguridad</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sus datos se almacenan en servidores seguros con cifrado en tránsito (TLS/SSL) y en reposo. Implementamos medidas de seguridad técnicas y organizativas apropiadas, incluyendo:
            </p>
            <ul className="ml-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Cifrado de contraseñas mediante algoritmos de hash seguros.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Políticas de seguridad a nivel de base de datos (Row Level Security) que garantizan que cada usuario solo acceda a sus propios datos.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Autenticación segura con tokens JWT.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Monitoreo continuo de accesos y actividad sospechosa.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">6. Compartición de Datos con Terceros</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">No vendemos ni compartimos</strong> sus datos personales con terceros para fines publicitarios. Solo compartimos información con:
            </p>
            <ul className="ml-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Proveedores de infraestructura:</strong> servicios de hosting y base de datos necesarios para operar la plataforma, bajo estrictos acuerdos de confidencialidad.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Procesadores de pago:</strong> cuando aplique, para gestionar suscripciones premium de forma segura.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Autoridades legales:</strong> únicamente cuando sea requerido por ley o por orden judicial.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">7. Derechos del Usuario</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">Usted tiene derecho a:</p>
            <ul className="ml-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Acceso:</strong> solicitar una copia de los datos personales que tenemos sobre usted.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Rectificación:</strong> corregir datos inexactos o incompletos desde su perfil.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Eliminación:</strong> solicitar la eliminación de su cuenta y todos los datos asociados.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Portabilidad:</strong> solicitar sus datos en un formato estructurado y legible por máquina.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Oposición:</strong> oponerse al procesamiento de sus datos para determinados fines.</span>
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Para ejercer cualquiera de estos derechos, puede contactarnos a través de la aplicación o enviando un correo a <span className="text-primary">josediaztrainer@gmail.com</span>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">8. Retención de Datos</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Conservamos sus datos personales mientras mantenga una cuenta activa en la plataforma. Si solicita la eliminación de su cuenta, todos sus datos serán eliminados de nuestros servidores en un plazo máximo de 30 días, excepto aquellos que debamos conservar por obligaciones legales.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">9. Menores de Edad</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              JOSE DIAZ FIT SCAN está diseñada exclusivamente para personas mayores de 18 años. Al utilizar esta plataforma, usted declara y garantiza que tiene al menos 18 años de edad. No recopilamos intencionalmente datos de menores de 18 años. Si detectamos que un menor ha proporcionado datos personales, procederemos a eliminar dicha información de inmediato.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">10. Cookies y Tecnologías de Seguimiento</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Utilizamos cookies técnicas y de sesión estrictamente necesarias para el funcionamiento de la plataforma. No utilizamos cookies de terceros con fines publicitarios. Los datos de análisis se procesan de forma agregada y anónima.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">11. Cambios en esta Política</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento. Los cambios serán notificados a través de la aplicación. El uso continuado de la plataforma después de cualquier modificación constituye la aceptación de los nuevos términos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">12. Términos y Condiciones de Uso</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Al utilizar JOSE DIAZ FIT SCAN, usted acepta los siguientes términos:
            </p>
            <ul className="ml-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>La plataforma ofrece asesoría fitness y nutricional con fines informativos y educativos. <strong className="text-foreground">No sustituye el consejo médico profesional.</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Usted es responsable de consultar a un profesional de la salud antes de iniciar cualquier programa de ejercicios o dieta.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Las estimaciones nutricionales generadas por escaneo de alimentos son aproximadas y no deben considerarse como valores exactos.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>JOSE DIAZ FIT SCAN no se hace responsable de lesiones, daños o efectos adversos derivados del uso de las recomendaciones proporcionadas.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Queda prohibido compartir, revender o distribuir el contenido de la plataforma sin autorización expresa.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos o hagan uso indebido de la plataforma.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">13. Contacto</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Para cualquier consulta, solicitud o reclamo relacionado con esta Política de Privacidad o los Términos y Condiciones, puede contactarnos a:
            </p>
            <div className="rounded-lg border border-border bg-card p-4 space-y-1">
              <p className="text-sm text-foreground font-medium">JOSE DIAZ FIT SCAN</p>
              <p className="text-sm text-muted-foreground">📧 soporte@josediazfitscan.com</p>
              <p className="text-sm text-muted-foreground">🌐 josediazfitscan.lovable.app</p>
            </div>
          </section>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-xs text-primary">
              <Shield className="mr-1 inline h-3 w-3" />
              Al usar JOSE DIAZ FIT SCAN, usted confirma haber leído, entendido y aceptado esta Política de Privacidad y los Términos y Condiciones de Uso.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;
