export class CustomRegex {
  public static readonly URI_REGEX =
    /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,63}(:[0-9]{1,5})?(\/.*)?$/;
  public static readonly EMAIL_REGEX =
    /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

  public static readonly PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-zA-Z]).{8,}$/i;

  public static readonly USERNAME_REGEX = /^[a-zA-Z0-9]+$/;
  // regex to check ontology name: shouldn't start with a number or with 'v' followed by a number, spaces or special characters are not allowed
  public static readonly ID_NAME_REGEX = /^(?![vV]+[0-9])+^([a-zA-Z])[a-zA-Z0-9_.-]*$/;
}
