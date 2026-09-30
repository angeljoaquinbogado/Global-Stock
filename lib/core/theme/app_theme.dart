import 'package:flutter/material.dart';

abstract final class AppTheme {
  static const red = Color(0xFFE50914);
  static const darkBackground = Color(0xFF050505);
  static const lightBackground = Color(0xFFF7F7F7);

  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBackground,
      colorScheme: const ColorScheme.dark(
        primary: red,
        secondary: red,
        surface: Color(0xFF111111),
      ),
      inputDecorationTheme: _inputDecorationTheme(
        fillColor: const Color(0xFF111111),
        borderColor: const Color(0xFF2A2A2A),
        hintColor: const Color(0xFF6F6F6F),
      ),
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: lightBackground,
      colorScheme: const ColorScheme.light(
        primary: red,
        secondary: red,
        surface: Colors.white,
      ),
      inputDecorationTheme: _inputDecorationTheme(
        fillColor: Colors.white,
        borderColor: const Color(0xFFE1E1E1),
        hintColor: const Color(0xFF909090),
      ),
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  static InputDecorationTheme _inputDecorationTheme({
    required Color fillColor,
    required Color borderColor,
    required Color hintColor,
  }) {
    return InputDecorationTheme(
      filled: true,
      fillColor: fillColor,
      hintStyle: TextStyle(color: hintColor),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 18,
        vertical: 18,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: borderColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: borderColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: red, width: 1.4),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: red),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: red, width: 1.4),
      ),
    );
  }
}
