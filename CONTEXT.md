# DSP-APP

The browser client for the DaSCH Service Platform. It lets humanities researchers define data models, enter and curate research data, and browse and cite it, talking to DSP-API over two HTTP clients. This file fixes the vocabulary so that one word means one thing.

## Language

### Research data

**Project**:
A research undertaking that owns its own data model, data, and members.
_Avoid_: Repository, collection

**Resource**:
A single addressable item of research data, such as a letter, a photograph, or a person.
_Avoid_: Record, entity, object

**Value**:
One atomic datum attached to a resource under a property, such as a date, a text, or a link.

**Property**:
A named slot that a resource class declares, holding values of one declared type.

**Resource class**:
A type of resource defined by a project, declaring which properties its instances may carry.
_Avoid_: Type, entity type

**Ontology**:
A project's data model: the set of resource classes and properties it defines.
_Avoid_: Schema, data model (in code and URLs; see Flagged ambiguities)

**Cardinality**:
The constraint on how many values of one property a resource of a given class may carry, one of required, optional, may-have-many, or at-least-one.
_Avoid_: Multiplicity, occurrence

**List**:
A controlled vocabulary: a hierarchical or flat set of reference terms a project defines for use as values.
_Avoid_: Enum, lookup table, taxonomy

**List node**:
One term within a list, which may itself have child nodes.
_Avoid_: List item, list element

### Files and media

**Representation**:
A resource whose purpose is to carry a file, such as a still image, moving image, audio, document, archive, or text.
_Avoid_: Media, asset (in the client)

**File value**:
The value on a representation that points at the stored file.

**Region**:
A marked area of a still image, carrying its own comment and permissions.
_Avoid_: Annotation (in code; see Flagged ambiguities)

**Segment**:
A marked time span of a moving image or audio resource.

**Compound**:
A resource that groups ordered child representations, such as the pages of a book.
_Avoid_: Parent resource, multi-page resource

**Sipi**:
The DaSCH image and file server that stores and delivers representations over IIIF.

**Ingest**:
The service that accepts an uploaded file and hands back a reference a file value can store.

### Identity and provenance

**IRI**:
The globally unique identifier DSP assigns to every project, resource, value, and ontology entity.

**ARK URL**:
The persistent citable identifier for a resource or a specific version of it.
_Avoid_: Permalink (outside the UI label)

**Shortcode**:
The four-character hexadecimal code that identifies a project.
_Avoid_: Short code, project ID

**Shortname**:
The brief machine-readable name of a project, used in IRIs and URLs.

### Access control

**Permission**:
A grant recorded on a resource or value saying what a given group may do with it.

**Administrative permission**:
A grant saying what a group may do inside a project, such as create resources.
_Avoid_: AP (in prose)

**Default object access permission**:
The permission set newly created resources or values inherit, scoped by group, resource class, or property.
_Avoid_: DOAP (in prose)

**Restricted view**:
The weakest object-access level, which delivers a reduced-size or watermarked image instead of the full file.

**Project member**:
A user attached to a project who may read and create its data.

**Project admin**:
A project member who may additionally change the project's data model, settings, and membership.
_Avoid_: Project administrator, admin

**System admin**:
A user who may administer every project on the instance.
_Avoid_: Sysadmin, system administrator

### Querying

**Full-text search**:
The search mechanism that matches free text against the text content of resources, reached at `search/:q`.
_Avoid_: Simple search, regular search

**Advanced search**:
The DSP-APP page on which a user assembles query criteria over a project's data model.
_Avoid_: Extended search, regular search

**Gravsearch**:
DSP's SPARQL-derived query language, which advanced search compiles its criteria into.

**Extended search**:
The DSP-API endpoint that accepts a Gravsearch query.
_Avoid_: Using this name for the advanced search page

**Criterion**:
One condition in an advanced search, pairing a property with an operator and a value.
_Avoid_: Filter, sub-criteria (both appear in the UI for this one concept)

### Editing

**Delete**:
To mark a resource or value as deleted with a reason, leaving it recoverable and its IRI resolvable.

**Erase**:
To remove a resource or an entire project from the triplestore irrecoverably.
_Avoid_: Hard delete, purge

**Standoff**:
Rich-text markup stored as RDF separately from the text it annotates, which is what makes text values linkable.

**GUI element**:
The widget a property declares for entering its values, drawn from the salsah-gui vocabulary.
_Avoid_: Property type (in code; see Flagged ambiguities), input type, control

**Link object**:
A resource whose purpose is to group other resources into a named collection.
_Avoid_: Collection (in code)

## Relationships

