---
layout: default
title: Search
parent: Workspace
nav_order: 0
---

# Search and find data
{: .no_toc }

It's possible to look at data only in your own project or across all public projects stored in SUID. The SUID app offers three possible search tools to find your data: full-text, advanced and expert search.

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Full-text search

Full-text search performs queries including one or more terms or phrases and returns data that match search conditions. The asterisk * can be used as a wildcard symbol.

<!-- ![Search 1: Simple full-text search with a selection to filter by project.](/assets/images/search-fulltext.png) -->

## Advanced search

The advanced search allows you to filter by project, by source type, or by the metadata of source types. Each filter can be standalone or combined. The metadata field can be precisely filtered with criteria such as "contains", "like", "equals to", "exists" or in case of a date value with "before" or "after".

In addition, for a metadata field that is connected to another source type, it's possible to filter by this second source type. If you are looking for the source type "Photograph" with the metadata field "Photographer", which is connected to source type "Person", you can search for photograph(s) taken by person(s) who is born before February 1970. The result of this request will be an intersection of the two source types, illustrated in this Diagram.

![Diagram 1: Photograph and Person are two sources, connected by metadata field "Photographer" in photograph. In advanced search (and expert search) you can find an intersection of both by filtering both sources at the same time.](/assets/images/search-advanced-diagram.png)
Diagram 1: Photograph and Person are two sources, connected by metadata field "Photographer" in photograph. In advanced search (and expert search) you can find an intersection of both by filtering both sources at the same time.

![Search 2: Advanced search offers many filter combinations and is a powerful search tool.](/assets/images/search-advanced.png)
Search 2: Advanced search offers many filter combinations and is a powerful search tool.

## Expert search

The expert search can be more powerful than the advanced search, but requires knowing how to use the query language Gravsearch (based on SparQL and developed by the DaSCH team). With Gravsearch, expert users can build searches by combining text-related criteria with any other criteria.

For example, you could search for a photograph in a transcript that contains a certain element and also mentions a person, who lived in the same country as another person, who is the author of another photograph.

To learn Gravsearch, go to the Knora documentation: <https://docs.knora.org/paradox/03- apis/api-v2/query-language.html>

![Search 3: Expert search is a text area in which you can create Gravsearch queries.](/assets/images/search-expert-gravsearch.png)
Search 3: Expert search is a text area in which you can create Gravsearch queries.


