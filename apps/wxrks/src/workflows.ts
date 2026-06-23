export const parseParameterList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  const commaSeparatedList = () => trimmed.split(',').map((item) => item.trim()).filter(Boolean);

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch (_err) {
    return commaSeparatedList();
  }

  return commaSeparatedList();
};

export const serializeParameterList = (values: string[]): string => {
  return values.map((value) => value.trim()).filter(Boolean).join(',');
};

export const parseWorkflows = parseParameterList;
export const serializeWorkflows = serializeParameterList;
