// Testes de integração — batem num Postgres de verdade (mesmo DATABASE_URL
// do dev), fora do `pnpm test`/CI padrão (que não sobe Postgres nenhum).
// Rodar com `pnpm test:integration` tendo o banco de dev no ar.
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.integration\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  passWithNoTests: true,
}
