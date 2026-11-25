export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://globalstocks.vercel.app";

export const SUPPORT_EMAIL = "support.globalstock@gmail.com";

export const STORE_URLS = {
  ios: process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || "",
  android: process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() || "",
  windows: process.env.NEXT_PUBLIC_MICROSOFT_STORE_URL?.trim() || ""
} as const;

export const NAV_LINKS = [
  { label: "Inicio", href: "#inicio", icon: "home" },
  { label: "Ventajas", href: "#comparativa", icon: "compare" },
  { label: "Funciones", href: "#funciones", icon: "layers" },
  { label: "Rubros", href: "#rubros", icon: "store" },
  { label: "Instalar", href: "#instalar", icon: "download" },
  { label: "Preguntas", href: "#preguntas", icon: "help" }
] as const;

export const COMPARISON_ROWS = [
  {
    aspect: "Control de stock",
    before: "Te enterás del faltante recién cuando el cliente pide el producto.",
    after: "Cada venta descuenta stock al instante y avisa qué reponer."
  },
  {
    aspect: "Cierre de caja",
    before: "Sumás efectivo y transferencias a mano y casi nunca coincide.",
    after: "Separá cada medio de pago automáticamente y cerrá en 2 minutos."
  },
  {
    aspect: "Carga de precios",
    before: "Buscás precios en listas o tipeás códigos mientras se arma fila.",
    after: "Usás la cámara de tu celular como escáner conectado a tu PC."
  },
  {
    aspect: "Ganancia real",
    before: "Sabés cuánto entró en el día, pero no cuánto ganaste limpio.",
    after: "Calculás ventas, costos y margen neto real con ayuda de IA."
  },
  {
    aspect: "Permisos de equipo",
    before: "Al prestar tu cuenta, el empleado ve tus costos y balances.",
    after: "Cada usuario entra con su acceso y ve solo lo que habilitás."
  }
] as const;

export type PainSolution = {
  id: string;
  shortTab: string;
  problemTitle: string;
  problemDetail: string;
  solutionTitle: string;
  solutionDetail: string;
  highlights: { label: string; value: string; tone: "ok" | "alert" }[];
};

export const PAIN_SOLUTIONS: PainSolution[] = [
  {
    id: "quiebre-stock",
    shortTab: "Falta de stock",
    problemTitle: "Te quedás sin mercadería clave en pleno horario pico",
    problemDetail:
      "Llevar el stock de memoria o en cuaderno hace que detectes los faltantes tarde y pierdas ventas.",
    solutionTitle: "Descuento automático y alerta de reposición",
    solutionDetail:
      "Cada cobro actualiza el inventario al segundo y arma la lista de pedido para cada proveedor.",
    highlights: [
      { label: "Yerba Mate 1 kg · Mínimo 15 un.", value: "Alerta: quedan 4 un.", tone: "alert" },
      { label: "Café Molido 500 g · Mínimo 8 un.", value: "Stock OK: 26 un.", tone: "ok" }
    ]
  },
  {
    id: "cierre-caja",
    shortTab: "Cierre de caja",
    problemTitle: "Al cerrar el día la plata del cajón no coincide",
    problemDetail:
      "Mezclar efectivo, transferencias y retiros genera diferencias y pérdida de tiempo al cierre.",
    solutionTitle: "Arqueo separado por medio de pago en 2 minutos",
    solutionDetail:
      "Global Stock clasifica cobros y movimientos del turno para darte el saldo exacto.",
    highlights: [
      { label: "Efectivo en caja (18 ventas)", value: "$ 184.500", tone: "ok" },
      { label: "Transferencias y QR (14 ventas)", value: "$ 241.200", tone: "ok" }
    ]
  },
  {
    id: "carga-lenta",
    shortTab: "Cobro lento",
    problemTitle: "Perdés tiempo buscando precios mientras se arma fila",
    problemDetail:
      "Tipear códigos largos o revisar listas impresas frena el mostrador y genera errores.",
    solutionTitle: "Cámara del celular como lector de códigos para tu PC",
    solutionDetail:
      "Vinculás tu teléfono sin cables: apuntás al código y entra directo al ticket.",
    highlights: [
      { label: "Código 7790895001428 leído con celular", value: "Cargado en < 0.3s", tone: "ok" },
      { label: "Alta de mercadería nueva", value: "+12 un. sumadas", tone: "ok" }
    ]
  },
  {
    id: "rentabilidad-real",
    shortTab: "Ganancia real",
    problemTitle: "Vendés todos los días pero no sabés cuánto ganás limpio",
    problemDetail:
      "Mirar solo la caja diaria no alcanza si subieron los costos o hay mercadería sin rotación.",
    solutionTitle: "Ganancia neta por producto y asistente con IA",
    solutionDetail:
      "Cruza ventas con costos de reposición y responde qué productos dejan mayor margen.",
    highlights: [
      { label: "Facturación últimos 30 días", value: "$ 4.820.000", tone: "ok" },
      { label: "Ganancia neta real (34% margen)", value: "$ 1.638.800", tone: "ok" }
    ]
  },
  {
    id: "permisos-equipo",
    shortTab: "Empleados",
    problemTitle: "Querés delegar la caja sin exponer costos ni balances",
    problemDetail:
      "Compartir tu cuenta principal deja visibles tus márgenes y movimientos históricos.",
    solutionTitle: "Usuarios propios con permisos por puesto",
    solutionDetail:
      "Creás accesos para cajeros o encargados y registrás quién hizo cada movimiento.",
    highlights: [
      { label: "Cajero turno tarde", value: "Solo ventas y caja", tone: "ok" },
      { label: "Costos y ganancia neta", value: "Ocultos para empleados", tone: "alert" }
    ]
  }
];

