import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Interface representing a parsed resource link
 */
interface ResourceLink {
  url: string;
  shortcode: string;
  uuid: string;
}

/**
 * Extracts resource links from HTML content.
 * Matches links in the format: http://rdfh.ch/[shortcode]/[uuid]
 * or https://rdfh.ch/[shortcode]/[uuid]
 *
 * @param htmlContent The HTML content to parse
 * @returns Array of ResourceLink objects
 */
function extractResourceLinks(htmlContent: string): ResourceLink[] {
  const links: ResourceLink[] = [];

  // Regex to match resource links in href attributes
  // Matches: http(s)://rdfh.ch/[shortcode]/[uuid]
  // Shortcode format: 4 hexadecimal digits (0-9, A-F, case insensitive)
  // UUID format: standard base64url characters
  const linkRegex = /https?:\/\/rdfh\.ch\/([0-9A-Fa-f]{4})\/([A-Za-z0-9_-]+)/g;

  let match;
  // eslint-disable-next-line no-cond-assign
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    links.push({
      url: match[0],
      shortcode: match[1],
      uuid: match[2],
    });
  }

  return links;
}

/**
 * Validator factory that checks if HTML content contains links to resources from other projects.
 * Links to resources in the same project are allowed, but links to other projects are not.
 *
 * @param currentProjectShortcode The shortcode of the current project (e.g., "0854")
 * @returns ValidatorFn that validates the HTML content
 *
 * @example
 * ```typescript
 * const control = new FormControl('', crossProjectLinkValidator('0854'));
 * ```
 */
export function crossProjectLinkValidator(currentProjectShortcode: string | null | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // If no value or no project shortcode, skip validation
    if (!control.value || !currentProjectShortcode) {
      return null;
    }

    const htmlContent = control.value as string;

    // Parse HTML to extract all resource links
    const resourceLinks = extractResourceLinks(htmlContent);

    // If no resource links found, validation passes
    if (resourceLinks.length === 0) {
      return null;
    }

    // Check if any links point to other projects
    // Use case-insensitive comparison since shortcodes can be in different cases
    const crossProjectLinks = resourceLinks.filter(
      link => link.shortcode.toUpperCase() !== currentProjectShortcode.toUpperCase()
    );

    if (crossProjectLinks.length > 0) {
      // Deduplicate links by URL to avoid showing the same link multiple times
      const uniqueLinks = Array.from(
        new Map(crossProjectLinks.map(link => [link.url, { url: link.url, shortcode: link.shortcode }])).values()
      );

      return {
        crossProjectLink: {
          currentProject: currentProjectShortcode,
          invalidLinks: uniqueLinks,
        },
      };
    }

    return null;
  };
}
