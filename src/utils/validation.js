const validator = require('validator');

const validationRules = {
  email: (value) => validator.isEmail(value),
  string: (value) => typeof value === 'string' && value.trim().length > 0,
  number: (value) => typeof value === 'number' && value >= 0,
  date: (value) => validator.isISO8601(value),
  enum: (value, allowedValues) => allowedValues.includes(value),
  objectId: (value) => validator.isMongoId(value),
  array: (value) => Array.isArray(value),
  boolean: (value) => typeof value === 'boolean',
};

const validateData = (data, schema) => {
  const errors = {};
  for (const field in schema) {
    const rules = schema[field].split(',').map(rule => rule.trim());
    let value = data[field];

    for (const rule of rules) {
      let validatorFn;
      let ruleParams = [];

      if (rule.includes('enum')) {
        const enumValues = rule.match(/enum \['(.*?)'\]/)[1].split("','");
        validatorFn = validationRules.enum;
        ruleParams.push(enumValues);
      } else {
        validatorFn = validationRules[rule];
      }

      if (!validatorFn) {
        console.warn(`Unknown validation rule: ${rule}`);
        continue;
      }

      if (rule === 'unique') {
        // Unique validation needs to be handled by services after fetching data
        continue;
      }

      if (rule === 'hashed') {
        // Hashed validation is typically part of saving, not direct validation of input
        continue;
      }

      if (rule === 'optional' && value === undefined) {
        continue; 
      }

      if (validatorFn(...(Array.isArray(value) ? [value, ...ruleParams] : [value, ...ruleParams])) === false) {
        errors[field] = `Invalid ${field}: rule '${rule}' failed`;
        break;
      }
    }
  }
  return errors;
};

module.exports = {
  validateData,
  validationRules
};
