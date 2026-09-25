export type ProfessionalProfile = {
  id: string;
  name: string;
  title: string;
  skills: string[];
  location: string;
  company?: string;
};

export type ProfessionalSearchQuery = {
  nameOrTitle: string;
  skills: string;
  location: string;
};

export type ProfessionalSearchResult = {
  people: ProfessionalProfile[];
  sourceConfigured: boolean;
};

export type ProfessionalDirectoryProvider = {
  search(query: ProfessionalSearchQuery): Promise<ProfessionalProfile[]>;
};

const professionalDirectoryProvider: ProfessionalDirectoryProvider | null = null;

export async function searchProfessionals(query: ProfessionalSearchQuery): Promise<ProfessionalSearchResult> {
  if (!professionalDirectoryProvider) {
    return { people: [], sourceConfigured: false };
  }

  return {
    people: await professionalDirectoryProvider.search(query),
    sourceConfigured: true,
  };
}
