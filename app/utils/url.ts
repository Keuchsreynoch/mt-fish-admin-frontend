type QueryPrimitive = string | number | boolean | Date;

export type QueryValue =
  | QueryPrimitive
  | null
  | undefined
  | QueryValue[]
  | { [key: string]: QueryValue };

function appendQueryValue(
  params: URLSearchParams,
  key: string,
  value: QueryValue,
) {
  if (value === null || value === undefined || value === "") return;

  if (value instanceof Date) {
    params.append(key, value.toISOString());
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      appendQueryValue(params, `${key}[${index}]`, item);
    });
    return;
  }

  if (typeof value === "object") {
    Object.entries(value).forEach(([childKey, childValue]) => {
      appendQueryValue(params, `${key}[${childKey}]`, childValue);
    });
    return;
  }

  params.append(key, String(value));
}

export function buildQueryString(params: Record<string, QueryValue>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    appendQueryValue(searchParams, key, value);
  });

  return searchParams.toString();
}

export function buildUrlWithParams(
  path: string,
  params?: Record<string, QueryValue>,
): string {
  if (!params) return path;

  const [basePath = path, existingQuery = ""] = path.split("?");
  const searchParams = new URLSearchParams(existingQuery);

  Object.entries(params).forEach(([key, value]) => {
    appendQueryValue(searchParams, key, value);
  });

  const queryString = searchParams.toString();
  if (!queryString) return basePath;

  return `${basePath}?${queryString}`;
}

export function pushParamsToUrl(
  path: string,
  params: Record<string, QueryValue>,
) {
  return buildUrlWithParams(path, params);
}