export type CoreFeature = {
  id: string;
  iconName: "pos" | "stock" | "scan" | "cash" | "suppliers" | "ai";
  name: string;
  detail: string;
};

export const CORE_FEATURES: CoreFeature[] = [
  {
    id: "pos",
    iconName: "pos",
    name: "Punto de venta ágil",
    detail: "Armá tickets en segundos y cobrá con efectivo, transferencia o tarjeta."
  },
  {
    id: "stock",
    iconName: "stock",
    name: "Stock en tiempo real",
    detail: "Cada venta descuenta unidades al instante y avisa cuando falta mercadería."
  },
  {
    id: "scan",
    iconName: "scan",
    name: "Escáner desde el celular",
    detail: "Usá la cámara de tu teléfono como lector de códigos conectado a tu PC."
  },
  {
    id: "cash",
    iconName: "cash",
    name: "Control de caja diaria",
    detail: "Seguimiento por turno para cerrar el día sin diferencias de plata."
  },
  {
    id: "suppliers",
    iconName: "suppliers",
    name: "Compras y proveedores",
    detail: "Cargá ingresos de mercadería, actualizá costos y organizá tus pedidos."
  },
  {
    id: "ai",
    iconName: "ai",
    name: "Rentabilidad e IA",
    detail: "Conocé tu ganancia neta real y consultá datos de tu negocio en español."
  }
];

export const SECTOR_GROUPS = [
  {
    category: "Comercios de cercanía y alimentos",
    examples: ["Almacenes y autoservicios", "Kioscos y maxikioscos", "Carnicerías y fiambrerías", "Verdulerías y dietéticas", "Panaderías y cafeterías"]
  },
  {
    category: "Indumentaria, hogar y cuidado personal",
    examples: ["Ropa, calzado y accesorios", "Farmacias y perfumerías", "Cosmética y estética", "Veterinarias y pet shops", "Bazar, regalería y decoración"]
  },
  {
    category: "Ferreterías, repuestos y técnica",
    examples: ["Ferreterías y corralones", "Repuestos y autopartes", "Celulares y electrónica", "Librerías y papelerías", "Ópticas y joyerías"]
  },
  {
    category: "Mayoristas, producción y digital",
    examples: ["Distribuidoras y depósitos", "Talleres y pequeños fabricantes", "Peluquerías y barberías", "Tiendas online y showrooms", "Emprendimientos y servicios"]
  }
] as const;

export type DevicePlatform = {
  id: "ios" | "android" | "windows" | "mac" | "web";
  name: string;
  subtitle: string;
  browserHint: string;
  icon: string;
  isMonochrome?: boolean;
  storeKey?: "ios" | "android" | "windows";
  steps: string[];
};

