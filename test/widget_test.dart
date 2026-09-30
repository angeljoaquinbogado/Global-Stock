import 'package:flutter_test/flutter_test.dart';

import 'package:global_stock/app.dart';

void main() {
  testWidgets('Global Stock welcome screen renders', (tester) async {
    await tester.pumpWidget(const GlobalStockApp());
    await tester.pumpAndSettle();

    expect(find.text('GLOBAL STOCK'), findsOneWidget);
    expect(find.text('Iniciar sesión'), findsOneWidget);
    expect(find.text('Crear cuenta gratis'), findsOneWidget);
  });

  testWidgets('Login screen opens from welcome screen', (tester) async {
    await tester.pumpWidget(const GlobalStockApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Iniciar sesión'));
    await tester.pumpAndSettle();

    expect(find.text('Bienvenido de nuevo'), findsOneWidget);
    expect(find.text('Correo electrónico'), findsOneWidget);
    expect(find.text('Contraseña'), findsOneWidget);
  });
}
