import { ProjectAssertionPageBase } from './project-assertion-payloads';

export class Project00FFPayloads extends ProjectAssertionPageBase {
  static readonly project = '00FF';
  static readonly defaultOntology = 'images';

  constructor() {
    super(Project00FFPayloads.project, Project00FFPayloads.defaultOntology);
  }
}
