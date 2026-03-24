import { JsonConverter, JsonCustomConvert } from 'json2typescript';
import { CustomConverterUtils } from '../../../util/utils';
import { Constants } from '../Constants';
import { Cardinality, IHasProperty } from '../ontologies/class-definition';

/**
 * @category Internal
 */
@JsonConverter
export class HasCardinalityForPropertyConverter implements JsonCustomConvert<IHasProperty[]> {
  serialize(cardinalities: IHasProperty[]): any {
    const subClassOf = cardinalities.map(card => {
      const cardEle: { [index: string]: number | string | object } = {};

      cardEle['@type'] = Constants.Restriction;
      cardEle[Constants.OnProperty] = {
        '@id': card.propertyIndex,
      };

      if (card.cardinality === Cardinality._0_1) {
        cardEle[Constants.MaxCardinality] = 1;
      } else if (card.cardinality === Cardinality._0_n) {
        cardEle[Constants.MinCardinality] = 0;
      } else if (card.cardinality === Cardinality._1_n) {
        cardEle[Constants.MinCardinality] = 1;
      } else if (card.cardinality === Cardinality._1) {
        cardEle[Constants.Cardinality] = 1;
      } else {
        throw new Error('Invalid cardinality: ' + card.cardinality);
      }

      if (card.guiOrder) {
        cardEle[Constants.GuiOrder] = card.guiOrder;
      }

      return cardEle;
    });

    if (subClassOf.length === 0) {
      // no cardinality, empty array
      return subClassOf;
    } else {
      // if one card is given, just return this card (single object, no array)
      return subClassOf.length > 1 ? subClassOf : subClassOf[0];
    }
  }

  deserialize(items: any): IHasProperty[] {
    const hasCardForProp: IHasProperty[] = [];

    const addItem = (ele: any) => {
      if (ele.hasOwnProperty('@type') && ele['@type'] === Constants.Restriction) {
        let cardinality: Cardinality = Cardinality._0_n;
        if (ele.hasOwnProperty(Constants.MaxCardinality)) {
          if (ele[Constants.MaxCardinality] === 1) {
            cardinality = Cardinality._0_1;
          } else {
            throw new Error('Inconsistent value for max cardinality: ' + ele[Constants.MaxCardinality]);
          }
        } else if (ele.hasOwnProperty(Constants.MinCardinality)) {
          if (ele[Constants.MinCardinality] === 1) {
            cardinality = Cardinality._1_n;
          } else if (ele[Constants.MinCardinality] === 0) {
            cardinality = Cardinality._0_n;
          } else {
            throw new Error('Inconsistent value for min cardinality ' + ele[Constants.MinCardinality]);
          }
        } else if (ele.hasOwnProperty(Constants.Cardinality)) {
          if (ele[Constants.Cardinality] === 1) {
            cardinality = Cardinality._1;
          } else {
            throw new Error('Inconsistent value for cardinality ' + ele[Constants.Cardinality]);
          }
        }

        let propertyIndex: string = '';
        if (ele.hasOwnProperty(Constants.OnProperty)) {
          const propstruct: any = ele[Constants.OnProperty];
          if (propstruct.hasOwnProperty('@id') && CustomConverterUtils.isString(propstruct['@id'])) {
            propertyIndex = propstruct['@id'];
          } else {
            throw new Error('Missing property name in cardinality');
          }
        }

        let isInherited = false;
        if (ele.hasOwnProperty(Constants.IsInherited) && ele[Constants.IsInherited] === true) {
          isInherited = true;
        }

        let guiOrder: number = -1;
        if (ele.hasOwnProperty(Constants.GuiOrder)) {
          guiOrder = ele[Constants.GuiOrder];
          hasCardForProp.push({
            propertyIndex: propertyIndex,
            cardinality: cardinality,
            guiOrder: guiOrder,
            isInherited: isInherited,
          });
        } else {
          hasCardForProp.push({
            propertyIndex: propertyIndex,
            cardinality: cardinality,
            isInherited: isInherited,
          });
        }
      }
    };

    if (Array.isArray(items)) {
      items.forEach(item => addItem(item));
    } else {
      addItem(items);
    }

    return hasCardForProp;
  }
}
