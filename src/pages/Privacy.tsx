import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Shield, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const Privacy = () => {
  const navigate = useNavigate();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isAdult, setIsAdult] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!acceptedTerms || !isAdult) {
      toast.error("Debes aceptar ambas condiciones para continuar");
      return;
    }
    setConfirmed(true);
    toast.success("✅ Has aceptado los Términos y Condiciones");
    setTimeout(() => navigate(-1), 1500);
  };

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
              <p className="text-sm text-muted-foreground">📧 josediaztrainer@gmail.com</p>
              <p className="text-sm text-muted-foreground">🌐 josediazfitscan.lovable.app</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">14. Legislación Aplicable</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Esta Política de Privacidad y los Términos y Condiciones se rigen por las leyes de la República del Perú, incluyendo pero no limitándose a:
            </p>
            <ul className="ml-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Ley N° 29733</strong> — Ley de Protección de Datos Personales y su Reglamento (D.S. N° 003-2013-JUS).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Ley N° 29571</strong> — Código de Protección y Defensa del Consumidor.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong className="text-foreground">Decreto Legislativo N° 1390</strong> — Modificatoria de la Ley de Protección de Datos Personales.</span>
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Cualquier controversia será sometida a los tribunales competentes de la ciudad de Lima, Perú.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">15. Exención de Responsabilidad</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              JOSE DIAZ FIT SCAN proporciona información y asesoramiento fitness y nutricional con <strong className="text-foreground">carácter exclusivamente informativo y educativo</strong>. La plataforma <strong className="text-foreground">NO constituye un servicio médico, diagnóstico ni tratamiento</strong>. El usuario reconoce y acepta que:
            </p>
            <ul className="ml-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Debe consultar a un profesional de la salud antes de iniciar cualquier programa de ejercicio o régimen alimenticio.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Los resultados pueden variar según cada individuo y no están garantizados.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>JOSE DIAZ FIT SCAN, sus creadores, operadores y colaboradores quedan <strong className="text-foreground">exentos de toda responsabilidad</strong> por lesiones, daños físicos, problemas de salud o cualquier perjuicio directo o indirecto derivado del uso de la plataforma.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>El uso de la plataforma es bajo la <strong className="text-foreground">total y exclusiva responsabilidad del usuario</strong>.</span>
              </li>
            </ul>
          </section>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-xs text-primary">
              <Shield className="mr-1 inline h-3 w-3" />
              Al usar JOSE DIAZ FIT SCAN, usted confirma haber leído, entendido y aceptado esta Política de Privacidad, los Términos y Condiciones de Uso, y la Exención de Responsabilidad.
            </p>
          </div>

          {/* Confirmation section */}
          {!confirmed ? (
            <div className="space-y-4 rounded-lg border border-border bg-card p-5">
              <h3 className="text-center font-display text-lg tracking-wide text-foreground">CONFIRMACIÓN</h3>
              
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="accept-terms" className="text-sm leading-relaxed text-muted-foreground cursor-pointer">
                  He leído, entendido y <strong className="text-foreground">acepto la Política de Privacidad, los Términos y Condiciones de Uso</strong> y la Exención de Responsabilidad de JOSE DIAZ FIT SCAN.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-age"
                  checked={isAdult}
                  onCheckedChange={(checked) => setIsAdult(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="accept-age" className="text-sm leading-relaxed text-muted-foreground cursor-pointer">
                  Declaro que <strong className="text-foreground">soy mayor de 18 años</strong> y tengo capacidad legal para aceptar estos términos.
                </label>
              </div>

              <Button
                onClick={handleConfirm}
                disabled={!acceptedTerms || !isAdult}
                className="w-full font-display text-lg tracking-wider box-glow"
              >
                <Shield className="mr-2 h-5 w-5" />
                CONFIRMO QUE ESTOY DE ACUERDO
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-5 text-center space-y-2">
              <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
              <p className="font-display text-lg tracking-wide text-green-500">¡ACEPTADO!</p>
              <p className="text-xs text-muted-foreground">Has aceptado los Términos y Condiciones. Redirigiendo...</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;
