export type QueryFilter =
    | {
        property: string;
        op: "eq" | "neq" | "lt" | "lte" | "gt" | "gte" | "like";
        value: Primitive;
    }
    | { property: string; op: "in" | "not_in"; value: Primitive[] }
    | { property: string; op: "between"; value: [Primitive, Primitive] };

export interface QuerySort {
    property: string;
    direction: "asc" | "desc";
}

export interface PagingOption {
    page: number;
    per_page: number;
}

type Primitive = string | number;

export type Operator =
    | "eq"
    | "neq"
    | "lt"
    | "lte"
    | "gt"
    | "gte"
    | "like"
    | "in"
    | "not_in"
    | "between";

// import type { PagingOption, QueryFilter, QuerySort } from "../types/query";

export const buildQueryParams = (options: {
    filters?: QueryFilter[];
    sorts?: QuerySort[];
    paging?: PagingOption;
}) => {
    const params: Record<string, unknown> = {};

    options.filters?.forEach((filter, index) => {
        params[`filters[${index}][property]`] = filter.property;
        params[`filters[${index}][op]`] = filter.op;

        if (Array.isArray(filter.value)) {
            params[`filters[${index}][value]`] = filter.value.join(",");
        } else {
            params[`filters[${index}][value]`] = filter.value;
        }
    });

    if (options.sorts) {
        options.sorts.forEach((sort, index) => {
            params[`sorts[${index}][property]`] = sort.property;
            params[`sorts[${index}][direction]`] = sort.direction;
        });
    }

    if (options.paging) {
        params["paging_options[page]"] = options.paging.page;
        params["paging_options[per_page]"] = options.paging.per_page;
    }

    return params;
};
