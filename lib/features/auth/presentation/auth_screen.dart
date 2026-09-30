import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_buttons.dart';
import '../../../shared/widgets/global_stock_logo.dart';

enum AuthMode { signIn, signUp }

class AuthScreen extends StatefulWidget {
  const AuthScreen({
    super.key,
    required this.mode,
    required this.isDark,
    required this.onThemeChanged,
  });

  final AuthMode mode;
  final bool isDark;
  final VoidCallback onThemeChanged;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  late AuthMode _mode;
  bool _showPassword = false;
  bool _showConfirmPassword = false;

  bool get _isSignUp => _mode == AuthMode.signUp;

  @override
  void initState() {
    super.initState();
    _mode = widget.mode;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _switchMode() {
    setState(() {
      _mode = _isSignUp ? AuthMode.signIn : AuthMode.signUp;
      _formKey.currentState?.reset();
      _passwordController.clear();
      _confirmPasswordController.clear();
    });
  }

  void _submit() {
    FocusScope.of(context).unfocus();

    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            _isSignUp
                ? 'Formulario listo. El próximo paso es conectar el registro con Supabase.'
                : 'Formulario listo. El próximo paso es conectar el inicio de sesión con Supabase.',
          ),
        ),
      );
  }

  String? _validateEmail(String? value) {
    final email = value?.trim() ?? '';
    if (email.isEmpty) {
      return 'Ingresá tu correo electrónico';
    }
    if (!email.contains('@') || !email.contains('.')) {
      return 'Ingresá un correo válido';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    final password = value ?? '';
    if (password.isEmpty) {
      return 'Ingresá tu contraseña';
    }
    if (password.length < 8) {
      return 'Usá al menos 8 caracteres';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dark = theme.brightness == Brightness.dark;
    final textColor = dark ? Colors.white : const Color(0xFF111111);
    final muted =
        dark ? const Color(0xFF939393) : const Color(0xFF737373);

    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            Positioned(
              left: 18,
              top: 16,
              child: _RoundIconButton(
                icon: Icons.arrow_back_ios_new_rounded,
                tooltip: 'Volver',
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
            Positioned(
              right: 18,
              top: 16,
              child: ThemeToggleButton(
                isDark: dark,
                onPressed: widget.onThemeChanged,
              ),
            ),
            Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 86, 24, 40),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 470),
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(30, 32, 30, 30),
                    decoration: BoxDecoration(
                      color: dark
                          ? const Color(0xFF0B0B0B)
                          : Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(
                        color: dark
                            ? const Color(0xFF202020)
                            : const Color(0xFFE8E8E8),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(
                            alpha: dark ? .2 : .06,
                          ),
                          blurRadius: 40,
                          offset: const Offset(0, 16),
                        ),
                      ],
                    ),
                    child: AnimatedSize(
                      duration: const Duration(milliseconds: 280),
                      curve: Curves.easeOutCubic,
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Align(
                              alignment: Alignment.center,
                              child: GlobalStockLogo(
                                size: 62,
                                showGlow: false,
                              ),
                            ),
                            const SizedBox(height: 24),
                            Text(
                              _isSignUp
                                  ? 'Creá tu cuenta'
                                  : 'Bienvenido de nuevo',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: textColor,
                                fontSize: 28,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -.7,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _isSignUp
                                  ? 'Empezá gratis y configurá tu negocio en pocos pasos.'
                                  : 'Ingresá para administrar tu negocio desde un solo lugar.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: muted,
                                height: 1.45,
                                fontSize: 13.5,
                              ),
                            ),
                            const SizedBox(height: 28),
                            if (_isSignUp) ...[
                              _FieldLabel(
                                text: 'Nombre',
                                color: textColor,
                              ),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: _nameController,
                                textInputAction: TextInputAction.next,
                                autofillHints: const [AutofillHints.name],
                                decoration: const InputDecoration(
                                  hintText: 'Tu nombre',
                                  prefixIcon:
                                      Icon(Icons.person_outline_rounded),
                                ),
                                validator: (value) {
                                  if ((value?.trim().length ?? 0) < 2) {
                                    return 'Ingresá tu nombre';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 18),
                            ],
                            _FieldLabel(
                              text: 'Correo electrónico',
                              color: textColor,
                            ),
                            const SizedBox(height: 8),
                            TextFormField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.next,
                              autofillHints: const [AutofillHints.email],
                              autocorrect: false,
                              decoration: const InputDecoration(
                                hintText: 'nombre@correo.com',
                                prefixIcon:
                                    Icon(Icons.mail_outline_rounded),
                              ),
                              validator: _validateEmail,
                            ),
                            const SizedBox(height: 18),
                            _FieldLabel(
                              text: 'Contraseña',
                              color: textColor,
                            ),
                            const SizedBox(height: 8),
                            TextFormField(
                              controller: _passwordController,
                              obscureText: !_showPassword,
                              textInputAction: _isSignUp
                                  ? TextInputAction.next
                                  : TextInputAction.done,
                              autofillHints: _isSignUp
                                  ? const [AutofillHints.newPassword]
                                  : const [AutofillHints.password],
                              onFieldSubmitted:
                                  _isSignUp ? null : (_) => _submit(),
                              decoration: InputDecoration(
                                hintText: 'Mínimo 8 caracteres',
                                prefixIcon:
                                    const Icon(Icons.lock_outline_rounded),
                                suffixIcon: IconButton(
                                  tooltip: _showPassword
                                      ? 'Ocultar contraseña'
                                      : 'Mostrar contraseña',
                                  onPressed: () {
                                    setState(() {
                                      _showPassword = !_showPassword;
                                    });
                                  },
                                  icon: Icon(
                                    _showPassword
                                        ? Icons.visibility_off_outlined
                                        : Icons.visibility_outlined,
                                  ),
                                ),
                              ),
                              validator: _validatePassword,
                            ),
                            if (_isSignUp) ...[
                              const SizedBox(height: 18),
                              _FieldLabel(
                                text: 'Repetir contraseña',
                                color: textColor,
                              ),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: _confirmPasswordController,
                                obscureText: !_showConfirmPassword,
                                textInputAction: TextInputAction.done,
                                autofillHints: const [
                                  AutofillHints.newPassword,
                                ],
                                onFieldSubmitted: (_) => _submit(),
                                decoration: InputDecoration(
                                  hintText: 'Repetí tu contraseña',
                                  prefixIcon:
                                      const Icon(Icons.lock_outline_rounded),
                                  suffixIcon: IconButton(
                                    tooltip: _showConfirmPassword
                                        ? 'Ocultar contraseña'
                                        : 'Mostrar contraseña',
                                    onPressed: () {
                                      setState(() {
                                        _showConfirmPassword =
                                            !_showConfirmPassword;
                                      });
                                    },
                                    icon: Icon(
                                      _showConfirmPassword
                                          ? Icons.visibility_off_outlined
                                          : Icons.visibility_outlined,
                                    ),
                                  ),
                                ),
                                validator: (value) {
                                  if (value != _passwordController.text) {
                                    return 'Las contraseñas no coinciden';
                                  }
                                  return null;
                                },
                              ),
                            ] else ...[
                              const SizedBox(height: 10),
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: () {
                                    ScaffoldMessenger.of(context)
                                      ..hideCurrentSnackBar()
                                      ..showSnackBar(
                                        const SnackBar(
                                          content: Text(
                                            'La recuperación de contraseña se conectará con Supabase.',
                                          ),
                                        ),
                                      );
                                  },
                                  child: const Text(
                                    '¿Olvidaste tu contraseña?',
                                    style: TextStyle(
                                      color: AppTheme.red,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12.5,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                            SizedBox(height: _isSignUp ? 28 : 18),
                            AppPrimaryButton(
                              text: _isSignUp
                                  ? 'Crear cuenta gratis'
                                  : 'Iniciar sesión',
                              icon: _isSignUp
                                  ? Icons.arrow_forward_rounded
                                  : null,
                              onPressed: _submit,
                            ),
                            const SizedBox(height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Flexible(
                                  child: Text(
                                    _isSignUp
                                        ? '¿Ya tenés una cuenta?'
                                        : '¿Todavía no tenés cuenta?',
                                    style: TextStyle(
                                      color: muted,
                                      fontSize: 12.5,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 5),
                                TextButton(
                                  onPressed: _switchMode,
                                  style: TextButton.styleFrom(
                                    foregroundColor: AppTheme.red,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 4,
                                      vertical: 6,
                                    ),
                                    minimumSize: Size.zero,
                                    tapTargetSize:
                                        MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  child: Text(
                                    _isSignUp
                                        ? 'Iniciar sesión'
                                        : 'Crear cuenta',
                                    style: const TextStyle(
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            if (_isSignUp) ...[
                              const SizedBox(height: 16),
                              Text(
                                'Al crear una cuenta aceptás los términos y la política de privacidad.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: muted.withValues(alpha: .82),
                                  fontSize: 10.5,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
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

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({
    required this.text,
    required this.color,
  });

  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        color: color,
        fontSize: 12.5,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: dark ? const Color(0xFF151515) : Colors.white,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(999),
        child: Tooltip(
          message: tooltip,
          child: Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              border: Border.all(
                color: dark
                    ? const Color(0xFF292929)
                    : const Color(0xFFE5E5E5),
              ),
            ),
            child: Icon(icon, size: 17),
          ),
        ),
      ),
    );
  }
}
