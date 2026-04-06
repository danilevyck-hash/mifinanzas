import Link from "next/link";

export default function PrivacidadPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-primary">Politica de Privacidad</h1>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <p className="text-muted text-xs">Ultima actualizacion: abril 2026</p>

        <section>
          <h2 className="font-semibold text-primary mb-1">1. Datos que recopilamos</h2>
          <p>
            MiFinanzas recopila unicamente la informacion que ingresas voluntariamente:
          </p>
          <ul className="list-disc ml-5 mt-1 space-y-0.5">
            <li>Nombre de usuario y nombre para mostrar</li>
            <li>Contrasena (almacenada de forma encriptada)</li>
            <li>Gastos personales: monto, descripcion, categoria, metodo de pago y fecha</li>
            <li>Categorias personalizadas</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-primary mb-1">2. Almacenamiento de datos</h2>
          <p>
            Tus datos se almacenan de forma segura en Supabase (PostgreSQL en la nube).
            La conexion entre tu dispositivo y nuestros servidores esta protegida con
            encriptacion HTTPS.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-primary mb-1">3. Compartir datos</h2>
          <p>
            No compartimos, vendemos ni transferimos tus datos personales a terceros.
            MiFinanzas es una aplicacion de uso personal y tus datos son accesibles
            unicamente por ti.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-primary mb-1">4. Eliminacion de datos</h2>
          <p>
            Puedes solicitar la eliminacion completa de tu cuenta y todos tus datos
            en cualquier momento. Para hacerlo, contactanos directamente y procederemos
            a eliminar toda tu informacion de nuestros servidores.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-primary mb-1">5. Cookies y sesion</h2>
          <p>
            MiFinanzas utiliza unicamente un token de sesion almacenado en tu navegador
            para mantener tu sesion activa. No utilizamos cookies de rastreo, publicidad
            ni analiticas de terceros.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-primary mb-1">6. Contacto</h2>
          <p>
            Si tienes preguntas sobre esta politica de privacidad o sobre tus datos,
            puedes contactarnos a traves del administrador de la aplicacion.
          </p>
        </section>
      </div>

      <div className="text-center">
        <Link href="/" className="text-blue-500 text-sm hover:underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
