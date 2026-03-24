import { Cardinality } from '../../../models/v2/ontologies/class-definition';
import { ResourceClassDefinition } from '../../../models/v2/ontologies/resource-class-definition';
import { CardinalityUtil } from './cardinality-util';

describe('CardinalityUtil', () => {
  describe('Determine if a value can be created', () => {
    describe('check cardinality 0-1', () => {
      const classDef = new ResourceClassDefinition();

      classDef.propertiesList = [
        {
          propertyIndex: 'myProp',
          cardinality: Cardinality._0_1,
          isInherited: false,
        },
      ];

      it('create the first value ', () => {
        const createValueAllowed = CardinalityUtil.createValueForPropertyAllowed('myProp', 0, classDef);
        expect(createValueAllowed).toBeTruthy();
      });

      it('create a second value ', () => {
        const createValueAllowed = CardinalityUtil.createValueForPropertyAllowed('myProp', 1, classDef);
        expect(createValueAllowed).toBeFalsy();
      });
    });

    describe('check cardinality 1', () => {
      const classDef = new ResourceClassDefinition();

      classDef.propertiesList = [
        {
          propertyIndex: 'myProp',
          cardinality: Cardinality._1,
          isInherited: false,
        },
      ];

      it('create the first value (impossible use case)', () => {
        const createValueAllowed = CardinalityUtil.createValueForPropertyAllowed('myProp', 0, classDef);
        expect(createValueAllowed).toBeFalsy();
      });

      it('create a second value (impossible use case)', () => {
        const createValueAllowed = CardinalityUtil.createValueForPropertyAllowed('myProp', 1, classDef);
        expect(createValueAllowed).toBeFalsy();
      });
    });

    describe('check cardinality 1-n', () => {
      const classDef = new ResourceClassDefinition();

      classDef.propertiesList = [
        {
          propertyIndex: 'myProp',
          cardinality: Cardinality._1_n,
          isInherited: false,
        },
      ];

      it('create first value (impossible use case)', () => {
        const createValueAllowed = CardinalityUtil.createValueForPropertyAllowed('myProp', 0, classDef);
        expect(createValueAllowed).toBeFalsy();
      });

      it('create a second value', () => {
        const createValueAllowed = CardinalityUtil.createValueForPropertyAllowed('myProp', 1, classDef);
        expect(createValueAllowed).toBeTruthy();
      });
    });

    describe('check cardinality 0-n', () => {
      const classDef = new ResourceClassDefinition();

      classDef.propertiesList = [
        {
          propertyIndex: 'myProp',
          cardinality: Cardinality._0_n,
          isInherited: false,
        },
      ];

      it('create first value', () => {
        const createValueAllowed = CardinalityUtil.createValueForPropertyAllowed('myProp', 0, classDef);
        expect(createValueAllowed).toBeTruthy();
      });

      it('create a second value', () => {
        const createValueAllowed = CardinalityUtil.createValueForPropertyAllowed('myProp', 1, classDef);
        expect(createValueAllowed).toBeTruthy();
      });
    });
  });

  describe('Determine if a value can be deleted', () => {
    describe('check cardinality 0-1', () => {
      const classDef = new ResourceClassDefinition();

      classDef.propertiesList = [
        {
          propertyIndex: 'myProp',
          cardinality: Cardinality._0_1,
          isInherited: false,
        },
      ];

      it('delete the single value ', () => {
        const createValueAllowed = CardinalityUtil.deleteValueForPropertyAllowed('myProp', 1, classDef);
        expect(createValueAllowed).toBeTruthy();
      });
    });

    describe('check cardinality 1', () => {
      const classDef = new ResourceClassDefinition();

      classDef.propertiesList = [
        {
          propertyIndex: 'myProp',
          cardinality: Cardinality._1,
          isInherited: false,
        },
      ];

      it('delete the single value ', () => {
        const createValueAllowed = CardinalityUtil.deleteValueForPropertyAllowed('myProp', 1, classDef);
        expect(createValueAllowed).toBeFalsy();
      });
    });

    describe('check cardinality 1-n', () => {
      const classDef = new ResourceClassDefinition();

      classDef.propertiesList = [
        {
          propertyIndex: 'myProp',
          cardinality: Cardinality._1_n,
          isInherited: false,
        },
      ];

      it('delete a single value', () => {
        const createValueAllowed = CardinalityUtil.deleteValueForPropertyAllowed('myProp', 1, classDef);
        expect(createValueAllowed).toBeFalsy();
      });

      it('delete of of multiple values', () => {
        const createValueAllowed = CardinalityUtil.deleteValueForPropertyAllowed('myProp', 2, classDef);
        expect(createValueAllowed).toBeTruthy();
      });
    });

    describe('check cardinality 0-n', () => {
      const classDef = new ResourceClassDefinition();

      classDef.propertiesList = [
        {
          propertyIndex: 'myProp',
          cardinality: Cardinality._0_n,
          isInherited: false,
        },
      ];

      it('delete a single value', () => {
        const createValueAllowed = CardinalityUtil.deleteValueForPropertyAllowed('myProp', 1, classDef);
        expect(createValueAllowed).toBeTruthy();
      });

      it('delete of of multiple values', () => {
        const createValueAllowed = CardinalityUtil.deleteValueForPropertyAllowed('myProp', 2, classDef);
        expect(createValueAllowed).toBeTruthy();
      });
    });
  });
});
