import type { SearchRepository } from "@/domain/repositories/SearchRepository";

import type { SearchData, SearchResult } from "../api/generated";
import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";

import { toSearchResult } from "./mappers";

const createSearchRepository = (http: HttpClient): SearchRepository => ({
  search: async (q) => {
    const params: SearchData["query"] = { q };

    return toSearchResult(await http.get<SearchResult>(API_ROUTES.SEARCH, { params }));
  },
});

export const searchRepository: SearchRepository = createSearchRepository(axiosClient);
