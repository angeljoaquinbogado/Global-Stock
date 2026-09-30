import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';
import 'features/auth/presentation/welcome_screen.dart';

class GlobalStockApp extends StatefulWidget {
  const GlobalStockApp({super.key});

  @override
  State<GlobalStockApp> createState() => _GlobalStockAppState();
}

class _GlobalStockAppState extends State<GlobalStockApp> {
  bool _isDark = true;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Global Stock',
      themeMode: _isDark ? ThemeMode.dark : ThemeMode.light,
      darkTheme: AppTheme.dark,
      theme: AppTheme.light,
      home: WelcomeScreen(
        isDark: _isDark,
        onThemeChanged: () {
          setState(() {
            _isDark = !_isDark;
          });
        },
      ),
    );
  }
}
