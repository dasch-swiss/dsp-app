const PROJECT_FORM_CONSTANTS = {
  descriptionMaxLength: 2000,
  shortcodeMinLength: 4,
  shortcodeMaxLength: 4,
  shortnameMinLength: 3,
  shortnameMaxLength: 20,
  existingShortNames: [new RegExp('anEmptyRegularExpressionWasntPossible')] as [RegExp],
  shortnameRegex: /^[a-zA-Z]+\S*$/,
  existingShortcodes: [new RegExp('anEmptyRegularExpressionWasntPossible')] as [RegExp],
  shortcodeRegex: /^[0-9A-Fa-f]+$/,
};

export default PROJECT_FORM_CONSTANTS;
