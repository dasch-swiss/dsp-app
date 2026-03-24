import { KnoraApiConfig } from '../../../knora-api-config';
import { OntologyConversionUtil } from './OntologyConversionUtil';

describe('OntologyConversionUtil', () => {
  describe('Method getOntologyIriFromEntityIri with local setup', () => {
    const config = new KnoraApiConfig('http', '0.0.0.0', 3333);

    it('should get the ontology IRI from a knora-api entity', () => {
      const ontologyIri = OntologyConversionUtil.getOntologyIriFromEntityIri(
        'http://api.knora.org/ontology/knora-api/v2#Resource',
        config
      );

      expect(ontologyIri[0]).toEqual('http://api.knora.org/ontology/knora-api/v2');
    });

    it('should get the ontology IRI from a project entity', () => {
      const ontologyIri = OntologyConversionUtil.getOntologyIriFromEntityIri(
        'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
        config
      );

      expect(ontologyIri[0]).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2');
    });

    it('should ignore an external entity', () => {
      const ontologyIri = OntologyConversionUtil.getOntologyIriFromEntityIri(
        'http://www.w3.org/2000/01/rdf-schema#label',
        config
      );

      expect(ontologyIri.length).toEqual(0);
    });
  });

  describe('Method getOntologyIriFromEntityIri with remote setup', () => {
    const config = new KnoraApiConfig('https', 'test.example.com', 3333);

    it('should get the ontology IRI from a knora-api entity', () => {
      const ontologyIri = OntologyConversionUtil.getOntologyIriFromEntityIri(
        'http://api.knora.org/ontology/knora-api/v2#Resource',
        config
      );

      expect(ontologyIri[0]).toEqual('http://api.knora.org/ontology/knora-api/v2');
    });

    it('should get the ontology IRI from a project entity', () => {
      const ontologyIri = OntologyConversionUtil.getOntologyIriFromEntityIri(
        'http://test.example.com/ontology/0001/anything/v2#Thing',
        config
      );

      expect(ontologyIri[0]).toEqual('http://test.example.com/ontology/0001/anything/v2');
    });

    it('should ignore an external entity', () => {
      const ontologyIri = OntologyConversionUtil.getOntologyIriFromEntityIri(
        'http://www.w3.org/2000/01/rdf-schema#label',
        config
      );

      expect(ontologyIri.length).toEqual(0);
    });
  });
});
