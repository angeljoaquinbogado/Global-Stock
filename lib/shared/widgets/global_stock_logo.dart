import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';

class GlobalStockLogo extends StatelessWidget {
  const GlobalStockLogo({
    super.key,
    this.size = 96,
    this.showGlow = true,
  });

  final double size;
  final bool showGlow;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * .29),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFFF2C39),
            AppTheme.red,
            Color(0xFF980009),
          ],
        ),
        boxShadow: showGlow
            ? [
                BoxShadow(
                  color: AppTheme.red.withValues(alpha: .26),
                  blurRadius: size * .35,
                  spreadRadius: size * .04,
                ),
              ]
            : null,
      ),
      child: Center(
        child: SizedBox(
          width: size * .5,
          height: size * .5,
          child: const _StockMark(),
        ),
      ),
    );
  }
}

class _StockMark extends StatelessWidget {
  const _StockMark();

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisAlignment: MainAxisAlignment.center,
      children: const [
        _Bar(heightFactor: .65),
        SizedBox(width: 4),
        _Bar(heightFactor: 1),
        SizedBox(width: 4),
        _Bar(heightFactor: .42),
      ],
    );
  }
}

class _Bar extends StatelessWidget {
  const _Bar({required this.heightFactor});

  final double heightFactor;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: FractionallySizedBox(
        heightFactor: heightFactor,
        alignment: Alignment.bottomCenter,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(999),
          ),
        ),
      ),
    );
  }
}
