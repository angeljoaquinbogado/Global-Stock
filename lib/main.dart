import 'package:flutter/material.dart';

void main() {
  runApp(const GlobalStockApp());
}

class GlobalStockApp extends StatefulWidget {
  const GlobalStockApp({super.key});

  @override
  State<GlobalStockApp> createState() => _GlobalStockAppState();
}

class _GlobalStockAppState extends State<GlobalStockApp> {
  bool isDark = true;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Global Stock',
      themeMode: isDark ? ThemeMode.dark : ThemeMode.light,

      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF050505),
        fontFamily: 'Segoe UI',
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFE50914),
          secondary: Color(0xFFE50914),
          surface: Color(0xFF111111),
        ),
      ),

      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF7F7F7),
        fontFamily: 'Segoe UI',
        colorScheme: const ColorScheme.light(
          primary: Color(0xFFE50914),
          secondary: Color(0xFFE50914),
          surface: Colors.white,
        ),
      ),

      home: WelcomeScreen(
        isDark: isDark,
        onThemeChanged: () {
          setState(() {
            isDark = !isDark;
          });
        },
      ),
    );
  }
}

class WelcomeScreen extends StatefulWidget {
  final bool isDark;
  final VoidCallback onThemeChanged;

  const WelcomeScreen({
    super.key,
    required this.isDark,
    required this.onThemeChanged,
  });

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen>
    with TickerProviderStateMixin {
  late AnimationController logoController;
  late AnimationController contentController;

  late Animation<double> logoScale;
  late Animation<double> logoOpacity;
  late Animation<Offset> contentSlide;
  late Animation<double> contentOpacity;

  @override
  void initState() {
    super.initState();

    logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    contentController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    logoScale = Tween<double>(
      begin: .78,
      end: 1,
    ).animate(
      CurvedAnimation(
        parent: logoController,
        curve: Curves.easeOutCubic,
      ),
    );

    logoOpacity = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(
      CurvedAnimation(
        parent: logoController,
        curve: Curves.easeOut,
      ),
    );

    contentSlide = Tween<Offset>(
      begin: const Offset(0, .12),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: contentController,
        curve: Curves.easeOutCubic,
      ),
    );

    contentOpacity = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(contentController);

    logoController.forward();

    Future.delayed(const Duration(milliseconds: 450), () {
      if (mounted) {
        contentController.forward();
      }
    });
  }

  @override
  void dispose() {
    logoController.dispose();
    contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dark = widget.isDark;

    final background =
        dark ? const Color(0xFF050505) : const Color(0xFFF7F7F7);

    final textColor =
        dark ? Colors.white : const Color(0xFF111111);

    final muted =
        dark ? const Color(0xFF9C9C9C) : const Color(0xFF777777);

    return Scaffold(
      backgroundColor: background,
      body: SafeArea(
        child: Stack(
          children: [
            Positioned(
              top: 22,
              right: 24,
              child: _ThemeButton(
                dark: dark,
                onTap: widget.onThemeChanged,
              ),
            ),

            Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 28,
                  vertical: 40,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(
                    maxWidth: 470,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      FadeTransition(
                        opacity: logoOpacity,
                        child: ScaleTransition(
                          scale: logoScale,
                          child: const _GlobalStockLogo(),
                        ),
                      ),

                      const SizedBox(height: 34),

                      FadeTransition(
                        opacity: contentOpacity,
                        child: SlideTransition(
                          position: contentSlide,
                          child: Column(
                            children: [
                              Text(
                                'GLOBAL STOCK',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: textColor,
                                  fontSize: 36,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -1.2,
                                ),
                              ),

                              const SizedBox(height: 10),

                              Text(
                                'Todo tu negocio. Un solo lugar.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: muted,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w500,
                                  letterSpacing: -.1,
                                ),
                              ),

                              const SizedBox(height: 8),

                              Text(
                                'Stock · Ventas · Caja · IA',
                                style: TextStyle(
                                  color: const Color(0xFFE50914),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: .4,
                                ),
                              ),

                              const SizedBox(height: 45),

                              _PrimaryButton(
                                text: 'Iniciar sesión',
                                onTap: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Próximo paso: pantalla de inicio de sesión',
                                      ),
                                    ),
                                  );
                                },
                              ),

                              const SizedBox(height: 12),

                              _SecondaryButton(
                                text: 'Crear cuenta gratis',
                                dark: dark,
                                onTap: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Próximo paso: crear cuenta',
                                      ),
                                    ),
                                  );
                                },
                              ),

                              const SizedBox(height: 24),

                              Text(
                                'Gratis para empezar · Sin tarjeta',
                                style: TextStyle(
                                  color: muted,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GlobalStockLogo extends StatelessWidget {
  const _GlobalStockLogo();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 96,
      height: 96,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFFF2533),
            Color(0xFFE50914),
            Color(0xFF990008),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE50914).withValues(alpha: .28),
            blurRadius: 35,
            spreadRadius: 4,
          ),
        ],
      ),
      child: const Center(
        child: Icon(
          Icons.stacked_bar_chart_rounded,
          size: 48,
          color: Colors.white,
        ),
      ),
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  final String text;
  final VoidCallback onTap;

  const _PrimaryButton({
    required this.text,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: FilledButton(
        onPressed: onTap,
        style: FilledButton.styleFrom(
          backgroundColor: const Color(0xFFE50914),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 0,
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

class _SecondaryButton extends StatelessWidget {
  final String text;
  final bool dark;
  final VoidCallback onTap;

  const _SecondaryButton({
    required this.text,
    required this.dark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          foregroundColor:
              dark ? Colors.white : const Color(0xFF111111),
          side: BorderSide(
            color: dark
                ? const Color(0xFF303030)
                : const Color(0xFFD9D9D9),
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

class _ThemeButton extends StatelessWidget {
  final bool dark;
  final VoidCallback onTap;

  const _ThemeButton({
    required this.dark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: dark
          ? const Color(0xFF151515)
          : Colors.white,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: dark
                  ? const Color(0xFF292929)
                  : const Color(0xFFE5E5E5),
            ),
          ),
          child: Icon(
            dark
                ? Icons.light_mode_rounded
                : Icons.dark_mode_rounded,
            size: 18,
          ),
        ),
      ),
    );
  }
}