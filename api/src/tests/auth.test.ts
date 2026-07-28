import { validateCPF, calculateAge, hashPasswordClientStyle } from '../utils/crypto';
import assert from 'assert';

console.log('=== RUNNING CRYPTO UNIT TESTS ===');

assert.strictEqual(validateCPF('11144477735'), true, 'CPF Valido Falhou');
assert.strictEqual(validateCPF('11144477700'), false, 'CPF Invalido Passou');
assert.strictEqual(validateCPF('00000000000'), false, 'CPF todos iguais deve ser invalido');
console.log('[PASS] Validacao de CPF por Digitos Verificadores');

assert.strictEqual(calculateAge('1990-01-01') >= 18, true, 'Calculo de Maioridade Falhou');
assert.strictEqual(calculateAge('2020-01-01') < 12, true, 'Calculo de Menor de 12 anos Falhou');
console.log('[PASS] Calculo de Idade');

const expectedHash = 'B352FBE7CE621F4C2506503685BF8522DF5041700D37111A90AEC843B0C92561';
const generatedHash = hashPasswordClientStyle('testgame', 'password123');
assert.strictEqual(generatedHash, expectedHash, 'Hash C++ incompativel');
console.log('[PASS] Hash de Senha compativel com Game.exe');

console.log('=== ALL CRYPTO UNIT TESTS PASSED ===');
