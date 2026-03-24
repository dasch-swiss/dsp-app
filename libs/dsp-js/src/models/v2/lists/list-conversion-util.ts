import { ListNodeV2 } from './list-node-v2';

/**
 * @category Internal
 */
export namespace ListConversionUtil {
  /**
   * Given a list node, collects the node
   * and all of its direct and indirect children.
   *
   * @param node the node to start with.
   */
  export const collectNodes = (node: ListNodeV2) => {
    // collection of nodes to add to
    let subnodes: ListNodeV2[] = [];

    node.children.forEach((child: ListNodeV2) => {
      subnodes = subnodes.concat(collectNodes(child));
    });

    return [node].concat(subnodes);
  };
}