- A **Project** defines zero or more **Ontologies** and zero or more **Lists**
- An **Ontology** defines zero or more **Resource classes** and zero or more **Properties**
- A **Resource class** declares each of its **Properties** with exactly one **Cardinality**
- A **Resource** is an instance of exactly one **Resource class** and belongs to exactly one **Project**
- A **Resource** carries zero or more **Values**, each under exactly one **Property**
- A **List** contains one root **List node**, which contains zero or more child **List nodes**
- A **Value** of list type references exactly one **List node**
- A **Representation** is a **Resource** carrying exactly one **File value**
- A **Region** marks exactly one still-image **Representation**; a **Segment** marks exactly one moving-image or audio **Representation**
- A **Compound** orders zero or more child **Representations**
- Every **Resource** and every **Value** carries **Permissions** and has exactly one **ARK URL**
- **Advanced search** compiles to exactly one **Gravsearch** query

## Example dialogue

> **Dev:** "When a user adds a **Property** to an existing **Resource class**, do we need a new **Ontology** version?"
>
> **Domain expert:** "No, but you must send the ontology's last modification date, and the **Cardinality** you set decides whether existing **Resources** still validate. Adding a required one to a class that already has instances is refused."
>
> **Dev:** "And if the **Property** holds terms from a **List**?"
>
> **Domain expert:** "Then the **Value** points at a **List node**, not at a string. If someone later deletes that node the value still resolves, because we **Delete** rather than **Erase**."

## Flagged ambiguities

- **"Ontology" in code and URLs, "data model" in the UI.** Every user-facing string says data model; the word ontology never reaches a user. Both are correct in their own layer. Canonical term for code, API, and these documents is **Ontology**. Do not rename either side.

- **"List" in code, "controlled vocabulary" in the UI.** The UI rename is incomplete: the property-type picker still shows "Select list" and the property-type group is still labelled "List". Canonical term for code is **List**. The UI inconsistency is a real defect, not a naming choice.

- **"Region"/"Segment" in code, "Annotation" in the UI.** The UI calls both Annotation; the code keeps them distinct because they mark different media and have different geometry. Canonical terms are **Region** and **Segment**. This is the widest gap between code and UI vocabulary in the app.

- **"Cardinality" means two different things.** In `dsp-js` it is the enum of allowed counts, and it is also the DSP-API name for the class-to-property assignment record itself (`UpdateResourceClassCardinality` updates a class's properties). Two code comments in the repo complain about this. Canonical: **Cardinality** is the count constraint; call the assignment a **class property declaration**.

- **"Permissions" names two unrelated types.** The admin model `Permissions` (a user's groups and administrative grants) and the `PermissionUtil.Permissions` enum (the RV/V/M/D/CR object-access ladder) share a name. Canonical: the ladder is **object access level**; the admin model is **Permissions data**.

- **"Properties" means schema in one place and data in another.** On `ReadOntology` it maps property IRI to definition; on `ReadResource` it maps property IRI to values. Read the owning type before assuming.

- **"Full-text search" names two different mechanisms.** One is the standalone search at `search/:q`, which calls `doFulltextSearch` and involves no Gravsearch. The other is a field inside advanced search, whose value is compiled into a `matchFulltext` filter inside a Gravsearch query and sent to the extended-search endpoint. The UI labels both "Full-text search". Say **full-text search page** or **full-text criterion** when the distinction matters.

- **Gravsearch, extended search and advanced search are one chain, not three features.** Advanced search is the page, Gravsearch is the language it writes, extended search is the endpoint that runs it. A fifth name, "regular search", survives only in unused i18n keys and is not live vocabulary.

- **"Knora" versus "DSP".** Knora is the former name of the platform. It survives unavoidably in the wire vocabulary (`knora-api`, `knora-admin` IRIs) and cosmetically in type names such as `KnoraApiConnection` and `KnoraDate`. Canonical name for the platform in prose is **DSP**. Do not rewrite protocol IRIs.

- **"Delete" and "Erase" are distinct, not synonyms.** Deleting is reversible and keeps the IRI resolvable; erasing is not. Conflating them in UI copy or code is a correctness problem.

- **"Still image" versus "image", "moving image" versus "video".** DSP-API uses still image and moving image; the UI says image and video. Canonical for code is the API pair.

- **Role spellings reaching users.** "Project Administrator", "Project Admin", and "Admin" all appear in UI strings for one role, as do "Shortcode" and "Short code". Pick one per role in the i18n files.

- **`StringLiteral` versus `StringLiteralV2`.** Two live types for one concept, differing only in wire keys, because the admin and v2 APIs disagree. Pick by which client you are on, not by preference.
