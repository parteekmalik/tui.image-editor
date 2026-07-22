const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const packageRoot = path.resolve(__dirname, '..');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tui-image-editor-consumer-'));

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, npm_config_loglevel: 'warn' },
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`;

  assert.strictEqual(result.status, 0, `${command} ${args.join(' ')} failed:\n${output}`);

  return output;
}

try {
  const packOutput = run('npm', ['pack', '--json', '--pack-destination', tempRoot], packageRoot);
  const tarball = path.join(tempRoot, JSON.parse(packOutput)[0].filename);
  const consumerRoot = path.join(tempRoot, 'consumer');

  fs.mkdirSync(consumerRoot);
  fs.writeFileSync(
    path.join(consumerRoot, 'package.json'),
    `${JSON.stringify({ private: true }, null, 2)}\n`
  );

  const installOutput = run('npm', ['install', '--no-audit', '--no-fund', tarball], consumerRoot);

  assert.doesNotMatch(
    installOutput,
    /\bdeprecated\b/i,
    `Consumer install emitted a deprecation warning:\n${installOutput}`
  );

  const installedPackage = JSON.parse(
    fs.readFileSync(
      path.join(consumerRoot, 'node_modules', '@parteekmalik', 'tui-image-editor', 'package.json'),
      'utf8'
    )
  );

  assert.ok(!installedPackage.dependencies.fabric, 'Fabric must not be installed by consumers');
  console.log('Packed package installs without consumer deprecation warnings.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
