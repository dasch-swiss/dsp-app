export class Constants {
  static StandardMapping = 'http://rdfh.ch/standoff/mappings/StandardMapping';
  static KnoraApi = 'http://api.knora.org';
  static KnoraApiV2 = Constants.KnoraApi + '/ontology/knora-api/v2';
  static HashDelimiter = '#';
  static IsDeleted = Constants.KnoraApiV2 + Constants.HashDelimiter + 'isDeleted';
  static IsResourceClass = Constants.KnoraApiV2 + Constants.HashDelimiter + 'isResourceClass';
  static IsStandoffClass = Constants.KnoraApiV2 + Constants.HashDelimiter + 'isStandoffClass';
  static IsResourceProperty = Constants.KnoraApiV2 + Constants.HashDelimiter + 'isResourceProperty';
  static ObjectType = Constants.KnoraApiV2 + Constants.HashDelimiter + 'objectType';
  static SubjectType = Constants.KnoraApiV2 + Constants.HashDelimiter + 'subjectType';
  static IsLinkProperty = Constants.KnoraApiV2 + Constants.HashDelimiter + 'isLinkProperty';
  static IsLinkValueProperty = Constants.KnoraApiV2 + Constants.HashDelimiter + 'isLinkValueProperty';
  static IsEditable = Constants.KnoraApiV2 + Constants.HashDelimiter + 'isEditable';
  static IsInherited = Constants.KnoraApiV2 + Constants.HashDelimiter + 'isInherited';
  static CanBeInstantiated = Constants.KnoraApiV2 + Constants.HashDelimiter + 'canBeInstantiated';
  static ResourceIri = Constants.KnoraApiV2 + Constants.HashDelimiter + 'resourceIri';
  static ResourceClassIri = Constants.KnoraApiV2 + Constants.HashDelimiter + 'resourceClassIri';

  static StandoffOntology = Constants.KnoraApi + '/ontology/standoff/v2';
  static HasStandoffLinkToValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasStandoffLinkToValue';
  static XMLToStandoffMapping = Constants.KnoraApiV2 + Constants.HashDelimiter + 'XMLToStandoffMapping';
  static HasIncomingLinkValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasIncomingLinkValue';
  static Resource = Constants.KnoraApiV2 + Constants.HashDelimiter + 'Resource';
  static MayHaveMoreResults = Constants.KnoraApiV2 + Constants.HashDelimiter + 'mayHaveMoreResults';
  static ResourceIcon = Constants.KnoraApiV2 + Constants.HashDelimiter + 'ResourceIcon';
  static ForbiddenResource = Constants.KnoraApiV2 + Constants.HashDelimiter + 'ForbiddenResource';
  static HasValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasValue';
  static HasLinkTo = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasLinkTo';
  static IsPartOf = Constants.KnoraApiV2 + Constants.HashDelimiter + 'isPartOf';
  static BooleanValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'BooleanValue';
  static ColorValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'ColorValue';
  static GeonameValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'GeonameValue';
  static DateValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'DateValue';
  static IntValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'IntValue';
  static DecimalValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'DecimalValue';
  static IntervalValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'IntervalValue';
  static ListValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'ListValue';
  static ListNode = Constants.KnoraApiV2 + Constants.HashDelimiter + 'ListNode';
  static TextValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'TextValue';
  static LinkValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'LinkValue';
  static HasLinkToValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasLinkToValue';
  static UriValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'UriValue';
  static GeomValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'GeomValue';
  static FileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'FileValue';
  static AudioFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'AudioFileValue';
  static DDDFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'DDDFileValue';
  static DocumentFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'DocumentFileValue';
  static StillImageFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'StillImageFileValue';
  static StillImageExternalFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'StillImageExternalFileValue';
  static StillImageVectorFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'StillImageVectorFileValue';
  static MovingImageFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'MovingImageFileValue';
  static TextFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'TextFileValue';
  static ArchiveFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'ArchiveFileValue';
  static IsRootNode = Constants.KnoraApiV2 + Constants.HashDelimiter + 'isRootNode';
  static HasRootNode = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasRootNode';
  static HasSubListNode = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasSubListNode';
  static TimeValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'TimeValue';
  static HasStillImageFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasStillImageFileValue';
  static HasTextFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasTextFileValue';
  static HasMovingImageFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasMovingImageFileValue';
  static HasDocumentFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasDocumentFileValue';
  static HasDDDFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasDDDFileValue';
  static HasAudioFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasAudioFileValue';
  static HasArchiveFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasArchiveFileValue';

  static HasRepresentation = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasRepresentation';
  static StillImageRepresentation = Constants.KnoraApiV2 + Constants.HashDelimiter + 'StillImageRepresentation';
  static StillImageAbstractFileValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'StillImageAbstractFileValue';
  static MovingImageRepresentation = Constants.KnoraApiV2 + Constants.HashDelimiter + 'MovingImageRepresentation';
  static AudioRepresentation = Constants.KnoraApiV2 + Constants.HashDelimiter + 'AudioRepresentation';
  static DDDrepresentation = Constants.KnoraApiV2 + Constants.HashDelimiter + 'DDDrepresentation';
  static TextRepresentation = Constants.KnoraApiV2 + Constants.HashDelimiter + 'TextRepresentation';
  static DocumentRepresentation = Constants.KnoraApiV2 + Constants.HashDelimiter + 'DocumentRepresentation';
  static ArchiveRepresentation = Constants.KnoraApiV2 + Constants.HashDelimiter + 'ArchiveRepresentation';

  static LinkObj = Constants.KnoraApiV2 + Constants.HashDelimiter + 'LinkObj';
  static Region = Constants.KnoraApiV2 + Constants.HashDelimiter + 'Region';
  static HasGeometry = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasGeometry';
  static HasColor = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasColor';
  static HasComment = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasComment';
  static IsRegionOfValue = Constants.KnoraApiV2 + Constants.HashDelimiter + 'isRegionOfValue';

  static AttachedToProject = Constants.KnoraApiV2 + Constants.HashDelimiter + 'attachedToProject';
  static AttachedToUser = Constants.KnoraApiV2 + Constants.HashDelimiter + 'attachedToUser';
  static ArkUrl = Constants.KnoraApiV2 + Constants.HashDelimiter + 'arkUrl';
  static VersionArkUrl = Constants.KnoraApiV2 + Constants.HashDelimiter + 'versionArkUrl';
  static CreationDate = Constants.KnoraApiV2 + Constants.HashDelimiter + 'creationDate';
  static ValueCreationDate = Constants.KnoraApiV2 + Constants.HashDelimiter + 'valueCreationDate';
  static ValueHasUUID = Constants.KnoraApiV2 + Constants.HashDelimiter + 'valueHasUUID';
  static LastModificationDate = Constants.KnoraApiV2 + Constants.HashDelimiter + 'lastModificationDate';
  static NewModificationDate = Constants.KnoraApiV2 + Constants.HashDelimiter + 'newModificationDate';
  static HasPermissions = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasPermissions';
  static UserHasPermission = Constants.KnoraApiV2 + Constants.HashDelimiter + 'userHasPermission';
  static DeletedResource = Constants.KnoraApiV2 + Constants.HashDelimiter + 'DeletedResource';
  static DeleteDate = Constants.KnoraApiV2 + Constants.HashDelimiter + 'deleteDate';

  static BooleanValueAsBoolean = Constants.KnoraApiV2 + Constants.HashDelimiter + 'booleanValueAsBoolean';
  static ColorValueAsColor = Constants.KnoraApiV2 + Constants.HashDelimiter + 'colorValueAsColor';
  static GeonameValueAsGeonameCode = Constants.KnoraApiV2 + Constants.HashDelimiter + 'geonameValueAsGeonameCode';
  static DateValueHasCalendar = Constants.KnoraApiV2 + Constants.HashDelimiter + 'dateValueHasCalendar';
  static DateValueHasEndDay = Constants.KnoraApiV2 + Constants.HashDelimiter + 'dateValueHasEndDay';
  static DateValueHasEndEra = Constants.KnoraApiV2 + Constants.HashDelimiter + 'dateValueHasEndEra';
  static DateValueHasEndMonth = Constants.KnoraApiV2 + Constants.HashDelimiter + 'dateValueHasEndMonth';
  static DateValueHasEndYear = Constants.KnoraApiV2 + Constants.HashDelimiter + 'dateValueHasEndYear';
  static DateValueHasStartDay = Constants.KnoraApiV2 + Constants.HashDelimiter + 'dateValueHasStartDay';
  static DateValueHasStartEra = Constants.KnoraApiV2 + Constants.HashDelimiter + 'dateValueHasStartEra';
  static DateValueHasStartMonth = Constants.KnoraApiV2 + Constants.HashDelimiter + 'dateValueHasStartMonth';
  static DateValueHasStartYear = Constants.KnoraApiV2 + Constants.HashDelimiter + 'dateValueHasStartYear';
  static IntValueAsInt = Constants.KnoraApiV2 + Constants.HashDelimiter + 'intValueAsInt';
  static SeqNum = Constants.KnoraApiV2 + Constants.HashDelimiter + 'seqnum';
  static DecimalValueAsDecimal = Constants.KnoraApiV2 + Constants.HashDelimiter + 'decimalValueAsDecimal';
  static IntervalValueHasStart = Constants.KnoraApiV2 + Constants.HashDelimiter + 'intervalValueHasStart';
  static IntervalValueHasEnd = Constants.KnoraApiV2 + Constants.HashDelimiter + 'intervalValueHasEnd';
  static ListValueAsListNode = Constants.KnoraApiV2 + Constants.HashDelimiter + 'listValueAsListNode';
  static ValueAsString = Constants.KnoraApiV2 + Constants.HashDelimiter + 'valueAsString';
  static TextValueAsXml = Constants.KnoraApiV2 + Constants.HashDelimiter + 'textValueAsXml';
  static TextValueHasMapping = Constants.KnoraApiV2 + Constants.HashDelimiter + 'textValueHasMapping';
  static TextValueAsHtml = Constants.KnoraApiV2 + Constants.HashDelimiter + 'textValueAsHtml';
  static LinkValueHasTarget = Constants.KnoraApiV2 + Constants.HashDelimiter + 'linkValueHasTarget';
  static LinkValueHasTargetIri = Constants.KnoraApiV2 + Constants.HashDelimiter + 'linkValueHasTargetIri';
  static LinkValueHasSource = Constants.KnoraApiV2 + Constants.HashDelimiter + 'linkValueHasSource';
  static LinkValueHasSourceIri = Constants.KnoraApiV2 + Constants.HashDelimiter + 'linkValueHasSourceIri';
  static UriValueAsUri = Constants.KnoraApiV2 + Constants.HashDelimiter + 'uriValueAsUri';
  static GeometryValueAsGeometry = Constants.KnoraApiV2 + Constants.HashDelimiter + 'geometryValueAsGeometry';
  static DocumentFileValueHasDimX = Constants.KnoraApiV2 + Constants.HashDelimiter + 'documentFileValueHasDimX';
  static DocumentFileValueHasDimY = Constants.KnoraApiV2 + Constants.HashDelimiter + 'documentFileValueHasDimY';
  static DocumentFileValueHasPageCount =
    Constants.KnoraApiV2 + Constants.HashDelimiter + 'documentFileValueHasPageCount';
  static StillImageFileValueHasDimX = Constants.KnoraApiV2 + Constants.HashDelimiter + 'stillImageFileValueHasDimX';
  static StillImageFileValueHasDimY = Constants.KnoraApiV2 + Constants.HashDelimiter + 'stillImageFileValueHasDimY';
  static StillImageFileValueHasIIIFBaseUrl =
    Constants.KnoraApiV2 + Constants.HashDelimiter + 'stillImageFileValueHasIIIFBaseUrl';
  /**
   * @deprecated FileValueHasExternalUrl will be removed in future versions. Use StillImageFileValueHasExternalUrl instead.
   */
  static FileValueHasExternalUrl = Constants.KnoraApiV2 + Constants.HashDelimiter + 'fileValueHasExternalUrl';
  static StillImageFileValueHasExternalUrl =
    Constants.KnoraApiV2 + Constants.HashDelimiter + 'stillImageFileValueHasExternalUrl';
  static AudioFileValueHasDuration = Constants.KnoraApiV2 + Constants.HashDelimiter + 'audioFileValueHasDuration';
  static MovingImageFileValueHasDimX = Constants.KnoraApiV2 + Constants.HashDelimiter + 'movingImageFileValueHasDimX';
  static MovingImageFileValueHasDimY = Constants.KnoraApiV2 + Constants.HashDelimiter + 'movingImageFileValueHasDimY';
  static MovingImageFileValueHasDuration =
    Constants.KnoraApiV2 + Constants.HashDelimiter + 'movingImageFileValueHasDuration';
  static MovingImageFileValueHasFps = Constants.KnoraApiV2 + Constants.HashDelimiter + 'movingImageFileValueHasFps';
  static FileValueHasFilename = Constants.KnoraApiV2 + Constants.HashDelimiter + 'fileValueHasFilename';
  static FileValueAsUrl = Constants.KnoraApiV2 + Constants.HashDelimiter + 'fileValueAsUrl';
  static TimeValueAsTimeStamp = Constants.KnoraApiV2 + Constants.HashDelimiter + 'timeValueAsTimeStamp';
  static ValueHasComment = Constants.KnoraApiV2 + Constants.HashDelimiter + 'valueHasComment';
  static DeleteComment = Constants.KnoraApiV2 + Constants.HashDelimiter + 'deleteComment';
  static Result = Constants.KnoraApiV2 + Constants.HashDelimiter + 'result';
  static CanDo = Constants.KnoraApiV2 + Constants.HashDelimiter + 'canDo';
  static CannotDoReason = Constants.KnoraApiV2 + Constants.HashDelimiter + 'cannotDoReason';
  static CannotDoContext = Constants.KnoraApiV2 + Constants.HashDelimiter + 'cannotDoContext';
  static CanSetCardinalityCheckFailure =
    Constants.KnoraApiV2 + Constants.HashDelimiter + 'canSetCardinalityCheckFailure';
  static CanSetCardinalityOntologySubclassCheckFailed =
    Constants.KnoraApiV2 + Constants.HashDelimiter + 'canSetCardinalityOntologySubclassCheckFailed';
  static CanSetCardinalityOntologySuperClassCheckFailed =
    Constants.KnoraApiV2 + Constants.HashDelimiter + 'canSetCardinalityOntologySuperClassCheckFailed';
  static CanSetCardinalityPersistenceCheckFailed =
    Constants.KnoraApiV2 + Constants.HashDelimiter + 'canSetCardinalityPersistenceCheckFailed';
  static CanSetCardinalityKnoraOntologyCheckFailed =
    Constants.KnoraApiV2 + Constants.HashDelimiter + 'canSetCardinalityKnoraOntologyCheckFailed';

  static hasCopyrightHolder = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasCopyrightHolder';
  static hasAuthorship = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasAuthorship';
  static hasLicense = Constants.KnoraApiV2 + Constants.HashDelimiter + 'hasLicense';

  static MatchText = Constants.KnoraApiV2 + Constants.HashDelimiter + 'matchText';

  static OntologyName = Constants.KnoraApiV2 + Constants.HashDelimiter + 'ontologyName';

  static KnoraAdmin = 'http://www.knora.org/ontology/knora-admin';
  static DefaultSharedOntologyIRI = Constants.KnoraAdmin + Constants.HashDelimiter + 'DefaultSharedOntologiesProject';
  static SystemProjectIRI = Constants.KnoraAdmin + Constants.HashDelimiter + 'SystemProject';

  static UnknownUserGroupIRI = Constants.KnoraAdmin + Constants.HashDelimiter + 'UnknownUser';
  static KnownUserGroupIRI = Constants.KnoraAdmin + Constants.HashDelimiter + 'KnownUser';
  static CreatorGroupIRI = Constants.KnoraAdmin + Constants.HashDelimiter + 'Creator';
  static ProjectMemberGroupIRI = Constants.KnoraAdmin + Constants.HashDelimiter + 'ProjectMember';
  static ProjectAdminGroupIRI = Constants.KnoraAdmin + Constants.HashDelimiter + 'ProjectAdmin';
  static SystemAdminGroupIRI = Constants.KnoraAdmin + Constants.HashDelimiter + 'SystemAdmin';
  static UserGroupIRI = Constants.KnoraAdmin + Constants.HashDelimiter + 'UserGroup';

  static SalsahGui = 'http://api.knora.org/ontology/salsah-gui/v2';
  static GuiAttribute = Constants.SalsahGui + Constants.HashDelimiter + 'guiAttribute';
  static GuiOrder = Constants.SalsahGui + Constants.HashDelimiter + 'guiOrder';
  static GuiElement = Constants.SalsahGui + Constants.HashDelimiter + 'guiElement';

  static GuiSimpleText = Constants.SalsahGui + Constants.HashDelimiter + 'SimpleText';
  static GuiTextarea = Constants.SalsahGui + Constants.HashDelimiter + 'Textarea';
  static GuiRichText = Constants.SalsahGui + Constants.HashDelimiter + 'Richtext';
  static GuiList = Constants.SalsahGui + Constants.HashDelimiter + 'List';
  static GuiPulldown = Constants.SalsahGui + Constants.HashDelimiter + 'Pulldown';
  static GuiRadio = Constants.SalsahGui + Constants.HashDelimiter + 'Radio';
  static GuiCheckbox = Constants.SalsahGui + Constants.HashDelimiter + 'Checkbox';
  static GuiDatePicker = Constants.SalsahGui + Constants.HashDelimiter + 'Date';
  static GuiTimeStamp = Constants.SalsahGui + Constants.HashDelimiter + 'TimeStamp';
  static GuiInterval = Constants.SalsahGui + Constants.HashDelimiter + 'Interval';
  static GuiSlider = Constants.SalsahGui + Constants.HashDelimiter + 'Slider';
  static GuiSpinbox = Constants.SalsahGui + Constants.HashDelimiter + 'Spinbox';
  static GuiSearchbox = Constants.SalsahGui + Constants.HashDelimiter + 'Searchbox';
  static GuiGeonames = Constants.SalsahGui + Constants.HashDelimiter + 'Geonames';
  static GuiColorPicker = Constants.SalsahGui + Constants.HashDelimiter + 'Colorpicker';
  static GuiGeometry = Constants.SalsahGui + Constants.HashDelimiter + 'Geometry';
  static GuiFileUpload = Constants.SalsahGui + Constants.HashDelimiter + 'Fileupload';

  static Owl = 'http://www.w3.org/2002/07/owl';
  static Ontology = Constants.Owl + Constants.HashDelimiter + 'Ontology';
  static Class = Constants.Owl + Constants.HashDelimiter + 'Class';
  static Restriction = Constants.Owl + Constants.HashDelimiter + 'Restriction';
  static MaxCardinality = Constants.Owl + Constants.HashDelimiter + 'maxCardinality';
  static MinCardinality = Constants.Owl + Constants.HashDelimiter + 'minCardinality';
  static Cardinality = Constants.Owl + Constants.HashDelimiter + 'cardinality';
  static OnProperty = Constants.Owl + Constants.HashDelimiter + 'onProperty';
  static DataTypeProperty = Constants.Owl + Constants.HashDelimiter + 'DatatypeProperty';
  static ObjectProperty = Constants.Owl + Constants.HashDelimiter + 'ObjectProperty';
  static AnnotationProperty = Constants.Owl + Constants.HashDelimiter + 'AnnotationProperty';

  static Rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns';
  static RdfProperty = Constants.Rdf + Constants.HashDelimiter + 'Property';

  static Rdfs = 'http://www.w3.org/2000/01/rdf-schema';
  static SubClassOf = Constants.Rdfs + Constants.HashDelimiter + 'subClassOf';
  static Comment = Constants.Rdfs + Constants.HashDelimiter + 'comment';
  static Label = Constants.Rdfs + Constants.HashDelimiter + 'label';
  static LabelEn = Constants.Rdfs + Constants.HashDelimiter + 'labelEn';
  static Uri = Constants.Rdfs + Constants.HashDelimiter + 'uri';
  static SubPropertyOf = Constants.Rdfs + Constants.HashDelimiter + 'subPropertyOf';

  static Xsd = 'http://www.w3.org/2001/XMLSchema';
  static XsdAnyUri = Constants.Xsd + Constants.HashDelimiter + 'anyURI';
  static XsdString = Constants.Xsd + Constants.HashDelimiter + 'string';
  static XsdBoolean = Constants.Xsd + Constants.HashDelimiter + 'boolean';
  static XsdDecimal = Constants.Xsd + Constants.HashDelimiter + 'decimal';
  static XsdInteger = Constants.Xsd + Constants.HashDelimiter + 'integer';
  static XsdDate = Constants.Xsd + Constants.HashDelimiter + 'date';
  static dateTimeStamp = Constants.Xsd + Constants.HashDelimiter + 'dateTimeStamp';

  static SchemaNumberOfItems = 'http://schema.org/numberOfItems';

  static SalsahLink = 'salsah-link'; // class on an HTML <a> element that indicates a link to a Knora resource
  static RefMarker = 'ref-marker'; // class on an HTML element that refers to another element in the same document

  // Project Metadata
  static Dsp = 'http://ns.dasch.swiss';
  static SlashDelimiter = '/';
  static DspRepo = Constants.Dsp + Constants.SlashDelimiter + 'repository';
  static DspRepoBase = Constants.DspRepo + Constants.HashDelimiter;
  static SchemaBase = 'https://schema.org';
  static ProvBase = 'http://www.w3.org/ns/prov';
  // Dataset
  static DspDataset = Constants.DspRepoBase + 'Dataset';
  static DspHasAbstract = Constants.DspRepoBase + 'hasAbstract';
  static DspHasAlternativeTitle = Constants.DspRepoBase + 'hasAlternativeTitle';
  static DspHasConditionsOfAccess = Constants.DspRepoBase + 'hasConditionsOfAccess';
  static DspHasDateCreated = Constants.DspRepoBase + 'hasDateCreated';
  static DspHasDateModified = Constants.DspRepoBase + 'hasDateModified';
  static DspHasDatePublished = Constants.DspRepoBase + 'hasDatePublished';
  static DspHasDistribution = Constants.DspRepoBase + 'hasDistribution';
  static DspHasDocumentation = Constants.DspRepoBase + 'hasDocumentation';
  static DspHasHowToCite = Constants.DspRepoBase + 'hasHowToCite';
  static DspHasLanguage = Constants.DspRepoBase + 'hasLanguage';
  static DspHasLicense = Constants.DspRepoBase + 'hasLicense';
  static DspHasQualifiedAttribution = Constants.DspRepoBase + 'hasQualifiedAttribution';
  static DspHasStatus = Constants.DspRepoBase + 'hasStatus';
  static DspHasTitle = Constants.DspRepoBase + 'hasTitle';
  static DspHasTypeOfData = Constants.DspRepoBase + 'hasTypeOfData';
  static DspIsPartOf = Constants.DspRepoBase + 'isPartOf';
  static DspSameAs = Constants.DspRepoBase + 'sameAs';
  // Project
  static DspProject = Constants.DspRepoBase + 'Project';
  static DspHasAlternateName = Constants.DspRepoBase + 'hasAlternateName';
  static DspHasContactPoint = Constants.DspRepoBase + 'hasContactPoint';
  static DspHasDataManagementPlan = Constants.DspRepoBase + 'hasDataManagementPlan';
  static DspHasDescription = Constants.DspRepoBase + 'hasDescription';
  static DspHasDiscipline = Constants.DspRepoBase + 'hasDiscipline';
  static DspHasEndDate = Constants.DspRepoBase + 'hasEndDate';
  static DspHasFunder = Constants.DspRepoBase + 'hasFunder';
  static DspHasGrant = Constants.DspRepoBase + 'hasGrant';
  static DspHasKeywords = Constants.DspRepoBase + 'hasKeywords';
  static DspHasName = Constants.DspRepoBase + 'hasName';
  static DspHasPublication = Constants.DspRepoBase + 'hasPublication';
  static DspHasShortcode = Constants.DspRepoBase + 'hasShortcode';
  static DspHasSpatialCoverage = Constants.DspRepoBase + 'hasSpatialCoverage';
  static DspHasStartDate = Constants.DspRepoBase + 'hasStartDate';
  static DspHasTemporalCoverage = Constants.DspRepoBase + 'hasTemporalCoverage';
  static DspHasURL = Constants.DspRepoBase + 'hasURL';
  // Person/Organization
  static DspPerson = Constants.DspRepoBase + 'Person';
  static DspOrganization = Constants.DspRepoBase + 'Organization';
  static DspHasAddress = Constants.DspRepoBase + 'hasAddress';
  static DspHasEmail = Constants.DspRepoBase + 'hasEmail';
  static DspHasFamilyName = Constants.DspRepoBase + 'hasFamilyName';
  static DspHasGivenName = Constants.DspRepoBase + 'hasGivenName';
  static DspHasJobTitle = Constants.DspRepoBase + 'hasJobTitle';
  static DspIsMemberOf = Constants.DspRepoBase + 'isMemberOf';
  // Address
  static SchemaPostalAddress = Constants.SchemaBase + Constants.SlashDelimiter + 'PostalAddress';
  static SchemaAddressLocality = Constants.SchemaBase + Constants.SlashDelimiter + 'addressLocality';
  static SchemaPostalCode = Constants.SchemaBase + Constants.SlashDelimiter + 'postalCode';
  static SchemaStreetAddress = Constants.SchemaBase + Constants.SlashDelimiter + 'streetAddress';
  // Attribution
  static DspHasRole = Constants.DspRepoBase + 'hasRole';
  static ProvAgent = Constants.ProvBase + Constants.HashDelimiter + 'agent';
  static ProvAttribution = Constants.ProvBase + Constants.HashDelimiter + 'Attribution';
  // DataManagementPlan
  static DspDataManagementPlan = Constants.DspRepoBase + 'DataManagementPlan';
  static DspIsAvailable = Constants.DspRepoBase + 'isAvailable';
  // Grant
  static DspGrant = Constants.DspRepoBase + 'Grant';
  static DspHasNumber = Constants.DspRepoBase + 'hasNumber';

  static SchemaUrlType = Constants.SchemaBase + Constants.SlashDelimiter + 'URL';
  static SchemaUrlValue = Constants.SchemaUrlType.toLocaleLowerCase();
  static SchemaPropID = Constants.SchemaBase + Constants.SlashDelimiter + 'propertyID';
  static SchemaPropVal = Constants.SchemaBase + Constants.SlashDelimiter + 'PropertyValue';
  static SchemaDownload = Constants.SchemaBase + Constants.SlashDelimiter + 'DataDownload';
  static SchemaPlace = Constants.SchemaBase + Constants.SlashDelimiter + 'Place';
}
