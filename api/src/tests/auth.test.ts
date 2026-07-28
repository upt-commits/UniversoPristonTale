import { validateCPF, calculateAge, hashPasswordClientStyle } from '../utils/crypto';
import assert from 'assert';

console.log('=== RUNNING SECURITY & CRYPTO TESTS ===');

// 1. CPF Verification Digits Validation
assert.strictEqual(validateCPF('11144477735'), true, 'CPF Válido Falhou');
assert.strictEqual(validateCPF('11144477700'), false, 'CPF Inválido Passou');
console.log('[PASS] Validação de CPF por Dígitos Verificadores');

// 2. Age Calculator Check
assert.strictEqual(calculateAge('1990-01-01') >= 18, true, 'Cálculo de Maioridade Falhou');
assert.strictEqual(calculateAge('2020-01-01') < 12, true, 'Cálculo de Menor de 12 anos Falhou');
console.log('[PASS] Cálculo de Idade');

// 3. Client Password Hashing (SHA-256 Uppercase)
const expectedHash = 'B352FBE7CE621F4C2506503685BF8522DF5041700D37111A90AEC843B0C92561';
const generatedHash = hashPasswordClientStyle('testgame', 'password123');
assert.strictEqual(generatedHash, expectedHash, 'Hash C++ incompatível');
console.log('[PASS] Hash de Senha compatível com Game.exe');

console.log('=== ALL TESTS COMPLETED SUCCESSFULLY ===');
