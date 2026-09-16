# DSP-APP

The browser client for the DaSCH Service Platform (DSP). It is the user interface of the Virtual Research Environment, whose backend is dsp-api: humanities researchers use it to define data models, enter and curate research data, and browse and cite it, talking to DSP-API over two HTTP clients. This file fixes the vocabulary so that one word means one thing, here and in dsp-api alike.

## Vocabulary ownership

dsp-api owns the domain vocabulary. Its root [`CONTEXT.md`](https://github.com/dasch-swiss/dsp-api/blob/main/CONTEXT.md) indexes eight bounded contexts, each with its own `CONTEXT.md` reached through that index: Projects, Identity & Access, Data Model, Resources & Values, Search, Assets, Project Migration and Operations. Follow the index rather than a path, because those files move when a context is extracted into its own module. Where a term appears in both repositories, the dsp-api definition wins and this file adds only what the client needs: the UI label it appears under, the code name that carries it, and where the two disagree. An agent that reads the same term in both repositories must find the same meaning.

This file owns the terms dsp-api has not named yet: the kinds of Resource the client renders specially (Representation, Region, Segment, Compound), the citation and editing vocabulary (ARK URL, Delete, Erase), the search-page vocabulary (Advanced search, Criterion) and the modelling widgets (GUI element, GUI attribute). They are listed under "Terms not yet in dsp-api" so they can be proposed upstream. Once dsp-api adopts one, its definition wins here too.

Rule for prose in this repository: use the domain term. Code identifiers, API paths, URLs and wire vocabulary keep their names and are written in backticks.

## Language

### Product context

**VRE**:
The Virtual Research Environment in which researchers and data stewards create, edit, organise, query, and manage research data. DSP-APP is its user interface; dsp-api is its backend.
_Avoid_: Archive, Repository

**Repository**:
The downstream environment for preserving and presenting published data. Not this application, and not where a Project's data lives while it is being worked on.
_Avoid_: VRE

### Research data

**Project**:
The ownership and scoping unit for Data Models, Resources, settings, and access administration; in research terms, one research undertaking.
_Avoid_: Repository, collection, dataset, tenant

**Data Model**:
One user-authored model within a Project: a set of Classes, Properties and Cardinalities. This is what code, the API and URLs call an ontology.
_Avoid_: Ontology in prose (see Flagged ambiguities); schema, which means something else (see Schema)

**Class**:
A user-defined type of Resource within a Data Model. Code names say `ResourceClass`, and **Resource class** is the accepted long form in this repository wherever "class" alone would read as the TypeScript keyword.
_Avoid_: Type, entity type, predicate

**Property**:
A user-defined attribute or relationship a Class may carry, holding Values of one declared type.
_Avoid_: Field, predicate in prose

**Cardinality**:
A Data Model constraint stating how many Values of a Property a Resource of a Class may or must have: required, optional, may-have-many, or at-least-one. In dsp-api the Cardinality is also the record that binds the Class to the Property, which is why `UpdateResourceClassCardinality` is how a property is added to a class.
_Avoid_: Multiplicity, occurrence

**Resource**:
An instance of a Class, and the aggregate root and consistency scope for its Values: a letter, a photograph, a person.
_Avoid_: Record, entity, object

**Value**:
A versioned entity holding one Property value inside a Resource, with no independent lifecycle. Every edit to a Value goes through its Resource.
_Avoid_: Field, standalone datum

**List**:
A hierarchical controlled vocabulary authored as part of a Project's data modelling, whose nodes Values can point at.
_Avoid_: Enum, lookup table, taxonomy

**List node**:
One term within a List, which may itself have child nodes.
_Avoid_: List item, list element

### Files and media

**Representation**:
A Resource whose Class carries a File value: a still image, moving image, audio, document, archive, or text file. `knora-api:Representation` and its subclasses.
_Avoid_: Media

**File value**:
The Value on a Representation that represents an Asset through metadata and an internal filename. It never holds the bytes.
_Avoid_: Asset, file

**Asset**:
The binary file behind a File value, represented in the VRE by metadata and an identifier. Its bytes are handled by Sipi and dsp-ingest, never by this client.
_Avoid_: File value, media

**Region**:
A marked area of a still-image Representation, carrying its own comment and permissions.
_Avoid_: Annotation (in code; see Flagged ambiguities)

**Segment**:
A marked time span of a moving-image or audio Representation.

**Compound**:
A Resource that groups ordered child Representations, such as the pages of a book.
_Avoid_: Parent resource, multi-page resource

**Sipi**:
The IIIF image system that transforms and serves Asset bytes.

**dsp-ingest**:
The service that accepts an uploaded file and hands back the reference a File value stores. Configured as `ingestUrl` in this client.
_Avoid_: Ingest as a proper noun, upload service

### Identity and provenance

**IRI**:
The globally unique identifier DSP assigns to every Project, User, Group, List, Resource, Value and Data Model entity. dsp-api distinguishes two families, and dsp-js follows the distinction:

- **Data IRI**: schema-invariant, for a Resource, Value, Project, User, Group, List or permission. It never converts between Schemas.
- **Definition IRI**: schema-variant, for a Data Model, Class or Property. It has an internal form and one public form per Schema.

**Schema**:
A representation of a Definition IRI or Data Model entity: internal, v2 complex, or v2 simple. dsp-js speaks the v2 complex schema. Not a synonym for Data Model.
_Avoid_: Data Model, ontology

**ARK URL**:
The persistent citable identifier for a Resource or a specific version of it.
_Avoid_: Permalink (outside the UI label)

**Shortcode**:
The stable four-character hexadecimal identifier that scopes a Project's data and identifiers.
_Avoid_: Short code, project ID, Project IRI

**Shortname**:
The brief machine-readable name of a Project, used in IRIs and URLs.

### Access control

**User**:
An authenticated identity that acts within Projects. The UI's "My Account" page edits a User.
_Avoid_: Account (in code and prose; the UI label stays)

**Group**:
A named set of Users used to grant permissions. Project member, Project admin and System admin are built-in Groups.
_Avoid_: Role

**Membership**:
The association of a User with a Project or Group.
_Avoid_: Project ownership

**Permission profile**:
A User's effective Groups and administration flags, computed by dsp-api and carried on every authenticated request. In dsp-js this is the admin model `Permissions` on a user.
_Avoid_: Permissions data, permission object

**Object-access permission**:
The fine-grained grant recorded on a Resource or Value saying which Groups may do what with it, evaluated against the requesting User's Permission profile.
_Avoid_: Permission (unqualified), scope

**Permission level**:
One step of the object-access ladder: restricted view (RV), view (V), modify (M), delete (D), change rights (CR). In dsp-js this is the `PermissionUtil.Permissions` enum.
_Avoid_: Object access level, permission enum

**Administrative permission**:
A Project-scoped or Group-scoped grant governing administrative actions, such as creating Resources.
_Avoid_: AP (in prose), object-access permission

**Default object-access permission**:
The Object-access permission newly created Resources or Values receive, scoped by Group, Class, or Property. Also called DOAP.
_Avoid_: DOAP (in prose), administrative permission

**Restricted view**:
A Project setting for reduced-resolution or watermarked serving of Assets, configured under the project's view-restriction settings and enforced by dsp-api's Assets context when bytes are served. The Permission level RV is what puts a User under it; the setting decides what they then see.
_Avoid_: Using it for the Permission level itself; say RV or restricted-view level

**Project member**:
A User with a Membership in a Project, who may read and create its data.

**Project admin**:
A Project member who may additionally change the Project's Data Models, settings, and Memberships.
_Avoid_: Project administrator, admin

**System admin**:
A User who may administer every Project on the instance.
_Avoid_: Sysadmin, system administrator

### Querying

**Full-text search**:
The search mechanism that matches free text against the text content of Resources, reached at `search/:q`. dsp-api's Search context calls the mechanism full-text retrieval; the page is the search.
_Avoid_: Simple search, regular search

**Advanced search**:
The DSP-APP page on which a user assembles query criteria over a Project's Data Model.
_Avoid_: Extended search, regular search

**Gravsearch**:
dsp-api's Data-Model-aware query language for retrieving Resources, which advanced search compiles its criteria into.
_Avoid_: SPARQL

**Extended search**:
The DSP-API endpoint that accepts a Gravsearch query.
_Avoid_: Using this name for the advanced search page

**Criterion**:
One condition in an advanced search, pairing a Property with an operator and a value.
_Avoid_: Filter, sub-criteria (both appear in the UI for this one concept)

### Editing

**Delete**:
To mark a Resource or Value as deleted with a reason, leaving it recoverable and its IRI resolvable.

**Erase**:
To remove a Resource or an entire Project from the triplestore irrecoverably.
_Avoid_: Hard delete, purge

**Standoff markup**:
Rich-text markup attached to a text Value, stored as RDF separately from the text it annotates, which is what makes text Values linkable. The definitions it uses, standoff classes and XML mappings, belong to the Data Model.
_Avoid_: Standoff (unqualified) where definitions and markup could be confused

**GUI element**:
The widget a Property declares for entering its Values, drawn from the salsah-gui vocabulary.
_Avoid_: Property type (in code; see Flagged ambiguities), input type, control

**GUI attribute**:
A parameter a GUI element takes, such as the List a list picker draws from or the size of a text field. Configured alongside the GUI element in the property form.
_Avoid_: GUI option, widget setting

**Link object**:
A Resource whose purpose is to group other Resources into a named collection.
_Avoid_: Collection (in code)

## Relationships

- A **Project** owns zero or more **Data Models**, zero or more **Lists**, and its project settings
- A **Data Model** defines zero or more **Classes** and zero or more **Properties**
- A **Cardinality** binds one **Class** to one **Property** with one count constraint
- A **Resource** is an instance of exactly one **Class** and belongs to exactly one **Project**
- A **Resource** carries zero or more **Values**, each under exactly one **Property**; a **Value** has no lifecycle outside its **Resource**
- A **List** contains one root **List node**, which contains zero or more child **List nodes**
- A **Value** of list type references exactly one **List node**
- A **Representation** is a **Resource** carrying exactly one **File value**, which references exactly one **Asset**
- A **Region** marks exactly one still-image **Representation**; a **Segment** marks exactly one moving-image or audio **Representation**
- A **Compound** orders zero or more child **Representations**
- A **User** holds zero or more **Memberships**, from which dsp-api computes their **Permission profile**
- Every **Resource** and every **Value** carries **Object-access permissions**, evaluated against the requesting User's **Permission profile**, and has exactly one **ARK URL**
- **Restricted view** is a Project setting; the **Permission level** RV selects it for a User
- **Advanced search** compiles to exactly one **Gravsearch** query

## Example dialogue

> **Dev:** "A researcher wants to add a **Property** to a **Class** that already has **Resources**. Anything to watch?"
>
> **Domain expert:** "The **Cardinality**. If the new property is required, every existing resource of that class would become invalid, so the **Data Model** refuses it. Make it optional, or fill in the values first."
>
> **Dev:** "And if the property takes its values from a **List**?"
>
> **Domain expert:** "Then each **Value** points at a **List node**, not at a text. Renaming the node later changes the label everywhere without touching a single resource. And a node that any value still points at cannot be deleted, so check with the project before removing one."
>
> **Dev:** "Who is allowed to do all this?"
>
> **Domain expert:** "A **Project admin** changes the data model. A **Project member** enters data, and what they may see on each resource is decided by its **Object-access permissions**, not by their membership alone."

## Flagged ambiguities

- **"Ontology" in code and URLs, "Data Model" in prose and the UI.** dsp-api's Data Model context settles it: Data Model is the domain term, and ontology is the RDF implementation term that stays valid in code names (`ReadOntology`, `OntologyService`, `vre/pages/ontology`), API paths (`/v2/ontologies`) and route constants. Every user-facing string already says data model. Write **Data Model** in prose and in these documents; do not rename either the code or the UI.

- **"List" in code, "controlled vocabulary" in the UI.** The UI rename is incomplete: the property-type picker still shows "Select list" and the property-type group is still labelled "List". Canonical term for code is **List**. The UI inconsistency is a real defect, not a naming choice.

- **"Region"/"Segment" in code, "Annotation" in the UI.** The UI calls both Annotation; the code keeps them distinct because they mark different media and have different geometry. Canonical terms are **Region** and **Segment**. This is the widest gap between code and UI vocabulary in the app.

- **"Cardinality" carries the count and the binding.** dsp-api's definition covers both: a Cardinality is the Data Model constraint binding a Class, a Property and a count, so `UpdateResourceClassCardinality` adding a property to a class is the API's meaning, not a misnomer. The dsp-js `Cardinality` enum names only the count part; the binding is `IHasProperty`, which carries that enum together with the property IRI and GUI order. Two code comments in the repo complain about the overlap. Read an `IHasProperty` as "a cardinality" and its `cardinality` field as "the count".

- **"Permissions" names two unrelated types.** The admin model `Permissions` (a User's Groups and administrative grants) is the **Permission profile**. The `PermissionUtil.Permissions` enum (RV/V/M/D/CR) is the **Permission level** ladder. Use the domain terms in prose and let the code names stand.

- **"Restricted view" is a setting and a level.** `RestrictedViewSettings` in the admin API and the view-restrictions page under project settings are the Project setting, owned by dsp-api's Projects context. RV in the permission ladder is the level. The setting is what a User at level RV gets. Say which one is meant.

- **"Standoff" names definitions and markup.** dsp-api splits them: standoff classes and XML mappings belong to Data Model, standoff markup to the text Value it annotates. This client only ever handles the markup, so **Standoff markup** is the term here.

- **"Asset" was avoided here and is a bounded context in dsp-api.** Resolved by adopting dsp-api's meaning: the Asset is the file behind a File value. The client never touches its bytes, which is why the word is rare here, not a reason to avoid it.

- **"Properties" means schema in one place and data in another.** On `ReadOntology` it maps property IRI to definition; on `ReadResource` it maps property IRI to values. Read the owning type before assuming.

- **"Full-text search" names two different mechanisms.** One is the standalone search at `search/:q`, which calls `doFulltextSearch` and involves no Gravsearch. The other is a field inside advanced search, whose value is compiled into a `matchFulltext` filter inside a Gravsearch query and sent to the extended-search endpoint. The UI labels both "Full-text search". Say **full-text search page** or **full-text criterion** when the distinction matters.

- **Gravsearch, extended search and advanced search are one chain, not three features.** Advanced search is the page, Gravsearch is the language it writes, extended search is the endpoint that runs it. A fifth name, "regular search", survives only in unused i18n keys and is not live vocabulary.

- **"Knora" versus "DSP".** Knora is the former name of the platform. It survives unavoidably in the wire vocabulary (`knora-api`, `knora-admin` IRIs) and cosmetically in type names such as `KnoraApiConnection` and `KnoraDate`. Canonical name for the platform in prose is **DSP**. Do not rewrite protocol IRIs.

- **"Delete" and "Erase" are distinct, not synonyms.** Deleting is reversible and keeps the IRI resolvable; erasing is not. Conflating them in UI copy or code is a correctness problem.

- **"Still image" versus "image", "moving image" versus "video".** DSP-API uses still image and moving image; the UI says image and video. Canonical for code is the API pair.

- **Role spellings reaching users.** "Project Administrator", "Project Admin", and "Admin" all appear in UI strings for one role, as do "Shortcode" and "Short code", and "My Account" labels the page that edits a **User**. Pick one per role in the i18n files; the account label may stay, the concept is User.

- **`StringLiteral` versus `StringLiteralV2`.** Two live types for one concept, differing only in wire keys, because the admin and v2 APIs disagree. Pick by which client you are on, not by preference. The generated client adds two more for the same concept, `LanguageStringDto` and `StringLiteralWithLanguage`, and `vre/ui/string-literal` currently imports all four. For presentational libraries, which are on no client, ADR-0001 decision 7 settles this differently: declare the shape locally and import none of them.

## Terms not yet in dsp-api

Proposed for adoption upstream in the context named. Until then this file is their source, and their definitions above are the ones to propose.

| Term | Proposed dsp-api context | Why it is missing there |
| --- | --- | --- |
| Representation, Region, Segment, Compound | Resources & Values | Resource kinds from the `knora-api` vocabulary with their own rendering and geometry; dsp-api describes Resources generically |
| ARK URL | Resources & Values | The citation identifier; dsp-api's IRI families do not name it |
| Delete, Erase | Resources & Values, and Projects for erasing a project | dsp-api has the operations but no vocabulary entry for the distinction |
| Advanced search, Extended search, Criterion | Search | The client page, the endpoint name and the page's unit of work; dsp-api names only Gravsearch and full-text retrieval |
| GUI element, GUI attribute | Data Model | The salsah-gui vocabulary is authored as part of a Data Model |
| Permission level | Permission policy | dsp-api names the module that owns levels but not the ladder's members |
| Shortname | Projects | dsp-api names Shortcode only |
| Project member, Project admin, System admin | Identity & Access | The built-in Groups |

Two loosenesses to raise upstream, both in dsp-api's Data Model file. First, it defines Data Model in the singular as "a Project's Classes, Properties, Cardinalities, controlled vocabularies, and related definitions", then says "a Project owns one or more Data Models". This file takes the plural reading: one Data Model is one ontology, and a Project has several. Second, it says "a Data Model defines Lists". A List is project-scoped and belongs to no single Data Model, which is how this client shows them. The ownership of Lists by the Data Model context is right; the containment relationship is not, and this file records the Project as the owner. Both readings are the ones to propose upstream.
