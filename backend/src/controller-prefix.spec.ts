import { Test } from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CRITICAL TEST: Prevents /api/api/ route duplication
 *
 * This test ensures no controller has 'api/' in their @Controller() decorator,
 * since main.ts already sets global prefix 'api'.
 *
 * If this test fails, remove 'api/' from the controller decorator.
 */
describe('Controller Prefix Validation', () => {
  it('should NOT have api/ prefix in any controller decorators', () => {
    const srcDir = path.join(__dirname, '../src');
    const errors: string[] = [];

    function checkFile(filePath: string) {
      if (!filePath.endsWith('.controller.ts')) return;

      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for @Controller('api/...') or @Controller("api/...")
      const apiPrefixPattern = /@Controller\s*\(\s*['"]api\//g;
      const matches = content.match(apiPrefixPattern);

      if (matches) {
        const relativePath = path.relative(srcDir, filePath);
        errors.push(
          `❌ ${relativePath} has 'api/' prefix in @Controller decorator.\n` +
          `   This will cause /api/api/... routes because main.ts sets global prefix.\n` +
          `   Fix: Change @Controller('api/xyz') to @Controller('xyz')`
        );
      }
    }

    function walkDir(dir: string) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (stat.isFile()) {
          checkFile(filePath);
        }
      }
    }

    walkDir(srcDir);

    if (errors.length > 0) {
      fail(
        '\n\n' +
        '═══════════════════════════════════════════════════════════════\n' +
        '  ❌ CONTROLLER PREFIX VALIDATION FAILED\n' +
        '═══════════════════════════════════════════════════════════════\n\n' +
        errors.join('\n\n') +
        '\n\n' +
        '═══════════════════════════════════════════════════════════════\n' +
        '  📝 IMPORTANT: Global prefix is set in main.ts\n' +
        '  All routes automatically get /api/ prefix\n' +
        '  DO NOT add api/ in controller decorators\n' +
        '═══════════════════════════════════════════════════════════════\n\n'
      );
    }
  });

  it('should have global prefix set in main.ts', () => {
    const mainPath = path.join(__dirname, '../src/main.ts');
    const content = fs.readFileSync(mainPath, 'utf-8');

    expect(content).toContain("app.setGlobalPrefix('api')");
  });
});
