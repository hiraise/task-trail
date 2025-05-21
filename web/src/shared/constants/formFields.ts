type FieldsObject = Record<string, string>;

function createFields<T extends FieldsObject>(fields: T) {
  return {
    ...fields,
    all: Object.values(fields),
  };
}

export const LOGIN_FORM_FIELDS = createFields({
  email: "email",
  password: "password",
});

export const PASSWORD_RECOVERY_FIELDS = createFields({
  email: "email",
});
