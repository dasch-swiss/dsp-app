import {
  Constants,
  CreateOntology,
  CreateResourceClass,
  CreateResourceProperty,
  IHasProperty,
  StringLiteral,
  UpdateOntology,
  UpdateOntologyMetadata,
  UpdateResourceClassCardinality,
  UpdateResourceClassComment,
  UpdateResourceClassLabel,
  UpdateResourcePropertyComment,
  UpdateResourcePropertyLabel,
} from '@dasch-swiss/dsp-js';
import { UpdateEntityCommentOrLabel } from '@dasch-swiss/dsp-js/src/models/v2/ontologies/update/update-entity-comment-or-label';
import { StringLiteralV2 } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DefaultProperty } from '@dasch-swiss/vre/shared/app-helper-services';
import { CreatePropertyData } from '../forms/property-form/property-form.type';
import { ResourceClassFormData } from '../forms/resource-class-form/resource-class-form.type';

type UpdateOntologyT =
  | CreateResourceProperty
  | UpdateResourceClassCardinality
  | UpdateEntityCommentOrLabel
  | UpdateResourcePropertyLabel
  | CreateResourceClass;

export interface OntologyContext {
  id: string;
  lastModificationDate: string;
}

export interface ProjectContext {
  projectId: string;
  projectShort: string;
}

export class MakeOntologyFor {
  private static wrapInUpdateOntology<T extends UpdateOntologyT>(ctx: OntologyContext, entity: T): UpdateOntology<T> {
    const upd = new UpdateOntology<T>();
    upd.id = ctx.id;
    upd.lastModificationDate = ctx.lastModificationDate;
    upd.entity = entity as T;
    return upd;
  }

  static createProperty(ctx: OntologyContext, data: CreatePropertyData): UpdateOntology<CreateResourceProperty> {
    const create = this._buildCreateResourceProperty(data);
    return this.wrapInUpdateOntology(ctx, create);
  }

  private static _buildCreateResourceProperty(d: CreatePropertyData): CreateResourceProperty {
    const c = new CreateResourceProperty();
    c.name = d.name;
    c.label = d.labels;
    c.comment = d.comment;
    c.guiElement = d.propType.guiElement;
    c.subPropertyOf = [d.propType.subPropOf];

    if (d.guiAttribute) {
      c.guiAttributes = this._guiAttrFor(d.guiAttribute, d.propType);
    }

    const needsObjType = [Constants.HasLinkTo, Constants.IsPartOf].includes(d.propType.subPropOf);
    c.objectType = needsObjType
      ? (d.objectType ?? d.guiAttribute ?? d.propType.objectType ?? '')
      : (d.propType.objectType ?? '');

    return c;
  }

  private static _guiAttrFor(attr: string, p: DefaultProperty): string[] | undefined {
    switch (p.guiElement) {
      case Constants.GuiList:
      case Constants.GuiPulldown:
      case Constants.GuiRadio:
        return [`hlist=<${attr}>`];
      case Constants.GuiSpinbox:
        return [`min=${attr}`, `max=${attr}`];
      case Constants.GuiTextarea:
        return ['width=100%'];
      default:
        return undefined;
    }
  }

  /**
   * Yes, someone named properties of a resource class "cardinality" in the backends data model and the class to
   * update the properties or one property is an UpdateResourceClassCardinality ...
   */
  static updateResourceClassCardinality(classId: string, properties: IHasProperty[]): UpdateResourceClassCardinality {
    const upd = new UpdateResourceClassCardinality();
    upd.id = classId;
    upd.cardinalities = properties;
    return upd;
  }

  /**
   * Yes, someone named the properties of a class "cardinality" in the data model and the class to
   * update them is a UpdateResourceClassCardinality ...
   */
  static updateCardinalityOfResourceClass(ctx: OntologyContext, classId: string, properties: IHasProperty[]) {
    return this.wrapInUpdateOntology(ctx, this.updateResourceClassCardinality(classId, properties));
  }

  static updatePropertyLabel(ctx: OntologyContext, id: string, labels: StringLiteral[] | StringLiteralV2[]) {
    const upd = new UpdateResourcePropertyLabel();
    upd.id = id;
    upd.labels = labels;
    return this.wrapInUpdateOntology(ctx, upd);
  }

  static updatePropertyComment(ctx: OntologyContext, id: string, comments: StringLiteral[] | StringLiteralV2[]) {
    const upd = new UpdateResourcePropertyComment();
    upd.id = id;
    upd.comments = comments;
    return this.wrapInUpdateOntology(ctx, upd);
  }

  static createResourceClass(
    ctx: OntologyContext,
    { name, labels, comments }: ResourceClassFormData
  ): UpdateOntology<CreateResourceClass> {
    const create = new CreateResourceClass();
    create.name = name;
    create.label = labels;
    create.comment = comments;
    create.subClassOf = [Constants.Resource];

    return this.wrapInUpdateOntology(ctx, create);
  }

  static updateClassLabel(ctx: OntologyContext, id: string, labels: StringLiteral[] | StringLiteralV2[]) {
    const upd = new UpdateResourceClassLabel();
    upd.id = id;
    upd.labels = labels;
    return this.wrapInUpdateOntology(ctx, upd);
  }

  static updateClassComments(ctx: OntologyContext, id: string, comments: StringLiteral[] | StringLiteralV2[]) {
    const upd = new UpdateResourceClassComment();
    upd.id = id;
    upd.comments = comments;
    return this.wrapInUpdateOntology(ctx, upd);
  }

  static createOntology(ctx: ProjectContext, name: string, label: string, comment: string): CreateOntology {
    const create = new CreateOntology();
    create.name = name;
    create.label = label;
    create.comment = comment;
    create.attachedToProject = ctx.projectId;
    return create;
  }

  static updateOntologyMetadata(ctx: OntologyContext, label: string, comment: string): UpdateOntologyMetadata {
    const upd = new UpdateOntologyMetadata();
    upd.id = ctx.id;
    upd.label = label;
    upd.comment = comment;
    upd.lastModificationDate = ctx.lastModificationDate;
    return upd;
  }
}
