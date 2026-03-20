/**
 * @category Response
 */
export abstract class ApiResponse {
  ///////////////
  // CONSTANTS //
  ///////////////

  // <editor-fold desc="">
  // </editor-fold>

  ////////////////
  // PROPERTIES //
  ////////////////

  // <editor-fold desc="">

  /**
   * Original HTTP method
   */
  method: string = '';

  /**
   * Request URL
   */
  url: string = '';

  /**
   * Status number
   */
  status: number = 0;

  // </editor-fold>

  /////////////////
  // CONSTRUCTOR //
  /////////////////

  // <editor-fold desc="">
  // </editor-fold>

  /////////////
  // METHODS //
  /////////////

  // <editor-fold desc="">
  // </editor-fold>
}
