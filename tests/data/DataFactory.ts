/**
 * KATA Architecture - Data Factory
 *
 * Generador centralizado de datos de prueba.
 * Regla de oro: NUNCA datos estáticos, siempre dinámicos con Faker.
 *
 * Acceso:
 *   - Desde componentes: this.data.createUser()
 *   - Import directo: import { DataFactory } from '@DataFactory'
 */

import type { TestAtc, TestCredentials, TestUser } from './types';

import { faker } from '@faker-js/faker';

export class DataFactory {
  // ============================================
  // HELPERS PRIVADOS
  // ============================================

  private static uniqueId(): string {
    return `${Date.now()}-${faker.string.alphanumeric(6)}`;
  }

  private static testEmail(prefix = 'test'): string {
    const id = faker.string.alphanumeric(6).toLowerCase();
    const name = faker.person.firstName().toLowerCase();
    return `${prefix}.${name}.${id}@example.com`;
  }

  private static securePassword(): string {
    return `Test${faker.string.alphanumeric(8)}!`;
  }

  // ============================================
  // GENERADORES PRINCIPALES
  // ============================================

  /**
   * Genera un usuario completo para testing
   * @param overrides - Propiedades a sobreescribir
   */
  static createUser(overrides?: Partial<TestUser>): TestUser {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      email: this.testEmail(),
      password: this.securePassword(),
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      ...overrides,
    };
  }

  /**
   * Genera solo credenciales (email + password)
   * @param overrides - Propiedades a sobreescribir
   */
  static createCredentials(overrides?: Partial<TestCredentials>): TestCredentials {
    return {
      email: this.testEmail(),
      password: this.securePassword(),
      ...overrides,
    };
  }

  /**
   * Genera un ID único para identificar datos de test
   * Útil para cleanup y trazabilidad
   */
  static createTestId(prefix = 'test'): string {
    return `${prefix}-${this.uniqueId()}`;
  }

  // ============================================
  // PROJECT-SPECIFIC (Bunkai domain: ATC)
  // ============================================

  /**
   * Genera la porción fabricable de un ATC (title, layer, tags, steps,
   * assertions). NO incluye module_id/user_story_id/acceptance_criterion_ids
   * — esos identificadores deben referenciar entidades reales ya existentes
   * y se combinan aparte al construir el CreateAtcRequest/UpdateAtcRequest
   * real (ver api/schemas/atcs.types.ts).
   */
  static createAtc(overrides?: Partial<TestAtc>): TestAtc {
    return {
      title: `Test ATC ${faker.hacker.verb()} ${faker.string.alphanumeric(6)}`,
      layer: 'API',
      tags: [faker.word.sample()],
      steps: [
        {
          position: 1,
          content: faker.lorem.sentence(),
          input_data: null,
          expected: faker.lorem.sentence(),
        },
      ],
      assertions: [
        { content: faker.lorem.sentence() },
      ],
      ...overrides,
    };
  }
}

export default DataFactory;
