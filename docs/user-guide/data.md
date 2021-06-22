# Data management

Once your [data model](/user-guide/project/#data-model) is ready, you're able to add data. The DSP-APP offers several possibilities to add data, whether you are starting from scratch or importing data from another program.

## Start from scratch
&#9888; *NOT YET IMPLEMENTED* (only mockups are presented)

When a project starts from scratch, you will enter and generate new data directly in the DSP-APP itself. Generating new data can be done one by one with a form or with a table-based (Excel like) tool.

- Upload the files, e.g., the actual audio file of an interview or images of the photographs discussed in the interview
- Augment the metadata
- In case of interview transcriptions from audio or video files, DSP-APP will offer a simple transcription tool

![Create new source e.g. upload audio file of an interview.](../assets/images/mock-source-new-edit.png)*Create new source; e.g. upload audio file of an interview.*

---

### Organize data and create additional sources
&#9888; *NOT YET IMPLEMENTED*

The workspace of the DSP-APP includes tools to connect different sources, even if they're not in the same project (linkage), to comment on a source and on their metadata fields (annotate), and to transcribe audio-visual material. These actions will generate more data and will help to find specific sources and their relations easily.
It's possible to collect different sources and to store them in an individual collection. You can define more than one collection. You can share collections and invite other users to collaborate.

---

## Search and browse

DSP-APP offers the possibility to the user to search in 3 different ways: **full text** search, **advanced** search and **expert** search (Gravsearch query). The search bar is always available in the header of each page, whether logged in or out.

![Search bar with the 3 search modes: full text, advanced and expert](../assets/images/search-3modes.png)

### Full text search

Full text search performs queries including one or more terms or phrases, and returns data that matches search conditions. By default, the search is performed in all projects stored in DSP. However, it is possible to filter by project using the menu "Filter by project" on the left side of the search bar.

![Filter your full text search by specific project](../assets/images/search-fulltext-filterByProject.png)*<https://admin.dasch.swiss> - Search 1: Full text search*

When clicking on the search bar, the search history panel is displayed. The **10** last searches are registered. It is also possible to clear the search history list (*Clear list* button at the bottom of the panel).

![Search history panel](../assets/images/search-history.png)*Search history list is accessible for the full text search from any webpage.*

Special syntax:

- asterisk* can be used as a wildcard symbol
- "quotation marks" searches for the whole pattern 

---

### Advanced search

![Advanced search link is findable in the search menu at the right of the full text search field.](../assets/images/search-advanced-link.png)

The advanced search allows you to filter by project, by source type, or by the metadata of source types. Each filter can be standalone or combined. The metadata field can be precisely filtered with criteria such as "contains", "is like", "equals to", "exists" or in case of a date value with "before" or "after".

In addition, for a metadata field that is connected to another source type, it's possible to filter by this second source type.

![Search 2: Advanced search offers many filter combinations and is a powerful search tool.](../assets/images/search-advanced.png)*<https://admin.dasch.swiss/search/advanced> - Search 2: Advanced search offers many filter combinations and is a powerful search tool.*

Currently, it is possible to search for only **one** source.

---

### Expert search

![Expert search link is findable in the search menu at the right of the full text search field.](../assets/images/search-expert-link.png)

The expert search can be more powerful than the advanced search, but requires knowing how to use the query language Gravsearch (based on SparQL and developed by the DaSCH team). With Gravsearch, expert users can build searches by combining text-related criteria with any other criteria.

**For example**: you could search for a page in a manuscript that contains a certain element and also mentions a person, who lived in the same country as another person, who is the author of another author.

![Expert search is a text area in which you can create Gravsearch queries.](../assets/images/search-expert.png)*<https://admin.dasch.swiss/search/expert> - Search 3: Expert search is a text area in which you can create Gravsearch queries. Here is the default example you can find in the app.*

To learn Gravsearch, go to the DSP-API documentation [&rarr; Gravsearch](https://docs-api.dasch.swiss/03-apis/api-v2/query-language/)

---

## Search results

### Simple list
The results of the search are displayed in an organised list with a small preview. You can select one result at a time to get more information.

![Search result 1: Simple list of results, similar to Google's list of results.](../assets/images/search-results-list.png)*Search result 1: Simple list of results, similar to Google's list of results.*

&#9888; *NOT YET IMPLEMENTED*
It is not possible yet to sort or order by criteria when searching with the full text search, use the advanced search or the expert search instead to get back sorted results.

---

### Grid list: Lighttable
&#9888; *NOT YET IMPLEMENTED*

The results of the search are displayed in a grid list with a big preview. You can select one result at a time to get more information.

![Search result 2: A kind of preview list, inspired by Pinterest.com.](../assets/images/search-results-grid.png)*Search result 2: A preview list where the results are presented in tiles.*

---

### Table: Excel-like view
&#9888; *NOT YET IMPLEMENTED*

The search results are displayed in a table with the option to sort them. This layout is enabled when the search has been performed with **only one source type**.
Each column of the table corresponds to one metadata.

![Search result 3: An Excel-like table view to edit multiple sources at once.](../assets/images/search-results-table-mockup.png)*Search result 3: An Excel-like table view to edit multiple sources at once.*

---

## Do research and work on your data

Once you have found the desired sources, you can (re)view them and annotate the source itself, the media file, or single metadata values. If you select more than one source, you can compare them in a side-by-side view, link them, edit them all at once, or save them in a collection. A collection is similar to a playlist in a music app or shopping basket in an online store.

### Display a source
&#9888; *WORK IN PROGRESS*

The DSP-APP offers different source views for different media types. There's a viewer for still images, moving images, audio and document files. You can open them from the list of search results. Depending on the media type, DSP-APP offers different tools to work on the source.

In a still image source, you're able to draw regions on the image and to annotate or transcribe this region. Usually, a still image source is used for book pages, photographs, postcards, letters etc.

In time-based sources like moving image or audio document, you can mark sequences on the timeline. A transcription tool helps to annotate and to transcribe the sequence.

![Single source view. The source type in this example is "Photo".](../assets/images/resource-view-with-image.png)*Single source view. The source type in this example is "Page".*

DSP-APP will offer a graph view to visualize the connection of a selected source. The graph view is a powerful tool because you will find more information about the source by clicking through the nodes.

![Graph view of a single source.](../assets/images/source-graph-view.png)*Graph view of a single source.*

Additionally, you can work on the source directly, e.g, transcribe a moving image or a taped interview or mark regions of interest on still images and on documents.

![Single source fullframe view with the transcription tool at the bottom. The source type in this example is "Video" with a table-based sequence protocol on the right hand-side.](../assets/images/source-selected-fullframe.png)*Single source fullframe view with the transcription tool at the bottom. The source type in this example is "Video" with a table-based sequence protocol on the right hand-side.*

---

### Select more than one source
&#9888; *NOT YET IMPLEMENTED*

![Three sources selected; what do you want to do with them?](../assets/images/source-selected-three.png)*Three sources are selected; what do you want to do with them?*

By selecting more than one source, you will be able to edit them all at once, add them to a collection, share or connect them. 
Or you could compare the sources (see [Compare the sources](/user-guide/data/#compare-the-sources)).

---

### Compare the sources
&#9888; *NOT YET IMPLEMENTED*

You will be able to compare from two to six source objects at the same time side by side.

![Compare 2 to 6 sources with each other, similar to the Mirador web app.](../assets/images/source-compare-viewer.png)*Compare 2 to 6 sources with each other, similar to the Mirador web app.*

---

### Annotate and connect your data (sources and/or metadata)
&#9888; *NOT YET IMPLEMENTED*

A main feature of the flexible data storage that DSP-APP uses is the possibility to annotate and link sources and their metadata. An annotation can be a small note about a date like "Not sure about the birthdate of this person. There's another date mentioned in the source XYZ". Inside the note, it will be possible to link to another source.

Links in DSP-APP are always bi-directional. If you link source A with source B, then source B knows about this connection. If you find source B, you have the connection to source A as well.

---

### Export, save or share the data
&#9888; *NOT YET IMPLEMENTED*

Data sets and metadata extracted through a search can be exported as CSV, XML, or other predefined file formats.
It will be also possible to store full text, advanced, and expert search queries to reuse them later, collect source objects in a collection similar to a playlist of a music app or a shopping basket.

![The share menu offers many tools to export the data, to send it to someone or to store it in an individual source collection.](../assets/images/share-export-menu.png)*The share menu offers many tools to export the data, to send it to someone or to store it in an individual source collection.*