export const DEVICES: DevicePlatform[] = [
  {
    id: "android",
    name: "Android",
    subtitle: "Celulares y tablets",
    browserHint: "Desde Google Chrome",
    icon: "/platforms/android.png",
    storeKey: "android",
    steps: [
      "Abrí Global Stock en Google Chrome desde tu celular (podés copiarte el link con «Copiar enlace»).",
      "Tocá el menú de tres puntos ⋮ arriba a la derecha.",
      "Elegí «Instalar aplicación» o «Agregar a la pantalla principal» y confirmá."
    ]
  },
  {
    id: "ios",
    name: "iPhone y iPad",
    subtitle: "iOS / iPadOS",
    browserHint: "Desde Safari",
    icon: "/platforms/apple.png",
    isMonochrome: true,
    storeKey: "ios",
    steps: [
      "Abrí Global Stock en Safari desde tu iPhone o iPad.",
      "Tocá el botón Compartir (el cuadrado con la flecha hacia arriba) en la barra inferior.",
      "Deslizá hacia abajo, elegí «Agregar a pantalla de inicio» y tocá «Agregar»."
    ]
  },
  {
    id: "windows",
    name: "Windows",
    subtitle: "Windows 10 y 11",
    browserHint: "Desde Chrome o Edge",
    icon: "/platforms/windows.png",
    storeKey: "windows",
    steps: [
      "Estando en esta página con Chrome o Edge, mirá el ícono de instalar a la derecha de la barra de direcciones.",
      "Hacé clic ahí y confirmá «Instalar» para crear el acceso directo en tu escritorio.",
      "También podés abrir el menú ⋮ / ⋯ → Aplicaciones → «Instalar este sitio como una aplicación»."
    ]
  },
  {
    id: "mac",
    name: "Mac",
    subtitle: "macOS",
    browserHint: "Desde Safari o Chrome",
    icon: "/platforms/apple.png",
    isMonochrome: true,
    steps: [
      "En Safari: abrí el menú superior Archivo → «Agregar al Dock».",
      "En Google Chrome: hacé clic en el ícono de instalar en la barra de direcciones.",
      "La aplicación queda disponible en tu Dock en ventana propia."
    ]
  },
  {
    id: "web",
    name: "Navegador web",
    subtitle: "Cualquier equipo",
    browserHint: "Sin instalar nada",
    icon: "",
    steps: [
      "Hacé clic en «Ir a crear cuenta o iniciar sesión».",
      "Registrate gratis con tu correo en menos de un minuto.",
      "Toda tu información queda sincronizada para usarla desde cualquier equipo."
    ]
  }
];

export const FAQ: { q: string; a: string; links?: { label: string; href: string }[] }[] = [
  {
    q: "¿Qué es Global Stock y qué lográs al usarlo?",
    a: "Es una aplicación de gestión comercial para evitar faltantes de mercadería, cerrar la caja diaria con precisión y saber cuánto ganás limpio. Reúne inventario, punto de venta, caja, compras, proveedores y reportes."
  },
  {
    q: "¿Tiene costo o necesitás tarjeta para empezar?",
    a: "No. Podés crear tu cuenta y empezar a usar Global Stock gratis, sin ingresar tarjeta de crédito."
  },
  {
    q: "¿Cómo funciona el escáner de códigos de barras con el celular?",
    a: "Iniciás sesión con tu cuenta en la computadora y en tu celular. Activás el modo escáner en el teléfono, apuntás al código de barras y el producto entra al instante en el ticket o inventario de tu PC."
  },
  {
    q: "¿Qué pasa si se corta internet o cambiás de computadora?",
    a: "Tu información se guarda en la nube vinculada a tu cuenta. Si cambiás de equipo, solo iniciás sesión para recuperar todo tu catálogo, ventas y movimientos."
  },
  {
    q: "¿Por qué se instala desde el navegador y no pesa cientos de megas?",
    a: "Porque es una aplicación web progresiva (PWA): se instala desde Safari, Chrome o Edge en segundos, ocupa muy poco espacio, se actualiza sola y funciona en Android, iPhone, Windows y Mac."
  },
  {
    q: "¿Tus empleados pueden ver tus costos y ganancias?",
    a: "No, salvo que se los habilites. Podés crear usuarios individuales con permisos específicos para que un cajero solo registre ventas y caja sin ver costos ni balances.",
    links: [
      { label: "Ver política de seguridad", href: "/legal/security" },
      { label: "Ver privacidad", href: "/legal/privacy" }
    ]
  }
];

export const LEGAL_LINKS = [
  { label: "Seguridad", href: "/legal/security" },
  { label: "Política de privacidad", href: "/legal/privacy" },
  { label: "Términos de uso", href: "/legal/terms" },
  { label: "Cookies", href: "/legal/cookies" }
] as const;